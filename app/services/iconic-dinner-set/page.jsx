"use client";

import Image from "next/image";
import Link from "next/link";

export default function IconicDinnerSetPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-20">
      <div className="max-w-4xl text-center">
        <div className="relative w-40 h-40 md:w-56 md:h-56 mx-auto mb-8">
          <Image
            src="/assets/Iconic.png"
            alt="Iconic Dinner Set"
            fill
            className="object-contain"
          />
        </div>

        <h1 className="text-3xl md:text-4xl font-serif text-gray-900 mb-4">
          Iconic Dinner Set
        </h1>
        <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-6">
          Your purchase comes wrapped in our exclusive Dinner Set packaging — a touch of elegance for every occasion. 
          Perfect for gifting or keeping as a timeless treasure.
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
