"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { assets } from "@/assets/assets";

/* === ICONLAR === */
const icons = {
  Menu: (p) => (<svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>),
  Close: (p) => (<svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
  Search: (p) => (<svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>),
  ShoppingBag: (p) => (<svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>),
};

/* === DİL LİSTESİ === */
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

/* === COOKIE YÖNETİMİ - BASİT VE GÜVENLİ === */
function getBaseDomain() {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname;
  
  if (host === 'localhost' || host.startsWith('192.168.') || host.startsWith('10.0.') || host === '127.0.0.1') {
    return '';
  }
  
  return host.startsWith("www.") ? `.${host.replace("www.", "")}` : `.${host}`;
}

function readGoogTrans() {
  if (typeof document === "undefined") return null;
  try {
    const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
    return m ? decodeURIComponent(m[1]) : null;
  } catch (error) {
    console.error('Çerez okuma hatası:', error);
    return null;
  }
}

function setGoogTransCookie(from, to) {
  if (typeof document === 'undefined') return;
  try {
    const v = encodeURIComponent(`/${from}/${to}`);
    const baseDomain = getBaseDomain();
    
    let cookieString = `googtrans=${v}; path=/; max-age=31536000; SameSite=Lax`;
    
    if (baseDomain && !baseDomain.includes('localhost')) {
      cookieString += `; domain=${baseDomain}`;
    }
    
    document.cookie = cookieString;
    console.log('Çerez ayarlandı:', v);
  } catch (error) {
    console.error('Çerez yazma hatası:', error);
  }
}

function clearGoogTransCookie() {
  if (typeof document === 'undefined') return;
  try {
    const baseDomain = getBaseDomain();
    const past = "expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    
    document.cookie = `googtrans=; ${past}`;
    if (baseDomain) {
      document.cookie = `googtrans=; ${past}; domain=${baseDomain}`;
    }
    console.log('Çerez temizlendi');
  } catch (error) {
    console.error('Çerez temizleme hatası:', error);
  }
}

/* === GOOGLE TRANSLATE YÖNETİMİ - GÜVENLİ === */
function useGoogleTranslate() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const checkGoogleTranslate = () => {
      if (typeof window !== 'undefined' && window.google && window.google.translate && window.google.translate.TranslateElement) {
        setIsLoaded(true);
        return true;
      }
      return false;
    };

    if (checkGoogleTranslate()) {
      return;
    }

    let attempts = 0;
    const maxAttempts = 20;
    
    const interval = setInterval(() => {
      attempts++;
      if (checkGoogleTranslate() || attempts >= maxAttempts) {
        clearInterval(interval);
        if (attempts >= maxAttempts) {
          console.warn('Google Translate yüklenemedi');
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return { isLoaded };
}

/* === DİL HOOK - SORUNSUZ === */
function useCurrentLang(defaultLang = "en") {
  const [current, setCurrent] = useState(defaultLang);
  const [mounted, setMounted] = useState(false);
  const { isLoaded: googleLoaded } = useGoogleTranslate();

  useEffect(() => {
    setMounted(true);
  }, []);

  const checkCookieAndSetLang = useCallback(() => {
    if (typeof window === 'undefined') return defaultLang;
    
    try {
      const c = readGoogTrans();
      let currentLangInCookie = defaultLang;
      
      if (c) {
        const parts = c.split("/");
        if (parts.length === 3 && parts[2]) {
          currentLangInCookie = parts[2];
        }
      }
      
      console.log('Çerezden okunan dil:', currentLangInCookie);
      setCurrent(currentLangInCookie);
      return currentLangInCookie;
    } catch (error) {
      console.error('Dil kontrol hatası:', error);
      return defaultLang;
    }
  }, [defaultLang]);

  useEffect(() => {
    if (mounted) {
      checkCookieAndSetLang();
    }
  }, [mounted, checkCookieAndSetLang]);

  useEffect(() => {
    if (mounted && googleLoaded) {
      setTimeout(() => {
        checkCookieAndSetLang();
      }, 500);
    }
  }, [mounted, googleLoaded, checkCookieAndSetLang]);

  const setLang = useCallback((lang) => {
    if (typeof window === 'undefined') return;

    console.log('Dil değiştiriliyor:', lang);

    if (lang === "en") {
      clearGoogTransCookie();
      setCurrent("en");
    } else {
      setGoogTransCookie("en", lang);
      setCurrent(lang);
    }

    const triggerManualTranslation = () => {
      try {
        setTimeout(() => {
          const combo = document.querySelector('select.goog-te-combo');
          if (combo) {
            const value = lang === 'en' ? '' : lang;
            if (combo.value !== value) {
              combo.value = value;
              
              const event = new Event('change', { bubbles: true });
              combo.dispatchEvent(event);
              
              console.log('Google Translate manuel tetiklendi:', lang);
            }
          } else {
            console.warn('Google Translate widget bulunamadı');
          }
        }, 300);
        
        return true;
      } catch (error) {
        console.error('Google Translate tetikleme hatası:', error);
        return false;
      }
    };

    triggerManualTranslation();

    setTimeout(() => {
      console.log('Sayfa yenileniyor...');
      window.location.reload();
    }, 1000);
  }, []);

  return [current, setLang, mounted];
}

/* === DİL SEÇİCİ - MOBİL UYUMLU === */
function LanguageSwitcher({ dark = false }) {
  const [current, setLang, mounted] = useCurrentLang("en");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    const handleEsc = (e) => e.key === "Escape" && setOpen(false);

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  if (!mounted) {
    return (
      <div className="relative">
        <button 
          className="flex items-center gap-2 p-2 rounded-lg opacity-50"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          <span className="inline-block rounded px-2 py-0.5 text-[10px] tracking-wide uppercase border">
            EN
          </span>
        </button>
      </div>
    );
  }

  const currentLang = current || 'en';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        onTouchEnd={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          "flex items-center gap-1 sm:gap-2 rounded-lg transition-all duration-200",
          "p-2 sm:px-3 sm:py-2",
          "text-xs sm:text-sm",
          "select-none touch-manipulation",
          dark
            ? "text-white hover:bg-white/10 active:bg-white/20"
            : "text-gray-800 hover:bg-gray-100 active:bg-gray-200",
        ].join(" ")}
        style={{ minHeight: '44px', minWidth: '44px' }}
      >
        <span className={[
            "inline-block rounded px-0 py-0 text-[11px] sm:text-[10px] tracking-wide uppercase font-semibold",
            "sm:px-2 sm:py-0.5 sm:border sm:font-medium",
            dark ? "sm:border-white/50" : "sm:border-gray-400"
        ].join(" ")}>
          {currentLang.toUpperCase()}
        </span>

        <span className="hidden md:inline-block">
          {LANGS.find((l) => l.code === currentLang)?.label || "Language"}
        </span>
        
        <svg 
          className="w-4 h-4 flex-shrink-0 hidden sm:block" 
          viewBox="0 0 20 20" 
          fill="currentColor" 
          aria-hidden="true"
        >
          <path d="M5.25 7.5l4.5 4.5 4.5-4.5"/>
        </svg>
      </button>

      {open && (
        <div 
          role="listbox" 
          className={[
            "absolute right-0 mt-2 w-48 rounded-xl shadow-xl ring-1 ring-black/5 focus:outline-none z-[9999]",
            "backdrop-blur-sm",
            dark ? "bg-neutral-900/95 text-white" : "bg-white/95 text-gray-800"
          ].join(" ")}
        >
          <ul className="py-1 max-h-64 overflow-auto">
            {LANGS.map((l) => (
              <li key={l.code}>
                <button
                  onClick={() => { 
                    setLang(l.code); 
                    setOpen(false); 
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    setLang(l.code);
                    setOpen(false);
                  }}
                  className={[
                    "w-full text-left px-3 py-3 text-sm hover:bg-black/5 active:bg-black/10 transition-colors",
                    "touch-manipulation",
                    l.code === currentLang ? "font-semibold bg-black/10" : "",
                  ].join(" ")}
                  style={{ minHeight: '44px' }}
                  role="option" 
                  aria-selected={l.code === currentLang}
                >
                  <span className="mr-2 inline-block w-7 text-[11px] text-center rounded border">
                    {l.code.toUpperCase()}
                  </span>
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

/* === YENİ SIDEBAR/MOBİL MENÜ COMPONENT'I === */
function MobileMenu({ isOpen, onClose, navLinks, router }) {
  const menuRef = useRef(null);

  // Safari için özel stiller
  useEffect(() => {
    if (isOpen) {
      // Safari'de body scroll'unu engelle
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      // Scroll'u geri aç
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }

    return () => {
      // Cleanup
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [isOpen]);

  // ESC tuşu ile kapatma
  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && onClose();
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Safari için overlay click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay - Safari için optimize edilmiş */}
      <div 
        className="fixed inset-0 bg-black/95 z-[9998] lg:hidden"
        onClick={handleOverlayClick}
        onTouchEnd={handleOverlayClick}
        style={{
          // Safari için hardware acceleration
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)'
        }}
      />
      
      {/* Mobil Menü Container - Safari için optimize edilmiş */}
      <div 
        ref={menuRef}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center text-center space-y-6 text-white lg:hidden"
        style={{
          // Safari için hardware acceleration
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
          // Safari için overflow hidden
          overflow: 'hidden'
        }}
      >
        {/* Kapatma Butonu - Üst Sağ Köşede */}
        <button 
          aria-label="Close menu" 
          className="absolute top-8 right-6 p-4 rounded-full hover:bg-white/20 active:bg-white/30 transition-all duration-300 touch-manipulation"
          style={{ 
            minHeight: '48px', 
            minWidth: '48px',
            // Safari için shadow
            WebkitAppearance: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
          onClick={onClose}
          onTouchEnd={(e) => {
            e.preventDefault();
            onClose();
          }}
        >
          <icons.Close className="w-7 h-7" />
        </button>
        
        {/* Navigasyon Linkleri */}
        <div className="flex flex-col items-center justify-center space-y-8 w-full px-8">
          {navLinks.map((item, index) => (
            <div 
              key={item.name} 
              className="w-full max-w-xs transform transition-all duration-500"
              style={{
                animationDelay: `${index * 100}ms`,
                // Safari için animation
                WebkitAnimation: `fadeInUp 0.5s ease-out ${index * 100}ms both`
              }}
            >
              <Link 
                href={item.href} 
                onClick={() => {
                  onClose();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  router.push(item.href);
                  onClose();
                }}
                className="block w-full py-5 px-6 text-2xl font-medium hover:text-orange-300 active:text-orange-400 transition-all duration-300 touch-manipulation rounded-2xl hover:bg-white/10 active:bg-white/20 border border-transparent hover:border-white/20"
                style={{ 
                  minHeight: '64px', 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  // Safari için stiller
                  WebkitTapHighlightColor: 'transparent',
                  WebkitUserSelect: 'none',
                  userSelect: 'none'
                }}
              >
                <span className="relative">
                  {item.name}
                  {/* Hover underline effect */}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-300 transition-all duration-300 group-hover:w-full"></span>
                </span>
              </Link>
            </div>
          ))}
        </div>

        {/* Alt Bilgi - Sosyal Medya veya Telif Hakkı */}
        <div className="absolute bottom-8 left-0 right-0 px-8">
          <div className="text-white/60 text-sm font-light">
            <p>© 2024 Tüm Hakları Saklıdır</p>
          </div>
        </div>
      </div>

      {/* Safari için Animasyon Stilleri */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @-webkit-keyframes fadeInUp {
          from {
            opacity: 0;
            -webkit-transform: translateY(30px);
          }
          to {
            opacity: 1;
            -webkit-transform: translateY(0);
          }
        }

        /* Safari için scroll bar gizleme */
        .no-scroll {
          overflow: hidden;
          position: fixed;
          width: 100%;
          height: 100%;
        }

        /* Safari için touch optimizasyonu */
        .safari-fix {
          -webkit-overflow-scrolling: touch;
          overflow-scrolling: touch;
        }
      `}</style>
    </>
  );
}

/* === ANA NAVBAR - GÜNCELLENMİŞ === */
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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchVisible(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isHomePage) {
      setIsSticky(true);
      return;
    }
    
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  useEffect(() => {
    if (searchQuery.trim() !== "") {
      const filtered = products.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
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
    ? "fixed top-0 left-0 right-0 z-50 bg-[#ECE4DC] text-gray-800 shadow-md transition-all duration-300"
    : "absolute top-0 left-0 right-0 z-20 text-white transition-all duration-300";

  const logoSrc = assets.logo;

  return (
    <>
      {/* GOOGLE TRANSLATE SCRIPT'LERİ */}
      <Script 
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" 
        strategy="afterInteractive"
        onLoad={() => console.log('Google Translate script yüklendi')}
        onError={() => console.log('Google Translate script yüklenemedi')}
      />
      
      <Script id="google-translate-init" strategy="afterInteractive">
        {`
          window.googleTranslateElementInit = function() {
            console.log('Google Translate Init başlatılıyor...');
            
            if (typeof google !== 'undefined' && google.translate && google.translate.TranslateElement) {
              try {
                new google.translate.TranslateElement({
                  pageLanguage: 'en',
                  includedLanguages: 'tr,en,de,fr,it,es,ar,ru',
                  layout: google.translate.TranslateElement.InlineLayout.HORIZONTAL,
                  autoDisplay: false
                }, 'google_translate_element');
                
                console.log('Google Translate widget başarıyla oluşturuldu');
                
                setTimeout(function() {
                  var currentCookie = document.cookie.match(/(?:^|;\\s*)googtrans=([^;]*)/);
                  if (currentCookie) {
                    var decoded = decodeURIComponent(currentCookie[1]);
                    var parts = decoded.split('/');
                    if (parts.length >= 3 && parts[2]) {
                      var currentLang = parts[2];
                      var combo = document.querySelector('select.goog-te-combo');
                      if (combo) {
                        var valueToSet = currentLang === 'en' ? '' : currentLang;
                        combo.value = valueToSet;
                        console.log('Widget mevcut dile ayarlandı:', currentLang);
                      }
                    }
                  }
                }, 1000);
                
              } catch (error) {
                console.error('Google Translate başlatma hatası:', error);
              }
            } else {
              console.error('Google Translate kütüphanesi mevcut değil');
              setTimeout(window.googleTranslateElementInit, 2000);
            }
          };

          if (document.readyState === 'complete') {
            window.googleTranslateElementInit();
          } else {
            window.addEventListener('load', window.googleTranslateElementInit);
          }
        `}
      </Script>

      <header
        className={`w-full pt-4 pb-2 px-4 sm:px-8 lg:px-16 ${headerClasses}`}
      >
        <div className="flex items-center justify-between relative">
          {/* Sol taraf */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              aria-label="Menu"
              className="p-2 rounded-full hover:bg-black/10 active:bg-black/20 transition lg:hidden touch-manipulation"
              style={{ minHeight: '44px', minWidth: '44px' }}
              onClick={() => setMenuOpen(true)}
              onTouchEnd={(e) => {
                e.preventDefault();
                setMenuOpen(true);
              }}
            >
              <icons.Menu className="w-6 h-6" />
            </button>
            
            <button
              aria-label="Search"
              className="p-2 rounded-full hover:bg-black/10 active:bg-black/20 transition touch-manipulation"
              style={{ minHeight: '44px', minWidth: '44px' }}
              onClick={() => setIsSearchVisible(!isSearchVisible)}
              onTouchEnd={(e) => {
                e.preventDefault();
                setIsSearchVisible(!isSearchVisible);
              }}
            >
              <icons.Search className="w-5 h-5" />
            </button>
          </div>

          {/* Logo */}
          <div
            className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            onClick={() => router.push("/")}
            onTouchEnd={() => router.push("/")}
          >
            <Image
              className="w-24 md:w-32"
              src={logoSrc}
              alt="logo"
              width={128}
              height={64}
              style={{ 
                filter: isSticky ? "none" : "brightness(0) invert(1)",
                transition: "filter 0.3s ease"
              }}
              priority
            />
          </div>

          {/* Sağ taraf */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <LanguageSwitcher dark={!isSticky} />
            
            {/* Google Translate Element - Gizli ama çalışır */}
            <div id="google_translate_element" style={{ 
              position: 'absolute', 
              top: '-1000px', 
              left: '-1000px',
              opacity: 0,
              pointerEvents: 'none',
              width: '1px',
              height: '1px',
              overflow: 'hidden'
            }} />

            {/* Kullanıcı Menüsü */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    setIsUserMenuOpen(!isUserMenuOpen);
                  }}
                  className="flex items-center gap-2 p-2 rounded-full hover:bg-black/10 active:bg-black/20 transition touch-manipulation"
                  style={{ minHeight: '44px', minWidth: '44px' }}
                >
                  <Image
                    className="w-5 h-5"
                    src={assets.user_icon}
                    alt="user icon"
                    width={20}
                    height={20}
                    style={{ 
                      filter: isSticky ? "none" : "brightness(0) invert(1)",
                      transition: "filter 0.3s ease"
                    }}
                  />
                  <span className="hidden md:block truncate max-w-[100px] text-sm">
                    {displayUserName}
                  </span>
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-sm rounded-md shadow-lg py-1 z-[9999] text-gray-800 border border-gray-200">
                    <Link 
                      href="/account" 
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-3 text-sm hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
                      style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}
                    >
                      My Account
                    </Link>
                    <button 
                      onClick={() => { signOut(); setIsUserMenuOpen(false); }} 
                      className="w-full text-left block px-4 py-3 text-sm hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
                      style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}
                    >
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => router.push("/auth")}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  router.push("/auth");
                }}
                className="flex items-center gap-2 p-2 rounded-full hover:bg-black/10 active:bg-black/20 transition touch-manipulation"
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                <Image
                  className="w-5 h-5"
                  src={assets.user_icon}
                  alt="user icon"
                  width={20}
                  height={20}
                  style={{ 
                    filter: isSticky ? "none" : "brightness(0) invert(1)",
                    transition: "filter 0.3s ease"
                  }}
                />
                <span className="hidden md:block text-sm">Log In</span>
              </button>
            )}

            {/* Sepet */}
            <button
              aria-label="Shopping Bag"
              className="p-2 rounded-full hover:bg-black/10 active:bg-black/20 transition relative touch-manipulation"
              style={{ minHeight: '44px', minWidth: '44px' }}
              onClick={() => router.push("/cart")}
              onTouchEnd={(e) => {
                e.preventDefault();
                router.push("/cart");
              }}
            >
              <icons.ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-white text-xs font-medium">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Arama Alanı */}
        {isSearchVisible && (
          <div ref={searchRef} className="relative mt-4 max-w-md mx-auto">
            <form onSubmit={handleSearchSubmit} className="flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Products..."
                autoFocus
                className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 text-sm transition-all ${
                  isSticky 
                    ? "bg-white text-gray-800 placeholder-gray-500 focus:ring-orange-500 border border-gray-300" 
                    : "bg-white/95 text-gray-800 placeholder-gray-500 focus:ring-orange-500 border border-white/20"
                }`}
              />
            </form>
            
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 w-full bg-white/95 backdrop-blur-sm text-black mt-2 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto border border-gray-200">
                <ul>
                  {searchResults.map((product) => (
                    <li key={product.id}>
                      <div 
                        onClick={() => handleProductClick(product.id)}
                        onTouchEnd={() => handleProductClick(product.id)}
                        className="flex items-center p-3 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors touch-manipulation"
                        style={{ minHeight: '60px' }}
                      >
                        <div className="relative w-12 h-12 mr-4 flex-shrink-0">
                          <Image 
                            src={getSafeImageUrl(product.image_urls)} 
                            alt={product.name} 
                            fill 
                            className="object-cover rounded-md"
                            sizes="48px"
                          />
                        </div>
                        <span className="font-medium text-gray-800 text-sm">{product.name}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Ana Navigasyon - Desktop */}
        <nav
          className={`mt-4 hidden lg:flex justify-center space-x-8 xl:space-x-12 text-sm font-light tracking-[0.25em] uppercase transition-colors ${
            isSticky ? "text-gray-700" : "text-white"
          }`}
        >
          {navLinks.map((item) => (
            <Link 
              key={item.name} 
              href={item.href} 
              className="relative group py-2 transition-all duration-300 hover:opacity-80"
            >
              <span className="relative z-10">{item.name}</span>
              <span className="absolute left-1/2 -bottom-1 w-0 h-0.5 bg-current group-hover:w-6 group-hover:-translate-x-1/2 transition-all duration-300"></span>
            </Link>
          ))}
        </nav>
      </header>

      {/* YENİ MOBİL MENÜ COMPONENT'I */}
      <MobileMenu 
        isOpen={menuOpen} 
        onClose={() => setMenuOpen(false)} 
        navLinks={navLinks}
        router={router}
      />

      {/* Global Stiller */}
      {mounted && (
        <style jsx global>{`
          /* Google Translate banner'ını tamamen gizle */
          .goog-te-banner-frame { 
            display: none !important; 
            visibility: hidden !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
          }
          
          .goog-te-banner-frame.skiptranslate {
            display: none !important;
          }
          
          .goog-logo-link { 
            display: none !important; 
          }
          
          .goog-te-gadget { 
            font-size: 0 !important; 
            color: transparent !important;
            display: none !important;
          }
          
          .goog-te-combo {
            display: none !important;
          }
          
          /* Sayfa yüksekliği düzeltmesi */
          body {
            top: 0 !important;
            position: static !important;
          }
          
          /* Safari ve mobil optimizasyonları */
          @media (max-width: 768px) {
            * {
              -webkit-tap-highlight-color: transparent;
            }
            
            button, a, [role="button"] {
              touch-action: manipulation;
              cursor: pointer;
            }
          }
        `}</style>
      )}
    </>
  );
}