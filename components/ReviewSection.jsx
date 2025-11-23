'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { FiMessageSquare, FiInfo } from 'react-icons/fi';
import StarRating from './StarRating';
import ReviewForm from './ReviewForm';
import { useAppContext } from '@/context/AppContext';

// --- Utility Functions ---
const maskEmail = (email) => {
  if (!email || typeof email !== 'string' || !email.includes('@')) return 'Anonymous User';
  const parts = email.split('@');
  const localPart = parts[0];
  const domain = parts[1];
  const visibleChars = Math.min(2, localPart.length);
  const maskedLocal = localPart.substring(0, visibleChars) + '***';
  return `${maskedLocal}@${domain}`;
};

const maskPhone = (phone) => {
  // No Phone check or formatting
  return 'No Phone'; // Simplified for this example as per request to English
};

// --- ReviewsList Component ---
const ReviewsList = ({ reviews, currentUserId }) => {
  // State for image modal
  const [selectedImage, setSelectedImage] = useState(null);

  const approvedReviews = reviews.filter((r) => r.is_approved === true || r.is_approved === 'true' || r.is_approved === 1);

  if (approvedReviews.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
        There are no approved reviews for this product yet. Be the first to review!
      </p>
    );
  }

  return (
    <div className="pt-4 space-y-6">
      {/* Image Zoom Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
            <Image 
              src={selectedImage} 
              alt="Review Large" 
              fill 
              className="object-contain"
            />
            <button className="absolute top-4 right-4 text-white bg-gray-800/50 rounded-full p-2">
                <FiInfo size={24}/> 
            </button>
          </div>
        </div>
      )}

      {approvedReviews.map((review) => {
        const isCurrentUserReview = review.user_id === currentUserId;
        const profile = review.reviewer;
        
        const fullName = profile?.full_name;
        const displayName = profile?.display_name;
        const emailLocalPart = profile?.email?.split('@')[0];

        const displayedIdentifier = isCurrentUserReview 
            ? "You"
            : fullName || displayName || emailLocalPart || "Anonymous User";
        
        return (
          <div
            key={review.id}
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3 transition hover:shadow-md"
          >
            {/* Header: Rating and Name */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 rounded-full p-1">
                    <FiMessageSquare className="text-gray-400 w-6 h-6 m-1" />
                </div>
                <div>
                    <span
                    className={`text-sm font-bold block ${
                        isCurrentUserReview ? "text-orange-600" : "text-gray-900"
                    }`}
                    >
                    {displayedIdentifier}
                    {isCurrentUserReview && <span className='text-xs font-normal text-gray-500 ml-1'>(Your Review)</span>}
                    </span>
                    <StarRating rating={Number(review.rating)} size={14} />
                </div>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(review.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            
            {/* Review Text */}
            <p className="text-gray-700 text-sm leading-relaxed pl-1">
              {review.comment}
            </p>

            {/* Review Images */}
            {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mt-2 pl-1">
                    {review.images.map((imgUrl, idx) => (
                        <div 
                            key={idx} 
                            className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 cursor-zoom-in group"
                            onClick={() => setSelectedImage(imgUrl)}
                        >
                            <Image 
                                src={imgUrl} 
                                alt={`Review image ${idx}`} 
                                fill 
                                className="object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </div>
                    ))}
                </div>
            )}
            
          </div>
        );
      })}
    </div>
  );
};

// --- Main ReviewSection Component ---
const ReviewSection = ({ productId, reviews, userReview, hasPurchased, fetchReviews }) => {
  const { user } = useAppContext();
  const currentUserId = user ? user.id : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-8">
      {/* Left Side: Review Form (4/12 ratio) */}
      <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit">
        <ReviewForm
          productId={productId}
          onReviewAdded={fetchReviews}
        />
      </div>

      {/* Right Side: Review List (8/12 ratio) */}
      <div className="lg:col-span-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4 flex items-center gap-2">
          <FiMessageSquare className="text-orange-600" /> Customer Reviews 
          <span className="text-sm font-normal text-gray-500 ml-2">({reviews.filter(r => r.is_approved).length})</span>
        </h3>
        
        <ReviewsList reviews={reviews} currentUserId={currentUserId} />
      </div>
    </div>
  );
};

export default ReviewSection;