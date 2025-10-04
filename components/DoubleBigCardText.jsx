"use client";

import Image from "next/image";

export default function FeaturedCollections() {
  const collections = [
    {
      title: "The Bird on a Rock Collection",
      image: "/assets/kolyetext.jpg", // Lütfen bu yolu kendi görsel yolunuzla değiştirin.
      alt: "Bird on a Rock kolyeden detay",
      description:
        "Chief Artistic Officer Nathalie Vardaelle introduces a new chapter in fine jewelry with designs that reimagine Jean Schlumberger’s emblematic creation from 1965.",
      linkText: "EXPLORE THE STORY",
      linkHref: "/collection/bird-on-a-rock",
    },
    {
      title: "The Sixteen Stone Collection",
      image: "/assets/kolyetext2.jpg", // Lütfen bu yolu kendi görsel yolunuzla değiştirin.
      alt: "Yüzük, küpe ve bilezik takan model",
      description:
        "Sixteen Stone is a feat of ingenuity conceived by Jean Schlumberger in 1959. Each design showcases Tiffany’s extraordinary diamonds and unparalleled artistry.",
      linkText: "SHOP THE COLLECTION",
      linkHref: "/collection/sixteen-stone",
    },
  ];

  return (
    <section className="w-full bg-white py-12 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* İki Sütunlu Grid Düzeni */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          
          {collections.map((item, index) => (
            <div key={index} className="text-center group">
              
              {/* 1. Görsel Alanı */}
              <div className="relative w-full aspect-square overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw" 
                  className="object-cover transition duration-500 ease-in-out group-hover:scale-[1.01]"
                  priority={index === 0} 
                />
              </div>

              {/* 2. Metin Alanı (Görseldeki yapıyı taklit eder) */}
              <div className="mt-8 px-4"> 
                
                {/* Başlık */}
                <h3 className="text-2xl font-serif text-gray-900 mb-4">
                  {item.title}
                </h3>

                {/* Açıklama Metni (Daraltılmış genişlikte) */}
                <p className="text-sm text-gray-700 max-w-sm mx-auto mb-6 leading-relaxed">
                  {item.description}
                </p>

                {/* Buton/Link */}
                <a
                  href={item.linkHref}
                  className="text-xs font-semibold tracking-widest uppercase text-gray-900 border-b border-gray-900 pb-1 hover:text-teal-600 hover:border-teal-600 transition duration-150"
                >
                  {item.linkText}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}