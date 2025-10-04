'use client';

import React from "react";

export default function KnotVideoHero() {
  return (
    // Ana Kapsayıcı: Ekranı tamamen kaplar (h-screen)
    <section className="w-full h-screen relative overflow-hidden bg-teal-500">
      
      {/* 1. Arka Plan Video / Görsel Alanı */}
      <video
        className="absolute top-0 left-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      >
        {/* LÜTFEN VİDEO YOLUNU GÜNCELLEYİN */}
        <source src="/assets/video.mp4" type="video/mp4" /> 
        Your browser does not support the video tag.
      </video>

      {/* Overlay (Metni okunaklı yapmak için) */}
      <div className="absolute inset-0 bg-black/10 z-10"></div> 

      {/* 2. İçerik Katmanı (Navigasyon, Başlık ve Buton) */}
      <div className="relative z-20 w-full h-full flex flex-col">

        {/* Üst Kısım: Logo ve Navigasyon */}
        <header className="w-full text-white pt-8 px-4 sm:px-8 lg:px-12">
            
            {/* Logo (Ortalanmış) */}
            <div className="text-center mb-6">
              <h1 className="text-4xl sm:text-5xl font-serif tracking-widest uppercase">
                TIFFANY&CO.
              </h1>
            </div>

            {/* Navigasyon Menüsü */}
            <nav className="hidden md:flex justify-center space-x-6 lg:space-x-10 text-xs font-semibold tracking-widest">
              <a href="#" className="hover:text-gray-300 transition duration-150">HIGH JEWELRY</a>
              <a href="#" className="hover:text-gray-300 transition duration-150">JEWELRY</a>
              <a href="#" className="hover:text-gray-300 transition duration-150">LOVE & ENGAGEMENT</a>
              <a href="#" className="hover:text-gray-300 transition duration-150">FINE WATCHES</a>
              <a href="#" className="hover:text-gray-300 transition duration-150">HOME</a>
              <a href="#" className="hover:text-gray-300 transition duration-150">ACCESSORIES</a>
              <a href="#" className="hover:text-gray-300 transition duration-150">GIFTS</a>
              <a href="#" className="hover:text-gray-300 transition duration-150">World of Tiffany</a>
            </nav>
        </header>
        
        
        </div>
      
      {/* 3. Buton Alanı (En alta konumlandırıldı) */}
      {/* absolute: Konumlandırma için kullanılır
         bottom-12: Alttan 12 birim yukarıda
         left-1/2 -translate-x-1/2: Yatayda tam ortalama sağlanır
      */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-30">
        <a
          href="/shop/knot"
          className="bg-white text-gray-900 text-sm font-semibold tracking-widest uppercase py-3 px-8 transition duration-300 hover:bg-gray-100"
        >
          SHOP NOW
        </a>
      </div>
    </section>
  );
}