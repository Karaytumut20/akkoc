// components/VideoBar.jsx

'use client';

import React, { useState, useEffect } from "react";
import MainNavbar from "./MainNavbar";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function KnotVideoHero() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [isClient, setIsClient] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);
  const [videoLoading, setVideoLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);

    if (isHomePage) {
      const fetchActiveVideo = async () => {
        setVideoLoading(true);
        const { data, error } = await supabase
          .from("hero_videos")
          .select("video_url")
          .eq("is_active", true)
          .limit(1)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Aktif video çekme hatası:", error);
          setActiveVideoUrl("/assets/video.mp4");
        } else if (data) {
          setActiveVideoUrl(data.video_url);
        } else {
          setActiveVideoUrl("/assets/video.mp4");
        }

        setVideoLoading(false);
      };

      fetchActiveVideo();
    } else {
      setVideoLoading(false);
    }
  }, [isHomePage]);

  if (!isHomePage && !isClient) {
    return (
      <div className="relative w-full bg-[#ECE4DC] backdrop-blur-md">
        <MainNavbar />
      </div>
    );
  }
  
  if (!isHomePage) {
    return (
      <div className="relative w-full bg-[#ECE4DC] backdrop-blur-md">
        <MainNavbar />
      </div>
    );
  }

  return (
    <section className="w-full h-[60vh] sm:h-[80vh] md:h-screen relative overflow-hidden bg-[#ECE4DC] font-sans">

      {/* Arka Plan Videosu */}
      {isClient && !videoLoading && activeVideoUrl && (
        <video
          key={activeVideoUrl}
          className="absolute top-0 left-0 w-full h-full object-contain transition-all duration-500 md:transform md:scale-[1.08]"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={activeVideoUrl} type="video/mp4" />
          Tarayıcınız video etiketini desteklemiyor.
        </video>
      )}

      {/* Yükleme Göstergesi */}
      {isClient && (videoLoading || !activeVideoUrl) && (
        <div className="absolute inset-0 bg-[#ECE4DC] flex items-center justify-center">
          <div className="text-gray-800 font-medium">Video Loading...</div>
        </div>
      )}

      {/* Kaplama Katmanı */}
      <div className="absolute inset-0 bg-black/30 z-10"></div>

      {/* Navbar */}
      <div className="absolute top-0 left-0 right-0 z-40">
        <MainNavbar />
      </div>

      {/* === DEĞİŞİKLİK BURADA === */}
      {/* Shop Now Butonu - Güncellenmiş stil */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-30">
        <a
          href="/all-products"
          className="bg-white/95 text-gray-900 text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase py-3 px-8 sm:px-10 whitespace-nowrap min-w-[140px] text-center inline-block hover:bg-white transition-all duration-300"
        >
          Shop Now
        </a>
      </div>
      {/* === DEĞİŞİKLİK SONU === */}
    </section>
  );
}