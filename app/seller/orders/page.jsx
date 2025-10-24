// app/seller/orders/page.jsx

'use client';
import React, { useEffect, useState, useCallback } from "react";
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
    if (!trackingNumber.trim()) {
        toast.error("Tracking number cannot be empty.");
        return;
    }
    setLoading(true);
    await onSave(order.id, trackingNumber.trim());
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Shipping Tracking Information</h2>
          <button onClick={onClose}>
            <FiX className="w-6 h-6 text-gray-500 hover:text-gray-800 transition" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-600">
            When you save the tracking number, the order status will automatically be updated to <b>Shipped</b>.
          </p>
          <FloatingLabelInput
            id="tracking_number"
            name="tracking_number"
            label="Shipping Tracking Number"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
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
// 📌 Main Component
// ============================
const OrdersPage = () => {
  const { currency } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [modalOrder, setModalOrder] = useState(null);

  const fetchSellerOrders = useCallback(async () => {
    setLoading(true);
    // Fetch orders with associated order_items and product details
    const { data, error } = await supabase
      .from("orders")
      .select(`*, order_items (*, products (*))`)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error fetching orders: " + error.message);
      setOrders([]);
    } else {
      // Map Turkish statuses to English for display logic if necessary,
      // but keeping original DB values for simplicity if DB uses Turkish.
      // Since the dropdown uses English values, we should assume the DB is updated to use them
      // or map them here. We will stick to the Turkish status values from the original code
      // for DB interaction and translate only for UI display where needed.
      const translatedData = (data || []).map(order => ({
        ...order,
        status: order.status.replace('Hazırlanıyor', 'Processing').replace('Kargolandı', 'Shipped').replace('Teslim Edildi', 'Delivered').replace('İptal Edildi', 'Canceled')
      }));

      setOrders(translatedData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSellerOrders();
  }, [fetchSellerOrders]);

  const toggleOrderDetails = (orderId) => {
    setExpandedOrder((prev) => (prev === orderId ? null : orderId));
  };

  const handleStatusChange = async (orderId, newStatus) => {
    // Translate status back to Turkish for database if the DB is set to store Turkish strings
    // We assume Turkish statuses (Hazırlanıyor, Kargolandı, Teslim Edildi, İptal Edildi) are stored in the DB.
    // If the DB were designed for internationalization, it would store keys (e.g., 'PROCESSING')
    // We will assume DB stores Turkish for this context, and send the translated status back.
    const dbStatus = newStatus.replace('Processing', 'Hazırlanıyor').replace('Shipped', 'Kargolandı').replace('Delivered', 'Teslim Edildi').replace('Canceled', 'İptal Edildi');
    
    const { error } = await supabase
      .from("orders")
      .update({ status: dbStatus })
      .eq("id", orderId);

    if (error) toast.error("Status update failed.");
    else {
      toast.success("Status updated!");
      // Manually update state for snappier UI, then refetch or trust.
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    }
  };

  const handleSaveTrackingNumber = async (orderId, trackingNumber) => {
    const { error } = await supabase
      .from("orders")
      .update({ tracking_number: trackingNumber, status: "Kargolandı" }) // Sending 'Kargolandı' to DB
      .eq("id", orderId);

    if (error) toast.error("Could not save tracking number.");
    else {
      toast.success("Tracking info saved!");
      // Manually update local state with English status 'Shipped'
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, tracking_number: trackingNumber, status: 'Shipped' } : o));
    }
  };

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
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* HEADER */}
              <div
                className="flex flex-wrap justify-between gap-2 items-center p-4 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => toggleOrderDetails(order.id)}
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
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className={`text-sm font-semibold rounded-full px-3 py-1 border focus:ring-2 focus:ring-orange-500 transition ${getStatusColor(order.status)}`}
                  >
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Canceled">Canceled</option>
                  </select>
                </div>
                <div className="text-gray-500">
                  {expandedOrder === order.id ? <FiChevronUp /> : <FiChevronDown />}
                </div>
              </div>

              {/* DETAILS BLOCK */}
              {expandedOrder === order.id && (
                <div className="space-y-6 p-4 bg-gray-50 border-t">
                  {/* PRODUCTS */}
                  <div>
                    <h4 className="font-semibold mb-3 text-gray-800 border-b pb-2">
                      🛍 Products
                    </h4>
                    <div className="space-y-3">
                      {order.order_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 bg-white rounded-lg p-2 border hover:shadow-sm transition"
                        >
                          <Image
                            src={getSafeImageUrl(item.products.image_urls)}
                            alt={item.products.name}
                            width={50}
                            height={50}
                            className="rounded-md object-cover"
                          />
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{item.products.name}</span>
                            <span className="text-xs text-gray-500">
                              {item.quantity} x {currency}{item.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ADDRESS */}
                  <div>
                    <h4 className="font-semibold mb-3 text-gray-800 border-b pb-2">
                      🏠 Shipping Information
                    </h4>
                    <div className="bg-white rounded-lg p-3 border text-sm space-y-1">
                      <p><b>Recipient:</b> {order.address.full_name}</p>
                      <p><b>Phone:</b> {order.address.phone_number}</p>
                      <p><b>Address:</b> {order.address.area}</p>
                      <p><b>City/State:</b> {order.address.city}, {order.address.state}</p>
                      {order.address.pincode && <p><b>Pincode:</b> {order.address.pincode}</p>}
                    </div>

                    <button
                      onClick={() => setModalOrder(order)}
                      className="mt-4 flex items-center gap-2 text-sm text-orange-600 hover:text-orange-800 font-semibold"
                    >
                      <FiTruck />
                      <span>
                        {order.tracking_number
                          ? "Edit Tracking Number"
                          : "Add Tracking Number"}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
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