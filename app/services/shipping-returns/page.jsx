"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function InfoSection() {
  return (
    <div className="min-h-screen bg-[#ECE4DC] px-4 py-14 flex flex-col items-center">
<div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-3 gap-12 text-center items-start mt-0 md:mt-10">
        {/* ================= SHIPPING & RETURNS ================= */}
        <div className="flex flex-col items-center mt-0 md:mt-4">
          <div className="relative w-28 h-28 md:w-36 md:h-36 mb-4 flex-shrink-0">
            <Image
              src="/assets/Shipping.png"
              alt="Shipping & Returns"
              fill
              priority
              className="object-contain"
            />
          </div>
          <h2 className="text-xl md:text-2xl font-serif text-gray-900 mb-2">
            Shipping & Returns
          </h2>
          <p className="text-gray-600 text-sm md:text-base max-w-xs mb-4">
            Enjoy complimentary delivery and effortless returns on every order.
            We ensure your purchase reaches you with care and elegance.
          </p>
          <ul className="text-gray-600 text-sm md:text-base space-y-1">
            <li>🚚 Free worldwide shipping</li>
            <li>🕒 Fast & reliable delivery</li>
            <li>💳 Easy return process</li>
          </ul>
        </div>

        {/* ================= AT YOUR SERVICE ================= */}
        <div className="flex flex-col items-center mt-0 md:mt-4">
          <div className="relative w-28 h-28 md:w-36 md:h-36 mb-4 flex-shrink-0">
            <Image
              src="/assets/Service.png"
              alt="At Your Service"
              fill
              priority
              className="object-contain"
            />
          </div>
          <h2 className="text-xl md:text-2xl font-serif text-gray-900 mb-2">
            At Your Service
          </h2>
          <p className="text-gray-600 text-sm md:text-base max-w-xs mb-4">
            Our dedicated client care team is here to provide personalized
            assistance, ensuring every detail of your experience feels exceptional.
          </p>
          <ul className="text-gray-600 text-sm md:text-base space-y-1">
            <li>🤝 Personalized support</li>
            <li>📞 24/7 customer care</li>
            <li>✨ Luxury shopping experience</li>
          </ul>
        </div>

        {/* ================= ICONIC DINNER SET ================= */}
        <div className="flex flex-col items-center mt-0 md:mt-4">
          <div className="relative w-36 h-36 md:w-44 md:h-44 mb-4 flex-shrink-0">
            <Image
              src="/assets/Iconic.png"
              alt="Iconic Dinner Set"
              fill
              priority
              className="object-contain"
            />
          </div>
          <h2 className="text-xl md:text-2xl font-serif text-gray-900 mb-2">
            Iconic Dinner Set
          </h2>
          <p className="text-gray-600 text-sm md:text-base max-w-xs mb-4">
            Every piece is presented in our signature dinner set packaging,
            making your unboxing moment as timeless as the product itself.
          </p>
          <ul className="text-gray-600 text-sm md:text-base space-y-1">
            <li>🎁 Elegant signature packaging</li>
            <li>🍽️ Perfect for gifting</li>
            <li>💫 Timeless presentation</li>
          </ul>
        </div>
      </div>

      {/* ================= BACK TO HOME ================= */}
      <div className="mt-12 text-center">
        <Link
          href="/"
          className="inline-block px-8 py-3 rounded-full bg-[#BE531C] text-white text-sm font-semibold hover:bg-[#9e4518] transition-all duration-300 shadow-md"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
