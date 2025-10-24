// components/VideoBar.jsx

'use client';

import React, { useState, useEffect } from "react";
import MainNavbar from "./MainNavbar";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"; // Supabase client'ı import et

export default function KnotVideoHero() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [isClient, setIsClient] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState(null); // Video URL'sini tutacak state
  const [videoLoading, setVideoLoading] = useState(true); // Video yüklenme durumu

  useEffect(() => {
    setIsClient(true);

    // Sadece anasayfada videoyu çek
    if (isHomePage) {
      const fetchActiveVideo = async () => {
        setVideoLoading(true);
        const { data, error } = await supabase
          .from('hero_videos')
          .select('video_url')
          .eq('is_active', true)
          .limit(1) // Sadece bir tane aktif olmalı
          .single(); // Tek bir kayıt bekliyoruz

        if (error && error.code !== 'PGRST116') { // PGRST116: No rows found
          console.error("Aktif video çekme hatası:", error);
          // Hata durumunda varsayılan videoyu kullanabilir veya boş bırakabilirsiniz
          setActiveVideoUrl("/assets/video.mp4"); // Varsayılan video
        } else if (data) {
          setActiveVideoUrl(data.video_url);
        } else {
          // Aktif video bulunamazsa varsayılanı kullan
          setActiveVideoUrl("/assets/video.mp4"); // Varsayılan video
        }
        setVideoLoading(false);
      };

      fetchActiveVideo();
    } else {
        setVideoLoading(false); // Anasayfa değilse yüklemeye gerek yok
    }

  }, [isHomePage]); // isHomePage değiştiğinde tekrar çalışır (gerçi pek değişmez ama doğru dependency)

  // Anasayfa dışındaysa veya henüz client tarafı yüklenmediyse sadece Navbar'ı göster
  if (!isHomePage && !isClient) {
      return (
         <div className="relative w-full bg-black/70 backdrop-blur-md">
            <MainNavbar />
         </div>
      );
  }
   // Anasayfa dışındaysa sadece Navbar göster
   if (!isHomePage) {
      return (
         <div className="relative w-full bg-black/70 backdrop-blur-md">
           <MainNavbar />
         </div>
      )
   }

  // Anasayfadaysak video arka planlı hero gözükecek
  return (
    <section className="w-full h-screen relative overflow-hidden bg-black font-sans">
      {/* Background Video */}
      {isClient && !videoLoading && activeVideoUrl && (
        <video
          key={activeVideoUrl} // URL değiştiğinde videonun yeniden yüklenmesini sağlar
          className="absolute top-0 left-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={activeVideoUrl} type="video/mp4" />
          {/* İsteğe bağlı olarak farklı formatlar için source ekleyebilirsiniz */}
          {/* <source src={activeVideoUrl.replace('.mp4', '.webm')} type="video/webm" /> */}
          Tarayıcınız video etiketini desteklemiyor.
        </video>
      )}
       {/* Video yüklenirken veya URL yoksa bir placeholder gösterilebilir */}
       {isClient && (videoLoading || !activeVideoUrl) && (
           <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
               {/* İsteğe bağlı yükleniyor göstergesi */}
                <div className="text-white">Video Yükleniyor...</div>
           </div>
       )}


      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] z-10"></div>

      {/* Navbar */}
      <MainNavbar />

      {/* SHOP NOW BUTTON */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-30">
        <a
          href="/all-products"
          className="bg-white/95 text-gray-900 text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase py-3 px-10 hover:bg-white transition-all duration-300"
        >
          Shop Now
        </a>
      </div>
    </section>
  );
}