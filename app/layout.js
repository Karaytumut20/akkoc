// app/layout.jsx
import { Outfit } from "next/font/google";
import "./globals.css";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";
import LayoutContent from "@/components/LayoutContent";
import Script from "next/script"; // ✅ Eksik olan import eklendi!

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500"] });

export const metadata = {
  title: "Nestcome",
  description: "Nestcome",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${outfit.className} antialiased text-gray-700 bg-[#ECE4DC]`}>
        <Toaster />
        <AppContextProvider>
          <LayoutContent>{children}</LayoutContent>

          {/* ✅ Google Translate bar'ı gizleyen script */}
          <Script id="force-remove-google-bar" strategy="afterInteractive">
  {`
    const removeGoogleTranslateBar = () => {
      // Üstteki çeviri barını sil
      const banner = document.querySelector('.goog-te-banner-frame.skiptranslate');
      if (banner) {
        banner.style.display = 'none';
        banner.style.visibility = 'hidden';
      }

      // body top boşluğunu sıfırla
      document.body.style.top = '0px';

      // Tooltip iframe varsa onu da kaldır
      const balloon = document.querySelector('.goog-te-balloon-frame');
      if (balloon) {
        balloon.style.display = 'none';
        balloon.style.visibility = 'hidden';
      }

      // Tooltip divlerini yok et
      const tooltip = document.getElementById('goog-gt-tt');
      if (tooltip) {
        tooltip.remove();
      }
    };

    // İlk açılışta ve her dil değişiminde tekrar çalıştır
    document.addEventListener('DOMContentLoaded', () => {
      const interval = setInterval(removeGoogleTranslateBar, 500);
      setTimeout(() => clearInterval(interval), 10000);
    });

    // Bazı durumlarda Google sonradan inject ettiği için dil değiştiğinde de çalıştırıyoruz
    window.addEventListener('load', removeGoogleTranslateBar);
  `}
</Script>

        </AppContextProvider>
      </body>
    </html>
  );
}
