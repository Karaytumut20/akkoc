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
  Menu: (p) => (<svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>),
  Close: (p) => (<svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
  Search: (p) => (<svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>),
  ShoppingBag: (p) => (<svg {...p} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>),
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

/* === YENİ MOBİL MENÜ KOMPONENTİ === */
function MobileMenu({ isOpen, onClose, navLinks, isSticky }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.9)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fadeIn 0.3s ease-in-out'
    }}>
      {/* Kapatma Butonu */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'none',
          border: 'none',
          color: 'white',
          padding: '10px',
          cursor: 'pointer'
        }}
      >
        <icons.Close style={{ width: '24px', height: '24px' }} />
      </button>

      {/* Menü Linkleri */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '30px'
      }}>
        {navLinks.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            onClick={onClose}
            style={{
              color: 'white',
              textDecoration: 'none',
              fontSize: '18px',
              fontWeight: '300',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              transition: 'color 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = '#f97316'}
            onMouseLeave={(e) => e.target.style.color = 'white'}
          >
            {item.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* === DİL SEÇİCİ === */
function LanguageSwitcher({ dark = false }) {
  const [current, setCurrent] = useState("en");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '8px',
          border: dark ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(0,0,0,0.2)',
          background: 'transparent',
          color: dark ? 'white' : 'black',
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
      >
        <span style={{
          padding: '2px 6px',
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'uppercase',
          border: dark ? '1px solid rgba(255,255,255,0.5)' : '1px solid rgba(0,0,0,0.3)',
          borderRadius: '4px'
        }}>
          {current.toUpperCase()}
        </span>
        <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.25 7.5l4.5 4.5 4.5-4.5"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: '100%',
          marginTop: '8px',
          width: '200px',
          backgroundColor: dark ? '#1a1a1a' : 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
          zIndex: 110,
          overflow: 'hidden'
        }}>
          {LANGS.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setCurrent(lang.code);
                setOpen(false);
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                color: dark ? 'white' : 'black',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <span style={{
                fontSize: '11px',
                fontWeight: '600',
                padding: '2px 6px',
                border: dark ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(0,0,0,0.3)',
                borderRadius: '4px'
              }}>
                {lang.code.toUpperCase()}
              </span>
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* === ANA NAVBAR === */
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

  const displayUserName = user?.user_metadata?.full_name || 
                         user?.email?.split("@")[0] || 
                         "My Account";

  const navLinks = [
    { name: "HOME", href: "/" },
    { name: "ALL PRODUCT", href: "/all-products" },
    { name: "COLLECTION", href: "/collection" },
    { name: "CONTACT", href: "/contact" },
  ];

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchVisible(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isHomePage) {
      setIsSticky(true);
      return;
    }
    const handleScroll = () => setIsSticky(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = products.filter(product =>
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

  const headerStyle = {
    width: '100%',
    padding: '16px 20px 8px 20px',
    transition: 'all 0.3s ease',
    ...(isSticky ? {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      backgroundColor: '#ECE4DC',
      color: '#1f2937',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    } : {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 20,
      color: 'white'
    })
  };

  return (
    <>
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

      <header style={headerStyle}>
        {/* Ana İçerik */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative'
        }}>
          {/* Sol Taraf - Menü ve Arama */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <button
              onClick={() => setMenuOpen(true)}
              style={{
                padding: '8px',
                background: 'none',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <icons.Menu style={{
                width: '24px',
                height: '24px',
                color: isSticky ? 'black' : 'white'
              }} />
            </button>

            <button
              onClick={() => setIsSearchVisible(!isSearchVisible)}
              style={{
                padding: '8px',
                background: 'none',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <icons.Search style={{
                width: '20px',
                height: '20px',
                color: isSticky ? 'black' : 'white'
              }} />
            </button>
          </div>

          {/* Logo */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              cursor: 'pointer'
            }}
            onClick={() => router.push("/")}
          >
            <Image
              src={assets.logo}
              alt="logo"
              width={120}
              height={40}
              style={{
                filter: isSticky ? 'none' : 'brightness(0) invert(1)'
              }}
            />
          </div>

          {/* Sağ Taraf - Dil, Kullanıcı, Sepet */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {mounted && <LanguageSwitcher dark={!isSticky} />}

            {/* Kullanıcı Menüsü */}
            {user ? (
              <div ref={userMenuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px',
                    background: 'none',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease'
                  }}
                >
                  <Image
                    src={assets.user_icon}
                    alt="user icon"
                    width={20}
                    height={20}
                    style={{
                      filter: isSticky ? 'none' : 'brightness(0) invert(1)'
                    }}
                  />
                </button>

                {isUserMenuOpen && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: '8px',
                    width: '160px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                    zIndex: 20,
                    overflow: 'hidden'
                  }}>
                    <Link 
                      href="/account" 
                      onClick={() => setIsUserMenuOpen(false)}
                      style={{
                        display: 'block',
                        padding: '12px 16px',
                        color: '#1f2937',
                        textDecoration: 'none',
                        fontSize: '14px',
                        transition: 'background-color 0.2s ease',
                        borderBottom: '1px solid #f3f4f6'
                      }}
                    >
                      My Account
                    </Link>
                    <button 
                      onClick={() => { signOut(); setIsUserMenuOpen(false); }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '12px 16px',
                        background: 'none',
                        border: 'none',
                        color: '#1f2937',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => router.push("/auth")}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px',
                  background: 'none',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s ease'
                }}
              >
                <Image
                  src={assets.user_icon}
                  alt="user icon"
                  width={20}
                  height={20}
                  style={{
                    filter: isSticky ? 'none' : 'brightness(0) invert(1)'
                  }}
                />
              </button>
            )}

            {/* Sepet */}
            <button
              onClick={() => router.push("/cart")}
              style={{
                padding: '8px',
                background: 'none',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
                position: 'relative'
              }}
            >
              <icons.ShoppingBag style={{
                width: '20px',
                height: '20px',
                color: isSticky ? 'black' : 'white'
              }} />
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '16px',
                  height: '16px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  borderRadius: '50%',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Arama Alanı */}
        {isSearchVisible && (
          <div ref={searchRef} style={{
            position: 'relative',
            marginTop: '16px',
            maxWidth: '500px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Products..."
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  backgroundColor: isSticky ? '#f3f4f6' : 'rgba(255,255,255,0.2)',
                  color: isSticky ? '#1f2937' : 'white'
                }}
              />
            </form>

            {searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                width: '100%',
                backgroundColor: 'white',
                marginTop: '8px',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                zIndex: 50,
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                      borderBottom: '1px solid #f3f4f6'
                    }}
                  >
                    <div style={{
                      position: 'relative',
                      width: '40px',
                      height: '40px',
                      marginRight: '12px',
                      flexShrink: 0
                    }}>
                      <Image
                        src={getSafeImageUrl(product.image_urls)}
                        alt={product.name}
                        fill
                        style={{ objectFit: 'cover', borderRadius: '4px' }}
                      />
                    </div>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#1f2937'
                    }}>
                      {product.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Masaüstü Navigasyon */}
        <nav style={{
          marginTop: '16px',
          display: 'none',
          justifyContent: 'center',
          gap: '40px',
          fontSize: '14px',
          fontWeight: '300',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          color: isSticky ? '#374151' : '#e5e7eb'
        }}>
          {navLinks.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              style={{
                color: 'inherit',
                textDecoration: 'none',
                position: 'relative',
                transition: 'color 0.3s ease'
              }}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Yeni Mobil Menü */}
        <MobileMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          navLinks={navLinks}
          isSticky={isSticky}
        />
      </header>

      {/* Global Stiller */}
      {mounted && (
        <style jsx global>{`
          .goog-te-banner-frame { display: none !important; }
          .goog-logo-link { display: none !important; }
          #google_translate_element .goog-te-gadget { font-size: 0 !important; }
          #google_translate_element .goog-te-gadget-simple { 
            background: transparent !important; 
            border: none !important; 
            padding: 0 !important; 
          }
          #google_translate_element .goog-te-menu-value span { display: none !important; }
          #google_translate_element .goog-te-gadget-icon { display: none !important; }
          body { top: 0 !important; }

          @media (min-width: 1024px) {
            nav { display: flex !important; }
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      )}
    </>
  );
}