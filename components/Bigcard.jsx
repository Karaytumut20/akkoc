"use client";

import Image from "next/image";

export default function HighJewelryBanner() {
  return (
    // Ana kapsayıcı: Ekranın neredeyse tamamını kaplar ve beyaz arkaplana sahiptir.
    <section className="w-full min-h-[85vh] md:h-[90vh] bg-white flex justify-center items-center overflow-hidden">
      
      {/* İçerik Kapsayıcı: Maksimum genişliği ayarlar ve yatay hizalamayı sağlar */}
      <div className="max-w-7xl mx-auto h-full grid grid-cols-1 md:grid-cols-2 gap-8 px-4 sm:px-6 lg:px-8">

        {/* SOL SÜTUN: Görsel */}
        <div className="relative w-full h-64 sm:h-80 md:h-full">
          {/* Arkaplan efekti */}
          <div className="absolute inset-0 bg-blue-50/50"></div>
          
          <Image
            src="/assets/bigcard.jpg" // Lütfen kendi görsel yolunu değiştir
            alt="Sea of Wonder High Jewelry Necklace"
            layout="fill"
            objectFit="cover"
            quality={100}
            className="z-10"
          />
        </div>

        {/* SAĞ SÜTUN: Metin İçeriği */}
        <div className="flex flex-col justify-center items-start text-left py-8 md:py-0">
          
          {/* Başlık */}
          <h1 className="text-4xl sm:text-5xl font-serif text-gray-900 mb-6 leading-tight">
            Introducing Our Newest <br /> High Jewelry Creations
          </h1>

          {/* Açıklama Metni */}
          <p className="text-base sm:text-lg text-gray-700 max-w-lg mb-10">
            The fall expression of Blue Book 2025: <strong>Sea of Wonder</strong> is a mesmerizing tribute to the beauty and rhythm of the ocean. The latest masterpieces reinterpret archival creations in breathtaking new designs—each showcasing the world's finest diamonds and extraordinary colored gemstones.
          </p>

          {/* Buton/Link */}
          <a
            href="/collection" // Hedef linki değiştir
            className="text-sm font-semibold tracking-widest uppercase text-gray-900 border-b-2 border-gray-900 pb-1 hover:text-teal-600 hover:border-teal-600 transition duration-200"
          >
            EXPLORE THE COLLECTION
          </a>
        </div>
      </div>
    </section>
  );
}
