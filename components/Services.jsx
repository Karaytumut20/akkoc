"use client";

import Image from "next/image";
import Link from "next/link";

export default function Services() {
  const services = [
    {
      title: "Shipping & Returns",
      description: "Complimentary shipping and returns on all orders.",
      linkText: "LEARN MORE",
      image: "/assets/Shipping.png",
      href: "/services/shipping-returns",
    },
    {
      title: "At Your Service",
      description: "Our client care experts are always here to help.",
      linkText: "CONTACT US",
      image: "/assets/Service.png",
      href: "/services/at-your-service",
    },
    {
      title: "Iconic Dinner Set",
      description: "Your purchase comes wrapped in our Dinner Set packaging.",
      linkText: "EXPLORE",
      image: "/assets/Iconic.png",
      href: "/services/iconic-dinner-set",
    },
  ];

  return (
    <section className="w-full py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
        {/* Mobilde yatay scroll - Desktopta grid */}
        <div className="flex gap-6 overflow-x-auto pl-4 pr-12 sm:grid sm:grid-cols-3 sm:gap-8 lg:gap-12 sm:overflow-visible scrollbar-hide snap-x snap-mandatory">
          {services.map((item, index) => {
            const isLast = index === services.length - 1; // sadece son eleman

            return (
              <div
                key={index}
                className="flex flex-col items-center justify-start text-center min-w-[80%] sm:min-w-0 flex-shrink-0 group transition-all duration-300 snap-start hover:scale-105 min-h-[300px]"
              >
                {/* Görsel */}
                <div
                  className={`relative mb-4 overflow-hidden flex items-center justify-center 
                    ${
                      isLast
                        ? "w-40 h-40 md:w-48 md:h-48 lg:w-56 lg:h-56" // sadece son görseli büyüttük
                        : "w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48"
                    }`}
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className={`object-contain transition-transform duration-300 ease-in-out
                      ${isLast ? "scale-110 group-hover:scale-125" : "group-hover:scale-110"}`}
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
                <Link
                  href={item.href}
                  className="text-xs sm:text-sm font-semibold tracking-widest text-gray-900 border-b border-[#be531c] hover:text-[#be531c] transition-colors duration-200"
                >
                  {item.linkText}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
