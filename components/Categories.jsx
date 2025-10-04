"use client";

import Image from "next/image";

export default function Categories() {
  const categories = [
    { title: "NECKLACES & PENDANTS", image: "/assets/1.jfif" },
    { title: "EARRINGS", image: "/assets/2.jfif" },
    { title: "RINGS", image: "/assets/3.jfif" },
    { title: "BRACELETS", image: "/assets/4.jfif" },
    { title: "WATCHES", image: "/assets/5.jfif" },
    { title: "HOME", image: "/assets/6.jfif" },
  ];

  return (
    <section className="w-full bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Başlık */}
        <h2 className="text-3xl sm:text-4xl font-serif text-gray-900 text-center mt-12 mb-12">
          Shop By Category
        </h2>

        {/* Kategoriler Flex Container */}
        <div className="flex gap-4 overflow-x-auto lg:grid lg:grid-cols-6 lg:gap-6 lg:overflow-x-visible">
          {categories.map((cat, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-[40%] sm:w-[30%] md:w-[25%] lg:w-auto
                         relative cursor-pointer text-center group transition-transform duration-300 hover:scale-105"
            >
              {/* Görsel */}
              <div className="relative w-full aspect-square rounded-xl shadow-xl overflow-hidden">
                <Image
                  src={cat.image}
                  alt={cat.title}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Başlık */}
              <h3 className="mt-4 text-base font-semibold tracking-wide text-gray-900 group-hover:text-teal-600">
                {cat.title}
              </h3>

              {/* Alt çizgi */}
              <div className="h-[3px] w-14 mx-auto mt-2 bg-gradient-to-r from-teal-400 via-teal-600 to-teal-400 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
