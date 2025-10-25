// components/seller/Sidebar.jsx

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiPlusSquare, FiList, FiBox, FiMessageSquare, FiImage, FiFilm, FiSettings } from 'react-icons/fi'; // FiSettings eklendi

const SideBar = ({ isOpen, toggleSidebar }) => {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Add Product', path: '/seller/add-product', icon: <FiPlusSquare className="w-6 h-6" /> },
    { name: 'Product List', path: '/seller/product-list', icon: <FiList className="w-6 h-6" /> },
    { name: 'Orders', path: '/seller/orders', icon: <FiBox className="w-6 h-6" /> },
    { name: 'Category Add', path: '/seller/category-add', icon: <FiList className="w-6 h-6" /> },
    { name: 'Reviews', path: '/seller/reviews', icon: <FiMessageSquare className="w-6 h-6" /> },
    { name: 'Carousel Management', path: '/seller/carousel-management', icon: <FiImage className="w-6 h-6" /> },
    { name: 'Hero Video', path: '/seller/hero-video', icon: <FiFilm className="w-6 h-6" /> },
    { name: 'Settings', path: '/seller/settings', icon: <FiSettings className="w-6 h-6" /> }, // Yeni link eklendi
  ];

  return (
    <>
      {/* 🟠 Overlay (mobilde aktif) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* 🟠 Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full bg-white border-r border-gray-200 py-4 z-50
          transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 w-64
        `}
      >
        {/* Header (mobilde görünür) */}
        <div className="md:hidden flex justify-between items-center px-4 pb-4 border-b border-gray-200">
          <h2 className="font-semibold text-lg text-gray-700">Menü</h2>
          <button onClick={toggleSidebar} className="text-2xl font-bold text-gray-700">
            ✕
          </button>
        </div>

        {/* Menü linkleri */}
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link href={item.path} key={item.name} passHref>
              <div
                onClick={toggleSidebar} // Mobilde tıklanınca otomatik kapansın
                className={`flex items-center py-3 px-6 gap-4 my-1 mx-2 rounded-lg cursor-pointer
                  ${isActive
                    ? 'bg-orange-100 text-orange-600 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <div className="flex-shrink-0">{item.icon}</div>
                <p className="text-sm">{item.name}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
};

export default SideBar;