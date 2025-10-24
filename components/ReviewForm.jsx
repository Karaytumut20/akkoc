'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';
import FloatingLabelInput from './ui/FloatingLabelInput';

const ReviewForm = ({ productId, onReviewAdded }) => {
  const { user } = useAppContext();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('You must log in to leave a review.');
    if (!rating || !comment.trim()) {
      return toast.error('Please rate and write your review.');
    }
    setLoading(true);
    const { error } = await supabase
      .from('reviews')
      .insert([{
        product_id: productId,
        user_id: user.id,
        rating,
        comment,
      }]);

    setLoading(false);
    if (error) {
      if (error.code === '23505') { 
          toast.error('You have already left a review for this product.');
      } else {
          toast.error('An error occurred while adding the review: ' + error.message);
      }
    } else {
      toast.success('Your review has been received and will be published after it is reviewed.');
      setRating(0);
      setComment('');
      if (onReviewAdded) {
        onReviewAdded();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 rounded-lg border">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Rate the Product</h3>
      <div className="mb-6">
        <span className="text-gray-700 font-medium">Your Rating:</span>
        <div className="flex items-center mt-1">
          {[...Array(5)].map((_, i) => (
            <button key={i} type="button" onClick={() => setRating(i + 1)} className="focus:outline-none">
              <svg className={`w-7 h-7 transition-colors duration-200 ${i < rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.561-.955L10 0l2.95 5.955 6.561.955-4.756 4.635 1.123 6.545z" />
              </svg>
            </button>
          ))}
        </div>
      </div>
      
      <FloatingLabelInput
        as="textarea"
        id="comment"
        name="comment"
        label="Write your review here..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        required
      />

      <button type="submit" disabled={loading} className="mt-6 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:bg-orange-400">
        {loading ? 'Sending...' : 'Submit Review'}
      </button>
    </form>
  );
};

export default ReviewForm;