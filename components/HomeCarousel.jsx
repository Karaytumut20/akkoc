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
  const [selectedIndex, setSelectedIndex] = useState(null); 

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('carousel_images')
        .select('id, image_url, alt_text')
        .order('display_order', { ascending: true });

      if (!error && data) {
        const repeated = Array.from({ length: MULTIPLIER }, () => data).flat();
        setImages(repeated);
      } else {
        console.error('Error fetching carousel images:', error);
      }
      setLoading(false);
    };
    fetchImages();
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || images.length === 0) return;

    const itemWidth = 180 + 16; 
    const originalCount = images.length / MULTIPLIER;
    const totalWidth = itemWidth * images.length;

    container.scrollLeft = originalCount * itemWidth; 

    const handleScroll = () => {
      if (container.scrollLeft >= totalWidth - container.clientWidth - itemWidth) {
        container.scrollLeft = originalCount * itemWidth;
      }
      if (container.scrollLeft <= 0) {
        container.scrollLeft = totalWidth - (originalCount * itemWidth);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [images]);

  const scrollLeft = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRight = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
  };

  const handleNext = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handlePrev = () => {
    if (selectedIndex === null) return;
    setSelectedIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const closeModal = () => setSelectedIndex(null);
  
  const selectedImage = selectedIndex !== null ? images[selectedIndex] : null;

  if (loading) {
    return <div className="h-[250px] w-full bg-gray-200 animate-pulse"></div>;
  }

  if (images.length === 0) return null;

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
              onClick={() => setSelectedIndex(index)} 
            >
              <Image
                src={img.image_url}
                alt={img.alt_text || 'Carousel Image'}
                fill
                className="object-cover"
                sizes="180px"
                priority={index < 5}
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

      {/* 📸 POPUP MODAL - SAFARİ İÇİN Z-INDEX DÜZELTMESİ */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[2147483645] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={closeModal}
          style={{
            // Safari için hardware acceleration
            transform: 'translateZ(0)',
            WebkitTransform: 'translateZ(0)'
          }}
        >
          <div
            className="relative max-w-5xl w-full mx-4 rounded-lg overflow-hidden shadow-none bg-transparent"
            onClick={(e) => e.stopPropagation()}
            style={{
              // Modal içeriği için biraz daha yüksek z-index
              zIndex: 2147483646
            }}
          >
            {/* ❌ X BUTONU */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-[2147483647] bg-white/90 text-black p-2 rounded-full hover:bg-white transition"
              aria-label="Close"
              style={{
                // Kapatma butonu en üstte
                zIndex: 2147483647
              }}
            >
              <FiX size={24} />
            </button>
            
            {/* SOL OK (Navigasyon - Masaüstü) */}
            <button
              onClick={handlePrev}
              className="absolute top-1/2 left-4 transform -translate-y-1/2 z-[2147483647] bg-white/50 text-black p-3 rounded-full hover:bg-white/70 transition hidden sm:block"
              aria-label="Previous Image"
              style={{
                zIndex: 2147483647
              }}
            >
              <FiChevronLeft size={30} />
            </button>

            {/* SAĞ OK (Navigasyon - Masaüstü) */}
            <button
              onClick={handleNext}
              className="absolute top-1/2 right-4 transform -translate-y-1/2 z-[2147483647] bg-white/50 text-black p-3 rounded-full hover:bg-white/70 transition hidden sm:block"
              aria-label="Next Image"
              style={{
                zIndex: 2147483647
              }}
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
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 700px"
              />
            </div>
            
            {/* MOBİL OKLAR (Görselin hemen altında) */}
             <div className="sm:hidden flex justify-center gap-8 mt-4">
                 <button
                    onClick={handlePrev}
                    className="flex items-center gap-1 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 transition z-[2147483647]"
                    style={{
                      zIndex: 2147483647
                    }}
                >
                    <FiChevronLeft size={20} /> 
                </button>
                <button
                    onClick={handleNext}
                    className="flex items-center gap-1 text-white bg-black/50 p-2 rounded-full hover:bg-black/70 transition z-[2147483647]"
                    style={{
                      zIndex: 2147483647
                    }}
                >
                   <FiChevronRight size={20} />
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Safari için Global Stiller */}
      <style jsx global>{`
        /* Safari için Carousel Modal Optimizasyonu */
        @media not all and (min-resolution:.001dpcm) { 
          @supports (-webkit-appearance:none) {
            /* Carousel modal'ının diğer elementlerin üstünde olmasını engelle */
            .carousel-modal-overlay {
              z-index: 2147483645 !important;
            }
            
            /* Sidebar'ın carousel modal'ından üstte olmasını sağla */
            .safari-overlay,
            .safari-mobile-menu {
              z-index: 2147483647 !important;
            }
          }
        }

        /* Scrollbar gizleme */
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
}