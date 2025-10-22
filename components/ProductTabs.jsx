// components/ProductTabs.jsx

'use client';

import React from 'react';
import ReviewSection from './ReviewSection'; // YENİ
import { FiCheckCircle, FiInfo } from 'react-icons/fi';

const ProductTabs = ({ product, reviews, averageRating, activeTab, setActiveTab, userReview, hasPurchased, fetchReviews }) => {

    const approvedReviews = reviews.filter((r) => r.is_approved === true);

    const DescriptionContent = () => (
        <div className="mt-6 space-y-6 bg-gradient-to-br from-[#FFFFF0] to-[#f0fff0] rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="border-b pb-4">
                <h2 className="font-semibold text-xl text-gray-900 mb-2 tracking-wide">
                    Ürün Açıklaması
                </h2>
                <p className="text-gray-700 leading-relaxed text-base">
                    {product.description || "Bu ürün için bir açıklama mevcut değil."}
                </p>
            </div>

            <div>
                <h2 className="font-semibold text-xl text-gray-900 mb-2 tracking-wide">
                    Ürün Detayları
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
                    <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full font-medium">
                    <strong>Kategori:</strong>{" "}
                    {product.categories?.name || "Belirtilmemiş"}
                    </span>
                    <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full font-medium">
                    <strong>Stok:</strong> {product.stock} adet
                    </span>
                    <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full font-medium">
                    <strong>Kod:</strong>{" "}
                    {product.id.substring(0, 8)}
                    </span>
                </div>
            </div>
        </div>
    );

    return (
        <div>
            {/* Sekmeler */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('description')}
                    className={`py-3 px-6 text-lg font-medium transition-colors duration-300 ${
                        activeTab === 'description' 
                            ? 'border-b-2 border-teal-600 text-teal-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Açıklama & Detaylar
                </button>
                <button
                    onClick={() => setActiveTab('reviews')}
                    className={`py-3 px-6 text-lg font-medium transition-colors duration-300 flex items-center gap-2 ${
                        activeTab === 'reviews' 
                            ? 'border-b-2 border-teal-600 text-teal-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Yorumlar 
                    <span className={`text-sm rounded-full px-2 py-0.5 font-bold ${activeTab === 'reviews' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {approvedReviews.length}
                    </span>
                </button>
            </div>

            {/* İçerik */}
            <div className="min-h-[300px]">
                {activeTab === 'description' && <DescriptionContent />}
                {activeTab === 'reviews' && (
                    <ReviewSection 
                        productId={product.id}
                        reviews={reviews}
                        userReview={userReview}
                        hasPurchased={hasPurchased}
                        fetchReviews={fetchReviews}
                    />
                )}
            </div>
        </div>
    );
}

export default ProductTabs;