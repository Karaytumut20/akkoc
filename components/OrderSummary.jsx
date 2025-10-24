// components/OrderSummary.jsx

'use client';
// CALIFORNIA_TAX_RATE import edildi (Vergi hesaplaması için gerekli)
import { useAppContext, CALIFORNIA_TAX_RATE } from "@/context/AppContext";
import Image from "next/image";
import React, { useState } from "react";
import toast from 'react-hot-toast';

const OrderSummary = () => {
  const { currency, cartItems, user, updateCartQuantity, getCartCount, getCartAmount, setCartItems, addresses, router } = useAppContext();
  const [selectedAddress, setSelectedAddress] = useState("");
  const [coupon, setCoupon] = useState("");
  const [loading, setLoading] = useState(false);

  // Vergi hesaplamasını al (Context'ten geliyor)
  const { subtotal, taxAmount, totalAmount } = getCartAmount(); // totalAmount burada

  // Silme onay popup kontrolü
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const handleQuantityChange = (productId, newQuantity) => {
    // Miktar 0'a düşerse onay popup'ını göster
    if (newQuantity <= 0) {
      setPendingDelete(productId);
      setShowConfirmModal(true);
    } else {
      updateCartQuantity(productId, newQuantity);
    }
  };

  const handleDeleteConfirm = () => {
    // Onay sonrası silme işlemi
    const updatedCart = { ...cartItems };
    delete updatedCart[pendingDelete];
    setCartItems(updatedCart);
    setPendingDelete(null);
    setShowConfirmModal(false);
    toast.success("Ürün sepetten kaldırıldı 🛒");
  };

  const handleDeleteCancel = () => {
    // İptal işlemi
    setPendingDelete(null);
    setShowConfirmModal(false);
  };

  // ✅ handlePlaceOrder güncellendi
  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error("Ödeme yapmak için lütfen giriş yapın.");
      router.push('/auth');
      return;
    }
    if (!selectedAddress) {
      toast.error("Lütfen bir teslimat adresi seçin!");
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/checkout_sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: Object.values(cartItems), // Webhook'un ürünleri işlemesi için hala gönderiyoruz
          userId: user.id,
          addressId: selectedAddress,
          totalAmount: totalAmount // ✅ Vergi dahil toplam tutarı API'ye gönderiyoruz
        }),
      });

      const { url, error } = await response.json();
      if (error) throw new Error(error.message);

      if (url) {
        window.location.href = url;
      } else {
        toast.error('Ödeme sayfasına yönlendirilemedi.');
      }
    } catch (error) {
      toast.error(`Bir hata oluştu: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Onay Popup */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center relative">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Emin misiniz?</h2>
            <p className="text-gray-600 mb-6">Bu ürünü sepetten kaldırmak istediğinize emin misiniz?</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-[#be531c] text-white rounded-lg hover:bg-[#a64919] transition font-semibold"
              >
                Evet
              </button>
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ana Bileşen */}
      <div className="w-full md:w-[500px] lg:w-[600px] bg-white shadow-2xl rounded-3xl p-6 md:p-8 mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-3">Checkout</h2>

        {/* Sepet Ürünleri Listesi */}
        <div className="space-y-5 mb-6 max-h-[60vh] md:max-h-[500px] overflow-y-auto">
          {Object.keys(cartItems).length === 0 ? (
            <p className="text-gray-500 text-center py-10">Sepetiniz boş.</p>
          ) : (
            Object.values(cartItems).map((item, idx) => (
              <div
                key={item.product.id || idx}
                className="flex items-center justify-between bg-[#ffffff] p-3 md:p-4 rounded-2xl hover:shadow-md transition"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 relative rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={item.product.image_urls?.[0] || "/assets/placeholder.jpg"}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 px-3 md:px-4">
                  <p className="font-semibold text-gray-800 text-sm md:text-base">{item.product.name}</p>
                  <p className="text-xs md:text-sm text-gray-500">{currency}{item.product.price}</p>
                </div>
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                    className="px-2 py-1 md:px-3 md:py-1 bg-gray-200 hover:bg-gray-300 transition"
                  >-</button>
                  <span className="px-2 py-1 md:px-3 md:py-1 text-gray-700">{item.quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                    className="px-2 py-1 md:px-3 md:py-1 bg-gray-200 hover:bg-gray-300 transition"
                  >+</button>
                </div>
                <div className="ml-2 md:ml-4 font-semibold text-gray-900 text-sm md:text-base">
                  {currency}{(item.product.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Adres Seçimi */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-gray-700 font-medium">Select Address</label>
            <button onClick={() => router.push('/account/addresses')} className="text-sm text-[#be531c] hover:underline">Adres Ekle/Düzenle</button>
          </div>
          <select
            value={selectedAddress}
            onChange={(e) => setSelectedAddress(e.target.value)}
            className="w-full border rounded-lg p-3 bg-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#be531c]"
          >
            <option value="" disabled>-- Adres seçin --</option>
            {addresses.length > 0 ? (
              addresses.map(addr => (
                <option key={addr.id} value={addr.id}>{`${addr.full_name} - ${addr.area}, ${addr.city}`}</option>
              ))
            ) : (
              <option disabled>Kayıtlı adresiniz bulunmuyor.</option>
            )}
          </select>
        </div>

        {/* Kupon Kodu */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">Coupon Code</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Enter code"
              className="flex-1 border rounded-lg p-3 bg-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#be531c]"
            />
            <button className="bg-[#be531c] text-white px-4 rounded-lg hover:bg-[#a64919] transition font-semibold">
              Apply
            </button>
          </div>
        </div>

        {/* Özet Kısmı */}
        <div className="mt-8 border-t pt-5 space-y-3">
            <div className="flex justify-between text-sm text-gray-500">
            <span>Items ({getCartCount()})</span>
            </div>
            <div className="flex justify-between text-gray-700">
            <span>Subtotal</span>
            <span>{currency}{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
            <span>Tax ({(CALIFORNIA_TAX_RATE * 100).toFixed(2)}%)</span>
            <span>{currency}{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-900 font-bold text-xl border-t pt-3 mt-3">
            <span>Total</span>
            <span>{currency}{totalAmount.toFixed(2)}</span>
            </div>
        </div>

        {/* Ödeme Butonu */}
        <button
          onClick={handlePlaceOrder}
          disabled={getCartCount() === 0 || !selectedAddress || loading}
          className="w-full mt-6 py-4 bg-gradient-to-r from-[#be531c] to-[#a64919] text-white font-semibold rounded-2xl hover:from-[#a64919] hover:to-[#8e3b13] transition shadow-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Yönlendiriliyor...' : 'Şimdi Öde'}
        </button>
      </div>
    </>
  );
};

export default OrderSummary;