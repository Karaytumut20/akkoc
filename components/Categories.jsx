"use client";

import Image from "next/image";

export default function Categories() {
  const categories = [
    {
      title: "NECKLACES & PENDANTS",
      image: "/assets/services4.jpg",
    },
    {
      title: "EARRINGS",
      image: "/assets/services4.jpg",
    },
    {
      title: "RINGS",
      image: "/assets/services4.jpg",
    },
    {
      title: "BRACELETS",
      image: "/assets/services4.jpg",
    },
    {
      title: "WATCHES",
      image: "/assets/services4.jpg",
    },
    {
      title: "HOME",
      image: "/assets/services4.jpg",
    },
  ];

  return (
    <section className="w-full py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Başlık */}
        <h2 className="text-3xl sm:text-4xl font-serif text-gray-900 text-center mb-10">
          Shop By Category
        </h2>

        {/* Kategoriler Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((cat, index) => (
            <div
              key={index}
              className="group cursor-pointer text-center transition-all duration-300"
            >
              {/* Görsel */}
              <div className="relative w-full aspect-square overflow-hidden rounded-lg shadow-md">
                <Image
                  src={cat.image}
                  alt={cat.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Başlık */}
              <h3 className="mt-4 text-sm font-semibold tracking-wide text-gray-800 group-hover:text-teal-600">
                {cat.title}
              </h3>

              {/* Alt çizgi sadece ilk elemana */}
              {index === 0 && (
                <div className="w-10 h-[2px] bg-teal-600 mt-1 mx-auto"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
