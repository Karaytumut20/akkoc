// components/OrderSummary.jsx

'use client';
// 🔥 FIX: Removed CALIFORNIA_TAX_RATE from this import
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import React, { useState } from "react";
import toast from 'react-hot-toast';

// 🔥 FIX: Define the constant here (or import from a dedicated constants file if you prefer)
const CALIFORNIA_TAX_RATE = 0.08; // Example tax rate (8%)

const OrderSummary = () => {
  // Get necessary functions and state from the AppContext
  const { currency, cartItems, user, updateCartQuantity, getCartCount, getCartAmount, setCartItems, addresses, router } = useAppContext();
  const [selectedAddress, setSelectedAddress] = useState(""); // State for selected shipping address
  const [coupon, setCoupon] = useState(""); // State for coupon code input
  const [loading, setLoading] = useState(false); // State for loading indicator during order placement

  // Calculate subtotal, tax, and total amount using the function from context
  // getCartAmount now likely returns an object with these values based on the context logic.
  // We need to ensure getCartAmount in AppContext calculates tax correctly.
  const { subtotal, taxAmount, totalAmount } = getCartAmount(CALIFORNIA_TAX_RATE); // Pass the rate if needed by the context function

  // State for delete confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null); // ID of the product pending deletion

  // Handle changes in product quantity
  const handleQuantityChange = (productId, newQuantity) => {
    // If quantity drops to 0 or less, show confirmation modal
    if (newQuantity <= 0) {
      setPendingDelete(productId);
      setShowConfirmModal(true);
    } else {
      // Otherwise, update the quantity in the cart via context
      updateCartQuantity(productId, newQuantity);
    }
  };

  // Confirm product deletion from cart
  const handleDeleteConfirm = () => {
    if (pendingDelete) {
        // Remove the item directly using setCartItems or ensure updateCartQuantity handles quantity 0
        const updatedCart = { ...cartItems };
        delete updatedCart[pendingDelete];
        setCartItems(updatedCart); // Update cart state via context
        toast.success("Product removed from cart 🛒");
    }
    setPendingDelete(null); // Reset pending delete state
    setShowConfirmModal(false); // Close modal
  };

  // Cancel product deletion
  const handleDeleteCancel = () => {
    setPendingDelete(null); // Reset pending delete state
    setShowConfirmModal(false); // Close modal
  };

  // Handle placing the order
  const handlePlaceOrder = async () => {
    // Check if user is logged in
    if (!user) {
      toast.error("Please log in to proceed with payment.");
      router.push('/auth'); // Redirect to login page
      return;
    }
    // Check if an address is selected
    if (!selectedAddress) {
      toast.error("Please select a delivery address!");
      return;
    }
    setLoading(true); // Start loading indicator

    try {
      // Call the API endpoint to create a Stripe checkout session
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/checkout_sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: Object.values(cartItems), // Send cart items (needed for metadata)
          userId: user.id,                // Send user ID
          addressId: selectedAddress,     // Send selected address ID
          totalAmount: totalAmount        // Send the final total amount (including tax)
        }),
      });

      const { url, error } = await response.json(); // Get the redirect URL or error from the API
      if (error) throw new Error(error.message);   // Throw error if API returned one

      // If a URL is received, redirect the user to Stripe checkout
      if (url) {
        window.location.href = url;
      } else {
        toast.error('Could not redirect to payment page.');
      }
    } catch (error) {
      // Show error toast if anything fails
      toast.error(`An error occurred: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false); // Stop loading indicator
    }
  };

  return (
    <>
      {/* Delete Confirmation Modal */}
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

      {/* Main Order Summary Component */}
      <div className="w-full md:w-[500px] lg:w-[600px] bg-white shadow-2xl rounded-3xl p-6 md:p-8 mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-3">Checkout</h2>

        {/* Cart Items List */}
        <div className="space-y-5 mb-6 max-h-[60vh] md:max-h-[500px] overflow-y-auto pr-2"> {/* Added padding-right */}
          {Object.keys(cartItems).length === 0 ? (
            <p className="text-gray-500 text-center py-10">Your cart is empty.</p>
          ) : (
            // Map through cart items and display each one
            Object.values(cartItems).map((item, idx) => (
              <div
                key={item.product.id || idx} // Use product ID as key
                className="flex items-center justify-between bg-[#ffffff] p-3 md:p-4 rounded-2xl hover:shadow-md transition"
              >
                {/* Product Image */}
                <div className="w-16 h-16 md:w-20 md:h-20 relative rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={item.product.image_urls?.[0] || "/assets/placeholder.jpg"} // Display first image or placeholder
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                {/* Product Name and Price */}
                <div className="flex-1 px-3 md:px-4">
                  <p className="font-semibold text-gray-800 text-sm md:text-base">{item.product.name}</p>
                  <p className="text-xs md:text-sm text-gray-500">{currency}{item.product.price.toFixed(2)}</p> {/* Ensure price has 2 decimal places */}
                </div>
                {/* Quantity Controls */}
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
                {/* Total Price for Item */}
                <div className="ml-2 md:ml-4 font-semibold text-gray-900 text-sm md:text-base">
                  {currency}{(item.product.price * item.quantity).toFixed(2)} {/* Ensure total has 2 decimal places */}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Address Selection */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-gray-700 font-medium">Select Address</label>
            {/* Link to add/edit addresses */}
            <button onClick={() => router.push('/account/addresses')} className="text-sm text-[#be531c] hover:underline">Add/Edit Address</button>
          </div>
          {/* Dropdown for selecting address */}
          <select
            value={selectedAddress}
            onChange={(e) => setSelectedAddress(e.target.value)}
            className="w-full border rounded-lg p-3 bg-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#be531c]"
          >
            <option value="" disabled>-- Select an address --</option>
            {addresses.length > 0 ? (
              // Map through available addresses
              addresses.map(addr => (
                <option key={addr.id} value={addr.id}>{`${addr.full_name} - ${addr.area}, ${addr.city}`}</option>
              ))
            ) : (
              // Show if no addresses are saved
              <option disabled>No saved addresses found.</option>
            )}
          </select>
        </div>

        {/* Coupon Code Input */}
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
            {/* Apply button (currently non-functional) */}
            <button className="bg-[#be531c] text-white px-4 rounded-lg hover:bg-[#a64919] transition font-semibold">
              Apply
            </button>
          </div>
        </div>

        {/* Order Totals Summary */}
        <div className="mt-8 border-t pt-5 space-y-3">
            <div className="flex justify-between text-sm text-gray-500">
                {/* Display total number of items */}
                <span>Items ({getCartCount()})</span>
            </div>
            <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                {/* Display subtotal */}
                <span>{currency}{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
                {/* Display tax rate and amount */}
                <span>Tax ({(CALIFORNIA_TAX_RATE * 100).toFixed(2)}%)</span>
                <span>{currency}{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-900 font-bold text-xl border-t pt-3 mt-3">
                <span>Total</span>
                {/* Display final total amount */}
                <span>{currency}{totalAmount.toFixed(2)}</span>
            </div>
        </div>

        {/* Place Order Button */}
        <button
          onClick={handlePlaceOrder}
          // Disable button if cart is empty, no address selected, or loading
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