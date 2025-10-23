'use client';

import React, { useState, useEffect } from 'react';
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

  // === Drag & Drop sıralama ===
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const reordered = [...images];
    const [movedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, movedItem);

    setImages(reordered);
    setDraggedIndex(index);
  };

  const handleDrop = async () => {
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
    } else {
      toast.success('Sıralama başarıyla güncellendi ✅');
      fetchCarouselImages();
    }

    setDraggedIndex(null);
  };

  // === Görsel seçme ===
  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setFilesToUpload((prev) => [...prev, ...newFiles]);
      e.target.value = null;
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

    const uploadPromises = filesToUpload.map(async (fileObj) => {
      const file = fileObj.file;
      const filePath = `public/${Date.now()}_${file.name.replace(/\s/g, '_')}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(CAROUSEL_BUCKET_NAME)
        .upload(filePath, file);

      if (uploadError) {
        toast.error(`Görsel yüklenemedi: ${file.name}`);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from(CAROUSEL_BUCKET_NAME)
        .getPublicUrl(uploadData.path);

      const maxOrder =
        images.length > 0 ? Math.max(...images.map((img) => img.display_order)) : 0;

      const { error: dbError } = await supabase
        .from('carousel_images')
        .insert([
          {
            image_url: urlData.publicUrl,
            alt_text: file.name,
            display_order: maxOrder + 1,
          },
        ]);

      if (dbError) {
        toast.error(`Veritabanına kaydedilemedi: ${file.name}`);
        await supabase.storage.from(CAROUSEL_BUCKET_NAME).remove([filePath]);
        return null;
      }

      URL.revokeObjectURL(fileObj.preview);
      return true;
    });

    await Promise.all(uploadPromises);

    setUploading(false);
    setFilesToUpload([]);
    fetchCarouselImages();
    toast.success('Görseller başarıyla yüklendi!');
  };

  // === Görsel silme ===
  const handleDelete = async (image) => {
    if (!confirm('Bu görseli silmek istediğinize emin misiniz?')) return;

    const filePath = image.image_url.substring(
      image.image_url.indexOf(`/${CAROUSEL_BUCKET_NAME}/`) +
        `/${CAROUSEL_BUCKET_NAME}/`.length
    );

    const { error: storageError } = await supabase.storage
      .from(CAROUSEL_BUCKET_NAME)
      .remove([filePath]);

    if (storageError && storageError.message !== 'The resource was not found') {
      toast.error('Storage\'dan silinemedi: ' + storageError.message);
    }

    const { error: dbError } = await supabase
      .from('carousel_images')
      .delete()
      .eq('id', image.id);

    if (dbError) {
      toast.error('Veritabanından silinemedi: ' + dbError.message);
    } else {
      toast.success('Görsel başarıyla silindi!');
      fetchCarouselImages();
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
            Görsel seç veya sürükle bırak
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
              {uploading ? 'Yükleniyor...' : 'Seçilenleri Yükle'}
            </button>
          </div>
        )}
      </div>

      {/* === Mevcut Görseller === */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Mevcut Carousel Görselleri
        </h2>
        {loading ? (
          <Loading />
        ) : images.length === 0 ? (
          <p className="text-center text-gray-500 py-6">
            Henüz carousel görseli yüklenmemiş.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={handleDrop}
                className="relative group border rounded-lg overflow-hidden shadow aspect-video cursor-move"
              >
                <Image
                  src={image.image_url}
                  alt={image.alt_text || `Carousel Image ${image.id}`}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-300 flex items-center justify-between px-3">
                  <FiMove className="text-white w-5 h-5 opacity-80" />
                  <button
                    onClick={() => handleDelete(image)}
                    className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                    title="Sil"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
                <span className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1.5 py-0.5 rounded">
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
