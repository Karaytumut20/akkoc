// app/layout.jsx
import { Outfit } from "next/font/google";
import "./globals.css";
import { AppContextProvider } from "@/context/AppContext";
import { Toaster } from "react-hot-toast";
import LayoutContent from "@/components/LayoutContent";
import Script from "next/script";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500"] });

export const metadata = {
  title: "Nestcome",
  description:
    "Discover luxury homeware, tableware, and decor at Nestcome. Elevate your living spaces with timeless elegance and quality craftsmanship.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* ✅ Schema.org — Google favicon ve logo için */}
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

          {/* ✅ Google Translate bar gizleme scripti */}
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
