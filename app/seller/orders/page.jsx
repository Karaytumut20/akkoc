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
    setLoading(true);
    await onSave(order.id, trackingNumber);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Kargo Takip Bilgisi</h2>
          <button onClick={onClose}>
            <FiX className="w-6 h-6 text-gray-500 hover:text-gray-800 transition" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-600">
            Takip numarasını kaydettiğinizde sipariş durumu otomatik olarak <b>Kargolandı</b> olarak güncellenecektir.
          </p>
          <FloatingLabelInput
            id="tracking_number"
            name="tracking_number"
            label="Kargo Takip Numarası"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:bg-orange-400"
            >
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================
// 📌 Renkli Durum için yardımcı fonksiyon
// ============================
const getStatusColor = (status) => {
  switch (status) {
    case "Hazırlanıyor":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "Kargolandı":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "Teslim Edildi":
      return "bg-green-100 text-green-800 border-green-300";
    case "İptal Edildi":
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

// ============================
// 📌 Ana Component
// ============================
const OrdersPage = () => {
  const { currency } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [modalOrder, setModalOrder] = useState(null);

  const fetchSellerOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(`*, order_items (*, products (*))`)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Siparişler getirilirken hata: " + error.message);
      setOrders([]);
    } else {
      setOrders(data || []);
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
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) toast.error("Durum güncellenemedi.");
    else {
      toast.success("Durum güncellendi!");
      fetchSellerOrders();
    }
  };

  const handleSaveTrackingNumber = async (orderId, trackingNumber) => {
    const { error } = await supabase
      .from("orders")
      .update({ tracking_number: trackingNumber, status: "Kargolandı" })
      .eq("id", orderId);

    if (error) toast.error("Takip numarası kaydedilemedi.");
    else {
      toast.success("Kargo bilgileri kaydedildi!");
      await fetchSellerOrders();
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-900 border-b pb-4">
        📦 Siparişler
      </h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">Henüz sipariş yok</p>
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
                    {new Date(order.created_at).toLocaleString("tr-TR")}
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
                    <option value="Hazırlanıyor">Hazırlanıyor</option>
                    <option value="Kargolandı">Kargolandı</option>
                    <option value="Teslim Edildi">Teslim Edildi</option>
                    <option value="İptal Edildi">İptal Edildi</option>
                  </select>
                </div>
                <div className="text-gray-500">
                  {expandedOrder === order.id ? <FiChevronUp /> : <FiChevronDown />}
                </div>
              </div>

              {/* DETAY BLOKLARI */}
              {expandedOrder === order.id && (
                <div className="space-y-6 p-4 bg-gray-50 border-t">
                  {/* ÜRÜNLER */}
                  <div>
                    <h4 className="font-semibold mb-3 text-gray-800 border-b pb-2">
                      🛍 Ürünler
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

                  {/* ADRES */}
                  <div>
                    <h4 className="font-semibold mb-3 text-gray-800 border-b pb-2">
                      🏠 Teslimat Bilgisi
                    </h4>
                    <div className="bg-white rounded-lg p-3 border text-sm space-y-1">
                      <p><b>Alıcı:</b> {order.address.full_name}</p>
                      <p><b>Telefon:</b> {order.address.phone_number}</p>
                      <p><b>Adres:</b> {order.address.area}</p>
                      <p><b>İlçe/İl:</b> {order.address.city}, {order.address.state}</p>
                      {order.address.pincode && <p><b>Posta Kodu:</b> {order.address.pincode}</p>}
                    </div>

                    <button
                      onClick={() => setModalOrder(order)}
                      className="mt-4 flex items-center gap-2 text-sm text-orange-600 hover:text-orange-800 font-semibold"
                    >
                      <FiTruck />
                      <span>
                        {order.tracking_number
                          ? "Kargo Numarasını Düzenle"
                          : "Kargo Numarası Ekle"}
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
