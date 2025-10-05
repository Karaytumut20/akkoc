"use client";

import Image from "next/image";

export default function HighJewelryBanner() {
  return (
    // Ana kapsayıcı
    <section className="w-full min-h-[85vh] md:h-[90vh] bg-white flex justify-center items-center overflow-hidden">
      
      {/* İçerik Kapsayıcı */}
      <div className="max-w-7xl mx-auto h-full grid grid-cols-1 md:grid-cols-2 gap-8 px-4 sm:px-6 lg:px-8 items-center">

        {/* SOL SÜTUN: Görsel */}
        <div className="relative w-full h-[300px] sm:h-[400px] md:h-[600px] flex justify-center items-center  rounded-xl overflow-hidden">
          <Image
            src="/assets/bigcard.jpg"
            alt="Sea of Wonder High Jewelry Necklace"
            fill
            style={{ objectFit: "contain" }} // 🔹 Resim tam görünür, taşmadan sığar
            quality={100}
            className="transition-all duration-500"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* SAĞ SÜTUN: Metin İçeriği */}
        <div className="flex flex-col justify-center items-start text-left py-8 md:py-0">
          
          {/* Başlık */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-gray-900 mb-6 leading-tight">
            Introducing Our Newest <br /> High Jewelry Creations
          </h1>

          {/* Açıklama Metni */}
          <p className="text-base sm:text-lg text-gray-700 max-w-lg mb-10">
            The fall expression of Blue Book 2025: <strong>Sea of Wonder</strong> is a mesmerizing tribute to the beauty and rhythm of the ocean. The latest masterpieces reinterpret archival creations in breathtaking new designs—each showcasing the world's finest diamonds and extraordinary colored gemstones.
          </p>

          {/* Buton/Link */}
          <a
            href="/collection"
            className="text-sm font-semibold tracking-widest uppercase text-gray-900 border-b-2 border-gray-900 pb-1 hover:text-teal-600 hover:border-teal-600 transition duration-200"
          >
            EXPLORE THE COLLECTION
          </a>
        </div>
      </div>
    </section>
  );
}
