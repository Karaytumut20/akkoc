// components/HomepageCarousel.jsx

'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import Link from 'next/link';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

// Klon sayısı, titremeyi önlemek için kritik. 
const CLONE_COUNT = 5; 

export default function HomepageCarousel() {
  const [carouselProducts, setCarouselProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef(null);
  
  // Ürünün tam genişliğini (gap dahil) tutmak için ref
  const itemWidthRef = useRef(0); 
  const isButtonScrollingRef = useRef(false); // Butonla başlatılan smooth scroll durumunu takip eder.

  // --- Veri Çekme ---
  useEffect(() => {
    // Mevcut fetching mantığı aynı kalır
    const fetchCarouselProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, image_urls')
        .eq('homepage_carousel', true)
        .limit(10); 

      if (error) {
        console.error('Carousel ürünleri alınamadı:', error.message);
        setCarouselProducts([]);
      } else {
        const productsWithValidImages = (data || []).map(p => ({
          ...p,
          imageUrl: (Array.isArray(p.image_urls) && p.image_urls.length > 0 && p.image_urls[0]) ? p.image_urls[0] : '/assets/placeholder.jpg'
        }));
        setCarouselProducts(productsWithValidImages);
      }
      setLoading(false);
    };
    fetchCarouselProducts();
  }, []);

  // --- Klonlanmış Liste Oluşturma (Aynı) ---
  const infiniteProducts = useMemo(() => {
    if (carouselProducts.length === 0 || carouselProducts.length < CLONE_COUNT) return carouselProducts;
    
    const clonesBefore = carouselProducts.slice(-CLONE_COUNT);
    const clonesAfter = carouselProducts.slice(0, CLONE_COUNT);

    return [
        ...clonesBefore.map(p => ({ ...p, key: `cloned-b-${p.id}-${Math.random()}` })), 
        ...carouselProducts.map(p => ({ ...p, key: `original-${p.id}` })),
        ...clonesAfter.map(p => ({ ...p, key: `cloned-a-${p.id}-${Math.random()}` }))
    ];
  }, [carouselProducts]);

  const originalProductCount = carouselProducts.length;
  const totalItemCount = infiniteProducts.length;
  const firstOriginalIndex = CLONE_COUNT; // İlk orijinal ürünün dizideki indeksi

  // Yardımcı Fonksiyon: Ürün genişliğini (gap dahil) hesaplar.
  const calculateItemWidth = useCallback((container) => {
    const firstItem = container.querySelector('.flex-shrink-0');
    if (firstItem) {
        const itemWidth = firstItem.offsetWidth;
        const gap = parseFloat(getComputedStyle(container).gap.replace('px', '')) || 0;
        itemWidthRef.current = itemWidth + gap;
        return itemWidth + gap;
    }
    // Fallback değeri
    return 200 + 16; 
  }, []);

  // --- Başlangıç Konumlandırma ve Event Listener'lar ---
  useEffect(() => {
    if (scrollContainerRef.current && originalProductCount > 0 && !loading) {
      const itemWidth = calculateItemWidth(scrollContainerRef.current);
      
      // İlk orijinal ürüne anında konumlan (Sayfa yüklenir yüklenmez)
      scrollContainerRef.current.scrollLeft = firstOriginalIndex * itemWidth;

      // Event Listener'ı ekle
      const currentRef = scrollContainerRef.current;
      currentRef.addEventListener('scroll', handleScroll);
      
      return () => {
        currentRef.removeEventListener('scroll', handleScroll);
      };
    }
  }, [loading, originalProductCount, calculateItemWidth]);

  // Sonsuz döngü mantığını uygulayan **Mouse Sürükleme** dinleyicisi
  const handleScroll = () => {
    if (!scrollContainerRef.current || isButtonScrollingRef.current) return;
    
    // Gecikme olmaksızın anında kontrol et.
    clearTimeout(scrollContainerRef.current.scrollTimeout);
    scrollContainerRef.current.scrollTimeout = setTimeout(() => {
        const { scrollLeft } = scrollContainerRef.current;
        const itemWidth = itemWidthRef.current;
        if (itemWidth === 0) return;

        // Mouse ile kaydırma durduğunda veya yavaşladığında çalışır.
        const currentSnapIndex = Math.round(scrollLeft / itemWidth);
        
        // --- Sonsuz Döngü Kontrolü ---

        // 1. Sona ulaşıldıysa (son klon grubuna geçiş)
        if (currentSnapIndex >= totalItemCount - CLONE_COUNT) {
          // Başlangıçtaki gerçek ürünün olduğu konuma anında atla
          const newScrollLeft = firstOriginalIndex * itemWidth;
          scrollContainerRef.current.scrollLeft = newScrollLeft;
        } 
        // 2. Başa ulaşıldıysa (ilk klon grubuna geçiş)
        else if (currentSnapIndex < CLONE_COUNT) {
          // Sondaki gerçek ürünün olduğu konuma anında atla
          const lastOriginalIndex = totalItemCount - CLONE_COUNT * 2;
          const newScrollLeft = lastOriginalIndex * itemWidth;
          scrollContainerRef.current.scrollLeft = newScrollLeft;
        }
    }, 100); // 100ms gecikme, mouse ile sürükleme durduktan sonra kontrol için.
  };

  // Kaydırma işlemi (Butonlar için)
  const scroll = (direction) => {
    if (!scrollContainerRef.current || isButtonScrollingRef.current) return;
    
    isButtonScrollingRef.current = true;
    
    const { scrollLeft } = scrollContainerRef.current;
    const itemWidth = itemWidthRef.current;
    
    const currentItemIndex = Math.round(scrollLeft / itemWidth);

    const newScrollLeft = direction === 'left' 
                          ? (currentItemIndex - 1) * itemWidth 
                          : (currentItemIndex + 1) * itemWidth;

    // Yumuşak kaydırma
    scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
    });

    // Butonla kaydırma bittikten sonra anlık kilidi kaldır
    setTimeout(() => {
        isButtonScrollingRef.current = false;
        // smooth scroll bittiğinde handleScroll tekrar tetiklenebilir
    }, 400); // CSS smooth scroll için güvenli süre.
  };

  if (loading) return null;
  if (carouselProducts.length < CLONE_COUNT) return null;

  return (
    <section className="w-full py-12 md:py-16 bg-[#ECE4DC] relative group">
      <h2 className="text-2xl md:text-3xl font-semibold text-center text-gray-800 mb-8 md:mb-12">
        Öne Çıkanlar
      </h2>
      <div className="relative max-w-7xl mx-auto px-4">
        {/* Sol Kaydırma Butonu */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/70 hover:bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-2 lg:-ml-4 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Önceki"
          // isButtonScrollingRef.current ile kontrol
        >
          <FiChevronLeft className="w-6 h-6 text-gray-700" />
        </button>

        {/* Kaydırılabilir İçerik (Mouse ile sürüklenebilir) */}
        <div
          ref={scrollContainerRef}
          // overflow-x-scroll mouse ile sürüklemeyi sağlar (varsayılan tarayıcı davranışı)
          className="flex gap-4 md:gap-6 overflow-x-scroll scrollbar-hide py-2 px-1" 
          // Scroll Snap, elle kaydırmayı kusursuz yapar.
          style={{ 
            scrollSnapType: 'x mandatory',
            // Bazı tarayıcılarda (özellikle mobil) sürüklemeyi iyileştirmek için
            WebkitOverflowScrolling: 'touch', 
            cursor: 'grab' // Mouse imlecini değiştirerek sürükleme hissi verir
          }} 
        >
          {/* infiniteProducts listesini kullanıyoruz */}
          {infiniteProducts.map((product) => (
            <Link 
                href={`/product/${product.id}`} 
                key={product.key} 
                passHref
            >
              <div 
                className="flex-shrink-0 w-[150px] md:w-[180px] lg:w-[200px] cursor-pointer group/item"
                style={{ scrollSnapAlign: 'start' }} 
              >
                <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-sm transition-shadow duration-300 group-hover/item:shadow-lg bg-gray-100">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover/item:scale-105"
                    sizes="(max-width: 768px) 40vw, (max-width: 1024px) 25vw, 200px"
                    loading="lazy"
                  />
                </div>
                <p className="mt-2 text-sm font-medium text-gray-700 text-center truncate group-hover/item:text-gray-900 transition-colors">
                  {product.name}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Sağ Kaydırma Butonu */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white/70 hover:bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 mr-2 lg:-mr-4 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Sonraki"
          // isButtonScrollingRef.current ile kontrol
        >
          <FiChevronRight className="w-6 h-6 text-gray-700" />
        </button>
      </div>
    </section>
  );
}