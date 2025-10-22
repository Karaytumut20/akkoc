// components/TrustBadges.jsx

import React from 'react';
import { FiTruck, FiRefreshCw, FiLock } from "react-icons/fi";

// --- GÜVEN ROZETLERİ BİLEŞENİ ---
const TrustBadges = () => (
  <div className="flex justify-around items-center text-center py-2 rounded-lg mt-9 bg-[#ECE4DC]">
    <div className="flex flex-col items-center gap-1">
      <FiTruck className="w-6 h-6 text-teal-600" />
      <span className="text-xs font-medium text-gray-800">Ücretsiz Kargo</span>
    </div>
    <div className="flex flex-col items-center gap-1">
      <FiRefreshCw className="w-6 h-6 text-teal-600" />
      <span className="text-xs font-medium text-gray-800">Kolay İade</span>
    </div>
    <div className="flex flex-col items-center gap-1">
      <FiLock className="w-6 h-6 text-teal-600" />
      <span className="text-xs font-medium text-gray-800">Güvenli Ödeme</span>
    </div>
  </div>
);

export default TrustBadges;
