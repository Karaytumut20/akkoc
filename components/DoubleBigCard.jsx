"use client";

import Image from "next/image";

export default function FeaturedCategories() {
  const featuredItems = [
    {
      title: "Silver Jewelry",
      image: "/assets/kolye.jfif", // Lütfen bu yolu kendi görsel yolunuzla değiştirin.
      alt: "Gümüş Zincir Bileklik",
    },
    {
      title: "Elsa Peretti",
      image: "/assets/kolye2.jfif", // Lütfen bu yolu kendi görsel yolunuzla değiştirin.
      alt: "Elsa Peretti Kolye ve Yüzük",
    },
  ];

  return (
    <section className="w-full bg-white py-12 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* İki Sütunlu Grid Düzeni */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          
          {featuredItems.map((item, index) => (
            <div key={index} className="text-center group">
              
              {/* Görsel Alanı */}
              <div className="relative w-full aspect-[4/3] sm:aspect-[3/4] overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw" // Responsive görsel boyutları
                  className="object-cover transition duration-500 ease-in-out group-hover:scale-[1.01]"
                  priority={index === 0} // İlk görseli öncelikli yükle
                />
              </div>

              {/* Metin Alanı */}
              <div className="mt-6">
                
                {/* Başlık */}
                <h3 className="text-xl font-serif text-gray-900 mb-4">
                  {item.title}
                </h3>

                {/* Buton/Link */}
                <a
                  href={`/shop/${item.title.toLowerCase().replace(/\s/g, '-')}`} // Dinamik link
                  className="text-xs font-semibold tracking-widest uppercase text-gray-900 border-b border-gray-900 pb-1 hover:text-teal-600 hover:border-teal-600 transition duration-150"
                >
                  SHOP NOW
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}