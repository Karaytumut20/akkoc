'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function HomeCarousel() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  const MULTIPLIER = 4; // Görselleri x4 çarpıyoruz (döngü fark edilmiyor)

  // 📸 Görselleri çek
  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('carousel_images')
        .select('id, image_url, alt_text')
        .order('display_order', { ascending: true });

      if (!error && data) {
        // x4 çoğalt
        const repeated = Array.from({ length: MULTIPLIER }, () => data).flat();
        setImages(repeated);
      } else {
        console.error('Error fetching carousel images:', error);
      }
      setLoading(false);
    };
    fetchImages();
  }, []);

  // 🌀 Sonsuz scroll efekti
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || images.length === 0) return;

    const itemWidth = 180 + 16; // 180px kart + 16px gap
    const totalWidth = itemWidth * images.length;

    // Ortadan başla ki geri sarma fark edilmesin
    container.scrollLeft = totalWidth / MULTIPLIER;

    const handleScroll = () => {
      // sona gelince başa al
      if (container.scrollLeft >= totalWidth - container.clientWidth - itemWidth) {
        container.scrollLeft = totalWidth / MULTIPLIER;
      }
      // başa gelince sona al
      if (container.scrollLeft <= 0) {
        container.scrollLeft = totalWidth - (totalWidth / MULTIPLIER);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [images]);

  // ⬅️ Sol buton
  const scrollLeft = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: -200,
      behavior: 'smooth',
    });
  };

  // ➡️ Sağ buton
  const scrollRight = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: 200,
      behavior: 'smooth',
    });
  };

  // 🕓 Loading
  if (loading) {
    return <div className="h-[250px] w-full bg-gray-200 animate-pulse"></div>;
  }

  if (images.length === 0) return null;

  return (
    <div className="relative w-full">
      {/* Scroll Container */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto gap-4 no-scrollbar scroll-smooth py-4 px-2"
      >
        {images.map((img, index) => (
          <div
            key={`${img.id}-${index}`}
            className="relative w-[180px] h-[180px] flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 hover:scale-105 transition-transform"
          >
            <Image
              src={img.image_url}
              alt={img.alt_text || 'Carousel Image'}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {/* Sol Ok */}
      <button
        onClick={scrollLeft}
        className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition z-10"
      >
        <FiChevronLeft size={20} />
      </button>

      {/* Sağ Ok */}
      <button
        onClick={scrollRight}
        className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition z-10"
      >
        <FiChevronRight size={20} />
      </button>
    </div>
  );
}
