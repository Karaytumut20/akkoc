"use client";

import Image from "next/image";

export default function Services() {
  const services = [
    {
      title: "Book An Appointment",
      description:
        "We’re happy to assist with in-store or virtual appointments.",
      linkText: "BOOK NOW",
      image: "/assets/SERVICES1.jpg",
    },
    {
      title: "Shipping & Returns",
      description: "Complimentary shipping and returns on all orders.",
      linkText: "LEARN MORE",
      image: "/assets/SERVICES2.jpg",
    },
    {
      title: "At Your Service",
      description: "Our client care experts are always here to help.",
      linkText: "CONTACT US",
      image: "/assets/SERVICES3.jpg",
    },
    {
      title: "Iconic Blue Box",
      description:
        "Your purchase comes wrapped in our Blue Box packaging.",
      linkText: "EXPLORE",
      image: "/assets/SERVICES4.jpg",
    },
  ];

  return (
    <section className="w-full py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 text-center">
          {services.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center group transition-all duration-300"
            >
              {/* Görsel */}
              <div className="relative w-48 h-48 sm:w-52 sm:h-52 lg:w-56 lg:h-56 mb-6 overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-contain group-hover:scale-105 transition-transform duration-300 ease-in-out"
                />
              </div>

              {/* Başlık */}
              <h3 className="text-lg sm:text-xl font-serif text-gray-900 mb-3 leading-snug">
                {item.title}
              </h3>

              {/* Açıklama */}
              <p className="text-sm sm:text-base text-gray-600 mb-4 max-w-[260px] mx-auto leading-relaxed">
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
