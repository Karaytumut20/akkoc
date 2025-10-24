// app/seller/carousel/page.jsx

'use client';

import React, { useState, useEffect, useRef } from 'react'; // useRef ekledik
import { supabase } from '@/lib/supabaseClient';
import { FiUploadCloud, FiTrash2, FiX, FiMove } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Loading from '@/components/Loading';

const CAROUSEL_BUCKET_NAME = 'carousel-images';

const CarouselManagementPage = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null); // Üzerine gelinen indeksi takip etmek için
  const dragItemNode = useRef(); // Sürüklenen öğeyi referans almak için
  const dragContainerRef = useRef(null); // Sıralama alanının referansı

  // === Carousel görsellerini çek ===
  const fetchCarouselImages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('carousel_images')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      toast.error('Carousel görselleri alınamadı: ' + error.message);
      setImages([]);
    } else {
      setImages(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCarouselImages();
  }, []);

  // === Mouse Drag & Drop ===
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    dragItemNode.current = e.target; // Sürüklenen DOM öğesini sakla
    // Tarayıcının varsayılan drag görselini engellemek için (opsiyonel)
    // e.dataTransfer.effectAllowed = 'move';
    // e.dataTransfer.setData('text/html', ''); // Firefox için gerekli olabilir
  };

  const handleDragEnter = (e, index) => {
    // Sadece farklı bir öğenin üzerine gelindiğinde çalıştır
     if (dragItemNode.current !== e.target) {
        setDragOverIndex(index);
        // Öğeleri yeniden sırala (Görsel geri bildirim için anlık güncelleme)
        const reordered = [...images];
        const [movedItem] = reordered.splice(draggedIndex, 1);
        reordered.splice(index, 0, movedItem);
        setImages(reordered); // State'i anlık güncelle
        setDraggedIndex(index); // Sürüklenen index'i yeni pozisyonuyla güncelle
     }
  };

  const handleDragEnd = async () => { // Bırakma işlemi burada tetiklenecek
    if (draggedIndex === null && dragOverIndex === null) return; // Eğer sürükleme olmadıysa veya aynı yere bırakıldıysa işlem yapma

    dragItemNode.current = null; // Referansı temizle
    setDraggedIndex(null);
    setDragOverIndex(null);

    // Veritabanını yeni sıralama ile güncelle
    const updatePromises = images.map((img, index) =>
      supabase
        .from('carousel_images')
        .update({ display_order: index + 1 })
        .eq('id', img.id)
    );

    const results = await Promise.all(updatePromises);
    const hasError = results.some((r) => r.error);

    if (hasError) {
      toast.error('Sıralama kaydedilirken hata oluştu!');
      // Hata durumunda eski sıralamayı geri yüklemek gerekebilir
      fetchCarouselImages();
    } else {
      toast.success('Sıralama başarıyla güncellendi ✅');
      // fetchCarouselImages(); // State zaten güncellendi, tekrar çekmeye gerek yok
    }
  };

    // handleDragOver: Tarayıcının drop olayına izin vermesi için gerekli
    const handleDragOver = (e) => {
        e.preventDefault();
    };

  // === Touch Drag & Drop ===
  const handleTouchStart = (e, index) => {
    setDraggedIndex(index);
    dragItemNode.current = e.target.closest('[draggable="true"]'); // En yakın draggable parent'ı bul
  };

  const handleTouchMove = (e) => {
    if (draggedIndex === null || !dragItemNode.current) return;

    // Sayfanın kaymasını engelle
    e.preventDefault();

    const touchLocation = e.touches[0];
    const elementOver = document.elementFromPoint(touchLocation.clientX, touchLocation.clientY);
    const dropZone = elementOver?.closest('[draggable="true"]'); // En yakın draggable parent'ı bul

    if (dropZone && dragContainerRef.current?.contains(dropZone)) {
        const overIndexAttr = dropZone.getAttribute('data-index');
        if (overIndexAttr !== null) {
            const overIndex = parseInt(overIndexAttr, 10);
            if (overIndex !== draggedIndex && overIndex !== dragOverIndex) {
                 setDragOverIndex(overIndex); // dragOverIndex'i ayarla
                // Öğeleri yeniden sırala
                const reordered = [...images];
                const [movedItem] = reordered.splice(draggedIndex, 1);
                reordered.splice(overIndex, 0, movedItem);
                setImages(reordered);
                setDraggedIndex(overIndex); // Güncel sürüklenen index
            }
        }
    }
  };

  const handleTouchEnd = () => {
    // Mouse ile aynı kaydetme fonksiyonunu çağır
    handleDragEnd();
  };

  // === Görsel seçme ===
  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setFilesToUpload((prev) => [...prev, ...newFiles]);
      e.target.value = null; // Input'u sıfırla
    }
  };

  // === Önizlemeyi kaldırma ===
  const handleRemovePreview = (previewUrl) => {
    setFilesToUpload((prev) => prev.filter((f) => f.preview !== previewUrl));
    URL.revokeObjectURL(previewUrl);
  };

  // === Görsel yükleme ===
  const handleUpload = async () => {
    if (filesToUpload.length === 0) {
      toast.error('Lütfen önce yüklenecek görselleri seçin.');
      return;
    }

    setUploading(true);
    const toastId = toast.loading(`${filesToUpload.length} görsel yükleniyor...`);

    let successCount = 0;
    const uploadPromises = filesToUpload.map(async (fileObj) => {
      const file = fileObj.file;
      const filePath = `public/${Date.now()}_${file.name.replace(/\s/g, '_')}`;

      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(CAROUSEL_BUCKET_NAME)
          .upload(filePath, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from(CAROUSEL_BUCKET_NAME)
          .getPublicUrl(uploadData.path);
        if (!urlData.publicUrl) throw new Error('Public URL alınamadı.');

        // Sıralama için mevcut en yüksek display_order'ı al
         const { data: maxOrderData, error: maxOrderError } = await supabase
            .from('carousel_images')
            .select('display_order')
            .order('display_order', { ascending: false })
            .limit(1)
            .single();

        const newOrder = (maxOrderError || !maxOrderData) ? 1 : maxOrderData.display_order + 1;


        const { error: dbError } = await supabase
          .from('carousel_images')
          .insert([
            {
              image_url: urlData.publicUrl,
              alt_text: file.name.split('.')[0], // Dosya adından uzantıyı çıkar
              display_order: newOrder, // Yeni sıralama değeri
            },
          ]);
        if (dbError) throw dbError;

        URL.revokeObjectURL(fileObj.preview);
        successCount++;
        return true;
      } catch (error) {
        toast.error(`Hata (${file.name}): ${error.message}`, { duration: 5000 });
        // Başarısız olursa storage'dan silmeyi dene
        try {
          await supabase.storage.from(CAROUSEL_BUCKET_NAME).remove([filePath]);
        } catch (removeError) {
          // Silme hatasını logla ama kullanıcıya gösterme
          console.error("Storage temizleme hatası:", removeError);
        }
        return false;
      }
    });

    await Promise.all(uploadPromises);

    setUploading(false);
    setFilesToUpload([]);
    if (successCount > 0) {
        toast.success(`${successCount} görsel başarıyla yüklendi!`, { id: toastId });
        fetchCarouselImages(); // Liste güncellensin
    } else {
        toast.error('Görsel yüklenemedi.', { id: toastId });
    }
  };

  // === Görsel silme ===
  const handleDelete = async (image) => {
    if (!confirm('Bu görseli silmek istediğinize emin misiniz?')) return;
    const toastId = toast.loading('Görsel siliniyor...');

    try {
        // Storage'dan silme
        const filePath = image.image_url.substring(
            image.image_url.indexOf(`/${CAROUSEL_BUCKET_NAME}/`) +
            `/${CAROUSEL_BUCKET_NAME}/`.length
        );

        const { error: storageError } = await supabase.storage
            .from(CAROUSEL_BUCKET_NAME)
            .remove([filePath]);

        // "Resource not found" hatasını görmezden gel, diğer hataları göster
        if (storageError && !storageError.message.includes('Not Found')) {
            throw new Error(`Storage Hatası: ${storageError.message}`);
        }

        // Veritabanından silme
        const { error: dbError } = await supabase
            .from('carousel_images')
            .delete()
            .eq('id', image.id);

        if (dbError) {
            throw new Error(`Veritabanı Hatası: ${dbError.message}`);
        }

        toast.success('Görsel başarıyla silindi!', { id: toastId });
        fetchCarouselImages(); // Listeyi güncelle
    } catch (error) {
        toast.error(`Silme başarısız: ${error.message}`, { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-900 border-b pb-4">
        Anasayfa Carousel Yönetimi
      </h1>

      {/* === Görsel Yükleme Alanı === */}
      <div className="mb-8 p-6 bg-white rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Yeni Görsel Yükle
        </h2>
        <label
          htmlFor="carousel-upload"
          className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-indigo-300 rounded-lg cursor-pointer bg-indigo-50 hover:bg-indigo-100 transition duration-300 ease-in-out"
        >
          <FiUploadCloud className="w-10 h-10 text-indigo-500 mb-2" />
          <p className="text-sm text-indigo-600 font-medium">
            Görsel seç veya sürükle bırak (Çoklu seçim yapabilirsiniz)
          </p>
        </label>
        <input
          id="carousel-upload"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />

        {filesToUpload.length > 0 && (
          <div className="mt-6">
            <h3 className="text-md font-semibold mb-3 text-gray-700">Yüklenecekler:</h3>
            <div className="flex flex-wrap gap-4">
              {filesToUpload.map((fileObj, index) => (
                <div
                  key={index}
                  className="relative w-24 h-24 border rounded-lg overflow-hidden shadow group"
                >
                  <Image
                    src={fileObj.preview}
                    alt={`Preview ${index}`}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                  <button
                    onClick={() => handleRemovePreview(fileObj.preview)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Kaldır"
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Yükleniyor...' : `Seçilen ${filesToUpload.length} Görseli Yükle`}
            </button>
          </div>
        )}
      </div>

      {/* === Mevcut Görseller (Sıralanabilir) === */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Mevcut Carousel Görselleri (Sıralamak için sürükleyin)
        </h2>
        {loading ? (
          <Loading />
        ) : images.length === 0 ? (
          <p className="text-center text-gray-500 py-6">
            Henüz carousel görseli yüklenmemiş.
          </p>
        ) : (
          <div
            ref={dragContainerRef} // Konteyner referansı
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
          >
            {images.map((image, index) => (
              <div
                key={image.id}
                draggable // Mouse ile sürükleme için
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)} // Üzerine gelindiğinde tetiklenir
                onDragEnd={handleDragEnd} // Bırakıldığında veya işlem bittiğinde tetiklenir
                onDragOver={handleDragOver} // Bırakmaya izin vermek için gerekli
                onTouchStart={(e) => handleTouchStart(e, index)} // Dokunma başlangıcı
                onTouchMove={handleTouchMove} // Dokunarak sürükleme
                onTouchEnd={handleTouchEnd} // Dokunma bitişi
                data-index={index} // Dokunma olaylarında index'i kolayca almak için
                className={`relative group border rounded-lg overflow-hidden shadow aspect-video cursor-move transition-opacity duration-300
                  ${draggedIndex === index ? 'opacity-50' : 'opacity-100'}
                  ${dragOverIndex === index ? 'border-indigo-500 border-2' : ''}
                `}
                style={{ touchAction: 'none' }} // Dokunarak sürüklerken sayfa kaymasını engellemek için önemli
              >
                <Image
                  src={image.image_url}
                  alt={image.alt_text || `Carousel Image ${image.id}`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  style={{ objectFit: 'cover' }}
                  className="transition-transform duration-300 group-hover:scale-105 pointer-events-none" // Image'ın drag olaylarını engelle
                  priority={index < 5} // İlk birkaç görseli öncelikli yükle
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-300 flex items-center justify-between p-2 sm:p-3 opacity-0 group-hover:opacity-100">
                  <FiMove className="text-white w-4 h-4 sm:w-5 sm:h-5 opacity-80" title="Sıralamak için sürükle" />
                  <button
                    onClick={(e) => {
                        e.stopPropagation(); // Arka plandaki drag olayını tetiklemesin
                        handleDelete(image);
                     }}
                    className="p-1 sm:p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                    title="Sil"
                  >
                    <FiTrash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
                <span className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded">
                  {image.display_order}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CarouselManagementPage;