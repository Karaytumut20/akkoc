'use client';
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import React, { useState } from "react";
import toast from 'react-hot-toast';
import { FaDollarSign } from "react-icons/fa";
import Swal from 'sweetalert2'; // ✅ Modern popup

const OrderSummary = () => {
  const { 
    currency, 
    cartItems, 
    user, 
    updateCartQuantity, 
    getCartCount, 
    getCartAmount, 
    setCartItems, 
    addresses, 
    router 
  } = useAppContext();

  const [selectedAddress, setSelectedAddress] = useState(""); 
  const [coupon, setCoupon] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Modern Popup ile ürün silme
  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity <= 0) {
      const result = await Swal.fire({
        title: 'Remove Item?',
        text: "Are you sure you want to remove this item from your cart?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#0d9488', // turkuaz
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, remove it',
        cancelButtonText: 'Cancel',
        background: '#fff',
        customClass: {
          popup: 'rounded-2xl shadow-2xl',
          title: 'text-gray-800 font-semibold',
          htmlContainer: 'text-gray-600',
        }
      });

      if (!result.isConfirmed) return;

      const updatedCart = { ...cartItems };
      delete updatedCart[productId];
      setCartItems(updatedCart);
      toast.success("Item removed from cart");
    } else {
      updateCartQuantity(productId, newQuantity);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error("Please log in to complete the payment.");
      router.push('/auth');
      return;
    }

    if (!selectedAddress) {
      toast.error("Please select an address.");
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
        }),
      });

      const { url, error } = await response.json();

      if (error) throw new Error(error.message);
      if (url) {
        window.location.href = url;
      } else {
        toast.error('Failed to redirect to payment page.');
      }
    } catch (error) {
      toast.error(`An error occurred: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFF0] flex items-center justify-center py-8 px-4">
      <div className="w-full md:w-[500px] lg:w-[600px] bg-white shadow-2xl rounded-3xl p-6 md:p-8 mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-3 text-center">
          Checkout
        </h2>

        {/* 🛒 Products */}
        <div className="space-y-5 mb-6 max-h-[60vh] md:max-h-[500px] overflow-y-auto">
          {Object.keys(cartItems).length === 0 ? (
            <p className="text-gray-500 text-center py-10">Your cart is empty.</p>
          ) : (
            Object.values(cartItems).map((item, idx) => (
              <div
                key={item.product.id || idx}
                className="flex items-center justify-between bg-gray-50 p-3 md:p-4 rounded-2xl hover:shadow-lg transition"
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
                  <p className="font-semibold text-gray-800 text-sm md:text-base">
                    {item.product.name}
                  </p>
                  <div className="flex items-center gap-1 text-teal-600 font-bold text-sm md:text-base">
                    <FaDollarSign className="text-lg" />
                    {item.product.price}
                  </div>
                </div>
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                    className="px-2 py-1 md:px-3 md:py-1 bg-gray-200 hover:bg-gray-300 transition"
                  >-</button>
                  <span className="px-2 py-1 md:px-3 md:py-1 text-gray-700">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                    className="px-2 py-1 md:px-3 md:py-1 bg-gray-200 hover:bg-gray-300 transition"
                  >+</button>
                </div>
                <div className="ml-2 md:ml-4 flex items-center gap-1 font-semibold text-gray-900 text-base md:text-lg bg-white px-2 py-1 rounded-lg shadow-sm">
                  <FaDollarSign className="text-teal-600" />
                  {(item.product.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 🏠 Address Selection */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-gray-700 font-medium">
              Select Address
            </label>
            <button 
              onClick={() => router.push('/account/addresses')} 
              className="text-sm text-teal-600 hover:underline"
            >
              Add/Edit
            </button>
          </div>
          <select
            value={selectedAddress}
            onChange={(e) => setSelectedAddress(e.target.value)}
            className="w-full border rounded-lg p-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">-- Choose an address --</option>
            {addresses.length > 0 ? (
              addresses.map(addr => (
                <option key={addr.id} value={addr.id}>
                  {`${addr.full_name} - ${addr.area}, ${addr.city}`}
                </option>
              ))
            ) : (
              <option value="" disabled>No saved addresses found.</option>
            )}
          </select>
        </div>

        {/* 💸 Coupon */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Coupon Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Enter code"
              className="flex-1 border rounded-lg p-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button className="bg-teal-600 text-white px-4 rounded-lg hover:bg-teal-700 transition font-semibold">
              Apply
            </button>
          </div>
        </div>

        {/* 🧾 Total */}
        <div className="mt-6 border-t pt-4 space-y-3">
          <div className="flex justify-between text-gray-700 font-medium">
            <span>Items ({getCartCount()})</span>
            <div className="flex items-center gap-1 text-gray-800 font-bold text-base">
              <FaDollarSign className="text-teal-600" />
              {getCartAmount().toFixed(2)}
            </div>
          </div>
          <div className="flex justify-between items-center text-gray-900 font-bold text-2xl">
            <span>Total</span>
            <div className="flex items-center gap-1 text-teal-600 text-2xl drop-shadow-sm">
              <FaDollarSign />
              {getCartAmount().toFixed(2)}
            </div>
          </div>
        </div>

        {/* 🛍️ Place Order */}
        <button
          onClick={handlePlaceOrder}
          disabled={getCartCount() === 0 || loading || !selectedAddress}
          className="w-full mt-6 py-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white font-semibold rounded-2xl hover:from-teal-700 hover:to-teal-800 transition shadow-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Redirecting...' : 'Pay Now'}
        </button>
      </div>
    </div>
  );
};

export default OrderSummary;
