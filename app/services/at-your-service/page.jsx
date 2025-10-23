"use client";

import Image from "next/image";
import Link from "next/link";

export default function AtYourServicePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-20">
      <div className="max-w-4xl text-center">
        <div className="relative w-40 h-40 md:w-56 md:h-56 mx-auto mb-8">
          <Image
            src="/assets/Service.png"
            alt="At Your Service"
            fill
            className="object-contain"
          />
        </div>

        <h1 className="text-3xl md:text-4xl font-serif text-gray-900 mb-4">
          At Your Service
        </h1>
        <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-6">
          Our client care experts are always here to help. Whether it’s product information, styling advice, or post-purchase care, 
          we are committed to offering the best service.
        </p>

        <div className="mt-6 flex justify-center">
          <Link
            href="/"
            className="px-8 py-3 rounded-full bg-[#BE531C] text-white text-sm font-semibold hover:bg-[#9e4518] transition-all duration-300 shadow-md"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
