// app/account/my-orders/page.jsx

'use client';
import React, { useEffect, useState, useCallback } from "react";
import { useAppContext } from "@/context/AppContext";
import Loading from "@/components/Loading";
import Image from "next/image";
import { getSafeImageUrl } from "@/lib/utils";
import toast from 'react-hot-toast';
import { supabase } from "@/lib/supabaseClient";
import ReturnReasonModal from "@/components/ReturnReasonModal";

const MyOrdersPage = () => {
    const { currency, myOrders, fetchMyOrders, user, authLoading, getTrackingInfo } = useAppContext();
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [itemToReturn, setItemToReturn] = useState(null);
    const [trackingData, setTrackingData] = useState({}); // Takip bilgilerini saklamak için

    useEffect(() => {
        if (user) {
            fetchMyOrders(user.id);
        }
    }, [user, fetchMyOrders]);

    // Takip bilgilerini getirme fonksiyonu
    const handleTrackPackage = async (trackingNumber, orderId) => {
        if (!trackingNumber) {
            toast.error("No tracking number available.");
            return;
        }

        const toastId = toast.loading("Getting tracking information...");
        try {
            const trackingInfo = await getTrackingInfo(trackingNumber);
            
            if (trackingInfo) {
                setTrackingData(prev => ({
                    ...prev,
                    [orderId]: trackingInfo
                }));
            }
        } catch (error) {
            console.error("Tracking error:", error);
        } finally {
            toast.dismiss(toastId);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Teslim Edildi': case 'Delivered': return 'bg-green-100 text-green-800';
            case 'Kargolandı': case 'Shipped': return 'bg-blue-100 text-blue-800';
            case 'İptal Edildi': case 'Canceled': return 'bg-red-100 text-red-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    const openReturnModal = (order, item) => {
        setItemToReturn({
            orderId: order.id,
            orderItemId: item.id,
            productId: item.products.id,
            productName: item.products.name,
            itemData: item
        });
        setIsReturnModalOpen(true);
    };

    const closeReturnModal = () => {
        setIsReturnModalOpen(false);
        setItemToReturn(null);
    };

    const submitReturnRequest = useCallback(async (reason) => {
        if (!itemToReturn) {
            toast.error('İade edilecek ürün bilgisi bulunamadı.');
            return;
        }

        const { orderId, orderItemId, productId, productName } = itemToReturn;
        const toastId = toast.loading('İade talebi oluşturuluyor...');

        try {
            const { error } = await supabase
                .from('returns')
                .insert({
                    order_id: orderId,
                    order_item_id: orderItemId,
                    product_id: productId,
                    user_id: user.id,
                    status: 'Pending',
                    reason: reason
                });

            if (error) {
                if (error.code === '23505') {
                    toast.error('Bu ürün için zaten bir iade talebiniz mevcut.', { id: toastId });
                } else {
                    throw error;
                }
            } else {
                toast.success(`'${productName}' için iade talebi alındı.`, { id: toastId });
                closeReturnModal();
            }
        } catch (err) {
            console.error("İade talebi hatası:", err);
            toast.error('İade talebi oluşturulurken bir hata oluştu: ' + err.message, { id: toastId });
        }
    }, [user, itemToReturn]);

    if (authLoading) return <Loading />;

    return (
        <div>
            <h1 className="text-2xl sm:text-3xl font-semibold mb-8 text-gray-800">My Orders</h1>
            
            {myOrders.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                    <p>You haven't placed any orders yet.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {myOrders.map(order => (
                        <div key={order.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6">
                            {/* Sipariş başlık bilgileri */}
                            <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                <div>
                                    <p className="font-bold text-gray-800">Order ID: #{order.id.slice(0, 8)}</p>
                                    <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="font-semibold text-lg">{currency}{order.total_amount.toFixed(2)}</p>
                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>

                            {/* TAKİP NUMARASI BÖLÜMÜ - BURASI YENİ */}
                            {order.tracking_number && (
                                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-blue-800 mb-1">📦 Shipping Information</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-600">Tracking Number:</span>
                                                <code className="text-blue-600 font-mono text-sm bg-blue-100 px-2 py-1 rounded">
                                                    {order.tracking_number}
                                                </code>
                                            </div>
                                            {order.shipping_cost && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Shipping Cost: <span className="font-semibold">{currency}{order.shipping_cost}</span>
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleTrackPackage(order.tracking_number, order.id)}
                                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                Track Package
                                            </button>
                                            <a
                                                href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${order.tracking_number}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-4 py-2 border border-blue-600 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors"
                                            >
                                                View on USPS
                                            </a>
                                        </div>
                                    </div>

                                    {/* Takip Detayları */}
                                    {trackingData[order.id] && (
                                        <div className="mt-4 p-3 bg-white rounded border">
                                            <div className="flex items-center mb-2">
                                                <div className={`w-2 h-2 rounded-full mr-2 ${
                                                    trackingData[order.id].status === 'Delivered' ? 'bg-green-500' : 
                                                    trackingData[order.id].status === 'In Transit' ? 'bg-blue-500' : 'bg-yellow-500'
                                                }`}></div>
                                                <span className="font-medium text-sm">
                                                    Status: {trackingData[order.id].status}
                                                </span>
                                            </div>
                                            
                                            {trackingData[order.id].estimatedDelivery && (
                                                <p className="text-xs text-gray-600 mb-2">
                                                    Estimated Delivery: {new Date(trackingData[order.id].estimatedDelivery).toLocaleDateString()}
                                                </p>
                                            )}

                                            {trackingData[order.id].details && trackingData[order.id].details.length > 0 && (
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-gray-700">Latest Updates:</p>
                                                    {trackingData[order.id].details.slice(0, 3).map((detail, index) => (
                                                        <div key={index} className="flex text-xs">
                                                            <div className="w-1 bg-blue-200 rounded-full mr-2 mt-1"></div>
                                                            <p className="text-gray-600">{detail}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {trackingData[order.id].isReal === false && (
                                                <p className="text-xs text-yellow-600 mt-2">
                                                    ⚠️ Demo tracking data - Configure real USPS API for live updates
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Sipariş kalemleri */}
                            <div className="border-t pt-4 mt-4">
                                {order.order_items.map(item => (
                                    <div key={item.id} className="flex items-start sm:items-center justify-between gap-4 mb-3 flex-wrap">
                                        <div className="flex items-center gap-4">
                                            <Image
                                                src={getSafeImageUrl(item.products.image_urls)}
                                                alt={item.products.name}
                                                width={64}
                                                height={64}
                                                className="rounded-md object-cover w-16 h-16"
                                            />
                                            <div>
                                                <p className="font-medium text-gray-800">{item.products.name}</p>
                                                <p className="text-sm text-gray-600">{item.quantity} x {currency}{item.price.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        {(order.status === 'Teslim Edildi' || order.status === 'Delivered') && (
                                            <button
                                                onClick={() => openReturnModal(order, item)}
                                                className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-semibold rounded-md hover:bg-red-200 transition mt-2 sm:mt-0"
                                            >
                                                Return Item
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ReturnReasonModal
                isOpen={isReturnModalOpen}
                onClose={closeReturnModal}
                orderItem={itemToReturn?.itemData}
                onSubmitReturn={submitReturnRequest}
            />
        </div>
    );
};

export default MyOrdersPage;