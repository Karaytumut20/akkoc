// app/layout.js

import { Outfit } from "next/font/google";
import "./globals.css";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";
import LayoutContent from "@/components/LayoutContent";
import Script from "next/script";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500"] });

// 👇 GÜNCELLEMEN GEREKEN KISIM BURASI 👇
export const metadata = {
  // 1. Sitenin ana adresini buraya mutlaka tanımlamalısın (SEO için en kritik satır)
  metadataBase: new URL('https://nestcome.com'), 

  title: {
    default: "Nestcome | Luxury Homeware & Decor",
    template: "%s | Nestcome" // Alt sayfalarda "Ürün Adı | Nestcome" şeklinde görünmesini sağlar
  },
  description:
    "Discover luxury homeware, tableware, and decor at Nestcome. Elevate your living spaces with timeless elegance and quality craftsmanship.",
  
  // 2. Canonical URL ayarı (Google'a "Orijinal sayfa burasıdır" der)
  alternates: {
    canonical: './',
  },

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  
  // Robotların siteni taramasına izin ver
  robots: {
    index: true,
    follow: true,
  }
};
// 👆 GÜNCELLEME SONU 👆

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Schema.org verisi doğru, kalabilir */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Nestcome",
              url: "https://nestcome.com",
              logo: "https://nestcome.com/favicon.ico",
            }),
          }}
        />
      </head>

      <body
        className={`${outfit.className} antialiased text-gray-700 bg-[#ECE4DC]`}
      >
        <Toaster />
        <AppContextProvider>
          <LayoutContent>{children}</LayoutContent>

          {/* Google Translate gizleme scripti doğru, kalabilir */}
          <Script id="force-remove-google-bar" strategy="afterInteractive">
            {`
              const removeGoogleTranslateBar = () => {
                const banner = document.querySelector('.goog-te-banner-frame.skiptranslate');
                if (banner) {
                  banner.style.display = 'none';
                  banner.style.visibility = 'hidden';
                }
                document.body.style.top = '0px';
                const balloon = document.querySelector('.goog-te-balloon-frame');
                if (balloon) {
                  balloon.style.display = 'none';
                  balloon.style.visibility = 'hidden';
                }
                const tooltip = document.getElementById('goog-gt-tt');
                if (tooltip) {
                  tooltip.remove();
                }
              };
              document.addEventListener('DOMContentLoaded', () => {
                const interval = setInterval(removeGoogleTranslateBar, 500);
                setTimeout(() => clearInterval(interval), 10000);
              });
              window.addEventListener('load', removeGoogleTranslateBar);
            `}
          </Script>
        </AppContextProvider>
      </body>
    </html>
  );
}