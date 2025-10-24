// components/TrustBadges.jsx

import React from 'react';
import { FiTruck, FiRefreshCw, FiLock } from "react-icons/fi";

const TrustBadges = () => (
  <div className="flex justify-around items-center text-center py-2 rounded-lg mt-9 bg-[#ECE4DC]">
    <div className="flex flex-col items-center gap-1">
      <FiTruck className="w-6 h-6 text-[#be531c]" />
      <span className="text-xs font-medium text-gray-800">Free Shipping</span>
    </div>
    <div className="flex flex-col items-center gap-1">
      <FiRefreshCw className="w-6 h-6 text-[#be531c]" />
      <span className="text-xs font-medium text-gray-800">Easy Returns</span>
    </div>
    <div className="flex flex-col items-center gap-1">
      <FiLock className="w-6 h-6 text-[#be531c]" />
      <span className="text-xs font-medium text-gray-800">Secure Payment</span>
    </div>
  </div>
);

export default TrustBadges;
