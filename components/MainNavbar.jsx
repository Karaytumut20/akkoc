// components/MainNavbar.jsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { assets } from "@/assets/assets";

/* === ICONS (JSX) === */
const icons = {
  Menu: (p) => (
    <svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>
    </svg>
  ),
  Close: (p) => (
    <svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Search: (p) => (
    <svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  ),
  ShoppingBag: (p) => (
    <svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  ),
};

/* === LANGS === */
const LANGS = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "tr", label: "Türkçe" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "it", label: "Italiano" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" },
];

/* === COOKIE HELPERS === */
function getBaseDomain() {
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  if (!host) return "";
  return host.startsWith("www.") ? `.${host.replace("www.", "")}` : `.${host}`;
}
function readGoogTrans() {
  const m = typeof document !== "undefined" && document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : null;
}
function setGoogTransCookie(from, to) {
  if (typeof document === "undefined") return;
  const v = encodeURIComponent(`/${from}/${to}`);
  const baseDomain = getBaseDomain();
  const base = `googtrans=${v}; path=/; max-age=31536000`;
  document.cookie = base;
  if (baseDomain) {
    document.cookie = `googtrans=${v}; path=/; domain=${baseDomain}; max-age=31536000; Secure; SameSite=None`;
  }
}
function clearGoogTransCookie() {
  if (typeof document === "undefined") return;
  const baseDomain = getBaseDomain();
  const past = "expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie = `googtrans=; ${past}`;
  if (baseDomain) {
    document.cookie = `googtrans=; ${past}; domain=${baseDomain}; Secure; SameSite=None`;
  }
}
function triggerComboChange(lang) {
  if (typeof document === "undefined") return false;
  const combo = document.querySelector("select.goog-te-combo");
  if (!combo) return false;
  combo.value = lang === "en" ? "" : lang;
  combo.dispatchEvent(new Event("change"));
  return true;
}

/* === LANGUAGE HOOK === */
function useCurrentLang(defaultLang = "en") {
  const [current, setCurrent] = useState(defaultLang);
  const pollIntervalRef = useRef(null);

  const checkCookieAndSetLang = useCallback((targetLang = null) => {
    const c = readGoogTrans();
    let currentLangInCookie = defaultLang;
    if (c) {
      const parts = c.split("/");
      if (parts.length === 3 && parts[2]) currentLangInCookie = parts[2];
    }
    if ((targetLang && currentLangInCookie === targetLang) || !targetLang) {
      setCurrent(currentLangInCookie);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return true;
    }
    return false;
  }, [defaultLang]);

  useEffect(() => {
    if (typeof window !== "undefined") checkCookieAndSetLang();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [checkCookieAndSetLang]);

  const setLang = useCallback((lang) => {
    if (typeof window === "undefined") return;
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (lang === "en") {
      clearGoogTransCookie();
      setCurrent("en");
      triggerComboChange("en");
      setTimeout(() => window.location.reload(), 300);
    } else {
      setGoogTransCookie("en", lang);
      const ok = triggerComboChange(lang);
      if (!ok) {
        setTimeout(() => window.location.reload(), 300);
        return;
      }
      let attempts = 0;
      const maxAttempts = 15;
      pollIntervalRef.current = setInterval(() => {
        attempts++;
        const updated = checkCookieAndSetLang(lang);
        if (updated || attempts >= maxAttempts) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
          if (!updated && attempts >= maxAttempts) console.warn("Google Translate cookie update timed out. Reloading might be needed.");
        }
      }, 200);
    }
  }, [checkCookieAndSetLang]);

  return [current, setLang];
}

/* === LANGUAGE SWITCHER === */
function LanguageSwitcher({ dark = false }) {
  const [current, setLang] = useCurrentLang("en");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          "flex items-center gap-1 sm:gap-2 rounded-lg transition",
          "p-2 sm:px-3 sm:py-2",
          "text-xs sm:text-sm",
          dark ? "text-white sm:border sm:border-white/30 sm:hover:bg-white/10" : "text-gray-800 sm:border sm:border-gray-300 sm:hover:bg-gray-100",
          !dark ? "hover:bg-gray-100" : "hover:bg-white/10",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block rounded px-0 py-0 text-[11px] sm:text-[10px] tracking-wide uppercase font-semibold",
            "sm:px-2 sm:py-0.5 sm:border sm:font-medium",
            dark ? "sm:border-white/50" : "sm:border-gray-400",
          ].join(" ")}
        >
          {(current || "en").toUpperCase()}
        </span>
        <span className="hidden md:inline-block">{LANGS.find((l) => l.code === current)?.label || "Language"}</span>
        <svg className="w-4 h-4 flex-shrink-0 hidden sm:block" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M5.25 7.5l4.5 4.5 4.5-4.5"/></svg>
      </button>
      {open && (
        <div
          role="listbox"
          className={[
            "absolute right-0 mt-2 w-48 rounded-xl shadow-xl ring-1 ring-black/5 focus:outline-none z-[110]",
            dark ? "bg-neutral-900 text-white" : "bg-white text-gray-800",
          ].join(" ")}
        >
          <ul className="py-1 max-h-64 overflow-auto">
            {LANGS.map((l) => (
              <li key={l.code}>
                <button
                  onClick={() => { setLang(l.code); setOpen(false); }}
                  className={["w-full text-left px-3 py-2 text-sm hover:bg-black/5", l.code === current ? "font-medium" : ""].join(" ")}
                  role="option"
                  aria-selected={l.code === current}
                >
                  <span className="mr-2 inline-block w-7 text-[11px] text-center rounded border">{l.code.toUpperCase()}</span>
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* === MOBILE MENU (PORTAL) === */
function MobileMenuPortal({ open, onClose, navLinks }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden"; else document.body.style.overflow = prev || "";
    return () => { document.body.style.overflow = prev || ""; };
  }, [open, mounted]);

  if (!mounted || !open) return null;

  return createPortal(
    <div role="dialog" aria-modal="true" data-sidebar className="fixed inset-0 z-[2147483647] flex">
      <div className="absolute inset-0 bg-black/90 animate-fadeIn" onClick={onClose} />
      <div className="relative z-10 flex flex-col items-center justify-center text-center gap-8 w-full h-full text-white text-lg font-light uppercase tracking-widest">
        <button aria-label="Close menu" className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/20 transition" onClick={onClose}>
          <icons.Close className="w-7 h-7" />
        </button>
        {navLinks.map((item) => (
          <Link key={item.name} href={item.href} onClick={onClose} className="hover:text-orange-300 transition">
            {item.name}
          </Link>
        ))}
      </div>
    </div>,
    document.body
  );
}

/* === MAIN NAVBAR === */
export default function MainNavbar() {
  const { products, getSafeImageUrl, user, signOut, getCartCount } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const searchRef = useRef(null);
  const userMenuRef = useRef(null);

  const cartCount = getCartCount();
  const isHomePage = pathname === "/";
  const displayUserName =
    (user && user.user_metadata && user.user_metadata.full_name) ||
    (user && user.email && user.email.split("@")[0]) ||
    "My Account";

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) setIsSearchVisible(false);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setIsUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isHomePage) { setIsSticky(true); return; }
    const handleScroll = () => setIsSticky(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  useEffect(() => {
    if (searchQuery.trim() !== "") {
      const filtered = products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
      setSearchResults(filtered.slice(0, 5));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, products]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/all-products?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchVisible(false);
      setSearchQuery("");
    }
  };

  const handleProductClick = (productId) => {
    router.push(`/product/${productId}`);
    setIsSearchVisible(false);
    setSearchQuery("");
  };

  const navLinks = [
    { name: "HOME", href: "/" },
    { name: "ALL PRODUCT", href: "/all-products" },
    { name: "COLLECTION", href: "/collection" },
    { name: "CONTACT", href: "/contact" },
  ];

  // Sticky: her zaman sticky top-0; isSticky sadece renk/gölge için.
  const headerClasses = [
    "sticky top-0 w-full z-[1000] transition-all duration-300",
    isSticky ? "bg-[#ECE4DC] text-gray-800 shadow-md animate-fadeInDown" : "text-white",
    // Safari iOS için: backdrop ve -webkit-sticky bazen sorun çıkarır, overflow:hidden parent'ları kaçın.
  ].join(" ");

  const logoSrc = assets.logo;

  return (
    <>
      {/* Google Translate */}
      <Script src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" strategy="afterInteractive" />
      <Script id="google-translate-init" strategy="afterInteractive">
        {`
          function googleTranslateElementInit() {
            new google.translate.TranslateElement({
              pageLanguage: 'en',
              includedLanguages: 'tr,en,de,fr,it,es,ar,ru',
              layout: google.translate.TranslateElement.InlineLayout.HORIZONTAL
            }, 'google_translate_element');
          }
        `}
      </Script>

      <header className={headerClasses}>
        <div className="pt-4 pb-2 px-5 sm:px-10 lg:px-16">
          <div className="flex items-center justify-between relative">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button aria-label="Menu" className="p-2 rounded-full hover:bg-black/10 transition lg:hidden" onClick={() => setMenuOpen((v) => !v)}>
                {menuOpen ? <icons.Close className="w-6 h-6" /> : <icons.Menu className="w-6 h-6" />}
              </button>
              <button aria-label="Search" className="p-2 rounded-full hover:bg-black/10 transition" onClick={(e) => { e.stopPropagation(); setIsSearchVisible((v) => !v); }}>
                <icons.Search className="w-5 h-5" />
              </button>
            </div>

            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer" onClick={() => router.push("/")}>
              <Image className="w-28 md:w-32" src={logoSrc} alt="logo" style={{ filter: isSticky ? "none" : "brightness(0) invert(1)" }} />
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {mounted && (
                <>
                  <LanguageSwitcher dark={!isSticky} />
                  <div id="google_translate_element" className="pointer-events-none absolute opacity-0 -z-[9999]" />
                </>
              )}

              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button onClick={() => setIsUserMenuOpen((v) => !v)} className="flex items-center gap-2 p-2 rounded-full hover:bg-black/10 transition">
                    <Image className="w-5 h-5" src={assets.user_icon} alt="user icon" style={{ filter: isSticky ? "none" : "brightness(0) invert(1)" }} />
                    <span className="hidden md:block truncate max-w-[100px]">{displayUserName}</span>
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 text-gray-800">
                      <Link href="/account" onClick={() => setIsUserMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-100">My Account</Link>
                      <button onClick={() => { signOut(); setIsUserMenuOpen(false); }} className="w-full text-left block px-4 py-2 text-sm hover:bg-gray-100">Log Out</button>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={() => router.push("/auth")} className="flex items-center gap-2 p-2 rounded-full hover:bg-black/10 transition">
                  <Image className="w-5 h-5" src={assets.user_icon} alt="user icon" style={{ filter: isSticky ? "none" : "brightness(0) invert(1)" }} />
                  <span className="hidden md:block">Log In</span>
                </button>
              )}

              <button aria-label="Shopping Bag" className="p-2 rounded-full hover:bg-black/10 transition relative" onClick={() => router.push("/cart")}>
                <icons.ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-white text-xs">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {isSearchVisible && (
            <div ref={searchRef} className="relative mt-4 max-w-md mx-auto">
              <form onSubmit={handleSearchSubmit} className="flex">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Products..."
                  autoFocus
                  className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                    isSticky ? "bg-gray-100 text-gray-800 placeholder-gray-500 focus:ring-orange-500" : "bg-white/20 text-white placeholder-white/70 focus:ring-white/50"
                  }`}
                />
              </form>
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-white text-black mt-2 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
                  <ul>
                    {searchResults.map((product) => (
                      <li key={product.id}>
                        <div onClick={() => handleProductClick(product.id)} className="flex items-center p-3 hover:bg-gray-100 cursor-pointer">
                          <div className="relative w-12 h-12 mr-4 flex-shrink-0">
                            <Image src={getSafeImageUrl(product.image_urls)} alt={product.name} fill className="object-cover rounded-md" />
                          </div>
                          <span className="font-medium text-gray-800">{product.name}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <nav className={`mt-6 hidden lg:flex justify-center space-x-10 text-sm font-light tracking-[0.25em] uppercase ${isSticky ? "text-gray-700" : "text-gray-200"}`}>
            {navLinks.map((item) => (
              <Link key={item.name} href={item.href} className="relative group hover:text-current transition">
                {item.name}
                <span className="absolute left-1/2 -bottom-1 w-0 h-[1.5px] bg-current group-hover:w-6 group-hover:-translate-x-1/2 transition-all duration-300" />
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile menu via portal (always on top) */}
      <MobileMenuPortal open={menuOpen} onClose={() => setMenuOpen(false)} navLinks={navLinks} />

      {/* Google Translate CSS fixes */}
      {mounted && (
        <style jsx global>{`
          .goog-te-banner-frame { display: none !important; }
          .goog-logo-link { display: none !important; }
          #google_translate_element .goog-te-gadget { font-size: 0 !important; }
          #google_translate_element .goog-te-gadget-simple { background-color: transparent !important; border: none !important; padding: 0 !important; margin: 0 !important; }
          #google_translate_element .goog-te-menu-value span { display: none !important; }
          #google_translate_element .goog-te-gadget-icon { display: none !important; }
          body { top: 0 !important; }
        `}</style>
      )}
    </>
  );
}

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

  if (!isHomePage) {
    return (
      <div className="relative w-full bg-[#ECE4DC]">
        <MainNavbar />
      </div>
    );
  }

  return (
    <>
      {/* Navbar artık section dışında ve sticky her sayfada çalışır */}
      <div className="relative w-full bg-[#ECE4DC]">
        <MainNavbar />
      </div>

      <section className="w-full h-[60vh] sm:h-[80vh] md:h-screen relative overflow-hidden bg-[#ECE4DC] font-sans">
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

        {isClient && (videoLoading || !activeVideoUrl) && (
          <div className="absolute inset-0 bg-[#ECE4DC] flex items-center justify-center">
            <div className="text-gray-800 font-medium">Video Loading...</div>
          </div>
        )}

        <div className="absolute inset-0 bg-black/30 z-10"></div>

        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-30">
          <a
            href="/all-products"
            className="bg-white/95 text-gray-900 text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase py-3 px-10 hover:bg-white transition-all duration-300"
          >
            Shop Now
          </a>
        </div>
      </section>
    </>
  );
}
