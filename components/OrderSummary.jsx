// components/OrderSummary.jsx

'use client';
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { supabase } from "@/lib/supabaseClient";

// CALIFORNIA_TAX_RATE sabiti burada tanımlı
const CALIFORNIA_TAX_RATE = 0.0825;

const OrderSummary = () => {
  const { currency, cartItems, user, updateCartQuantity, getCartCount, /* getCartAmount KULLANILMAYACAK */ setCartItems, addresses, router } = useAppContext();
  // ... (diğer state tanımlamaları aynı kalır: selectedAddress, couponCodeInput, appliedCoupon, loading, couponLoading, showConfirmModal, pendingDelete) ...
  const [selectedAddress, setSelectedAddress] = useState("");
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discount_type, discount_value, max_discount_amount }
  const [loading, setLoading] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const [totals, setTotals] = useState({ subtotal: 0, taxAmount: 0, discountAmount: 0, totalAmount: 0 });

  // === DÜZELTİLMİŞ useEffect ===
  useEffect(() => {
    // Toplamları hesaplayan fonksiyon (setAppliedCoupon çağrısı kaldırıldı)
    const calculateTotals = () => {
        // 1. Ara Toplamı Hesapla
        const subtotalRaw = Object.values(cartItems).reduce((sum, item) => {
            const price = item?.product?.price ?? 0;
            const quantity = item?.quantity ?? 0;
            return sum + (price * quantity);
        }, 0);

        // 2. İndirimi Hesapla (eğer kupon varsa)
        let calculatedDiscountAmount = 0;
        if (appliedCoupon) {
            if (appliedCoupon.discount_type === 'percentage') {
                calculatedDiscountAmount = subtotalRaw * (appliedCoupon.discount_value / 100);
                // Max indirim kontrolü
                if (appliedCoupon.max_discount_amount && calculatedDiscountAmount > appliedCoupon.max_discount_amount) {
                    calculatedDiscountAmount = appliedCoupon.max_discount_amount;
                }
            } else if (appliedCoupon.discount_type === 'fixed_amount') {
                calculatedDiscountAmount = appliedCoupon.discount_value;
            }
            // İndirim alt toplamdan büyük olamaz
            calculatedDiscountAmount = Math.min(calculatedDiscountAmount, subtotalRaw);
        }

        // 3. Vergiyi Hesapla (indirimli tutar üzerinden)
        const discountedSubtotal = subtotalRaw - calculatedDiscountAmount;
        const calculatedTaxAmount = discountedSubtotal * CALIFORNIA_TAX_RATE;

        // 4. Nihai Toplamı Hesapla
        const calculatedTotalAmount = discountedSubtotal + calculatedTaxAmount;

        // 5. State'i Güncelle
        setTotals({
            subtotal: subtotalRaw,
            taxAmount: calculatedTaxAmount,
            discountAmount: calculatedDiscountAmount, // Hesaplanan indirimi totals state'ine kaydet
            totalAmount: calculatedTotalAmount,
        });

        // ❌ BURADAN KALDIRILDI: setAppliedCoupon çağrısı yok
    };

    calculateTotals(); // Hesaplamayı çalıştır

  }, [cartItems, appliedCoupon]); // Bağımlılıklar doğru: Sepet veya kupon değiştiğinde hesaplama tekrar yapılır.
  // ============================

  // handleApplyCoupon fonksiyonu (Artık sadece kupon bilgilerini set eder, discountAmount'ı değil)
  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) return toast.error("Please enter a coupon code.");
    setCouponLoading(true);
    const code = couponCodeInput.trim().toUpperCase();

    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code)
        .single();

      // ... (diğer kupon doğrulama kontrolleri aynı kalır) ...
       if (error || !coupon) {
        throw new Error("Invalid coupon code.");
      }
      if (!coupon.is_active) {
          throw new Error("This coupon is no longer active.");
      }
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
          throw new Error("This coupon has expired.");
      }
      if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
          throw new Error("This coupon has reached its usage limit.");
      }
      // Kuponu uygulamadan ÖNCEKİ alt toplamı almak için geçici hesaplama
      const currentSubtotal = Object.values(cartItems).reduce((sum, item) => (item?.product?.price ?? 0) * (item?.quantity ?? 0) + sum, 0);
      if (coupon.min_purchase_amount && currentSubtotal < coupon.min_purchase_amount) {
          throw new Error(`Minimum purchase amount of ${currency}${coupon.min_purchase_amount.toFixed(2)} required.`);
      }


      // SADECE kupon bilgilerini state'e ata, useEffect indirimi hesaplayacak
      setAppliedCoupon({
          code: coupon.code,
          discount_type: coupon.discount_type,
          discount_value: coupon.discount_value,
          max_discount_amount: coupon.max_discount_amount,
      });
      toast.success(`Coupon "${coupon.code}" applied successfully!`);
      setCouponCodeInput("");

    } catch (err) {
      toast.error(err.message);
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };


  // handleRemoveCoupon, handleQuantityChange, handleDeleteConfirm, handleDeleteCancel, handlePlaceOrder aynı kalır...
   const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    toast.success("Coupon removed.");
  };
   const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setPendingDelete(productId);
      setShowConfirmModal(true);
    } else {
      updateCartQuantity(productId, newQuantity);
    }
  };
  const handleDeleteConfirm = () => {
    if (pendingDelete) {
        const updatedCart = { ...cartItems };
        delete updatedCart[pendingDelete];
        setCartItems(updatedCart);
        toast.success("Product removed from cart 🛒");
    }
    setPendingDelete(null);
    setShowConfirmModal(false);
  };
  const handleDeleteCancel = () => {
    setPendingDelete(null);
    setShowConfirmModal(false);
  };
  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error("Please log in to proceed with payment.");
      router.push('/auth');
      return;
    }
    if (!selectedAddress) {
      toast.error("Please select a delivery address!");
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/checkout_sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: Object.values(cartItems),
          userId: user.id,
          addressId: selectedAddress,
          totalAmount: totals.totalAmount, // State'deki toplamı kullan
          couponCode: appliedCoupon ? appliedCoupon.code : null,
        }),
      });

      const { url, error } = await response.json();
      if (error) throw new Error(error.message);

      if (url) {
        window.location.href = url;
      } else {
        toast.error('Could not redirect to payment page.');
      }
    } catch (error) {
      toast.error(`An error occurred: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };


  // JSX kısmı
  return (
    <>
      {/* Delete Confirmation Modal (Aynı kalır) */}
      {showConfirmModal && (
         <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center relative">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Are you sure?</h2>
            <p className="text-gray-600 mb-6">Do you want to remove this item from your cart?</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-[#be531c] text-white rounded-lg hover:bg-[#a64919] transition font-semibold"
              >
                Yes
              </button>
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full md:w-[500px] lg:w-[600px] bg-white shadow-2xl rounded-3xl p-6 md:p-8 mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-3">Checkout</h2>

        {/* Cart Items List (Aynı kalır) */}
        <div className="space-y-5 mb-6 max-h-[60vh] md:max-h-[500px] overflow-y-auto pr-2">
            {Object.keys(cartItems).length === 0 ? (
                <p className="text-gray-500 text-center py-10">Your cart is empty.</p>
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
                    <p className="text-xs md:text-sm text-gray-500">{currency}{item.product.price.toFixed(2)}</p>
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


        {/* Address Selection (Aynı kalır) */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-gray-700 font-medium">Select Address</label>
            <button onClick={() => router.push('/account/addresses')} className="text-sm text-[#be531c] hover:underline">Add/Edit Address</button>
          </div>
          <select
            value={selectedAddress}
            onChange={(e) => setSelectedAddress(e.target.value)}
            className="w-full border rounded-lg p-3 bg-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#be531c]"
          >
            <option value="" disabled>-- Select an address --</option>
            {addresses.length > 0 ? (
              addresses.map(addr => (
                <option key={addr.id} value={addr.id}>{`${addr.full_name} - ${addr.area}, ${addr.city}`}</option>
              ))
            ) : (
              <option disabled>No saved addresses found.</option>
            )}
          </select>
        </div>

        {/* Coupon Code Input (Aynı kalır) */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">Coupon Code</label>
          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-green-100 p-3 rounded-lg border border-green-200">
               {/* 🔥 DÜZELTME: totals.discountAmount kullan */}
              <p className="text-green-700 font-semibold">
                Code applied: <span className="font-bold">{appliedCoupon.code}</span> (-{currency}{totals.discountAmount.toFixed(2)})
              </p>
              <button onClick={handleRemoveCoupon} className="text-red-500 hover:text-red-700 text-sm font-semibold">
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCodeInput}
                onChange={(e) => setCouponCodeInput(e.target.value)}
                placeholder="Enter code"
                className="flex-1 border rounded-lg p-3 bg-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#be531c]"
                disabled={couponLoading}
              />
              <button
                onClick={handleApplyCoupon}
                disabled={couponLoading}
                className="bg-[#be531c] text-white px-4 rounded-lg hover:bg-[#a64919] transition font-semibold disabled:opacity-50"
              >
                {couponLoading ? '...' : 'Apply'}
              </button>
            </div>
          )}
        </div>

        {/* Order Totals Summary (Aynı kalır, state'den beslenir) */}
        <div className="mt-8 border-t pt-5 space-y-3">
            <div className="flex justify-between text-sm text-gray-500">
                <span>Items ({getCartCount()})</span>
            </div>
            <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span>{currency}{totals.subtotal.toFixed(2)}</span>
            </div>
            {totals.discountAmount > 0 && (
                 <div className="flex justify-between text-green-600 font-medium">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span>-{currency}{totals.discountAmount.toFixed(2)}</span>
                 </div>
            )}
            <div className="flex justify-between text-gray-700">
                <span>Tax ({(CALIFORNIA_TAX_RATE * 100).toFixed(2)}%)</span>
                <span>{currency}{totals.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-900 font-bold text-xl border-t pt-3 mt-3">
                <span>Total</span>
                <span>{currency}{totals.totalAmount.toFixed(2)}</span>
            </div>
        </div>

        {/* Place Order Button (Aynı kalır) */}
        <button
          onClick={handlePlaceOrder}
          disabled={getCartCount() === 0 || !selectedAddress || loading}
          className="w-full mt-6 py-4 bg-gradient-to-r from-[#be531c] to-[#a64919] text-white font-semibold rounded-2xl hover:from-[#a64919] hover:to-[#8e3b13] transition shadow-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Redirecting...' : 'Proceed to Payment'}
        </button>
      </div>
    </>
  );
};

export default OrderSummary;