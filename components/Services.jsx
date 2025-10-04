"use client";

import Image from "next/image";

export default function Services() {
  const services = [
    {
      title: "Book An Appointment",
      description:
        "We’re happy to assist with in-store or virtual appointments.",
      linkText: "BOOK NOW",
      image: "/assets/services1.jpg",
    },
    {
      title: "Shipping & Returns",
      description: "Complimentary shipping and returns on all orders.",
      linkText: "LEARN MORE",
      image: "/assets/services2.jpg",
    },
    {
      title: "At Your Service",
      description: "Our client care experts are always here to help.",
      linkText: "CONTACT US",
      image: "/assets/services3.jpg",
    },
    {
      title: "Iconic Blue Box",
      description:
        "Your purchase comes wrapped in our Blue Box packaging.",
      linkText: "EXPLORE",
      image: "/assets/services4.jpg",
    },
  ];

  return (
    <section className="w-full py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 text-center">
          {services.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center group transition-all duration-300"
            >
              {/* Görsel */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-44 lg:h-44 mb-3 sm:mb-4 overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-contain group-hover:scale-105 transition-transform duration-300 ease-in-out"
                />
              </div>

              {/* Başlık */}
              <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-serif text-gray-900 mb-1 sm:mb-2 leading-snug">
                {item.title}
              </h3>

              {/* Açıklama */}
              <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-2 sm:mb-3 max-w-[120px] sm:max-w-[180px] md:max-w-[220px] lg:max-w-[260px] mx-auto leading-relaxed">
                {item.description}
              </p>

              {/* Link */}
              <a
                href="#"
                className="text-xs sm:text-sm font-semibold tracking-widest text-gray-900 border-b border-teal-500 hover:text-teal-600 transition-colors duration-200"
              >
                {item.linkText}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
