// app/order-placed/page.jsx

'use client'
import { assets } from '@/assets/assets'
import { useAppContext } from '@/context/AppContext'
import Image from 'next/image'
import { useEffect } from 'react'

const OrderPlaced = () => {
  // router ve setCartItems'ı context'ten al
  const { router, setCartItems } = useAppContext();

  useEffect(() => {
    // Bileşen yüklendiğinde sepeti temizle
    setCartItems({}); // Sepeti boş bir obje yaparak temizle
    localStorage.removeItem("cartItems"); // LocalStorage'dan da sil (isteğe bağlı ama önerilir)

    // 5 saniye sonra siparişlerim sayfasına yönlendir
    const timer = setTimeout(() => {
      router.push('/account/my-orders');
    }, 5000);

    // Bileşen kaldırıldığında zamanlayıcıyı temizle (önemli!)
    return () => clearTimeout(timer);

    // Bağımlılık dizisine setCartItems ve router ekle
  }, [setCartItems, router]); // useEffect'in doğru çalışması için bağımlılıkları ekle

  return (
    // ... (Geri kalan JSX kodu aynı) ...
    <div className='h-screen flex flex-col justify-center items-center gap-5'>
      <div className="flex justify-center items-center relative">
        <Image className="absolute p-5" src={assets.checkmark} alt='' />
        <div className="animate-spin rounded-full h-24 w-24 border-4 border-t-green-300 border-gray-200"></div>
      </div>
      <div className="text-center text-2xl font-semibold">Order Placed Successfully</div>
    </div>
  )
}

export default OrderPlaced;