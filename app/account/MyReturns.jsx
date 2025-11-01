// app/account/MyReturns.jsx

'use client';

import React from 'react';
import { useAppContext } from '@/context/AppContext'; // Import AppContext
import Loading from '@/components/Loading'; // Loading component
import Image from 'next/image';
import { getSafeImageUrl } from '@/lib/utils'; // Safe image URL utility
import { 
    FiRefreshCw, // Pending / Processing (Return Code)
    FiCheckCircle, // Completed
    FiXCircle, // Rejected
    FiAlertCircle, // Unknown / Pending
    FiTruck, // Approved / Waiting for shipment
} from 'react-icons/fi'; 

const MyReturns = () => {
    // Get return requests, loading state, and currency from context
    const { myReturns, authLoading, currency } = useAppContext();

    // UPDATED RETURN STATUS AND MESSAGES (in English)
    const getReturnStatusData = (status) => {
        // Compare status by converting to lowercase
        switch (status?.toLowerCase()) {
            case 'approved': // Approved (Waiting for Shipment)
                return { 
                    color: 'text-blue-600 bg-blue-100', 
                    icon: <FiTruck />, 
                    text: 'Approved (Awaiting Shipment)',
                    detail: 'Your return request has been approved. Please deliver the product to the cargo company.'
                };
            case 'rejected': // Rejected
                return { 
                    color: 'text-red-600 bg-red-100', 
                    icon: <FiXCircle />, 
                    text: 'Rejected',
                    detail: 'Your return request has been rejected. Please contact us for detailed information.'
                };
            case 'processing': // Processing (Item reached, being inspected)
                return { 
                    color: 'text-purple-600 bg-purple-100', 
                    icon: <FiRefreshCw className="animate-spin" />, 
                    text: 'Processing (Item Received)',
                    detail: 'Your return package has arrived at our warehouse and is currently being inspected.'
                };
            case 'completed': // Completed (Refund issued)
                return { 
                    color: 'text-green-600 bg-green-100', 
                    icon: <FiCheckCircle />, 
                    text: 'Completed (Refund Issued)',
                    detail: 'Your refund has been successfully processed. The time it takes to reflect in your account depends on your bank.'
                };
            case 'pending': // Pending (Initial request)
            default: // Other or unknown statuses
                return { 
                    color: 'text-yellow-600 bg-yellow-100', 
                    icon: <FiAlertCircle />, 
                    text: 'Pending (Under Review)',
                    detail: 'Your return request has been received and is under review. We will get back to you shortly.'
                };
        }
    };

    // Show Loading component if data is loading
    if (authLoading) {
        return <Loading />;
    }

    return (
        <div>
            {/* Section title */}
            <h2 className="text-xl font-semibold text-gray-800 mb-6">My Return Requests</h2>

            {/* Message if no return request found */}
            {myReturns.length === 0 ? (
                <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-lg">
                    {/* Icon */}
                    <FiRefreshCw className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                    <p>You haven't requested any returns yet.</p>
                </div>
            ) : (
                // List return requests
                <div className="space-y-6">
                    {myReturns.map((ret) => {
                        // Get status details
                        const statusData = getReturnStatusData(ret.status);
                        const { color, icon, text: statusText, detail: statusDetail } = statusData;
                        // Safely get product information
                        const productName = ret.product?.name || 'Product Not Available'; 
                        const productImageUrl = getSafeImageUrl(ret.product?.image_urls); 
                        const itemQuantity = ret.order_item?.quantity || '?'; 
                        const itemPrice = ret.order_item?.price ?? 0; 
                        // DEĞİŞİKLİK: tracking_number sütunundaki veriyi kullan
                        const returnCode = ret.tracking_number || 'Not Assigned';

                        return (
                            // Card structure for each return request
                            <div key={ret.id} className="border rounded-lg bg-[#ffffff] shadow-lg overflow-hidden">
                                {/* Top Section: Status and Request Date */}
                                <div className="flex flex-wrap justify-between items-center p-3 sm:p-4 border-b gap-2 bg-gray-50/70">
                                    {/* Status tag */}
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 ${color}`}>
                                        {icon} {statusText}
                                    </span>
                                    {/* Request Date */}
                                    <p className="text-xs text-gray-500">Request Date: {new Date(ret.created_at).toLocaleDateString()}</p>
                                </div>
                                
                                {/* DETAIL SECTION */}
                                <div className="p-4 sm:p-6 space-y-4">
                                    
                                    {/* Return Code and Shipping Info */}
                                    <div className="border border-dashed border-gray-300 p-3 rounded-lg bg-[#ffffff]">
                                        <p className="text-sm font-bold text-gray-800 mb-2">Return Code (Reference): <span className="text-red-600">{returnCode}</span></p>
                                        <div className={`p-2 rounded-md ${color.split(' ')[1]}`}>
                                            <p className={`text-sm font-medium ${color.split(' ')[0]}`}>{statusDetail}</p>
                                            {/* Shipping code waiting message (for Approved) */}
                                            {ret.status?.toLowerCase() === 'approved' && (
                                                <p className="text-xs mt-1 text-blue-700">Please keep your shipping tracking number and do not forget to write your return code on the package: <span className='font-bold'>{returnCode}</span></p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex items-start gap-4 pt-4 border-t border-gray-100">
                                        {/* Product Image */}
                                        <Image
                                            src={productImageUrl}
                                            alt={productName}
                                            width={60} 
                                            height={60} 
                                            className="rounded-md object-cover w-15 h-15 flex-shrink-0 border bg-gray-100" 
                                        />
                                        {/* Product Details and Return Reason */}
                                        <div className="flex-grow space-y-1">
                                            <p className="font-semibold text-gray-800">{productName}</p>
                                            <p className="text-sm text-gray-600">Quantity: {itemQuantity}</p>
                                            <p className="text-sm text-gray-600">Unit Price: {currency}{itemPrice.toFixed(2)}</p>
                                            {/* Return Reason (if available) */}
                                            {ret.reason && (
                                                <div className="mt-2 pt-2 border-t border-gray-100">
                                                    <p className="text-xs font-medium text-gray-500 mb-1">Reason for Return:</p>
                                                    <p className="text-sm text-gray-700 bg-yellow-50 p-2 rounded border border-yellow-200">{ret.reason}</p>
                                                </div>
                                            )}
                                        </div>
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

export default MyReturns;