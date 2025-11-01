// app/account/my-orders/page.jsx

'use client';
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAppContext } from "@/context/AppContext";
import Loading from "@/components/Loading";
import Image from "next/image";
import { getSafeImageUrl } from "@/lib/utils";
import toast from 'react-hot-toast';
import { supabase } from "@/lib/supabaseClient";
import ReturnReasonModal from "@/components/ReturnReasonModal";

const MyOrdersPage = () => {
    const { currency, myOrders, fetchMyOrders, user, authLoading } = useAppContext();
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [itemToReturn, setItemToReturn] = useState(null);
    const [localLoading, setLocalLoading] = useState(false);

    // Fetch orders when user changes
    useEffect(() => {
        if (user && !authLoading) {
            setLocalLoading(true);
            fetchMyOrders(user.id).finally(() => setLocalLoading(false));
        }
    }, [user, authLoading, fetchMyOrders]);

    // Return color based on status
    const getStatusColor = useCallback((status) => {
        const statusMap = {
            'Delivered': 'bg-green-100 text-green-800',
            'Shipped': 'bg-blue-100 text-blue-800',
            'Canceled': 'bg-red-100 text-red-800',
            'Processing': 'bg-yellow-100 text-yellow-800',
            'Teslim Edildi': 'bg-green-100 text-green-800',
            'Kargolandı': 'bg-blue-100 text-blue-800',
            'İptal Edildi': 'bg-red-100 text-red-800',
            'İşleniyor': 'bg-yellow-100 text-yellow-800'
        };
        return statusMap[status] || 'bg-yellow-100 text-yellow-800';
    }, []);

    // Check if return button should be visible
    const canShowReturnButton = useCallback((status) => {
        return status === 'Delivered' || status === 'Teslim Edildi';
    }, []);

    // Open return modal
    const openReturnModal = useCallback((order, item) => {
        const existingReturn = item.returns && item.returns.length > 0;
        if (existingReturn) {
            toast.error('You already have a return request for this item.');
            return;
        }

        setItemToReturn({
            orderId: order.id,
            orderItemId: item.id,
            productId: item.products.id,
            productName: item.products.name,
            itemData: item
        });
        setIsReturnModalOpen(true);
    }, []);

    // Close return modal
    const closeReturnModal = useCallback(() => {
        setIsReturnModalOpen(false);
        setItemToReturn(null);
    }, []);

    // Submit return request (includes tracking_number from orders table)
    const submitReturnRequest = useCallback(async (reason) => {
        if (!itemToReturn || !user) {
            toast.error('Unable to create return request. Please try again.');
            return;
        }

        const { orderId, orderItemId, productId, productName } = itemToReturn;
        const toastId = toast.loading('Creating return request...');

        try {
            // 1️⃣ Fetch tracking_number from orders table
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('tracking_number')
                .eq('id', orderId)
                .single();

            if (orderError) throw orderError;

            // 2️⃣ Insert new return record
            const { error } = await supabase
                .from('returns')
                .insert({
                    order_id: orderId,
                    order_item_id: orderItemId,
                    product_id: productId,
                    user_id: user.id,
                    tracking_number: orderData?.tracking_number || null, // ✅ auto-fill tracking number
                    status: 'Pending',
                    reason: reason,
                    created_at: new Date().toISOString()
                });

            if (error) {
                if (error.code === '23505') {
                    toast.error('A return request for this item already exists.', { id: toastId });
                } else {
                    throw error;
                }
            } else {
                toast.success(`Return request created for '${productName}'.`, { id: toastId });
                closeReturnModal();
                fetchMyOrders(user.id);
            }
        } catch (err) {
            console.error("Return request error:", err);
            toast.error('Error while creating return request: ' + err.message, { id: toastId });
        }
    }, [user, itemToReturn, closeReturnModal, fetchMyOrders]);

    // Render orders
    const ordersList = useMemo(() => {
        return myOrders.map(order => (
            <div key={order.id} className="bg-[#ffffff] border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6">
                {/* Order header */}
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

                {/* Order items */}
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
                                    priority={false}
                                />
                                <div>
                                    <p className="font-medium text-gray-800">{item.products.name}</p>
                                    <p className="text-sm text-gray-600">
                                        {item.quantity} × {currency}{item.price.toFixed(2)}
                                    </p>
                                    {item.returns && item.returns.length > 0 && (
                                        <p className="text-xs text-orange-600 mt-1">
                                            Return request: {item.returns[0].status}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Return button */}
                            {canShowReturnButton(order.status) && (
                                <button
                                    onClick={() => openReturnModal(order, item)}
                                    disabled={item.returns && item.returns.length > 0}
                                    className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-semibold rounded-md hover:bg-red-200 transition mt-2 sm:mt-0 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                                >
                                    {item.returns && item.returns.length > 0
                                        ? 'Return Request Exists'
                                        : 'Return Item'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        ));
    }, [myOrders, currency, getStatusColor, canShowReturnButton, openReturnModal]);

    if (authLoading || localLoading) return <Loading />;

    return (
        <div className="min-h-screen bg-[#ffffff] p-4 sm:p-6">
            <h1 className="text-2xl sm:text-3xl font-semibold mb-8 text-gray-800">My Orders</h1>

            {myOrders.length === 0 ? (
                <div className="text-center py-16 text-gray-500 bg-white rounded-lg border border-gray-200">
                    <p className="text-lg">You haven't placed any orders yet.</p>
                    <p className="text-sm mt-2">Your orders will appear here once you make a purchase.</p>
                </div>
            ) : (
                <div className="space-y-6 max-w-4xl mx-auto">
                    {ordersList}
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
