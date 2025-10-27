'use client';

import React, { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import Loading from "@/components/Loading";
import Image from "next/image";
import { getSafeImageUrl } from "@/lib/utils";
import ReturnRequestModal from "@/components/ReturnRequestModal";
import { FiRotateCcw } from 'react-icons/fi';

const MyOrdersPage = () => {
  const { currency, myOrders, fetchMyOrders, user, authLoading } = useAppContext();
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
    if (user) {
      fetchMyOrders(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Modal aç
  const handleOpenReturnModal = (orderItem, orderId) => {
    setSelectedOrderItem(orderItem);
    setSelectedOrderId(orderId);
    setShowReturnModal(true);
  };

  // Modal kapat
  const handleCloseReturnModal = () => {
    setShowReturnModal(false);
    setSelectedOrderItem(null);
    setSelectedOrderId(null);
  };

  // İade sonrası listeyi yenile
  const handleReturnRequested = () => {
    if (user) {
      fetchMyOrders(user.id);
    }
  };

  // İade süresi kontrolü (14 gün)
  const isReturnable = (orderStatus, orderDate) => {
    if (orderStatus !== 'Delivered') return false;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 14);
    return new Date(orderDate) > cutoffDate;
  };

  if (authLoading || !myOrders) return <Loading />;

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-semibold mb-8 text-gray-800">Siparişlerim</h1>

      {myOrders.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          <p>Henüz hiç siparişiniz bulunmamaktadır.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {myOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6"
            >
              {/* Sipariş Başlık Bilgileri */}
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="font-semibold text-gray-800">Sipariş No: {order.id}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString("tr-TR")}
                  </p>
                </div>
                <div className="text-sm font-medium text-gray-600">
                  Durum: <span className="font-semibold">{order.status}</span>
                </div>
              </div>

              {/* Sipariş Kalemleri */}
              <div className="border-t pt-4 mt-4">
                {order.order_items.map((item) => {
                  const imageUrl = getSafeImageUrl(item.products?.image_urls);
                  const productName = item.products?.name || "Bilinmeyen Ürün";
                  const itemPrice = item.price ? item.price.toFixed(2) : "0.00";

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 mb-4 pb-4 border-b last:border-b-0 last:pb-0"
                    >
                      <Image
                        src={imageUrl}
                        alt={productName}
                        width={64}
                        height={64}
                        className="rounded-md object-cover w-16 h-16"
                      />
                      <div className="flex-grow">
                        <p className="font-medium text-gray-800">{productName}</p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} x {currency}{itemPrice}
                        </p>
                      </div>

                      {/* İade Butonu */}
                      {isReturnable(order.status, order.created_at) && (
                        <button
                          onClick={() => handleOpenReturnModal(item, order.id)}
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md"
                        >
                          <FiRotateCcw className="w-4 h-4" />
                          <span>İade Et</span>
                        </button>
                      )}

                      {/* İade süresi dolduysa mesaj */}
                      {!isReturnable(order.status, order.created_at) &&
                        order.status === "Delivered" && (
                          <span className="text-xs text-gray-400 italic">
                            İade süresi doldu
                          </span>
                        )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* İade Modalı */}
      {showReturnModal && selectedOrderItem && selectedOrderId && (
        <ReturnRequestModal
          orderItem={selectedOrderItem}
          orderId={selectedOrderId}
          onClose={handleCloseReturnModal}
          onReturnRequested={handleReturnRequested}
        />
      )}
    </div>
  );
};

export default MyOrdersPage;
