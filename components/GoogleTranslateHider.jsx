"use client";
import { useEffect } from "react";

export default function GoogleTranslateHider() {
  useEffect(() => {
    const kill = () => {
      document.querySelectorAll("iframe.goog-te-banner-frame,iframe.goog-te-balloon-frame").forEach(n => n.remove());
      document.querySelectorAll(".VIpgJd-ZVi9od-ORHb-OEVmcd,.VIpgJd-ZVi9od-aZ2wEe-wOHMyf,.VIpgJd-ZVi9od-l4eHX-hSRGPd").forEach(n => n.remove());
      if (document.body?.style?.top) document.body.style.top = "0px";
      const html = document.documentElement;
      if (html?.style?.top) html.style.top = "0px";
    };
    kill();
    const obs = new MutationObserver(kill);
    obs.observe(document.documentElement, { childList: true, subtree: true });
    const id = setInterval(kill, 1500); // safety for stubborn cases
    return () => { obs.disconnect(); clearInterval(id); };
  }, []);
  return null;
}