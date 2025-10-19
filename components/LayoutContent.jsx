'use client';

import { usePathname } from "next/navigation";
import VideoBar from "@/components/VideoBar";
import MainNavbar from "@/components/MainNavbar";
import React from "react";

export default function LayoutContent({ children }) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  
  // Seller sayfaları ve alt sayfaları için kontrol
  const isSellerPage = pathname.startsWith("/seller");

  return (
    <>
      {isHomePage ? (
        <>
          <VideoBar />
          <div>{children}</div>
        </>
      ) : (
        <>
          {/* Seller sayfalarında Navbar gösterme */}
          {!isSellerPage && <MainNavbar />}
          <div className={!isSellerPage ? "pt-20" : ""}>{children}</div>
        </>
      )}
    </>
  );
}
