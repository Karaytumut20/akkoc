"use client";
import { useEffect } from "react";

export default function GoogleTranslateHider() {
  useEffect(() => {
    const fixLayout = () => {
      // Bar ve tooltip frame'lerini kaldır
      document.querySelectorAll("iframe.goog-te-banner-frame,iframe.goog-te-balloon-frame").forEach(n => n.remove());
      document.querySelectorAll(".VIpgJd-ZVi9od-ORHb-OEVmcd,.VIpgJd-ZVi9od-aZ2wEe-wOHMyf,.VIpgJd-ZVi9od-l4eHX-hSRGPd").forEach(n => n.remove());

      // Body ve HTML top değerini sıfırla
      if (document.body?.style?.top) document.body.style.top = "0px";
      const html = document.documentElement;
      if (html?.style?.top) html.style.top = "0px";

      // Sidebar / Navbar gibi fixed elementlerin üstte kalması için
      document.querySelectorAll("[data-fixed],[data-navbar],[data-sidebar]").forEach((el) => {
        el.style.zIndex = "9999";
        el.style.position = "fixed";
      });
    };

    fixLayout();
    const obs = new MutationObserver(fixLayout);
    obs.observe(document.documentElement, { childList: true, subtree: true });

    const interval = setInterval(fixLayout, 2000); // güvenlik önlemi

    return () => {
      obs.disconnect();
      clearInterval(interval);
    };
  }, []);

  return null;
}
