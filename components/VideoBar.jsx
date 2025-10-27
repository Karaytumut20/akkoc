// components/VideoBar.jsx

'use client';

import React, { useState, useEffect } from "react";
import MainNavbar from "./MainNavbar"; // Ana navigasyon barını içe aktar
import { usePathname } from "next/navigation"; // Mevcut yolu almak için hook
import { supabase } from "@/lib/supabaseClient"; // Supabase istemcisini içe aktar

export default function KnotVideoHero() {
  const pathname = usePathname(); // Mevcut yolu al
  const isHomePage = pathname === "/"; // Anasayfa olup olmadığını kontrol et
  const [isClient, setIsClient] = useState(false); // Komponentin client tarafında yüklendiğini takip et
  const [activeVideoUrl, setActiveVideoUrl] = useState(null); // Aktif video URL'sini tut
  const [videoLoading, setVideoLoading] = useState(true); // Video yüklenme durumunu tut

  // Komponent yüklendiğinde client tarafında olduğunu işaretle ve videoyu çek (eğer anasayfaysa)
  useEffect(() => {
    setIsClient(true); // Client tarafında yüklendi

    // Sadece anasayfada videoyu çek
    if (isHomePage) {
      const fetchActiveVideo = async () => {
        setVideoLoading(true); // Yüklemeyi başlat
        // Supabase'den aktif videoyu ('is_active' true olanı) çek
        const { data, error } = await supabase
          .from("hero_videos") // 'hero_videos' tablosundan
          .select("video_url") // Sadece video URL'sini seç
          .eq("is_active", true) // 'is_active' sütunu true olanları filtrele
          .limit(1) // Sadece bir tane getir
          .single(); // Tek bir sonuç bekle

        // Hata kontrolü (Satır bulunamadı hatasını (PGRST116) göz ardı et)
        if (error && error.code !== "PGRST116") {
          console.error("Aktif video çekme hatası:", error);
          setActiveVideoUrl("/assets/video.mp4"); // Hata durumunda varsayılan videoyu ayarla
        } else if (data) {
          setActiveVideoUrl(data.video_url); // Gelen veriyi URL olarak ayarla
        } else {
          // Aktif video bulunamazsa varsayılanı kullan
          setActiveVideoUrl("/assets/video.mp4");
        }

        setVideoLoading(false); // Yüklemeyi bitir
      };

      fetchActiveVideo(); // Videoyu çekme fonksiyonunu çağır
    } else {
      setVideoLoading(false); // Anasayfa değilse yüklemeye gerek yok
    }
  }, [isHomePage]); // isHomePage değişirse bu effect'i tekrar çalıştır

  // ✅ Anasayfa değilse veya henüz client yüklenmediyse sadece Navbar'ı göster
  // Bu blok anasayfa dışındaki sayfalar için Navbar'ı render eder
  if (!isHomePage && !isClient) {
    return (
      <div className="relative w-full bg-[#ECE4DC] backdrop-blur-md"> {/* Arka plan rengi */}
        {/* Navbar burada render edilir, kendi içinde sticky vs. yönetir */}
        <MainNavbar />
      </div>
    );
  }
  // ✅ Anasayfa değilse Navbar'ı göster
  if (!isHomePage) {
    return (
      <div className="relative w-full bg-[#ECE4DC] backdrop-blur-md"> {/* Arka plan rengi */}
         {/* Navbar burada render edilir, kendi içinde sticky vs. yönetir */}
        <MainNavbar />
      </div>
    );
  }

  // ✅ Anasayfadaysa video hero alanı
  return (
    // Ana section: Yüksekliği ekran boyutlarına göre ayarla, video için relativ konumlandırma
    <section className="w-full h-[60vh] sm:h-[80vh] md:h-screen relative overflow-hidden bg-[#ECE4DC] font-sans">

      {/* === Arka Plan Videosu === */}
      {/* Sadece client'ta, video yüklenmişse ve URL varsa render et */}
      {isClient && !videoLoading && activeVideoUrl && (
        <video
          key={activeVideoUrl} // URL değişirse videoyu yeniden yükle
          // === DEĞİŞİKLİK BURADA ===
          // Stil: Mutlak konum, tam ekran kaplama, TÜM boyutlarda 'object-contain'.
          // md ve üzeri ekranlarda %8 zoom ('md:transform md:scale-[1.08]') uygula.
          className="absolute top-0 left-0 w-full h-full object-contain transition-all duration-500 md:transform md:scale-[1.08]"
          // === DEĞİŞİKLİK SONU ===
          autoPlay // Otomatik oynat
          loop // Döngüsel oynat
          muted // Sesi kapat
          playsInline // iOS'ta tam ekran olmadan oynat
        >
          <source src={activeVideoUrl} type="video/mp4" /> {/* Video kaynağı */}
          Tarayıcınız video etiketini desteklemiyor. {/* Desteklenmeyen tarayıcılar için mesaj */}
        </video>
      )}

      {/* === Yükleme Göstergesi === */}
      {/* Client'ta, video yüklenirken veya URL yoksa göster */}
      {isClient && (videoLoading || !activeVideoUrl) && (
        <div className="absolute inset-0 bg-[#ECE4DC] flex items-center justify-center">
          <div className="text-gray-800 font-medium">Video Loading...</div> {/* Yükleme metni */}
        </div>
      )}

      {/* === Kaplama Katmanı === */}
      {/* Video üzerine yarı saydam siyah bir katman ekler (z-10) */}
      <div className="absolute inset-0 bg-black/30 z-10"></div>

      {/* === Navbar === */}
      {/* Navbar'ı içeren div'e z-index ekleyerek butonun üzerine çıkarıyoruz */}
      <div className="absolute top-0 left-0 right-0 z-40"> {/* Navbar için z-40 */}
        <MainNavbar /> {/* Ana navigasyon barı */}
      </div>

      {/* === Shop Now Butonu === */}
      {/* Butonu absolute konumlandırıp ortalıyoruz (z-30) */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-30">
        <a
          href="/all-products" // Tüm ürünler sayfasına link
          // Buton stilleri: Beyaz arka plan, metin rengi, boyut, hover efekti vb.
          className="bg-white/95 text-gray-900 text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase py-3 px-10 hover:bg-white transition-all duration-300"
        >
          Shop Now
        </a>
      </div>
    </section>
  );
}