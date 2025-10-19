'use client';
import React, { useState } from 'react';
import { assets } from '../../assets/assets';
import Image from 'next/image';
import { useAppContext } from '@/context/AppContext';
import SideBar from '@/components/seller/Sidebar';

const Navbar = () => {
  const { router, signOut } = useAppContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <>
      <SideBar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="fixed top-0 left-0 right-0 flex items-center justify-between md:justify-center px-4 md:px-8 py-3 border-b bg-white shadow-sm z-40 mb-4">
        {/* Sol taraf - Hamburger menü sadece mobilde */}
        <div className="flex items-center gap-4 md:absolute md:left-8">
          <button
            onClick={toggleSidebar}
            className="md:hidden text-2xl font-bold text-gray-800"
          >
            ☰
          </button>
        </div>

        {/* Orta - Logo */}
        <div className="flex justify-center">
          <Image
            onClick={() => router.push('/')}
            className="w-28 lg:w-32 cursor-pointer"
            src={assets.logo}
            alt="logo"
          />
        </div>

        {/* Sağ taraf - Sadece Logout butonu */}
        <div className="flex items-center gap-3 sm:gap-5 md:absolute md:right-8">
          <button
            onClick={signOut}
            className="bg-red-600 text-white px-5 py-2 sm:px-7 sm:py-2 rounded-full text-xs sm:text-sm hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Navbar;
