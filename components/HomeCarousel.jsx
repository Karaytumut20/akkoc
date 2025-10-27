// components/HomeCarousel.jsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import { FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';

export default function HomeCarousel() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  const MULTIPLIER = 4;
  // REVİZYON: Seçili görselin nesnesi yerine dizideki indeksini tutuyoruz
  const [selectedIndex, setSelectedIndex] = useState(null); 

  // 📸 Görselleri çek
  useEffect(() => {
    // Görselleri veritabanından çeken asenkron fonksiyon (Turkce: Asenkron fonksiyon, veritabanından görselleri çeker.)
    const fetchImages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('carousel_images')
        .select('id, image_url, alt_text')
        .order('display_order', { ascending: true });

      if (!error && data) {
        // Sonsuz kaydırma efekti için görselleri çoğalt
        const repeated = Array.from({ length: MULTIPLIER }, () => data).flat();
        setImages(repeated);
      } else {
        console.error('Error fetching carousel images:', error); // Hata konsola yazılır.
      }
      setLoading(false);
    };
    fetchImages();
  }, []);

  // 🌀 Sonsuz scroll efekti
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || images.length === 0) return;

    // Tahmini öğe genişliği + boşluk
    const itemWidth = 180 + 16; 
    const originalCount = images.length / MULTIPLIER;
    const totalWidth = itemWidth * images.length;

    // Ortadaki orjinal görsellerin başlangıç noktasına kaydır.
    container.scrollLeft = originalCount * itemWidth; 

    // Scroll olayını yöneten fonksiyon (Turkce: Scroll hareketini kontrol ederek sonsuz döngü efektini sağlar.)
    const handleScroll = () => {
      // Sonsuz kaydırma mantığı:
      // Eğer son klon grubuna ulaştıysa (yaklaşık olarak)
      if (container.scrollLeft >= totalWidth - container.clientWidth - itemWidth) {
        // Ortadaki orjinal grubun başlangıcına anında atla
        container.scrollLeft = originalCount * itemWidth;
      }
      // Eğer ilk klon grubuna ulaştıysa (yaklaşık olarak)
      if (container.scrollLeft <= 0) {
        // Ortadaki orjinal grubun sonuna anında atla
        container.scrollLeft = totalWidth - (originalCount * itemWidth);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [images]);

  // Sola kaydırma (önizleme)
  const scrollLeft = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' }); // Yumuşak kaydırma
  };

  // Sağa kaydırma (önizleme)
  const scrollRight = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' }); // Yumuşak kaydırma
  };

  // Pop-up'ta sonraki görsele geçme (Turkce: Bir sonraki görsele döngüsel olarak geçer.)
  const handleNext = () => {
    if (selectedIndex === null) return;
    // Dizinin sonuna gelindiyse başa dön, aksi halde bir sonraki indekse geç
    setSelectedIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  // Pop-up'ta önceki görsele geçme (Turkce: Bir önceki görsele döngüsel olarak geçer.)
  const handlePrev = () => {
    if (selectedIndex === null) return;
    // Dizinin başına gelindiyse sona dön, aksi halde bir önceki indekse geç
    setSelectedIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  // Modal'ı kapat (Turkce: Modal'ı kapatır ve seçimi sıfırlar.)
  const closeModal = () => setSelectedIndex(null);
  
  // Modal'da gösterilecek görseli al (Turkce: Seçili indekse göre görsel nesnesini alır.)
  const selectedImage = selectedIndex !== null ? images[selectedIndex] : null;

  if (loading) {
    // Yükleniyor durumunda placeholder göster
    return <div className="h-[250px] w-full bg-gray-200 animate-pulse"></div>;
  }

  if (images.length === 0) return null; // Görsel yoksa bileşeni gizle

  return (
    <>
      <div className="relative w-full">
        {/* Başlık */}
        <h2 className="text-2xl sm:text-3xl font-normal text-gray-800 text-center mt-10 mb-6">
          Albums Of Collections
        </h2>

        {/* Scroll Container (Önizleme) */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-4 no-scrollbar scroll-smooth py-4 px-2"
        >
          {images.map((img, index) => (
            <div
              key={`${img.id}-${index}`}
              className="relative w-[180px] h-[180px] flex-shrink-0 rounded-lg overflow-hidden hover:scale-105 transition-transform cursor-pointer"
              // REVİZYON: Tıklama olayında indeksi ayarla
              onClick={() => setSelectedIndex(index)} 
            >
              <Image
                src={img.image_url}
                alt={img.alt_text || 'Carousel Image'}
                fill
                className="object-cover"
                sizes="180px" // Resim boyutunu belirt
                priority={index < 5} // İlk birkaç resmi öncelikli yükle
              />
            </div>
          ))}
        </div>

        {/* Sol Ok (Önizleme) */}
        <button
          onClick={scrollLeft}
          className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition z-10"
        >
          <FiChevronLeft size={20} />
        </button>

        {/* Sağ Ok (Önizleme) */}
        <button
          onClick={scrollRight}
          className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition z-10"
        >
          <FiChevronRight size={20} />
        </button>
      </div>

      {/* 📸 POPUP MODAL (Tam Ekran Görünüm) */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="relative max-w-5xl w-full mx-4 rounded-lg overflow-hidden shadow-none bg-transparent"
            onClick={(e) => e.stopPropagation()} // Modal içindeki tıklamaların kapanmayı engellemesi
          >
            {/* ❌ X BUTONU */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-50 bg-white/90 text-black p-2 rounded-full hover:bg-white transition"
              aria-label="Close"
            >
              <FiX size={24} />
            </button>
            
            {/* SOL OK (Navigasyon - Masaüstü) */}
            <button
              onClick={handlePrev}
              className="absolute top-1/2 left-4 transform -translate-y-1/2 z-50 bg-white/50 text-black p-3 rounded-full hover:bg-white/70 transition hidden sm:block"
              aria-label="Previous Image"
            >
              <FiChevronLeft size={30} />
            </button>

            {/* SAĞ OK (Navigasyon - Masaüstü) */}
            <button
              onClick={handleNext}
              className="absolute top-1/2 right-4 transform -translate-y-1/2 z-50 bg-white/50 text-black p-3 rounded-full hover:bg-white/70 transition hidden sm:block"
              aria-label="Next Image"
            >
              <FiChevronRight size={30} />
            </button>
            
            {/* GÖRSEL ALANI */}
            <div className="relative w-full h-[55vh] sm:h-[80vh] flex items-center justify-center">
              <Image
                src={selectedImage.image_url}
                alt={selectedImage.alt_text || 'Selected Image'}
                fill
                className="object-contain"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 700px" // Resim boyutlarını belirt
              />
            </div>
            
            {/* MOBİL OKLAR (Görselin hemen altında) */}
             <div className="sm:hidden flex justify-center gap-8 mt-4">
                 <button
                    onClick={handlePrev}
                    className="flex items-center gap-1 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 transition"
                >
                    <FiChevronLeft size={20} /> 
                </button>
                <button
                    onClick={handleNext}
                    className="flex items-center gap-1 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 transition"
                >
                   <FiChevronRight size={20} />
                </button>
             </div>
          </div>
        </div>
      )}
    </>
  );
}