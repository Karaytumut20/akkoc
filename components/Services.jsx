"use client";

import Image from "next/image";

export default function Services() {
  const services = [
    {
      title: "Shipping & Returns",
      description: "Complimentary shipping and returns on all orders.",
      linkText: "LEARN MORE",
      image: "/assets/shipping.png",
    },
    {
      title: "At Your Service",
      description: "Our client care experts are always here to help.",
      linkText: "CONTACT US",
      image: "/assets/service.png",
    },
    {
      title: "Iconic Dinner Set",
      description: "Your purchase comes wrapped in our Dinner Set packaging.",
      linkText: "EXPLORE",
      image: "/assets/Iconic.png",
    },
  ];

  return (
    <section className="w-full py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
        <div className="flex gap-6 overflow-x-auto pl-4 pr-12 sm:grid sm:grid-cols-3 sm:gap-8 lg:gap-12 sm:overflow-visible scrollbar-hide snap-x snap-mandatory">
          {services.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center justify-center text-center min-w-[80%] sm:min-w-0 flex-shrink-0 group transition-all duration-300 snap-start"
            >
              {/* Görsel */}
              <div
                className={`relative mb-4 overflow-hidden flex items-center justify-center
                ${
                  index === 2
                    ? "w-44 h-44 md:w-52 md:h-52 lg:w-60 lg:h-60" // büyütülmüş hali
                    : "w-28 h-28 md:w-36 md:h-36 lg:w-44 lg:h-44"
                }`}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-contain group-hover:scale-105 transition-transform duration-300 ease-in-out"
                />
              </div>

              {/* Başlık */}
              <h3 className="text-base md:text-lg lg:text-xl font-serif text-gray-900 mb-2 leading-snug">
                {item.title}
              </h3>

              {/* Açıklama */}
              <p className="text-sm md:text-base text-gray-600 mb-3 max-w-[260px] leading-relaxed">
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
