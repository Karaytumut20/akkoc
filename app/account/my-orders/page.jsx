// app/account/my-orders/page.jsx

'use client';
import React, { useEffect, useState } from "react"; // useState ekledik
import { useAppContext } from "@/context/AppContext";
import Loading from "@/components/Loading";
import Image from "next/image";
import { getSafeImageUrl } from "@/lib/utils";
import ReturnRequestModal from "@/components/ReturnRequestModal"; // Yeni modal component'ini import ediyoruz
import { FiRotateCcw } from "react-icons/fi"; // İade ikonu (opsiyonel)

const MyOrdersPage = () => {
    const { currency, myOrders, fetchMyOrders, user, authLoading } = useAppContext();

    // Modal state'leri
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [selectedOrderForReturn, setSelectedOrderForReturn] = useState(null);

    useEffect(() => {
        if (user) {
            fetchMyOrders(user.id);
        }
    }, [user, fetchMyOrders]); // fetchMyOrders dependency eklendi

    const getStatusColor = (status) => {
        // İngilizce durumları da kontrol etmek için güncelleme
        switch (status) {
            case 'Teslim Edildi':
            case 'Delivered':
                return 'bg-green-100 text-green-800';
            case 'Kargolandı':
            case 'Shipped':
                return 'bg-blue-100 text-blue-800';
            case 'İptal Edildi':
            case 'Canceled':
                 return 'bg-red-100 text-red-800';
            case 'Hazırlanıyor':
            case 'Processing':
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };

    // İade butonuna tıklandığında modal'ı açan fonksiyon
    const handleReturnClick = (order) => {
        setSelectedOrderForReturn(order);
        setIsReturnModalOpen(true);
    };

    // Modal'ı kapatan fonksiyon
    const handleCloseModal = () => {
        setIsReturnModalOpen(false);
        setSelectedOrderForReturn(null);
    };


    if (authLoading || !myOrders) return <Loading />; // myOrders yüklenene kadar bekle

    return (
        <div>
            <h1 className="text-2xl sm:text-3xl font-semibold mb-8 text-gray-800">My Orders</h1>
            {myOrders.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                    <p>You haven't placed any orders yet.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {myOrders.map(order => {
                        // Siparişin teslim edilip edilmediğini kontrol et (İngilizce ve Türkçe durumlar)
                        const isDelivered = order.status === 'Teslim Edildi' || order.status === 'Delivered';

                        return (
                            <div key={order.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6">
                                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                    <div>
                                        <p className="font-bold text-gray-800">Order ID: #{order.id.slice(0, 8)}</p>
                                        <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <p className="font-semibold text-lg">{currency}{order.total_amount.toFixed(2)}</p>
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                                            {/* Durumu İngilizce'ye çevirerek gösterelim (opsiyonel) */}
                                            {order.status.replace('Teslim Edildi', 'Delivered').replace('Kargolandı', 'Shipped').replace('İptal Edildi', 'Canceled').replace('Hazırlanıyor', 'Processing')}
                                        </span>
                                    </div>
                                </div>
                                <div className="border-t pt-4 mt-4">
                                    {order.order_items.map(item => (
                                        <div key={item.id} className="flex items-center gap-4 mb-3">
                                            {/* Ürün resmi null değilse göster */}
                                            {item.products ? (
                                                <Image
                                                    src={getSafeImageUrl(item.products.image_urls)}
                                                    alt={item.products.name || 'Product Image'}
                                                    width={64}
                                                    height={64}
                                                    className="rounded-md object-cover w-16 h-16"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-400">No Image</div>
                                            )}
                                            <div>
                                                <p className="font-medium text-gray-800">{item.products?.name || 'Product Not Found'}</p>
                                                <p className="text-sm text-gray-600">{item.quantity} x {currency}{item.price.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* İade Butonu (Sadece teslim edilmiş siparişler için) */}
                                {isDelivered && (
                                    <div className="mt-4 pt-4 border-t flex justify-end">
                                        <button
                                            onClick={() => handleReturnClick(order)}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition shadow-md"
                                        >
                                            <FiRotateCcw />
                                            <span>İade Et</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

             {/* İade Modal'ı */}
             <ReturnRequestModal
                isOpen={isReturnModalOpen}
                onClose={handleCloseModal}
                order={selectedOrderForReturn}
            />
        </div>
    );
};

export default MyOrdersPage;