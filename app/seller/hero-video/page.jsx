// app/seller/hero-video/page.jsx

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { FiUploadCloud, FiTrash2, FiCheckCircle, FiCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Loading from '@/components/Loading';

const BUCKET_NAME = 'hero_videos'; // Supabase Storage bucket adı

export default function HeroVideoManager() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // 'delete-id' or 'activate-id'

  const fetchVideos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('hero_videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Videolar alınamadı: ' + error.message);
      setVideos([]);
    } else {
      setVideos(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Lütfen geçerli bir video dosyası seçin (örn: mp4).');
      return;
    }

    setUploading(true);
    const toastId = toast.loading('Video loading...');
    const filePath = `public/${Date.now()}_${file.name.replace(/\s/g, '_')}`;

    try {
      // 1. Storage'a yükle
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Public URL'i al
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(uploadData.path);

      if (!publicUrlData?.publicUrl) {
        throw new Error('Videonun public URL\'i alınamadı.');
      }

      // 3. Veritabanına kaydet
      const { error: insertError } = await supabase
        .from('hero_videos')
        .insert([{ video_url: publicUrlData.publicUrl, is_active: false }]); // Yeni video varsayılan olarak aktif değil

      if (insertError) throw insertError;

      toast.success('Video başarıyla yüklendi!', { id: toastId });
      fetchVideos(); // Listeyi yenile
    } catch (error) {
      console.error('Video yükleme hatası:', error);
      toast.error(`Video yüklenemedi: ${error.message}`, { id: toastId });
      // Hata durumunda yüklenen dosyayı storage'dan silmeyi düşünebilirsiniz (opsiyonel)
    } finally {
      setUploading(false);
      // Input'u sıfırla ki aynı dosya tekrar seçilebilsin
      event.target.value = '';
    }
  };

  const setActiveVideo = async (videoId) => {
    setActionLoading(`activate-${videoId}`);
    const toastId = toast.loading('Aktif video güncelleniyor...');

    try {
      // Önce tüm videoları pasif yap
      const { error: deactivateError } = await supabase
        .from('hero_videos')
        .update({ is_active: false })
        .eq('is_active', true); // Sadece aktif olanı güncellemek daha verimli olabilir

      if (deactivateError) throw deactivateError;

      // Sonra seçili videoyu aktif yap
      const { error: activateError } = await supabase
        .from('hero_videos')
        .update({ is_active: true })
        .eq('id', videoId);

      if (activateError) throw activateError;

      toast.success('Aktif video başarıyla güncellendi!', { id: toastId });
      fetchVideos(); // State'i güncelle
    } catch (error) {
      console.error('Aktif video ayarlama hatası:', error);
      toast.error(`Hata: ${error.message}`, { id: toastId });
    } finally {
      setActionLoading(null);
    }
  };

  const deleteVideo = async (video) => {
    if (!confirm('Bu videoyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) return;

    setActionLoading(`delete-${video.id}`);
    const toastId = toast.loading('Video siliniyor...');

    try {
      // 1. Veritabanından sil
      const { error: dbError } = await supabase
        .from('hero_videos')
        .delete()
        .eq('id', video.id);

      if (dbError) throw dbError;

      // 2. Storage'dan sil
      // URL'den dosya yolunu çıkar
      const urlParts = video.video_url.split('/');
      const filePath = urlParts.slice(urlParts.indexOf(BUCKET_NAME) + 1).join('/');

      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      // Storage hatası olsa bile devam et, en azından DB'den silindi
      if (storageError) {
        console.warn('Storage silme hatası (DB kaydı silindi):', storageError.message);
        toast.error('Video veritabanından silindi ancak depolamadan silinemedi.', { id: toastId });
      } else {
        toast.success('Video başarıyla silindi!', { id: toastId });
      }

      fetchVideos(); // Listeyi yenile
    } catch (error) {
      console.error('Video silme hatası:', error);
      toast.error(`Video silinemedi: ${error.message}`, { id: toastId });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-900 border-b pb-4">
        Ana Sayfa Video Yönetimi
      </h1>

      {/* Video Yükleme Alanı */}
      <div className="mb-8 p-6 bg-white rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Yeni Video Yükle</h2>
        <label
          htmlFor="video-upload"
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition
            ${uploading ? 'bg-gray-100 border-gray-300' : 'border-indigo-300 hover:bg-indigo-50'}`}
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          ) : (
            <>
              <FiUploadCloud className="w-8 h-8 text-indigo-500 mb-2" />
              <p className="text-sm text-indigo-600 font-medium">Video Seçin veya Sürükleyip Bırakın</p>
              <p className="text-xs text-gray-500">MP4, WebM vb. formatlar desteklenir.</p>
            </>
          )}
        </label>
        <input
          id="video-upload"
          type="file"
          accept="video/*"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
        />
      </div>

      {/* Yüklenmiş Videolar Listesi */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Yüklenmiş Videolar</h2>
        {videos.length === 0 ? (
          <p className="text-center text-gray-500 py-6">Henüz yüklenmiş video bulunmuyor.</p>
        ) : (
          <div className="space-y-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className={`flex flex-col sm:flex-row items-center justify-between p-4 rounded-lg border transition
                  ${video.is_active ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
              >
                <div className="flex items-center gap-4 mb-3 sm:mb-0">
                  <video width="100" height="60" controls className='rounded'>
                      <source src={video.video_url} type="video/mp4" />
                      Tarayıcınız video etiketini desteklemiyor.
                  </video>
                  <div className='max-w-[200px] sm:max-w-xs'>
                    <p className="text-sm font-medium text-gray-700 truncate">{video.video_url.split('/').pop()}</p>
                    <p className="text-xs text-gray-500">Yüklenme: {new Date(video.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <button
                    onClick={() => setActiveVideo(video.id)}
                    disabled={video.is_active || actionLoading === `activate-${video.id}`}
                    className={`flex items-center gap-1 text-sm px-3 py-1 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed
                      ${video.is_active
                        ? 'text-green-700 bg-green-200 cursor-default'
                        : 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200'}`}
                  >
                    {video.is_active ? <FiCheckCircle /> : <FiCircle />}
                    {video.is_active ? 'Aktif' : 'Aktif Et'}
                  </button>
                  <button
                    onClick={() => deleteVideo(video)}
                    disabled={actionLoading === `delete-${video.id}`}
                    className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-md transition disabled:opacity-50"
                  >
                    <FiTrash2 /> Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}