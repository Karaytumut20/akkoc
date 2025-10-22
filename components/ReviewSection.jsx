// components/ReviewSection.jsx

'use client';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';
import Link from 'next/link';
import { FiCheckCircle, FiInfo, FiMessageSquare } from 'react-icons/fi';
import StarRating from './StarRating';

const ReviewsList = ({ reviews }) => {
    const approvedReviews = reviews.filter((r) => r.is_approved === true);
    
    if (approvedReviews.length === 0) {
        return (
            <p className="text-gray-500 text-center py-8">Bu ürün için henüz onaylanmış bir yorum yok.</p>
        );
    }
    return (
        <div className="pt-4 space-y-4">
            {approvedReviews.map((review) => (
                <div
                    key={review.id}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col gap-2"
                >
                    <div className="flex items-center justify-between">
                        <StarRating rating={Number(review.rating)} size={20} />
                        <span className={`text-sm font-medium ${review.user_id === supabase.auth.user()?.id ? "text-teal-600" : "text-gray-600"}`}>
                            {review.user_id === supabase.auth.user()?.id
                                ? "Siz (Yorumunuz)"
                                : review.users?.email ? `${review.users.email.split('@')[0]}...` : "Kullanıcı"}
                        </span>
                    </div>
                    <p className="text-gray-800 text-base leading-relaxed">"{review.comment}"</p>
                    <span className="text-xs text-gray-400">
                        {new Date(review.created_at).toLocaleDateString("tr-TR", { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                </div>
            ))}
        </div>
    );
};


const ReviewForm = ({ productId, userReview, hasPurchased, fetchReviews }) => {
    const { user, router } = useAppContext();
    const [userRating, setUserRating] = useState(0);
    const [userComment, setUserComment] = useState("");
    const [loading, setLoading] = useState(false);

    if (!user) {
        return (
            <p className="text-center text-gray-600 p-4 rounded-lg flex items-center gap-3 justify-center">
                <FiInfo className="w-5 h-5 text-gray-500 flex-shrink-0"/>
                Yorum yazmak için <button onClick={() => router.push("/auth")} className="text-teal-600 font-semibold underline hover:no-underline">giriş yapın</button>.
            </p>
        );
    }

    if (userReview) {
        return (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-3">
                <FiCheckCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                    <p className="font-semibold">Yorumunuz Gönderildi!</p>
                    <p className="text-sm">Bu ürün için zaten bir yorum yaptınız. Yorumunuz onay sürecindedir.</p>
                </div>
            </div>
        );
    }

    if (!hasPurchased) {
        return (
            <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg flex items-center gap-3">
                <FiInfo className="w-5 h-5 flex-shrink-0" />
                <div>
                    <p className="font-semibold">Satın Alma Gerekli</p>
                    <p className="text-sm">Yorum yazabilmek için ürünü **satın almış olmanız** gerekiyor 🛍️</p>
                </div>
            </div>
        );
    }

    const handleSubmitReview = async () => {
        if (userRating === 0 || userComment.trim().length < 10) {
            toast.error("Lütfen puan verin ve en az 10 karakterlik yorum yazın.");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.from("reviews").insert([
                {
                    product_id: productId,
                    user_id: user.id,
                    rating: Number(userRating),
                    comment: userComment,
                    is_approved: false,
                },
            ]);

            if (error) throw new Error(error.message);

            toast.success("Yorumunuz incelenmek üzere gönderildi! Teşekkür ederiz.");
            setUserRating(0);
            setUserComment("");
            fetchReviews(); // Yorumları yenile
        } catch (e) {
            toast.error("Yorum gönderilemedi: " + e.message);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="pt-4 border-t border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Sizin Yorumunuz</h3>
            <div className="flex justify-center mb-3">
                <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setUserRating(i + 1)}
                            className="focus:outline-none"
                        >
                            <svg
                                className={`w-7 h-7 transition-colors duration-200 ${i < userRating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.561-.955L10 0l2.95 5.955 6.561.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                        </button>
                    ))}
                </div>
            </div>
            <textarea
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                placeholder="Ürünle ilgili düşüncelerinizi yazın (min. 10 karakter)..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none mb-3 transition"
                maxLength={500}
                disabled={loading}
            />
            <button
                onClick={handleSubmitReview}
                disabled={loading || userRating === 0 || userComment.trim().length < 10}
                className={`w-full font-semibold py-3 rounded-lg transition duration-300 ${
                    loading || userRating === 0 || userComment.trim().length < 10
                        ? "bg-gray-400 cursor-not-allowed text-gray-100"
                        : "bg-teal-600 hover:bg-teal-700 text-white shadow-md"
                }`}
            >
                {loading ? 'Gönderiliyor...' : 'Yorumu Gönder'}
            </button>
        </div>
    );
};


// Ana ReviewSection Bileşeni
const ReviewSection = ({ productId, reviews, userReview, hasPurchased, fetchReviews }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-4">
            {/* Yorum Yazma Formu */}
            <div className="lg:order-1 bg-gray-50 p-6 rounded-xl shadow-inner border border-gray-200">
                <ReviewForm 
                    productId={productId}
                    userReview={userReview}
                    hasPurchased={hasPurchased}
                    fetchReviews={fetchReviews}
                />
            </div>
            
            {/* Yorum Listesi */}
            <div className="lg:order-2">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                    <FiMessageSquare className="w-6 h-6 text-teal-600" /> Müşteri Yorumları
                </h3>
                <div className="max-h-[500px] overflow-y-auto pr-2">
                    <ReviewsList reviews={reviews} />
                </div>
            </div>
        </div>
    );
};

export default ReviewSection;