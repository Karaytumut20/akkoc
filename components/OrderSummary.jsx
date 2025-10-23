'use client';
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import React, { useState } from "react";
import toast from 'react-hot-toast';

const OrderSummary = () => {
  const { currency, cartItems, user, updateCartQuantity, getCartCount, getCartAmount, addresses, router } = useAppContext();
  const [selectedAddress, setSelectedAddress] = useState("");
  const [coupon, setCoupon] = useState("");
  const [loading, setLoading] = useState(false);

  // 🆕 Silme onay popup kontrolü
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setPendingDelete(productId);
      setShowConfirmModal(true);
    } else {
      updateCartQuantity(productId, newQuantity);
    }
  };

  const handleDeleteConfirm = () => {
    updateCartQuantity(pendingDelete, 0);
    toast.success("Ürün sepetten kaldırıldı.");
    setPendingDelete(null);
    setShowConfirmModal(false);
  };

  const handleDeleteCancel = () => {
    setPendingDelete(null);
    setShowConfirmModal(false);
  };

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
      const itemsForStripe = Object.values(cartItems).map(item => ({
        product: { 
          name: item.product.name, 
          image_urls: item.product.image_urls 
        },
        quantity: item.quantity,
        price: item.price, 
      }));

      const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/checkout_sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsForStripe, 
          userId: user.id,
          addressId: selectedAddress,
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
      <div className="w-full md:w-[500px] lg:w-[600px] bg-[#ECE4DC] shadow-2xl rounded-3xl p-6 md:p-8 mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-3">Checkout</h2>

        {/* 🛒 Sepet ürünleri */}
        <div className="space-y-5 mb-6 max-h-[60vh] md:max-h-[500px] overflow-y-auto">
          {Object.keys(cartItems).length === 0 ? (
            <p className="text-gray-500 text-center py-10">Sepetiniz boş.</p>
          ) : (
            Object.values(cartItems).map((item, idx) => {
              const price = Number(item.price) || 0; 
              const quantity = Number(item.quantity) || 0;
              const itemTotal = price * quantity;

              return (
                <div
                  key={item.product.id || idx}
                  className="flex items-center justify-between bg-[#FFFFFF] p-3 md:p-4 rounded-2xl transition border border-[#f3f3f3]"
                >
                  {/* Ürün görseli */}
                  <div className="w-16 h-16 md:w-20 md:h-20 relative rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={item.product.image_urls?.[0] || "/assets/placeholder.jpg"}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Ürün adı ve fiyat */}
                  <div className="flex-1 px-3 md:px-4">
                    <p className="font-semibold text-gray-900 text-sm md:text-base">
                      {item.product.name}
                    </p>
                    <p className="text-xs md:text-sm text-gray-600 flex items-center gap-1">
                      <span className="text-sm">$</span>{price.toFixed(2)}
                    </p>
                  </div>

                  {/* Miktar kontrolü */}
                  <div className="flex items-center bg-[#F8F8F8] border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                      className="px-2 py-1 md:px-3 md:py-1 hover:bg-gray-100 transition text-gray-800"
                    >
                      -
                    </button>
                    <span className="px-2 py-1 md:px-3 md:py-1 text-gray-800 font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                      className="px-2 py-1 md:px-3 md:py-1 hover:bg-gray-100 transition text-gray-800"
                    >
                      +
                    </button>
                  </div>

                  {/* Toplam */}
                  <div className="ml-2 md:ml-4 font-semibold text-gray-900 text-sm md:text-base flex items-center gap-1">
                    <span>$</span>{itemTotal.toFixed(2)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 📍 Adres Seçimi */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-gray-700 font-medium">Select Address</label>
            <button onClick={() => router.push('/account/addresses')} className="text-sm text-[#be531c] hover:underline">Adres Ekle/Düzenle</button>
          </div>
          <select
            value={selectedAddress}
            onChange={(e) => setSelectedAddress(e.target.value)}
            className="w-full border rounded-lg p-3 bg-[#FFFFFF] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#be531c]"
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

        {/* 🎟️ Kupon */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">Coupon Code</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Enter code"
              className="flex-1 border rounded-lg p-3 bg-[#FFFFFF] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#be531c]"
            />
            <button className="bg-[#be531c] text-white px-4 rounded-lg hover:bg-[#a64919] transition font-semibold">
              Apply
            </button>
          </div>
        </div>

        {/* 💰 Toplam */}
        <div className="mt-6 border-t pt-4 space-y-3">
          <div className="flex justify-between text-gray-700 font-medium">
            <span>Items ({getCartCount()})</span>
            <span>${getCartAmount().toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-900 font-bold text-xl">
            <span>Total</span>
            <span>${getCartAmount().toFixed(2)}</span>
          </div>
        </div>

        {/* 🧾 Ödeme Butonu */}
        <button
          onClick={handlePlaceOrder}
          disabled={getCartCount() === 0 || !selectedAddress || loading}
          className="w-full mt-6 py-4 bg-gradient-to-r from-[#be531c] to-[#a64919] text-white font-semibold rounded-2xl hover:from-[#a64919] hover:to-[#8e3e15] transition shadow-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Yönlendiriliyor...' : 'Şimdi Öde'}
        </button>
      </div>

      {/* 🆕 Silme Onay Modalı */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/40">
          <div className="bg-[#ECE4DC] rounded-2xl shadow-2xl p-6 w-[90%] max-w-sm text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Ürünü Silmek Üzeresiniz</h3>
            <p className="text-gray-600 mb-6">Bu ürünü sepetten kaldırmak istediğinize emin misiniz?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 transition font-medium"
              >
                Vazgeç
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-lg bg-[#be531c] text-white hover:bg-[#a64919] transition font-medium"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderSummary;
