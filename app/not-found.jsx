'use client';

import Link from 'next/link';
import { FiAlertCircle, FiArrowLeft } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center bg-[#ECE4DC]">
      {/* Icon + Background Glow */}
      <div className="relative mb-6">
        <div className="absolute -inset-4 bg-orange-200 rounded-full opacity-30 blur-xl animate-pulse"></div>
        <FiAlertCircle className="relative w-24 h-24 text-[#be531c]" />
      </div>

      <h1 className="text-6xl md:text-8xl font-serif font-bold text-gray-800 mb-2">
        404
      </h1>

      <h2 className="text-2xl md:text-3xl font-medium text-gray-700 mb-4">
        Page Not Found
      </h2>

      <p className="text-gray-500 max-w-md mb-10 leading-relaxed">
        Oops! The page you are looking for might have been removed, had its name changed,
        or is temporarily unavailable.
      </p>

      {/* Home Button */}
      <Link
        href="/"
        className="flex items-center justify-center gap-2 px-8 py-3 bg-[#be531c] text-white rounded-full font-semibold hover:bg-[#a04516] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
      >
        <FiArrowLeft />
        Back to Home
      </Link>
    </div>
  );
}
