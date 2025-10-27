"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { assets } from "@/assets/assets";

/* === ICONLAR === */
// İkon SVG tanımlamaları (kısaltıldı)
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
  { code: "tr", label: "Türkçe" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "it", label: "Italiano" },
  { code: "es", label: "Español" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" },
];


/* === COOKIE YÖNETİMİ === */
// Tarayıcı çerezlerini okuma ve ayarlama fonksiyonları
// Ana domain'i alır (örneğin '.example.com')
function getBaseDomain() {
  const host = window.location.hostname;
  return host.startsWith("www.") ? `.${host.replace("www.", "")}` : `.${host}`;
}

// Google Translate çerezini okur
function readGoogTrans() {
  const m = typeof document !== "undefined" && document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : null;
}

// Google Translate çerezini ayarlar
function setGoogTransCookie(from, to) {
  const v = encodeURIComponent(`/${from}/${to}`);
  const baseDomain = getBaseDomain();
  const base = `googtrans=${v}; path=/; max-age=31536000`; // 1 yıl geçerli
  document.cookie = base; // Alt domainler için
  // Ana domain için Secure ve SameSite=None ayarlarıyla
  document.cookie = `googtrans=${v}; path=/; domain=${baseDomain}; max-age=31536000; Secure; SameSite=None`;
}

// Google Translate çerezini temizler
function clearGoogTransCookie() {
  const baseDomain = getBaseDomain();
  const past = "expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/"; // Geçmiş tarih
  document.cookie = `googtrans=; ${past}`;
  document.cookie = `googtrans=; ${past}; domain=${baseDomain}; Secure; SameSite=None`;
}

// Google Translate widget'ındaki dil seçimini programatik olarak değiştirir
function triggerComboChange(lang) {
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

  // Başlangıçta çerezden dili okur
  useEffect(() => {
    const c = readGoogTrans();
    if (!c) { setCurrent(defaultLang); return; } // Çerez yoksa varsayılanı kullan
    const to = c.split("/")[2]; // Çerez formatı: /fromLang/toLang
    setCurrent(to || defaultLang); // Dili ayarla
  }, [defaultLang]);

  // Dili değiştiren fonksiyon
  const setLang = useCallback((lang) => {
    setCurrent(lang); // State'i güncelle
    if (lang === "en") {
      clearGoogTransCookie(); // İngilizce seçilirse çerezi temizle
      setTimeout(() => window.location.reload(), 300); // Sayfayı yenile (çeviriyi kaldırmak için)
    } else {
      setGoogTransCookie("en", lang); // Diğer diller için çerezi ayarla
      const ok = triggerComboChange(lang); // Widget'ı tetikle
      if (!ok) setTimeout(() => window.location.reload(), 300); // Widget hazır değilse sayfayı yenile
    }
  }, []);

  return [current, setLang]; // Mevcut dil ve değiştirme fonksiyonunu döndürür
}


/* === MOBILE DİL SEÇİCİ === */
// Küçük ekranlar için kompakt dil seçici butonu ve modalı
function MobileLangCompact({ dark = false }) {
  const [current, setLang] = useCurrentLang("en"); // Dil hook'unu kullan
  const [open, setOpen] = useState(false); // Modal açık/kapalı durumu
  // Buton stilleri
  const btn = [
    "sm:hidden inline-flex items-center justify-center", // Sadece sm altında görünür
    "rounded-md border px-2 py-1 text-[11px] leading-none tracking-wide",
    "transition active:scale-[0.98]", // Tıklama efekti
    dark ? "border-white/30 text-white" : "border-gray-300 text-gray-800", // Koyu/açık tema
  ].join(" ");
  return (
    <>
      {/* Dil Kodu Butonu */}
      <button onClick={() => setOpen(true)} aria-label="Change language" className={btn}>
        {(current || "en").toUpperCase()} {/* Mevcut dil kodunu büyük harfle göster */}
      </button>
      {/* Dil Seçim Modalı */}
      {open && (
        <div className="fixed inset-0 z-[70] sm:hidden"> {/* Yüksek z-index, sadece sm altında */}
           {/* Arka plan overlay */}
           <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
           {/* Modal içeriği */}
           <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white text-gray-800 shadow-xl">
             <div className="flex items-center justify-between px-4 py-3 border-b">
               <span className="text-sm font-medium">Select language</span>
               <button onClick={() => setOpen(false)} className="px-2 py-1 text-sm rounded hover:bg-black/5">Close</button>
             </div>
             {/* Dil listesi */}
             <ul className="max-h-[60vh] overflow-y-auto py-1">
               {LANGS.map((l) => (
                 <li key={l.code}>
                   <button
                     onClick={() => { setLang(l.code); setOpen(false); }} // Dili ayarla ve modalı kapat
                     className={[
                       "w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-black/5",
                       l.code === current ? "font-medium" : "", // Seçili dili vurgula
                     ].join(" ")}
                   >
                     {/* Dil kodu */}
                     <span className="inline-block w-9 text-[11px] text-center rounded border">{l.code.toUpperCase()}</span>
                     {/* Dil adı */}
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


/* === DESKTOP DİL SEÇİCİ === */
// Büyük ekranlar için açılır menülü dil seçici
function DesktopLanguageSwitcher({ dark = false }) {
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
    <div className="relative hidden sm:block" ref={ref}> {/* Sadece sm ve üzeri ekranlarda görünür */}
      {/* Açılır Menü Butonu */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition",
          dark ? "border-white/30 text-white hover:bg-white/10" : "border-gray-300 text-gray-800 hover:bg-gray-100", // Tema
        ].join(" ")}
      >
        {/* Dil kodu */}
        <span className="inline-block rounded-md px-2 py-0.5 border text-[10px] tracking-wide uppercase">
          {(current || "en").toUpperCase()}
        </span>
        {/* Dil adı (md ve üzeri) */}
        <span className="hidden md:block">{LANGS.find((l) => l.code === current)?.label || "Language"}</span>
        {/* Aşağı ok ikonu */}
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M5.25 7.5l4.5 4.5 4.5-4.5"/></svg>
      </button>
      {/* Açılır Menü İçeriği */}
      {open && (
        <div role="listbox" className={["absolute right-0 mt-2 w-48 rounded-xl shadow-xl ring-1 ring-black/5 focus:outline-none z-[60]", // Yüksek z-index
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
      // Arama alanı dışına tıklanırsa kapat
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchVisible(false);
      }
      // Kullanıcı menüsü dışına tıklanırsa kapat
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    // Event listener'ları ekle
    document.addEventListener("mousedown", handleClickOutside);
    // Cleanup: Component unmount olduğunda listener'ları kaldır
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Scroll olayını dinle (Sticky header için)
  useEffect(() => {
    // Anasayfada değilse her zaman sticky yap
    if (!isHomePage) {
      setIsSticky(true);
      return;
    }
    // Scroll pozisyonuna göre sticky durumunu ayarla
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50); // 50px aşağı kaydırınca sticky yap
    };
    window.addEventListener("scroll", handleScroll);
    // Cleanup: Component unmount olduğunda listener'ı kaldır
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]); // isHomePage değişirse tekrar çalıştır

  // Arama sorgusu değiştikçe ürünleri filtrele
  useEffect(() => {
    if (searchQuery.trim() !== "") { // Sorgu boş değilse
      const filtered = products.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) // İsimde ara (küçük harfe çevirerek)
      );
      setSearchResults(filtered.slice(0, 5)); // İlk 5 sonucu al
    } else {
      setSearchResults([]); // Sorgu boşsa sonuçları temizle
    }
  }, [searchQuery, products]); // searchQuery veya products değişirse çalıştır

  // Arama formunu gönderince (Enter'a basınca)
  const handleSearchSubmit = (e) => {
    e.preventDefault(); // Sayfanın yeniden yüklenmesini engelle
    if (searchQuery.trim()) { // Sorgu boş değilse
      // Arama sonuçları sayfasına yönlendir (?q=... parametresiyle)
      router.push(`/all-products?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchVisible(false); // Arama alanını kapat
      setSearchQuery(""); // Sorguyu temizle
    }
  };

  // Arama sonucundaki bir ürüne tıklanınca
  const handleProductClick = (productId) => {
    router.push(`/product/${productId}`); // Ürün detay sayfasına git
    setIsSearchVisible(false); // Arama alanını kapat
    setSearchQuery(""); // Sorguyu temizle
  };

  // Ana navigasyon linkleri
  const navLinks = [
    { name: "HOME", href: "/" },
    { name: "ALL PRODUCT", href: "/all-products" },
    { name: "COLLECTION", href: "/collection" },
    { name: "CONTACT", href: "/contact" },
  ];

  // Header elementinin stil sınıfları (sticky durumuna göre değişir)
  const headerClasses = isSticky
    ? "fixed top-0 left-0 right-0 z-50 bg-white text-gray-800 shadow-md animate-fadeInDown" // Yapışkan stil
    : "absolute top-0 left-0 right-0 z-20 text-white"; // Normal stil (sayfanın üstünde)

  const logoSrc = assets.logo; // Logoyu assets'ten al

  return (
    <>
      {/* Google Translate Script'leri (Sayfa yüklendikten sonra çalışır) */}
      <Script src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" strategy="afterInteractive" />
      <Script id="google-translate-init" strategy="afterInteractive">
        {`
          // Google Translate widget'ını başlatan fonksiyon
          function googleTranslateElementInit() {
            new google.translate.TranslateElement({
              pageLanguage: 'en', // Sayfanın varsayılan dili
              includedLanguages: 'tr,en,de,fr,it,es,ar,ru', // Desteklenen diller
              layout: google.translate.TranslateElement.InlineLayout.HORIZONTAL // Yatay görünüm
            }, 'google_translate_element'); // Widget'ın yerleştirileceği elementin ID'si
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
            {/* Mobil menü butonu (hamburger/close ikonu) */}
            <button
              aria-label="Menu"
              className="p-2 rounded-full hover:bg-black/10 transition lg:hidden" // Sadece küçük ekranlarda
              onClick={() => setMenuOpen(!menuOpen)} // Tıklayınca menü durumunu değiştir
            >
              {menuOpen ? ( // Menü açıksa kapatma ikonu
                <icons.Close className="w-6 h-6" />
              ) : ( // Menü kapalıysa açma (hamburger) ikonu
                <icons.Menu className="w-6 h-6" />
              )}
            </button>

            {/* Arama butonu */}
            <button
              aria-label="Search"
              className="p-2 rounded-full hover:bg-black/10 transition"
              onClick={(e) => {
                e.stopPropagation(); // Diğer tıklama olaylarını engelle
                setIsSearchVisible(!isSearchVisible); // Arama alanının görünürlüğünü değiştir
              }}
            >
              <icons.Search className="w-5 h-5" />
            </button>
          </div>

          {/* Orta: Logo */}
          <div
            className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer" // Ortalamak için
            onClick={() => router.push("/")} // Tıklayınca anasayfaya git
          >
            <Image
              className="w-28 md:w-32" // Logo boyutu
              src={logoSrc}
              alt="logo"
              style={{
                // Sticky değilse (anasayfanın en üstündeyse) logoyu beyaz yap
                filter: isSticky ? "none" : "brightness(0) invert(1)",
              }}
            />
          </div>

          {/* Sağ taraf: Dil seçici, Kullanıcı menüsü, Sepet ikonu */}
          <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Dil Değiştirici (Client tarafında render edilir) */}
              {mounted && ( // Sadece client'ta render et
                <>
                  {/* Mobil ve Desktop için ayrı dil değiştiriciler */}
                  <MobileLangCompact dark={!isSticky} />
                  <DesktopLanguageSwitcher dark={!isSticky} />
                  {/* Google Translate widget'ının kendisi (gizlenmiş) */}
                  <div id="google_translate_element" className="pointer-events-none absolute opacity-0 -z-10" />
                </>
              )}

              {/* Kullanıcı Giriş/Hesap Menüsü */}
              {user ? ( // Kullanıcı giriş yapmışsa
                <div className="relative" ref={userMenuRef}> {/* Açılır menü için referans */}
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} // Kullanıcı menüsünü aç/kapat
                    className="flex items-center gap-2 p-2 rounded-full hover:bg-black/10 transition"
                  >
                    {/* Kullanıcı ikonu */}
                    <Image
                      className="w-5 h-5"
                      src={assets.user_icon}
                      alt="user icon"
                      style={{
                        filter: isSticky ? "none" : "brightness(0) invert(1)", // Sticky durumuna göre ikon rengi
                      }}
                    />
                    {/* Kullanıcı adı (sadece md ve üzeri ekranlarda) */}
                    <span className="hidden md:block truncate max-w-[100px]">
                      {displayUserName}
                    </span>
                  </button>
                  {/* Açılır Kullanıcı Menüsü */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 text-gray-800">
                      {/* Hesap linki */}
                      <Link
                        href="/account"
                        onClick={() => setIsUserMenuOpen(false)} // Tıklayınca menüyü kapat
                        className="block px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        My Account
                      </Link>
                      {/* Çıkış yap butonu */}
                      <button
                        onClick={() => {
                          signOut(); // Çıkış yap fonksiyonunu çağır
                          setIsUserMenuOpen(false); // Menüyü kapat
                        }}
                        className="w-full text-left block px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              ) : ( // Kullanıcı giriş yapmamışsa
                // Giriş Yap butonu
                <button
                  onClick={() => router.push("/auth")} // Giriş sayfasına yönlendir
                  className="flex items-center gap-2 p-2 rounded-full hover:bg-black/10 transition"
                >
                  <Image
                    className="w-5 h-5"
                    src={assets.user_icon}
                    alt="user icon"
                    style={{
                      filter: isSticky ? "none" : "brightness(0) invert(1)", // İkon rengi
                    }}
                  />
                  <span className="hidden md:block">Log In</span> {/* Sadece md ve üzeri */}
                </button>
              )}

              {/* Sepet Butonu */}
              <button
                aria-label="Shopping Bag"
                className="p-2 rounded-full hover:bg-black/10 transition relative"
                onClick={() => router.push("/cart")} // Sepet sayfasına git
              >
                <icons.ShoppingBag className="w-5 h-5" />
                {/* Sepette ürün varsa sayısını gösteren bildirim balonu */}
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-white text-xs">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
        </div>

        {/* Arama Alanı (Eğer görünürse) */}
        {isSearchVisible && (
          <div ref={searchRef} className="relative mt-4 max-w-md mx-auto"> {/* Arama alanı için referans */}
            <form onSubmit={handleSearchSubmit} className="flex"> {/* Form gönderimini handleSearchSubmit ile yönet */}
              <input
                type="text"
                value={searchQuery} // Input değeri state'e bağlı
                onChange={(e) => setSearchQuery(e.target.value)} // Değişiklikte state'i güncelle
                placeholder="Search Products..." // Placeholder metni
                autoFocus // Otomatik olarak input'a odaklan
                className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                  isSticky
                    ? "bg-gray-100 text-gray-800 placeholder-gray-500 focus:ring-orange-500" // Sticky durumunda stil
                    : "bg-white/20 text-white placeholder-white/70 focus:ring-white/50" // Normal durumda (üstte) stil
                }`}
              />
            </form>
            {/* Arama Sonuçları Listesi */}
            {searchResults.length > 0 && ( // Eğer arama sonucu varsa göster
              <div className="absolute top-full left-0 w-full bg-white text-black mt-2 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto"> {/* Yüksek z-index, kaydırılabilir */}
                <ul>
                  {searchResults.map((product) => ( // Sonuçları map ile dön
                    <li key={product.id}>
                      <div
                        onClick={() => handleProductClick(product.id)} // Sonuca tıklanınca ürün sayfasına git
                        className="flex items-center p-3 hover:bg-gray-100 cursor-pointer"
                      >
                        {/* Ürün resmi */}
                        <div className="relative w-12 h-12 mr-4 flex-shrink-0">
                          <Image
                            src={getSafeImageUrl(product.image_urls)} // Güvenli URL al
                            alt={product.name}
                            fill // Alanı doldur
                            className="object-cover rounded-md" // Stiller
                          />
                        </div>
                        {/* Ürün adı */}
                        <span className="font-medium text-gray-800">
                          {product.name}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Ana Navigasyon Menüsü (Büyük ekranlar için) */}
        <nav
          className={`mt-6 hidden lg:flex justify-center space-x-10 text-sm font-light tracking-[0.25em] uppercase ${
            isSticky ? "text-gray-700" : "text-gray-200" // Sticky durumuna göre metin rengi
          }`}
        >
          {navLinks.map((item) => ( // Linkleri map ile dön
            <Link
              key={item.name}
              href={item.href}
              className="relative group hover:text-current transition" // Hover efekti için group sınıfı
            >
              {item.name}
              {/* Hover'da altta çıkan çizgi efekti */}
              <span className="absolute left-1/2 -bottom-1 w-0 h-[1.5px] bg-current group-hover:w-6 group-hover:-translate-x-1/2 transition-all duration-300"></span>
            </Link>
          ))}
        </nav>

        {/* Mobil Menü (Eğer açıksa) */}
        {menuOpen && (
          // **İSTEĞİNİZ ÜZERE Z-INDEX EKLENDİ (z-50)**
          <div className="fixed top-0 left-0 w-full h-full bg-black/90 z-50 flex flex-col items-center justify-center text-center space-y-8 text-white text-lg font-light uppercase tracking-widest animate-fadeIn">
            {/* Kapatma butonu */}
            <button
              aria-label="Close menu"
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/20 transition"
              onClick={() => setMenuOpen(false)} // Tıklayınca menüyü kapat
            >
              <icons.Close className="w-7 h-7" />
            </button>

            {/* Mobil menü linkleri */}
            {navLinks.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMenuOpen(false)} // Linke tıklayınca menüyü kapat
                className="hover:text-orange-300 transition" // Hover rengi
              >
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Google Translate stil düzeltmeleri (Client tarafında) */}
      {mounted && ( // Sadece client'ta render et
        <style jsx global>{`
          /* Google Translate banner'ını tamamen gizle */
          .goog-te-banner-frame { display: none !important; }
          /* Google logosunu gizle */
          .goog-logo-link { display: none !important; }
          /* Google Translate widget'ının font boyutunu sıfırla (görünmez yapar ama işlevselliği korur) */
          .goog-te-gadget { font-size: 0 !important; }
          /* Sayfanın üst kısmındaki gereksiz boşluğu kaldır (banner gizlenince oluşabilir) */
          body { top: 0 !important; }
        `}</style>
      )}
    </>
  );
}