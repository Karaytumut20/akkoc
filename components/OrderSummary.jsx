// components/OrderSummary.jsx

'use client';
import { useAppContext } from "@/context/AppContext";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { supabase } from "@/lib/supabaseClient";
import { FiMapPin, FiPlus, FiEdit, FiChevronRight, FiShoppingBag, FiTag, FiCreditCard, FiX, FiUser, FiPhone, FiHome, FiLogIn, FiUserPlus } from "react-icons/fi";

// CALIFORNIA_TAX_RATE constant defined here
const CALIFORNIA_TAX_RATE = 0.0825;

// US States List
const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }
];

// Address Modal Component
const AddressModal = ({ isOpen, onClose, onAddressAdded, user }) => {
  const { addAddress } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    full_name: '',
    phone_number: '',
    pincode: '',
    area: '',
    city: '',
    state: '',
  });

  const onChangeHandler = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please log in to add an address.");
      onClose();
      return;
    }
    
    setLoading(true);
    
    // Validate required fields
    if (!address.full_name || !address.phone_number || !address.pincode || !address.area || !address.city || !address.state) {
      toast.error("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(address.phone_number.replace(/[\s\-\(\)]/g, ''))) {
      toast.error("Please enter a valid phone number.");
      setLoading(false);
      return;
    }

    // Validate zip code format (US zip codes)
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(address.pincode)) {
      toast.error("Please enter a valid zip code (5 digits or 5+4 format).");
      setLoading(false);
      return;
    }

    const success = await addAddress(address);
    setLoading(false);
    
    if (success) {
      onAddressAdded();
      onClose();
      // Reset form
      setAddress({
        full_name: '',
        phone_number: '',
        pincode: '',
        area: '',
        city: '',
        state: '',
      });
    }
  };

  // Form reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAddress({
        full_name: '',
        phone_number: '',
        pincode: '',
        area: '',
        city: '',
        state: '',
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#ffffff] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 sticky top-0 bg-[#ffffff]">
          <div className="flex items-center gap-3">
            <FiMapPin className="w-5 h-5 md:w-6 md:h-6 text-[#be531c]" />
            <h2 className="text-lg md:text-xl font-bold text-gray-900">Add New Address</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 md:p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <FiX className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmitHandler} className="p-4 md:p-6 space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FiUser className="w-4 h-4 text-gray-400" />
              Full Name *
            </label>
            <input
              name="full_name"
              className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#be531c] focus:border-[#be531c] transition bg-[#ffffff] text-sm md:text-base"
              type="text"
              placeholder="Enter your full name"
              onChange={onChangeHandler}
              value={address.full_name}
              required
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FiPhone className="w-4 h-4 text-gray-400" />
              Phone Number *
            </label>
            <input
              name="phone_number"
              className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#be531c] focus:border-[#be531c] transition bg-[#ffffff] text-sm md:text-base"
              type="tel"
              placeholder="Enter your phone number"
              onChange={onChangeHandler}
              value={address.phone_number}
              required
            />
          </div>

          {/* Zip Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FiMapPin className="w-4 h-4 text-gray-400" />
              Zip Code *
            </label>
            <input
              name="pincode"
              className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#be531c] focus:border-[#be531c] transition bg-[#ffffff] text-sm md:text-base"
              type="text"
              placeholder="Enter zip code"
              onChange={onChangeHandler}
              value={address.pincode}
              required
            />
          </div>

          {/* Area and Street */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FiHome className="w-4 h-4 text-gray-400" />
              Address (Area and Street) *
            </label>
            <textarea
              name="area"
              className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#be531c] focus:border-[#be531c] transition bg-[#ffffff] resize-none text-sm md:text-base"
              rows={3}
              placeholder="Enter your street address, apartment number, etc."
              onChange={onChangeHandler}
              value={address.area}
              required
            />
          </div>

          {/* City and State */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                name="city"
                className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#be531c] focus:border-[#be531c] transition bg-[#ffffff] text-sm md:text-base"
                type="text"
                placeholder="Enter city"
                onChange={onChangeHandler}
                value={address.city}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <select
                name="state"
                className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#be531c] focus:border-[#be531c] transition bg-[#ffffff] text-sm md:text-base"
                onChange={onChangeHandler}
                value={address.state}
                required
              >
                <option value="" disabled>Select State</option>
                {US_STATES.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Required Fields Note */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-blue-700 text-xs md:text-sm">
              * All fields are required
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col md:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold text-sm md:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-[#be531c] text-white rounded-lg hover:bg-[#a64919] transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                'Save Address'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Login Prompt Component - Sadece adres kısmında gösterilecek
const LoginPrompt = ({ onLogin, onSignup }) => {
  return (
    <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
      <FiUser className="w-12 h-12 text-gray-400 mx-auto mb-3" />
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Login Required</h3>
      <p className="text-gray-600 mb-4">Please sign in to add and manage delivery addresses</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onLogin}
          className="flex items-center gap-2 px-6 py-3 bg-[#be531c] text-white rounded-lg hover:bg-[#a64919] transition font-semibold"
        >
          <FiLogIn className="w-4 h-4" />
          Sign In
        </button>
       
      </div>
    </div>
  );
};

const OrderSummary = () => {
  const { currency, cartItems, user, updateCartQuantity, getCartCount, setCartItems, addresses, router } = useAppContext();
  
  const [selectedAddress, setSelectedAddress] = useState("");
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDetails, setCouponDetails] = useState(null); // Kupon detaylarını saklamak için
  const [loading, setLoading] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [totals, setTotals] = useState({ subtotal: 0, taxAmount: 0, discountAmount: 0, totalAmount: 0 });
  const [showAddressModal, setShowAddressModal] = useState(false);

  // Sepet değiştiğinde kupon geçerliliğini kontrol et
  useEffect(() => {
    const checkCouponValidity = () => {
      if (appliedCoupon && couponDetails) {
        const currentSubtotal = Object.values(cartItems).reduce((sum, item) => 
          (item?.product?.price ?? 0) * (item?.quantity ?? 0) + sum, 0
        );

        // Minimum alışveriş tutarı kontrolü
        if (couponDetails.min_purchase_amount && currentSubtotal < couponDetails.min_purchase_amount) {
          toast.error(`Coupon "${appliedCoupon.code}" is no longer valid. Minimum purchase amount of ${currency}${couponDetails.min_purchase_amount.toFixed(2)} required.`);
          setAppliedCoupon(null);
          setCouponDetails(null);
          return;
        }

        // Kullanım limiti kontrolü (opsiyonel - gerçek zamanlı olması için API çağrısı gerekebilir)
        // Bu kısım opsiyonel, çünkü gerçek zamanlı kontrol için veritabanı sorgusu gerekir
      }
    };

    checkCouponValidity();
  }, [cartItems, appliedCoupon, couponDetails, currency]);

  // Calculate totals when cart items or coupon changes
  useEffect(() => {
    const calculateTotals = () => {
      const subtotalRaw = Object.values(cartItems).reduce((sum, item) => {
        const price = item?.product?.price ?? 0;
        const quantity = item?.quantity ?? 0;
        return sum + (price * quantity);
      }, 0);

      let calculatedDiscountAmount = 0;
      if (appliedCoupon && couponDetails) {
        // Kupon hala geçerli mi kontrol et
        const currentSubtotal = Object.values(cartItems).reduce((sum, item) => 
          (item?.product?.price ?? 0) * (item?.quantity ?? 0) + sum, 0
        );

        if (couponDetails.min_purchase_amount && currentSubtotal < couponDetails.min_purchase_amount) {
          // Kupon geçersiz, indirim uygulama
          calculatedDiscountAmount = 0;
        } else {
          // Kupon geçerli, indirimi hesapla
          if (couponDetails.discount_type === 'percentage') {
            calculatedDiscountAmount = subtotalRaw * (couponDetails.discount_value / 100);
            if (couponDetails.max_discount_amount && calculatedDiscountAmount > couponDetails.max_discount_amount) {
              calculatedDiscountAmount = couponDetails.max_discount_amount;
            }
          } else if (couponDetails.discount_type === 'fixed_amount') {
            calculatedDiscountAmount = couponDetails.discount_value;
          }
          calculatedDiscountAmount = Math.min(calculatedDiscountAmount, subtotalRaw);
        }
      }

      const discountedSubtotal = subtotalRaw - calculatedDiscountAmount;
      const calculatedTaxAmount = discountedSubtotal * CALIFORNIA_TAX_RATE;
      const calculatedTotalAmount = discountedSubtotal + calculatedTaxAmount;

      setTotals({
        subtotal: subtotalRaw,
        taxAmount: calculatedTaxAmount,
        discountAmount: calculatedDiscountAmount,
        totalAmount: calculatedTotalAmount,
      });
    };

    calculateTotals();
  }, [cartItems, appliedCoupon, couponDetails]);

  // Apply coupon function - GÜNCELLENDİ
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

      const currentSubtotal = Object.values(cartItems).reduce((sum, item) => 
        (item?.product?.price ?? 0) * (item?.quantity ?? 0) + sum, 0
      );

      if (coupon.min_purchase_amount && currentSubtotal < coupon.min_purchase_amount) {
        throw new Error(`Minimum purchase amount of ${currency}${coupon.min_purchase_amount.toFixed(2)} required.`);
      }

      // Kupon bilgilerini ayrıca sakla (minimum tutar kontrolü için)
      setCouponDetails({
        min_purchase_amount: coupon.min_purchase_amount,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        max_discount_amount: coupon.max_discount_amount,
      });

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
      setCouponDetails(null);
    } finally {
      setCouponLoading(false);
    }
  };

  // Remove coupon function - GÜNCELLENDİ
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDetails(null);
    toast.success("Coupon removed.");
  };

  // Quantity change function - GÜNCELLENDİ
  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setPendingDelete(productId);
      setShowConfirmModal(true);
    } else {
      updateCartQuantity(productId, newQuantity);
    }
  };

  // Delete confirm function - GÜNCELLENDİ
  const handleDeleteConfirm = () => {
    if (pendingDelete) {
      const updatedCart = { ...cartItems };
      delete updatedCart[pendingDelete];
      setCartItems(updatedCart);
      toast.success("Product removed from cart 🛒");
      
      // Sepet değişti, kupon geçerliliği useEffect tarafından otomatik kontrol edilecek
    }
    setPendingDelete(null);
    setShowConfirmModal(false);
  };

  const handleDeleteCancel = () => {
    setPendingDelete(null);
    setShowConfirmModal(false);
  };

  // Handle address addition with login check
  const handleAddAddressClick = () => {
    if (!user) {
      toast.error("Please log in to add an address");
      return;
    }
    setShowAddressModal(true);
  };

  // Handle login redirect
  const handleLogin = () => {
    router.push('/auth');
  };

  // Handle signup redirect
  const handleSignup = () => {
    router.push('/auth');
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

    // Son bir kupon geçerlilik kontrolü
    if (appliedCoupon && couponDetails) {
      const currentSubtotal = Object.values(cartItems).reduce((sum, item) => 
        (item?.product?.price ?? 0) * (item?.quantity ?? 0) + sum, 0
      );

      if (couponDetails.min_purchase_amount && currentSubtotal < couponDetails.min_purchase_amount) {
        toast.error(`Coupon "${appliedCoupon.code}" is no longer valid. Please remove it or add more items to your cart.`);
        return;
      }
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
          totalAmount: totals.totalAmount,
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

  // Sadece modal kapatma işlemi
  const handleAddressAdded = () => {
    // Bu fonksiyon artık sadece modal'ın kapanması için kullanılıyor
  };

  return (
    <>
      {/* Delete Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#ffffff] rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center relative">
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

      {/* Address Modal */}
      <AddressModal 
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onAddressAdded={handleAddressAdded}
        user={user}
      />

      <div className="w-full max-w-2xl bg-[#ffffff] shadow-2xl rounded-3xl p-4 md:p-6 lg:p-8 mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 md:mb-6 border-b pb-3 md:pb-4">
          <FiShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-[#be531c]" />
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Order Summary</h2>
          {!user && (
            <span className="ml-auto bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium">
              Guest User
            </span>
          )}
        </div>

        {/* Cart Items List */}
        <div className="space-y-3 md:space-y-4 mb-6 md:mb-8 max-h-[40vh] md:max-h-[50vh] overflow-y-auto pr-2">
          {Object.keys(cartItems).length === 0 ? (
            <div className="text-center py-6 md:py-8">
              <FiShoppingBag className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" />
              <p className="text-gray-500 text-base md:text-lg">Your cart is empty</p>
              <button 
                onClick={() => router.push('/all-products')}
                className="mt-3 md:mt-4 px-4 py-2 md:px-6 md:py-2 bg-[#be531c] text-white rounded-lg hover:bg-[#a64919] transition text-sm md:text-base"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            Object.values(cartItems).map((item, idx) => (
              <div
                key={item.product.id || idx}
                className="flex items-center gap-3 md:gap-4 bg-gray-50 p-3 md:p-4 rounded-xl hover:shadow-md transition-all duration-200"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 relative rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={item.product.image_urls?.[0] || "/assets/placeholder.jpg"}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-xs md:text-sm truncate">{item.product.name}</p>
                  <p className="text-xs md:text-sm text-gray-500">{currency}{item.product.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                  <button
                    onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                    className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg transition text-xs md:text-sm"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-medium text-gray-700 text-xs md:text-sm">{item.quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                    className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-lg transition text-xs md:text-sm"
                  >
                    +
                  </button>
                </div>
                <div className="text-right min-w-[60px] md:min-w-[80px]">
                  <p className="font-semibold text-gray-900 text-xs md:text-sm">
                    {currency}{(item.product.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Address Selection - Enhanced */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2">
              <FiMapPin className="w-4 h-4 md:w-5 md:h-5 text-[#be531c]" />
              <label className="block text-gray-700 font-semibold text-base md:text-lg">Delivery Address</label>
            </div>
            {user ? (
              <button 
                onClick={handleAddAddressClick}
                className="flex items-center gap-1 text-[#be531c] hover:text-[#a64919] transition font-medium text-sm md:text-base"
              >
                <FiPlus className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden md:inline">Add New</span>
                <span className="md:hidden">Add</span>
              </button>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-1 text-[#be531c] hover:text-[#a64919] transition font-medium text-sm md:text-base"
              >
                <FiLogIn className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden md:inline">Login to Add</span>
                <span className="md:hidden">Login</span>
              </button>
            )}
          </div>

          {!selectedAddress && user && (
            <div className="mb-3 p-2 md:p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-700 text-xs md:text-sm font-medium flex items-center gap-2">
                <FiMapPin className="w-3 h-3 md:w-4 md:h-4" />
                Please select a delivery address to continue
              </p>
            </div>
          )}

          {/* SADECE BURADA GİRİŞ KONTROLÜ GÖSTERİLİYOR */}
          {!user ? (
            <LoginPrompt onLogin={handleLogin} onSignup={handleSignup} />
          ) : addresses.length > 0 ? (
            <>
              <select
                value={selectedAddress}
                onChange={(e) => setSelectedAddress(e.target.value)}
                className="w-full border border-gray-200 md:border-2 rounded-lg md:rounded-xl p-3 md:p-4 bg-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#be531c] focus:border-[#be531c] transition text-sm md:text-base"
              >
                <option value="" className="text-gray-400">Select your delivery address</option>
                {addresses.map(addr => (
                  <option key={addr.id} value={addr.id}>
                    {`${addr.full_name} - ${addr.area}, ${addr.city}, ${addr.state}`}
                  </option>
                ))}
              </select>
              
              <button 
                onClick={() => router.push('/account/addresses')}
                className="flex items-center gap-2 mt-2 md:mt-3 text-gray-600 hover:text-gray-800 transition text-xs md:text-sm"
              >
                <FiEdit className="w-3 h-3 md:w-4 md:h-4" />
                Manage all addresses
                <FiChevronRight className="w-3 h-3 md:w-4 md:h-4" />
              </button>
            </>
          ) : (
            <div className="text-center p-4 md:p-6 border border-dashed border-gray-300 rounded-lg md:rounded-xl bg-gray-50">
              <FiMapPin className="w-8 h-8 md:w-12 md:h-12 text-gray-400 mx-auto mb-2 md:mb-3" />
              <p className="text-gray-600 text-sm md:text-base mb-3 md:mb-4">No addresses saved yet</p>
              <button
                onClick={handleAddAddressClick}
                className="flex items-center gap-2 mx-auto px-4 py-2 md:px-6 md:py-3 bg-[#be531c] text-white rounded-lg hover:bg-[#a64919] transition font-semibold text-sm md:text-base"
              >
                <FiPlus className="w-4 h-4 md:w-5 md:h-5" />
                Add Your First Address
              </button>
            </div>
          )}
        </div>

        {/* Coupon Code Section */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <FiTag className="w-4 h-4 md:w-5 md:h-5 text-[#be531c]" />
            <label className="block text-gray-700 font-semibold text-base md:text-lg">Coupon Code</label>
          </div>

          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-green-50 p-3 md:p-4 rounded-lg md:rounded-xl border border-green-200">
              <div className="flex items-center gap-2 md:gap-3">
                <FiTag className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                <div>
                  <p className="text-green-700 font-semibold text-sm md:text-base">
                    Code: <span className="font-bold">{appliedCoupon.code}</span>
                  </p>
                  <p className="text-green-600 text-xs md:text-sm">
                    -{currency}{totals.discountAmount.toFixed(2)} discount applied
                  </p>
                  {couponDetails?.min_purchase_amount && (
                    <p className="text-green-600 text-xs">
                      Min. purchase: {currency}{couponDetails.min_purchase_amount.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
              <button 
                onClick={handleRemoveCoupon}
                className="text-red-500 hover:text-red-700 transition font-semibold text-xs md:text-sm"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-2 md:gap-3">
              <input
                type="text"
                value={couponCodeInput}
                onChange={(e) => setCouponCodeInput(e.target.value)}
                placeholder="Enter coupon code"
                className="flex-1 border border-gray-200 md:border-2 rounded-lg md:rounded-xl p-3 md:p-4 bg-[#ffffff] focus:outline-none focus:ring-2 focus:ring-[#be531c] focus:border-[#be531c] transition text-sm md:text-base"
                disabled={couponLoading}
              />
              <button
                onClick={handleApplyCoupon}
                disabled={couponLoading || !couponCodeInput.trim()}
                className="bg-[#be531c] text-white px-4 py-3 md:px-6 rounded-lg md:rounded-xl hover:bg-[#a64919] transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
              >
                {couponLoading ? '...' : 'Apply'}
              </button>
            </div>
          )}
        </div>

        {/* Order Totals Summary */}
        <div className="mt-6 md:mt-8 border-t pt-4 md:pt-6 space-y-3 md:space-y-4">
          <div className="flex justify-between text-gray-600 text-sm md:text-base">
            <span>Items ({getCartCount()})</span>
          </div>
          
          <div className="flex justify-between text-gray-700 text-sm md:text-base">
            <span>Subtotal</span>
            <span>{currency}{totals.subtotal.toFixed(2)}</span>
          </div>
          
          {totals.discountAmount > 0 && (
            <div className="flex justify-between text-green-600 font-medium text-sm md:text-base">
              <span>Discount</span>
              <span>-{currency}{totals.discountAmount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-gray-700 text-sm md:text-base">
            <span>Tax ({(CALIFORNIA_TAX_RATE * 100).toFixed(2)}%)</span>
            <span>{currency}{totals.taxAmount.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-gray-900 font-bold text-lg md:text-xl border-t pt-3 md:pt-4 mt-2 md:mt-2">
            <span>Total Amount</span>
            <span>{currency}{totals.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Place Order Button */}
        <button
          onClick={!user ? handleLogin : handlePlaceOrder}
          disabled={(!user ? false : (getCartCount() === 0 || !selectedAddress || loading))}
          className="w-full mt-6 md:mt-8 py-3 md:py-4 bg-gradient-to-r from-[#be531c] to-[#a64919] text-white font-semibold rounded-xl md:rounded-2xl hover:from-[#a64919] hover:to-[#8e3b13] transition-all duration-300 shadow-lg text-base md:text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 md:gap-3"
        >
          <FiCreditCard className="w-4 h-4 md:w-5 md:h-5" />
          {!user ? 'Sign In to Checkout' : (loading ? 'Redirecting...' : 'Proceed to Payment')}
        </button>

        {/* Security Notice */}
        <div className="mt-3 md:mt-4 text-center">
          <p className="text-xs text-gray-500">
            🔒 Your payment information is secure and encrypted
          </p>
        </div>
      </div>
    </>
  );
};

export default OrderSummary;