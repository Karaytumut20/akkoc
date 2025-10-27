"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { assets } from "@/assets/assets";

/* Icons */
const icons = {
  Menu: (p) => (<svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>),
  Close: (p) => (<svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
  Search: (p) => (<svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>),
  ShoppingBag: (p) => (<svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>),
};

/* Languages */
const LANGS = [
  { code: "en", label: "English" },
  { code: "tr", label: "Türkçe" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "it", label: "Italiano" },
  { code: "es", label: "Español" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" },
];

/* Translate helpers */
function readGoogTrans() {
  const m = typeof document !== "undefined" && document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : null;
}
function setGoogTransCookie(from, to) {
  const v = encodeURIComponent(`/${from}/${to}`);
  const base = `googtrans=${v}; path=/; max-age=31536000`;
  document.cookie = base;
  document.cookie = `googtrans=${v}; path=/; domain=${window.location.hostname}; max-age=31536000`;
}
function clearGoogTransCookie() {
  const past = "expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie = `googtrans=; ${past}`;
  document.cookie = `googtrans=; ${past}; domain=${window.location.hostname}`;
}
function triggerComboChange(lang) {
  const combo = document.querySelector("select.goog-te-combo");
  if (!combo) return false;
  combo.value = lang === "en" ? "" : lang; // why: empty resets to original (EN)
  combo.dispatchEvent(new Event("change"));
  return true;
}
function useCurrentLang(defaultLang = "en") {
  const [current, setCurrent] = useState(defaultLang);
  useEffect(() => {
    const c = readGoogTrans();
    if (!c) { setCurrent(defaultLang); return; }
    const to = c.split("/")[2];
    setCurrent(to || defaultLang);
  }, [defaultLang]);

  // Burası güncellenen kısım
  const setLang = useCallback((lang) => {
    setCurrent(lang);
    
    if (lang === "en") {
      clearGoogTransCookie();
      // Google Çeviri widget'ını tetiklemeyi dene.
      const ok = triggerComboChange(lang); 
      
      // Çerezi temizlediğimiz için, çevirinin tamamen sıfırlanması için 
      // her durumda sayfayı yeniden yüklemek en güvenilir yoldur.
      if (!ok || true) { 
        window.location.reload();
      }
      
    } else {
      setGoogTransCookie("en", lang);
      const ok = triggerComboChange(lang);
      
      // Widget'ı tetikleyemediysek, sayfa yeniden yüklensin
      if (!ok) {
        window.location.reload();
      }
    }
  }, []);
  
  return [current, setLang];
}

/* Mobile: compact button shows ONLY current code; full list in sheet */
function MobileLangCompact({ dark = false }) {
  const [current, setLang] = useCurrentLang("en");
  const [open, setOpen] = useState(false);
  const btn = [
    "sm:hidden inline-flex items-center justify-center",
    "rounded-md border px-2 py-1 text-[11px] leading-none tracking-wide",
    "transition active:scale-[0.98]",
    dark ? "border-white/30 text-white" : "border-gray-300 text-gray-800",
  ].join(" ");
  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Change language" className={btn}>
        {(current || "en").toUpperCase()}
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] sm:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white text-gray-800 shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="text-sm font-medium">Select language</span>
              <button onClick={() => setOpen(false)} className="px-2 py-1 text-sm rounded hover:bg-black/5">Close</button>
            </div>
            <ul className="max-h-[60vh] overflow-y-auto py-1">
              {LANGS.map((l) => (
                <li key={l.code}>
                  <button
                    onClick={() => { setLang(l.code); setOpen(false); }}
                    className={[
                      "w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-black/5",
                      l.code === current ? "font-medium" : "",
                    ].join(" ")}
                  >
                    <span className="inline-block w-9 text-[11px] text-center rounded border">{l.code.toUpperCase()}</span>
                    <span className="text-sm">{l.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

/* Desktop: dropdown with all languages */
function DesktopLanguageSwitcher({ dark = false }) {
  const [current, setLang] = useCurrentLang("en");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onClick); document.removeEventListener("keydown", onEsc); };
  }, []);
  return (
    <div className="relative hidden sm:block" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition",
          dark ? "border-white/30 text-white hover:bg-white/10" : "border-gray-300 text-gray-800 hover:bg-gray-100",
        ].join(" ")}
      >
        <span className="inline-block rounded-md px-2 py-0.5 border text-[10px] tracking-wide uppercase">
          {(current || "en").toUpperCase()}
        </span>
        <span className="hidden md:block">{LANGS.find((l) => l.code === current)?.label || "Language"}</span>
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M5.25 7.5l4.5 4.5 4.5-4.5"/></svg>
      </button>
      {open && (
        <div role="listbox" className={["absolute right-0 mt-2 w-48 rounded-xl shadow-xl ring-1 ring-black/5 focus:outline-none z-[60]",
          dark ? "bg-neutral-900 text-white" : "bg-white text-gray-800"].join(" ")}>
          <ul className="py-1 max-h-64 overflow-auto">
            {LANGS.map((l) => (
              <li key={l.code}>
                <button
                  onClick={() => { setLang(l.code); setOpen(false); }}
                  className={[
                    "w-full text-left px-3 py-2 text-sm hover:bg-black/5",
                    l.code === current ? "font-medium" : "",
                  ].join(" ")}
                  role="option" aria-selected={l.code === current}
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

/* === Main Navbar (integrates language switchers) === */
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
  const [mounted, setMounted] = useState(false); // why: avoid SSR/CSR mismatch

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
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setIsSearchVisible(false);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setIsUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isHomePage) { setIsSticky(true); return; }
    const onScroll = () => setIsSticky(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHomePage]);

  useEffect(() => {
    if (searchQuery.trim()) {
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

  const headerClasses = isSticky
    ? "fixed top-0 left-0 right-0 z-50 bg-white text-gray-800 shadow-md animate-fadeInDown"
    : "absolute top-0 left-0 right-0 z-20 text-white";

  const logoSrc = assets.logo;

  return (
    <>
      {/* Google Translate Script */}
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

      <header className={`w-full pt-4 pb-2 px-5 sm:px-10 lg:px-16 transition-all duration-300 ${headerClasses}`}>
        <div className="flex items-center justify-between relative">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button aria-label="Menu" className="p-2 rounded-full hover:bg-black/10 transition lg:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <icons.Close className="w-6 h-6" /> : <icons.Menu className="w-6 h-6" />}
            </button>
            <button aria-label="Search" className="p-2 rounded-full hover:bg-black/10 transition" onClick={(e) => { e.stopPropagation(); setIsSearchVisible(!isSearchVisible); }}>
              <icons.Search className="w-5 h-5" />
            </button>
          </div>

          {/* Logo */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer" onClick={() => router.push("/")}>
            <Image className="w-28 md:w-32" src={logoSrc} alt="logo" style={{ filter: isSticky ? "none" : "brightness(0) invert(1)" }} />
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Language UI only after mount */}
            {mounted && (
              <>
                <MobileLangCompact dark={!isSticky} />
                <DesktopLanguageSwitcher dark={!isSticky} />
                {/* hidden real widget instance */}
                <div id="google_translate_element" className="pointer-events-none absolute opacity-0 -z-10" />
              </>
            )}

            {/* User */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2 p-2 rounded-full hover:bg-black/10 transition">
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
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-white text-xs">{cartCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Search */}
        {isSearchVisible && (
          <div ref={searchRef} className="relative mt-4 max-w-md mx-auto">
            <form onSubmit={handleSearchSubmit} className="flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search product..."
                autoFocus
                className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${isSticky ? "bg-gray-100 text-gray-800 placeholder-gray-500 focus:ring-orange-500" : "bg-white/20 text-white placeholder-white/70 focus:ring-white/50"}`}
              />
            </form>
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 w-full bg-white text-black mt-2 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
                <ul>
                  {searchResults.map((product) => (
                    <li key={product.id}>
                      <div onClick={() => { handleProductClick(product.id); }} className="flex items-center p-3 hover:bg-gray-100 cursor-pointer">
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

        {/* Nav links */}
        <nav className={`mt-6 hidden lg:flex justify-center space-x-10 text-sm font-light tracking-[0.25em] uppercase ${isSticky ? "text-gray-700" : "text-gray-200"}`}>
          {navLinks.map((item) => (
            <Link key={item.name} href={item.href} className="relative group hover:text-current transition">
              {item.name}
              <span className="absolute left-1/2 -bottom-1 w-0 h-[1.5px] bg-current group-hover:w-6 group-hover:-translate-x-1/2 transition-all duration-300" />
            </Link>
          ))}
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="fixed top-0 left-0 w-full h-full bg-black/90 z-50 flex flex-col items-center justify-center text-center space-y-8 text-white text-lg font-light uppercase tracking-widest animate-fadeIn">
            <button aria-label="Close menu" className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/20 transition" onClick={() => setMenuOpen(false)}>
              <icons.Close className="w-7 h-7" />
            </button>
            {navLinks.map((item) => (
              <Link key={item.name} href={item.href} onClick={() => setMenuOpen(false)} className="hover:text-orange-300 transition">
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Global cleanup for Google UI (extra safety) */}
      {mounted && (
        <style jsx global>{`
          .goog-te-banner-frame { display: none !important; }
          .goog-logo-link { display: none !important; }
          .goog-te-gadget { font-size: 0 !important; }
          body { top: 0 !important; }
        `}</style>
      )}
    </>
  );
}