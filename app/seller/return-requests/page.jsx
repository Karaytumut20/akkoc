// app/seller/return-requests/page.jsx

'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import Loading from '@/components/Loading';
import Image from 'next/image';
import Link from 'next/link';
import { getSafeImageUrl } from '@/lib/utils';
import {
    FiRefreshCw,
    FiCheck,
    FiX,
    FiUser,
    FiMail,
    FiPhone,
    FiInfo,
    FiTag,
    FiCalendar,
    FiCheckCircle,
    FiXCircle,
    FiPackage,
} from 'react-icons/fi';

// Helper function to style return status
const getReturnStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
        case 'approved':
            return { color: 'text-green-700 bg-green-100 border-green-200', icon: <FiCheckCircle size={14} />, text: 'Approved' };
        case 'rejected':
            return { color: 'text-red-700 bg-red-100 border-red-200', icon: <FiXCircle size={14} />, text: 'Rejected' };
        case 'pending':
            return { color: 'text-yellow-700 bg-yellow-100 border-yellow-200', icon: <FiRefreshCw size={14} className="animate-spin" />, text: 'Pending' };
        default:
            return { color: 'text-gray-600 bg-gray-100 border-gray-200', icon: <FiInfo size={14} />, text: status || 'Unknown' };
    }
};

const SellerReturnRequestsPage = () => {
    const [returnRequests, setReturnRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    // Fetch all return requests
    const fetchAllReturnRequests = useCallback(async () => {
        setLoading(true);

        try {
            const { data: returnsData, error: returnsError } = await supabase
                .from('returns')
                .select(`
                    *,
                    product:products (id, name, image_urls, price),
                    order_item:order_items (quantity, price),
                    order:orders (id, created_at, total_amount, address)
                `)
                .order('created_at', { ascending: false });

            if (returnsError) throw returnsError;

            if (!returnsData || returnsData.length === 0) {
                setReturnRequests([]);
                setLoading(false);
                return;
            }

            // Get related users using RPC
            const userIds = [...new Set(returnsData.map(ret => ret.user_id).filter(id => id))];
            let usersMap = {};

            if (userIds.length > 0) {
                const { data: usersData, error: usersError } = await supabase
                    .rpc('get_users_by_ids', { user_ids: userIds });

                if (usersError) {
                    console.error("Failed to fetch users:", usersError.message);
                    toast.error("Some user details could not be loaded.");
                } else if (usersData) {
                    usersMap = usersData.reduce((acc, user) => {
                        acc[user.id] = user;
                        return acc;
                    }, {});
                }
            }

            const combinedData = returnsData.map(ret => ({
                ...ret,
                user_profile: usersMap[ret.user_id] || null,
            }));

            setReturnRequests(combinedData);
        } catch (error) {
            console.error('Error loading return requests:', error);
            toast.error('Error loading return requests: ' + error.message);
            setReturnRequests([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllReturnRequests();
    }, [fetchAllReturnRequests]);

    // Update return request status
    const updateReturnStatus = async (returnId, newStatus) => {
        setActionLoading(`${newStatus.toLowerCase()}-${returnId}`);
        const toastId = toast.loading(`${newStatus === 'Approved' ? 'Approving' : 'Rejecting'} return request...`);

        try {
            const { data, error } = await supabase
                .from('returns')
                .update({ status: newStatus })
                .eq('id', returnId)
                .select();

            if (error) throw error;

            if (data && data.length > 0) {
                toast.success(`Return request successfully ${newStatus.toLowerCase()}.`, { id: toastId });
                fetchAllReturnRequests();
            } else {
                throw new Error("Update failed or no permission.");
            }
        } catch (error) {
            console.error(`Error updating return (${newStatus}):`, error);
            toast.error(`Error updating return request: ${error.message}`, { id: toastId });
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <Loading />;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-900 border-b pb-4">
                Return Requests Management
            </h1>

            {returnRequests.length === 0 ? (
                <p className="text-center text-xl text-gray-500 py-20">
                    There are no return requests yet.
                </p>
            ) : (
                <div className="space-y-6">
                    {returnRequests.map((ret) => {
                        const { color, icon, text: statusText } = getReturnStatusStyle(ret.status);
                        const product = ret.product;
                        const orderItem = ret.order_item;
                        const userProfile = ret.user_profile;
                        const orderAddress = ret.order?.address;

                        const userName = userProfile?.raw_user_meta_data?.full_name || userProfile?.raw_user_meta_data?.display_name || 'No Name';
                        const userEmail = userProfile?.email || 'No Email';
                        const userPhone = userProfile?.raw_user_meta_data?.phone || 'No Phone';

                        const isApproving = actionLoading === `approved-${ret.id}`;
                        const isRejecting = actionLoading === `rejected-${ret.id}`;
                        const isProcessing = isApproving || isRejecting;

                        return (
                            <div key={ret.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                                {/* Header */}
                                <div className={`flex flex-wrap justify-between items-center p-4 border-l-4 ${color.replace('text-', 'border-').replace('bg-', '')}`}>
                                    <div>
                                        <p className="font-semibold text-gray-800 text-sm">Return ID: #{ret.id.slice(0, 8)}</p>
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <FiCalendar size={12}/> {new Date(ret.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 ${color}`}>
                                        {icon} {statusText}
                                    </span>
                                </div>

                                {/* Body */}
                                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Left: Product Info */}
                                    <div className="md:col-span-1 space-y-3">
                                        <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-1">
                                            <FiTag /> Product Information
                                        </h3>
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                                            <Image
                                                src={getSafeImageUrl(product?.image_urls)}
                                                alt={product?.name || 'Product'}
                                                width={60}
                                                height={60}
                                                className="rounded-md object-cover w-15 h-15 border"
                                            />
                                            <div>
                                                <p className="font-medium text-gray-800 text-sm">{product?.name || 'No Product Info'}</p>
                                                <p className="text-xs text-gray-500">Quantity: {orderItem?.quantity || '?'}</p>
                                                <p className="text-xs text-gray-500">Price: {product?.price ? `${product.price.toFixed(2)} ₺` : '?'}</p>
                                            </div>
                                        </div>

                                        {/* Return Reason */}
                                        {ret.reason && (
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 mb-1">Return Reason:</p>
                                                <p className="text-sm text-gray-700 bg-yellow-50 p-2 rounded border border-yellow-200">{ret.reason}</p>
                                            </div>
                                        )}

                                        {/* ✅ Tracking Number */}
                                        {ret.tracking_number && (
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 mb-1">Tracking Number:</p>
                                                <p className="text-sm text-gray-700 bg-blue-50 p-2 rounded border border-blue-200">
                                                    <FiPackage className="inline mr-1 text-blue-500" />
                                                    {ret.tracking_number}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Middle: Customer Info */}
                                    <div className="md:col-span-1 space-y-2 border-t md:border-t-0 md:border-l md:pl-6 pt-4 md:pt-0">
                                        <h3 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-1">
                                            <FiUser /> Customer Information
                                        </h3>
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <FiUser size={14} className="text-gray-400"/> {userName}
                                        </p>
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <FiMail size={14} className="text-gray-400"/> {userEmail}
                                        </p>
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <FiPhone size={14} className="text-gray-400"/> {userPhone}
                                        </p>

                                        {orderAddress && (
                                            <div className='mt-3 pt-3 border-t'>
                                                <p className="text-xs font-medium text-gray-500 mb-1">Address:</p>
                                                <p className='text-sm text-gray-600'>
                                                    {`${orderAddress.area}, ${orderAddress.city}, ${orderAddress.state}`}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="md:col-span-1 space-y-3 border-t md:border-t-0 md:border-l md:pl-6 pt-4 md:pt-0">
                                        <h3 className="font-semibold text-gray-700 text-sm mb-3">Actions</h3>

                                        {ret.status?.toLowerCase() === 'pending' ? (
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <button
                                                    onClick={() => updateReturnStatus(ret.id, 'Approved')}
                                                    disabled={isProcessing}
                                                    className="flex-1 px-3 py-2 bg-green-500 text-white text-xs font-semibold rounded-md hover:bg-green-600 transition disabled:opacity-50 flex items-center justify-center gap-1"
                                                >
                                                    {isApproving ? <FiRefreshCw className="animate-spin"/> : <FiCheck />} Approve
                                                </button>
                                                <button
                                                    onClick={() => updateReturnStatus(ret.id, 'Rejected')}
                                                    disabled={isProcessing}
                                                    className="flex-1 px-3 py-2 bg-red-500 text-white text-xs font-semibold rounded-md hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-1"
                                                >
                                                    {isRejecting ? <FiRefreshCw className="animate-spin"/> : <FiX />} Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <p className='text-sm text-gray-500 italic'>This request has already been processed.</p>
                                        )}

                                        {ret.order?.id && (
                                            <Link href={`/seller/orders`} className="text-xs text-blue-600 hover:underline mt-2 inline-block">
                                                View Order (#{ret.order.id.slice(0, 8)})
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SellerReturnRequestsPage;
