'use client';

import { assets } from '@/assets/assets';
import { useAppContext } from '@/context/AppContext';
import Image from 'next/image';
import { useEffect } from 'react';

const OrderPlaced = () => {
  const { router, clearCart } = useAppContext();

  useEffect(() => {
    // 🧹 Sepeti temizle — sadece 1 kez
    clearCart();

    // 🕒 5 saniye sonra yönlendirme yap
    const timer = setTimeout(() => {
      router.push('/account/my-orders');
    }, 5000);

    // Temizlik
    return () => clearTimeout(timer);
  }, []); // ❌ router ve clearCart bağımlılıktan çıkarıldı

  return (
    <div className='h-screen flex flex-col justify-center items-center gap-5'>
      <div className="flex justify-center items-center relative">
        <Image
          className="absolute p-5"
          src={assets.checkmark}
          alt="checkmark"
        />
        <div className="animate-spin rounded-full h-24 w-24 border-4 border-t-green-300 border-gray-200"></div>
      </div>
      <div className="text-center text-2xl font-semibold">
        Order Placed Successfully
      </div>
    </div>
  );
};

export default OrderPlaced;
