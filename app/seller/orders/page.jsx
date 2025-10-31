// app/seller/orders/page.jsx

'use client';
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Loading from "@/components/Loading";
import toast from "react-hot-toast";
import { FiChevronDown, FiChevronUp, FiTruck, FiX } from "react-icons/fi";
import FloatingLabelInput from "@/components/ui/FloatingLabelInput";
import { getSafeImageUrl } from "@/lib/utils";

// ============================
// 📌 Modal Component
// ============================
const TrackingNumberModal = ({ order, onClose, onSave }) => {
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await onSave(order.id, trackingNumber.trim());
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            {order.tracking_number ? "Edit Tracking Number" : "Add Tracking Number"}
          </h2>
          <button onClick={onClose}>
            <FiX className="w-6 h-6 text-gray-500 hover:text-gray-800 transition" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-600">
            {trackingNumber ? (
              <>When you save the tracking number, the order status will automatically be updated to <b>Shipped</b>.</>
            ) : (
              <>If you leave tracking number empty, the order status will remain as <b>Processing</b>.</>
            )}
          </p>
          <FloatingLabelInput
            id="tracking_number"
            name="tracking_number"
            label="Shipping Tracking Number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Enter tracking number or leave empty"
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:bg-orange-400"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================
// 📌 Helper function for Status Color
// ============================
const getStatusColor = (status) => {
  switch (status) {
    case "Processing":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "Shipped":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "Delivered":
      return "bg-green-100 text-green-800 border-green-300";
    case "Canceled":
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

// ============================
// 📌 Order Item Component (Memoized for performance)
// ============================
const OrderItem = React.memo(({ item, currency }) => (
  <div className="flex items-center gap-3 bg-white rounded-lg p-2 border hover:shadow-sm transition">
    <Image
      src={getSafeImageUrl(item.products?.image_urls)}
      alt={item.products?.name || "Product"}
      width={50}
      height={50}
      className="rounded-md object-cover"
    />
    <div className="flex flex-col">
      <span className="font-medium text-sm">{item.products?.name || "Unknown Product"}</span>
      <span className="text-xs text-gray-500">
        {item.quantity} x {currency}{item.price.toFixed(2)}
      </span>
    </div>
  </div>
));

OrderItem.displayName = 'OrderItem';

// ============================
// 📌 Order Card Component
// ============================
const OrderCard = ({ 
  order, 
  currency, 
  isExpanded, 
  onToggle, 
  onStatusChange, 
  onOpenTrackingModal 
}) => {
  const [localStatus, setLocalStatus] = useState(order.status);
  const [isUpdating, setIsUpdating] = useState(false);

  // Status değiştiğinde local state'i güncelle
  useEffect(() => {
    setLocalStatus(order.status);
  }, [order.status]);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setLocalStatus(newStatus);
    setIsUpdating(true);
    
    await onStatusChange(order.id, newStatus);
    setIsUpdating(false);
  };

  const handleTrackingClick = (e) => {
    e.stopPropagation();
    onOpenTrackingModal(order);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* HEADER */}
      <div
        className="flex flex-wrap justify-between gap-2 items-center p-4 cursor-pointer hover:bg-gray-50 transition"
        onClick={onToggle}
      >
        <div className="flex flex-col">
          <span className="font-bold text-gray-800">#{order.id.slice(0, 8)}</span>
          <span className="text-xs text-gray-500">
            {new Date(order.created_at).toLocaleString()}
          </span>
        </div>
        <div className="font-bold text-orange-600 text-lg">
          {currency}{order.total_amount.toFixed(2)}
        </div>
        <div>
          <select
            value={localStatus}
            onChange={handleStatusChange}
            disabled={isUpdating}
            onClick={(e) => e.stopPropagation()}
            className={`text-sm font-semibold rounded-full px-3 py-1 border focus:ring-2 focus:ring-orange-500 transition ${getStatusColor(localStatus)} ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Canceled">Canceled</option>
          </select>
          {isUpdating && (
            <div className="text-xs text-gray-500 mt-1 text-center">Updating...</div>
          )}
        </div>
        <div className="text-gray-500">
          {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
        </div>
      </div>

      {/* DETAILS BLOCK */}
      {isExpanded && (
        <div className="space-y-6 p-4 bg-gray-50 border-t">
          {/* PRODUCTS */}
          <div>
            <h4 className="font-semibold mb-3 text-gray-800 border-b pb-2">
              🛍 Products
            </h4>
            <div className="space-y-3">
              {order.order_items.map((item) => (
                <OrderItem 
                  key={item.id} 
                  item={item} 
                  currency={currency} 
                />
              ))}
            </div>
          </div>

          {/* ADDRESS */}
          <div>
            <h4 className="font-semibold mb-3 text-gray-800 border-b pb-2">
              🏠 Shipping Information
            </h4>
            <div className="bg-white rounded-lg p-3 border text-sm space-y-1">
              <p><b>Recipient:</b> {order.address?.full_name || "N/A"}</p>
              <p><b>Phone:</b> {order.address?.phone_number || "N/A"}</p>
              <p><b>Address:</b> {order.address?.area || "N/A"}</p>
              <p><b>City/State:</b> {order.address?.city || "N/A"}, {order.address?.state || "N/A"}</p>
              {order.address?.pincode && <p><b>Pincode:</b> {order.address.pincode}</p>}
            </div>

            <button
              onClick={handleTrackingClick}
              className="mt-4 flex items-center gap-2 text-sm text-orange-600 hover:text-orange-800 font-semibold"
            >
              <FiTruck />
              <span>
                {order.tracking_number
                  ? "Edit Tracking Number"
                  : "Add Tracking Number"}
              </span>
            </button>
            {order.tracking_number && (
              <div className="mt-2 text-sm text-gray-600">
                <b>Current Tracking:</b> {order.tracking_number}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================
// 📌 Main Component
// ============================
const OrdersPage = () => {
  const { currency } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [modalOrder, setModalOrder] = useState(null);

  // Optimized fetch function
  const fetchSellerOrders = useCallback(async () => {
    setLoading(true);
    try {
      // Sadece ihtiyaç duyulan alanları seçerek performansı artır
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          created_at,
          total_amount,
          status,
          tracking_number,
          address,
          order_items (
            id,
            quantity,
            price,
            products (
              name,
              image_urls
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
        toast.error("Error fetching orders: " + error.message);
        setOrders([]);
      } else {
        setOrders(data || []);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("An unexpected error occurred");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSellerOrders();
  }, [fetchSellerOrders]);

  const toggleOrderDetails = useCallback((orderId) => {
    setExpandedOrder((prev) => (prev === orderId ? null : orderId));
  }, []);

  const handleStatusChange = useCallback(async (orderId, newStatus) => {
    console.log("Updating status:", orderId, newStatus);
    
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) {
        console.error("Status update error:", error);
        toast.error("Status update failed: " + error.message);
        // Hata durumunda local state'i geri al
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: o.status } : o));
      } else {
        toast.success("Status updated!");
        // Optimistic update - veritabanı başarılı olursa state'i güncelle
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("An unexpected error occurred");
    }
  }, []);

  const handleSaveTrackingNumber = useCallback(async (orderId, trackingNumber) => {
    try {
      const updateData = { 
        tracking_number: trackingNumber
      };
      
      // Sadece tracking number doluysa status'ü Shipped yap
      if (trackingNumber.trim()) {
        updateData.status = "Shipped";
      }
      
      const { error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId);

      if (error) {
        console.error("Tracking update error:", error);
        toast.error("Could not save tracking number: " + error.message);
      } else {
        toast.success("Tracking info saved!");
        setOrders(prev => prev.map(o => 
          o.id === orderId ? { 
            ...o, 
            tracking_number: trackingNumber,
            status: trackingNumber.trim() ? 'Shipped' : o.status // Boşsa mevcut status'ü koru
          } : o
        ));
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("An unexpected error occurred");
    }
  }, []);

  const openTrackingModal = useCallback((order) => {
    setModalOrder(order);
  }, []);

  // Memoized orders list for better performance
  const ordersList = useMemo(() => {
    return orders.map((order) => (
      <OrderCard
        key={order.id}
        order={order}
        currency={currency}
        isExpanded={expandedOrder === order.id}
        onToggle={() => toggleOrderDetails(order.id)}
        onStatusChange={handleStatusChange}
        onOpenTrackingModal={openTrackingModal}
      />
    ));
  }, [orders, currency, expandedOrder, toggleOrderDetails, handleStatusChange, openTrackingModal]);

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-900 border-b pb-4">
        📦 Orders
      </h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">No orders yet</p>
      ) : (
        <div className="max-w-3xl mx-auto space-y-6">
          {ordersList}
        </div>
      )}

      {modalOrder && (
        <TrackingNumberModal
          order={modalOrder}
          onClose={() => setModalOrder(null)}
          onSave={handleSaveTrackingNumber}
        />
      )}
    </div>
  );
};

export default OrdersPage;