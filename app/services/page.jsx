"use client";

import Image from "next/image";
import Link from "next/link";

export default function ShippingReturnsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-20">
      <div className="max-w-4xl text-center">
        <div className="relative w-40 h-40 md:w-56 md:h-56 mx-auto mb-8">
          <Image
            src="/assets/Shipping.png"
            alt="Shipping & Returns"
            fill
            className="object-contain"
          />
        </div>

        <h1 className="text-3xl md:text-4xl font-serif text-gray-900 mb-4">
          Shipping & Returns
        </h1>
        <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-6">
          We offer complimentary shipping and returns on all orders. Your satisfaction is our priority. 
          If you’re not happy with your purchase, returning it is simple and free.
        </p>

        <div className="mt-6 flex justify-center">
          <Link
            href="/"
            className="px-8 py-3 rounded-full bg-[#be531c] text-white text-sm font-semibold hover:bg-[#be531c] transition-all duration-300"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
