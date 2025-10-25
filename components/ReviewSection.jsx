// components/ReviewSection.jsx

'use client';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';
import Link from 'next/link';
import { FiCheckCircle, FiInfo, FiMessageSquare } from 'react-icons/fi';
import StarRating from './StarRating';

// --- Utility Function: Email Masking ---
const maskEmail = (email) => {
  if (!email || typeof email !== 'string' || !email.includes('@')) return 'Anonim Kullanıcı';
  const parts = email.split('@');
  const localPart = parts[0];
  const domain = parts[1];

  // E-postanın yerel kısmının ilk 2 karakterini göster, gerisini maskele
  const visibleChars = Math.min(2, localPart.length);
  const maskedLocal = localPart.substring(0, visibleChars) + '***';

  return `${maskedLocal}@${domain}`;
};

// --- Utility Function: Phone Masking ---
const maskPhone = (phone) => {
  if (!phone || typeof phone !== 'string' || phone.length < 4) return 'Telefon Yok';
  
  const digits = phone.replace(/\D/g, ''); // Tüm non-digit karakterleri kaldır
  if (digits.length < 4) return 'Telefon Yok';
  
  // Sadece son 4 haneyi göster (Örn: *** *** 1234)
  const visibleChars = digits.slice(-4);
  const maskedPrefix = '*** *** '; 

  return `${maskedPrefix}${visibleChars}`;
};


// --- ReviewsList Component ---
const ReviewsList = ({ reviews, currentUserId }) => {
  // Filter only approved reviews
  const approvedReviews = reviews.filter((r) => r.is_approved === true || r.is_approved === 'true' || r.is_approved === 1);

  if (approvedReviews.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        There are no approved reviews for this product yet.
      </p>
    );
  }

  return (
    <div className="pt-4 space-y-4">
      {approvedReviews.map((review) => {
        const isCurrentUserReview = review.user_id === currentUserId;
        
        const profile = review.reviewer;
        
        // 1. Full Name > 2. Display Name > 3. Email Local Part önceliklendirmesi (Kullanıcının isteği)
        const fullName = profile?.full_name;
        const displayName = profile?.display_name;
        const emailLocalPart = profile?.email?.split('@')[0];

        // Gösterilecek kimlik bilgisini belirleme: FULL NAME en yüksek önceliktedir.
        const displayedIdentifier = isCurrentUserReview 
            ? "Siz"
            : fullName || displayName || emailLocalPart || "Anonim Kullanıcı";
        
        // Maskelenmiş iletişim bilgileri
        const maskedEmail = profile?.email ? maskEmail(profile.email) : "Email Yok";
        const maskedPhone = profile?.phone ? maskPhone(profile.phone) : "Telefon Yok";


        return (
          <div
            key={review.id}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col gap-2"
          >
            {/* YILDIZ ve KULLANICI BİLGİSİ YANYANA */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StarRating rating={Number(review.rating)} size={20} />
                <span
                  className={`text-base font-semibold ${
                    isCurrentUserReview ? "text-[#be531c]" : "text-gray-800"
                  }`}
                  title={isCurrentUserReview ? "Bu sizin yorumunuz." : maskedEmail}
                >
                  {displayedIdentifier}
                  {isCurrentUserReview && <span className='text-sm font-normal text-gray-500 ml-1'>(Yorumunuz)</span>}
                </span>
              </div>
            </div>
            
            <p className="text-gray-800 text-base leading-relaxed">
              "{review.comment}"
            </p>
            
            {/* Detay Bilgileri (Alt Alt) */}
            <div className="text-xs text-gray-500 space-y-1 pt-2 border-t mt-1">
                <p>
                    <strong>E-posta:</strong> {maskedEmail}
                </p>
                {maskedPhone !== "Telefon Yok" && (
                     <p>
                        <strong>Telefon:</strong> {maskedPhone}
                    </p>
                )}
                 <p className="text-xs text-gray-400">
                    <strong>Tarih:</strong> {new Date(review.created_at).toLocaleDateString("tr-TR", {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    })}
                </p>
            </div>
            
          </div>
        );
      })}
    </div>
  );
};


// --- ReviewForm Component ---
const ReviewForm = ({ productId, userReview, hasPurchased, fetchReviews }) => {
    const { user, router, reviewPermissionSetting } = useAppContext();
    const [userRating, setUserRating] = useState(0);
    const [userComment, setUserComment] = useState("");
    const [loading, setLoading] = useState(false);

    // ... (rest of ReviewForm logic remains the same) ...

    if (!user) {
      return (
        <p className="text-center text-gray-600 p-4 rounded-lg flex items-center gap-3 justify-center">
          <FiInfo className="w-5 h-5 text-gray-500 flex-shrink-0" />
          To write a review, please{" "}
          <button
            onClick={() => router.push("/auth")}
            className="text-[#be531c] font-semibold underline hover:no-underline"
          >
            log in
          </button>.
        </p>
      );
    }

    if (userReview) {
      return (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-3">
          <FiCheckCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Your review has been submitted!</p>
            <p className="text-sm">
              It will be published after approval. You can only submit one review per product.
            </p>
          </div>
        </div>
      );
    }

    if (reviewPermissionSetting === 'purchasers_only' && !hasPurchased) {
        return (
          <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg flex items-center gap-3">
            <FiInfo className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Purchase Required</p>
              <p className="text-sm">
                According to store settings, only users who have <strong>purchased</strong> this product can leave a review 🛍️
              </p>
            </div>
          </div>
        );
    }

    const handleSubmitReview = async () => {
      if (userRating === 0 || userComment.trim().length < 10) {
        toast.error("Please provide a rating and a comment (at least 10 characters).");
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
            is_approved: false, // Start as unapproved
          },
        ]);

        if (error) throw new Error(error.message);

        toast.success("Your review has been submitted for approval! Thank you.");
        setUserRating(0);
        setUserComment("");
        fetchReviews();
      } catch (e) {
        toast.error("Could not submit review: " + e.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="pt-4 border-t border-gray-100">
        <h3 className="text-xl font-semibold text-gray-800 mb-3">Your Review</h3>
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
                  className={`w-7 h-7 transition-colors duration-200 ${
                    i < userRating
                      ? 'text-yellow-400'
                      : 'text-gray-300 hover:text-yellow-300'
                  }`}
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
          placeholder="Share your thoughts about this product (min. 10 characters)..."
          rows={4}
          className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-[#be531c] focus:border-[#be531c] outline-none resize-none mb-3 transition"
          maxLength={500}
          disabled={loading}
        />
        <button
          onClick={handleSubmitReview}
          disabled={loading || userRating === 0 || userComment.trim().length < 10}
          className={`w-full font-semibold py-3 rounded-lg transition duration-300 ${
            loading || userRating === 0 || userComment.trim().length < 10
              ? "bg-gray-400 cursor-not-allowed text-gray-100"
              : "bg-[#be531c] hover:bg-[#a64919] text-white shadow-md"
          }`}
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    );
};


// --- ReviewSection Component (Main container) ---
const ReviewSection = ({ productId, reviews, userReview, hasPurchased, fetchReviews }) => {
  // 🔥 FIX: Get user object from context
  const { user } = useAppContext();
  // Get current user's ID, or null if not logged in
  const currentUserId = user ? user.id : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-4">
      {/* Review Form Area */}
      <div className="lg:order-1 bg-gray-50 p-6 rounded-xl shadow-inner border border-gray-200">
        <ReviewForm
          productId={productId}
          userReview={userReview}
          hasPurchased={hasPurchased}
          fetchReviews={fetchReviews}
        />
      </div>

      {/* Reviews List Area */}
      <div className="lg:order-2">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
          <FiMessageSquare className="w-6 h-6 text-[#be531c]" /> Customer Reviews
        </h3>
        <div className="max-h-[500px] overflow-y-auto pr-2">
          {/* 🔥 FIX: Pass currentUserId as a prop to ReviewsList */}
          <ReviewsList reviews={reviews} currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  );
};

export default ReviewSection;