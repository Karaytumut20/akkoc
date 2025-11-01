"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { assets } from "@/assets/assets";

/* === ICONLAR === */
// İkon SVG tanımlamaları
const icons = {
  Menu: (p) => (<svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>),
  Close: (p) => (<svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
  Search: (p) => (<svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>),
  ShoppingBag: (p) => (<svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>),
};


/* === DİL LİSTESİ === */
// Desteklenen dillerin listesi
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


/* === COOKIE YÖNETİMİ === */
// Tarayıcı çerezlerini okuma ve ayarlama fonksiyonları
// Ana domain'i alır (örneğin '.example.com')
function getBaseDomain() {
  const host = typeof window !== 'undefined' ? window.location.hostname : ''; // Sunucu tarafında window yok
  if (!host) return ''; // Host alınamazsa boş dön
  return host.startsWith("www.") ? `.${host.replace("www.", "")}` : `.${host}`;
}

// Google Translate çerezini okur
function readGoogTrans() {
  const m = typeof document !== "undefined" && document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : null;
}

// Google Translate çerezini ayarlar
function setGoogTransCookie(from, to) {
  if (typeof document === 'undefined') return; // Sunucu tarafında işlem yapma
  const v = encodeURIComponent(`/${from}/${to}`);
  const baseDomain = getBaseDomain();
  const base = `googtrans=${v}; path=/; max-age=31536000`; // 1 yıl geçerli
  document.cookie = base; // Alt domainler için
  // Ana domain için Secure ve SameSite=None ayarlarıyla (HTTPS gerektirir)
  if (baseDomain) {
      document.cookie = `googtrans=${v}; path=/; domain=${baseDomain}; max-age=31536000; Secure; SameSite=None`;
  }
}

// Google Translate çerezini temizler
function clearGoogTransCookie() {
  if (typeof document === 'undefined') return; // Sunucu tarafında işlem yapma
  const baseDomain = getBaseDomain();
  const past = "expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/"; // Geçmiş tarih
  document.cookie = `googtrans=; ${past}`;
  if (baseDomain) {
      document.cookie = `googtrans=; ${past}; domain=${baseDomain}; Secure; SameSite=None`;
  }
}

// Google Translate widget'ındaki dil seçimini programatik olarak değiştirir
function triggerComboChange(lang) {
  if (typeof document === 'undefined') return false; // Sunucu tarafında işlem yapma
  const combo = document.querySelector("select.goog-te-combo");
  if (!combo) return false; // Widget bulunamazsa false döner
  combo.value = lang === "en" ? "" : lang; // 'en' için boş değer kullanılır
  combo.dispatchEvent(new Event("change")); // Değişiklik olayını tetikler
  return true;
}


/* === DİL HOOK === */
// Mevcut dili yönetmek ve değiştirmek için özel hook
function useCurrentLang(defaultLang = "en") {
  const [current, setCurrent] = useState(defaultLang);
  const pollIntervalRef = useRef(null); // Polling interval referansı

  // Çerezi okuyup dili ayarlayan fonksiyon
  const checkCookieAndSetLang = useCallback((targetLang = null) => {
    const c = readGoogTrans();
    let currentLangInCookie = defaultLang;
    if (c) {
      const parts = c.split("/");
      if (parts.length === 3 && parts[2]) {
        currentLangInCookie = parts[2];
      }
    }

    // Eğer bir hedef dil belirtilmişse ve çerezdeki dil hedef dil ile eşleşiyorsa
    // veya hedef dil belirtilmemişse, state'i güncelle
    if ((targetLang && currentLangInCookie === targetLang) || !targetLang) {
       setCurrent(currentLangInCookie);
       // Polling'i durdur (hedefe ulaşıldı veya başlangıç kontrolü yapıldı)
       if (pollIntervalRef.current) {
         clearInterval(pollIntervalRef.current);
         pollIntervalRef.current = null;
       }
       return true; // Başarılı veya hedef yok
    }
    return false; // Hedef belirtilmiş ama çerez henüz güncellenmemiş
  }, [defaultLang]);

  // Başlangıçta çerezden dili oku (sadece client tarafında çalışır)
  useEffect(() => {
    if (typeof window !== 'undefined') { // Tarayıcıda olduğumuzdan emin olalım
        checkCookieAndSetLang();
    }
    // Komponent unmount olduğunda polling'i temizle
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [checkCookieAndSetLang]);


  // Dili değiştiren fonksiyon
  const setLang = useCallback((lang) => {
     if (typeof window === 'undefined') return; // Sunucu tarafında işlem yapma

     // Önceki polling varsa temizle
     if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
     }

    if (lang === "en") {
      clearGoogTransCookie(); // İngilizce seçilirse çerezi temizle
      setCurrent("en"); // State'i hemen güncelle
      // Google Translate widget'ı varsa onu da sıfırla
      triggerComboChange("en");
      // Sayfayı yenilemek genellikle en temiz yöntemdir.
      setTimeout(() => window.location.reload(), 300);
    } else {
      setGoogTransCookie("en", lang); // Diğer diller için çerezi ayarla
      const ok = triggerComboChange(lang); // Widget'ı tetikle

       // Widget tetiklenemezse veya hızlı güncelleme isteniyorsa sayfayı yenile
       if (!ok) {
         setTimeout(() => window.location.reload(), 300);
         return; // Yenileme yapılıyorsa polling'e gerek yok
       }

      // Widget tetiklendiyse, çerezin güncellenmesini bekle (Polling)
      let attempts = 0;
      const maxAttempts = 15; // Maksimum 3 saniye bekle (15 * 200ms)
      pollIntervalRef.current = setInterval(() => {
        attempts++;
        // Çerezi kontrol et ve state'i güncellemeye çalış
        const updated = checkCookieAndSetLang(lang);
        if (updated || attempts >= maxAttempts) {
          clearInterval(pollIntervalRef.current); // Interval'i temizle
          pollIntervalRef.current = null;
          if (!updated && attempts >= maxAttempts) {
              console.warn("Google Translate cookie update timed out. Reloading might be needed.");
          }
        }
      }, 200); // Her 200ms'de bir kontrol et
    }
  }, [checkCookieAndSetLang]); // checkCookieAndSetLang'ı bağımlılıklara ekle


  return [current, setLang]; // Mevcut dil ve değiştirme fonksiyonunu döndürür
}


/* === TÜM EKRANLAR İÇİN DİL SEÇİCİ === */
// Açılır menülü dil seçici (mobil ve masaüstü için)
function LanguageSwitcher({ dark = false }) {
  const [current, setLang] = useCurrentLang("en"); // Dil hook'unu kullan
  const [open, setOpen] = useState(false); // Açılır menü durumu
  const ref = useRef(null); // Menü referansı

  // Dışarı tıklama veya ESC tuşu ile menüyü kapatma
  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onClick); document.removeEventListener("keydown", onEsc); };
  }, []);

  return (
    <div className="relative" ref={ref}>
      {/* Açılır Menü Butonu */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          "flex items-center gap-1 sm:gap-2 rounded-lg transition", // Temel stiller (gap-1 mobil için)
          "p-2 sm:px-3 sm:py-2", // Mobil için daha az padding, sm+ daha fazla
          "text-xs sm:text-sm", // Mobilde daha küçük metin
          dark
            ? "text-white sm:border sm:border-white/30 sm:hover:bg-white/10" // Koyu tema (mobilde çerçevesiz)
            : "text-gray-800 sm:border sm:border-gray-300 sm:hover:bg-gray-100", // Açık tema (mobilde çerçevesiz)
          // === YENİ EKLEME: Sticky header için mobil arka plan ===
          !dark ? "hover:bg-gray-100" : "hover:bg-white/10" // Mobil için hover arka planı (sticky durumunu dark prop'u belirliyor)
          // === YENİ EKLEME SONU ===
        ].join(" ")}
      >
        {/* Dil kodu (Her zaman görünür) - Daha basit görünüm */}
        {/* === GÜNCELLEME: Mobil için border ve padding kaldırıldı, font kalın yapıldı === */}
        <span className={[
            "inline-block rounded px-0 py-0 text-[11px] sm:text-[10px] tracking-wide uppercase font-semibold", // Mobilde padding yok, font-semibold
            "sm:px-2 sm:py-0.5 sm:border sm:font-medium", // sm+ için eski stil
            dark ? "sm:border-white/50" : "sm:border-gray-400" // sm+ için border rengi
        ].join(" ")}>
          {(current || "en").toUpperCase()}
        </span>
        {/* === GÜNCELLEME SONU === */}

        {/* Dil adı (sadece md ve üzeri) */}
        <span className="hidden md:inline-block">{LANGS.find((l) => l.code === current)?.label || "Language"}</span>
        {/* Aşağı ok ikonu (sadece sm ve üzeri) */}
        <svg className="w-4 h-4 flex-shrink-0 hidden sm:block" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M5.25 7.5l4.5 4.5 4.5-4.5"/></svg>
      </button>
      {/* Açılır Menü İçeriği */}
      {open && (
        <div role="listbox" className={["absolute right-0 mt-2 w-48 rounded-xl shadow-xl ring-1 ring-black/5 focus:outline-none z-[110]", // Yüksek z-index
          dark ? "bg-neutral-900 text-white" : "bg-white text-gray-800"].join(" ")}>
          <ul className="py-1 max-h-64 overflow-auto"> {/* Kaydırılabilir liste */}
            {LANGS.map((l) => (
              <li key={l.code}>
                <button
                  onClick={() => { setLang(l.code); setOpen(false); }} // Dili ayarla ve menüyü kapat
                  className={[
                    "w-full text-left px-3 py-2 text-sm hover:bg-black/5",
                    l.code === current ? "font-medium" : "", // Seçili dili vurgula
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


/* === ANA NAVBAR === */
// Ana navigasyon barı komponenti
export default function MainNavbar() {
  // Gerekli context verilerini ve hook'ları al
  const { products, getSafeImageUrl, user, signOut, getCartCount } = useAppContext();
  const router = useRouter(); // Yönlendirme için
  const pathname = usePathname(); // Mevcut sayfa yolu

  // State tanımlamaları
  const [menuOpen, setMenuOpen] = useState(false); // Mobil menü açık/kapalı
  const [searchQuery, setSearchQuery] = useState(""); // Arama sorgusu
  const [searchResults, setSearchResults] = useState([]); // Arama sonuçları
  const [isSearchVisible, setIsSearchVisible] = useState(false); // Arama alanı görünürlüğü
  const [isSticky, setIsSticky] = useState(false); // Header yapışkan mı?
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false); // Kullanıcı menüsü açık/kapalı
  const [mounted, setMounted] = useState(false); // Komponent mount oldu mu? (Client-side render için)

  // Referans tanımlamaları (DOM elemanlarına erişim için)
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);

  // Sepetteki ürün sayısı
  const cartCount = getCartCount();
  // Anasayfada olup olmadığını kontrol et
  const isHomePage = pathname === "/";
  // Kullanıcı adını göster (varsa full_name, yoksa email'in başı, o da yoksa 'My Account')
  const displayUserName =
    (user && user.user_metadata && user.user_metadata.full_name) ||
    (user && user.email && user.email.split("@")[0]) ||
    "My Account";

  // Komponent mount olduğunda state'i güncelle (client-side render kontrolü)
  useEffect(() => setMounted(true), []);

  // Dışarı tıklama olaylarını dinle (Arama ve kullanıcı menüsünü kapatmak için)
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchVisible(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Scroll olayını dinle (Sticky header için)
  useEffect(() => {
    if (!isHomePage) {
      setIsSticky(true);
      return;
    }
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  // Arama sorgusu değiştikçe ürünleri filtrele
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

  // Arama formunu gönderince
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/all-products?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchVisible(false);
      setSearchQuery("");
    }
  };

  // Arama sonucundaki bir ürüne tıklanınca
  const handleProductClick = (productId) => {
    router.push(`/product/${productId}`);
    setIsSearchVisible(false);
    setSearchQuery("");
  };

  // Ana navigasyon linkleri
  const navLinks = [
    { name: "HOME", href: "/" },
    { name: "ALL PRODUCT", href: "/all-products" },
    { name: "COLLECTION", href: "/collection" },
    { name: "CONTACT", href: "/contact" },
  ];

  // Header elementinin stil sınıfları
  const headerClasses = isSticky
    ? "fixed top-0 left-0 right-0 z-50 bg-[#ECE4DC] text-gray-800 shadow-md animate-fadeInDown" // Yapışkan stil (Arka plan rengi güncellendi)
    : "absolute top-0 left-0 right-0 z-20 text-white"; // Normal stil (sayfanın üstünde)

  const logoSrc = assets.logo;

  return (
    <>
      {/* Google Translate Script'leri */}
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

      {/* Header elementi */}
      <header
        className={`w-full pt-4 pb-2 px-5 sm:px-10 lg:px-16 transition-all duration-300 ${headerClasses}`}
      >
        {/* İçerik hizalama */}
        <div className="flex items-center justify-between relative">
          {/* Sol taraf: Menü ve Arama ikonları */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobil menü butonu */}
            <button
              aria-label="Menu"
              className="p-2 rounded-full hover:bg-black/10 transition lg:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <icons.Close className="w-6 h-6" /> : <icons.Menu className="w-6 h-6" />}
            </button>
            {/* Arama butonu */}
            <button
              aria-label="Search"
              className="p-2 rounded-full hover:bg-black/10 transition"
              onClick={(e) => { e.stopPropagation(); setIsSearchVisible(!isSearchVisible); }}
            >
              <icons.Search className="w-5 h-5" />
            </button>
          </div>

          {/* Orta: Logo */}
          <div
            className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <Image
              className="w-28 md:w-32"
              src={logoSrc}
              alt="logo"
              style={{ filter: isSticky ? "none" : "brightness(0) invert(1)" }}
            />
          </div>

          {/* Sağ taraf: Dil seçici, Kullanıcı menüsü, Sepet ikonu */}
          <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Dil Değiştirici (Client tarafında render edilir) */}
              {mounted && (
                <>
                  {/* === DEĞİŞİKLİK: Sadece LanguageSwitcher kullanılıyor, dark prop'u isSticky'ye göre ayarlanıyor === */}
                  <LanguageSwitcher dark={!isSticky} />
                  {/* === DEĞİŞİKLİK SONU === */}
                  <div id="google_translate_element" className="pointer-events-none absolute opacity-0 -z-10" />
                </>
              )}

              {/* Kullanıcı Giriş/Hesap Menüsü */}
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-2 rounded-full hover:bg-black/10 transition"
                  >
                    <Image
                      className="w-5 h-5"
                      src={assets.user_icon}
                      alt="user icon"
                      style={{ filter: isSticky ? "none" : "brightness(0) invert(1)" }}
                    />
                    <span className="hidden md:block truncate max-w-[100px]">
                      {displayUserName}
                    </span>
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 text-gray-800">
                      <Link href="/account" onClick={() => setIsUserMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-100">
                        My Account
                      </Link>
                      <button onClick={() => { signOut(); setIsUserMenuOpen(false); }} className="w-full text-left block px-4 py-2 text-sm hover:bg-gray-100">
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={() => router.push("/auth")} className="flex items-center gap-2 p-2 rounded-full hover:bg-black/10 transition">
                  <Image
                    className="w-5 h-5"
                    src={assets.user_icon}
                    alt="user icon"
                    style={{ filter: isSticky ? "none" : "brightness(0) invert(1)" }}
                  />
                  <span className="hidden md:block">Log In</span>
                </button>
              )}

              {/* Sepet Butonu */}
              <button
                aria-label="Shopping Bag"
                className="p-2 rounded-full hover:bg-black/10 transition relative"
                onClick={() => router.push("/cart")}
              >
                <icons.ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-white text-xs">
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

        {/* Ana Navigasyon Menüsü (Büyük ekranlar) */}
        <nav
          className={`mt-6 hidden lg:flex justify-center space-x-10 text-sm font-light tracking-[0.25em] uppercase ${
            isSticky ? "text-gray-700" : "text-gray-200"
          }`}
        >
          {navLinks.map((item) => (
            <Link key={item.name} href={item.href} className="relative group hover:text-current transition">
              {item.name}
              <span className="absolute left-1/2 -bottom-1 w-0 h-[1.5px] bg-current group-hover:w-6 group-hover:-translate-x-1/2 transition-all duration-300"></span>
            </Link>
          ))}
        </nav>

        {/* Mobil Menü */}
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

      {/* Google Translate stil düzeltmeleri */}
      {mounted && (
        <style jsx global>{`
          /* Google Translate banner'ını tamamen gizle */
          .goog-te-banner-frame { display: none !important; }
          /* Google logosunu gizle */
          .goog-logo-link { display: none !important; }
          /* Google Translate widget'ını görünmez yap ama işlevselliği koru */
          #google_translate_element .goog-te-gadget { font-size: 0 !important; }
          #google_translate_element .goog-te-gadget-simple { background-color: transparent !important; border: none !important; padding: 0 !important; margin: 0 !important; } /* Daha fazla stil sıfırlama */
          #google_translate_element .goog-te-menu-value span { display: none !important; }
          #google_translate_element .goog-te-gadget-icon { display: none !important; }
          /* Sayfanın üst kısmındaki gereksiz boşluğu kaldır */
          body { top: 0 !important; }
        `}</style>
      )}
    </>
  );
}