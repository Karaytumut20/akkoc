'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';
import FloatingLabelInput from './ui/FloatingLabelInput';
import { FiCamera, FiX, FiUploadCloud } from 'react-icons/fi';
import Image from 'next/image';

const ReviewForm = ({ productId, onReviewAdded }) => {
  const { user } = useAppContext();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Image upload states
  const [selectedImages, setSelectedImages] = useState([]); 
  const [uploadingImages, setUploadingImages] = useState(false);

  // Handle file selection
  const handleImageChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      
      // Limit: Max 3 images
      if (selectedImages.length + filesArray.length > 3) {
        toast.error("You can upload a maximum of 3 photos.");
        return;
      }

      const newImages = filesArray.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));

      setSelectedImages(prev => [...prev, ...newImages]);
    }
  };

  // Remove selected image
  const removeImage = (indexToRemove) => {
    setSelectedImages(prev => {
      const newImages = prev.filter((_, index) => index !== indexToRemove);
      // Revoke URL to prevent memory leaks
      URL.revokeObjectURL(prev[indexToRemove].preview);
      return newImages;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('You must log in to submit a review.');
    if (!rating) {
      return toast.error('Please provide a rating.');
    }
    
    setLoading(true);
    let uploadedImageUrls = [];

    try {
      // 1. Upload images if selected
      if (selectedImages.length > 0) {
        setUploadingImages(true);
        const uploadPromises = selectedImages.map(async (imgObj) => {
          const file = imgObj.file;
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${productId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('review-images')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data } = supabase.storage
            .from('review-images')
            .getPublicUrl(filePath);

          return data.publicUrl;
        });

        uploadedImageUrls = await Promise.all(uploadPromises);
        setUploadingImages(false);
      }

      // 2. Save review to database
      const { error } = await supabase
        .from('reviews')
        .insert([{
          product_id: productId,
          user_id: user.id,
          rating,
          comment,
          images: uploadedImageUrls, // Save image URLs array
          is_approved: false // Requires admin approval
        }]);

      if (error) {
        if (error.code === '23505') { 
            toast.error('You have already reviewed this product.');
        } else {
            throw error;
        }
      } else {
        toast.success('Your review has been submitted! It will be published after approval.');
        // Reset form
        setRating(0);
        setComment('');
        setSelectedImages([]);
        if (onReviewAdded) {
          onReviewAdded();
        }
      }

    } catch (error) {
      console.error('Review error:', error);
      toast.error('An error occurred: ' + error.message);
    } finally {
      setLoading(false);
      setUploadingImages(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Rate this Product</h3>
      
      {/* Rating Stars */}
      <div className="mb-6">
        <span className="text-gray-700 font-medium block mb-2">Your Rating:</span>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <button key={i} type="button" onClick={() => setRating(i + 1)} className="focus:outline-none transition-transform hover:scale-110">
              <svg className={`w-8 h-8 transition-colors duration-200 ${i < rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.561-.955L10 0l2.95 5.955 6.561.955-4.756 4.635 1.123 6.545z" />
              </svg>
            </button>
          ))}
        </div>
      </div>
      
      {/* Comment Area */}
      <div className="mb-4">
        <FloatingLabelInput
          as="textarea"
          id="comment"
          name="comment"
          label="Write your review here..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      {/* Image Upload Area (Optional) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Add Photos (Optional)</label>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Select Image Button */}
          <label htmlFor="review-images" className="cursor-pointer flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-100 transition">
            <FiCamera className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-500 mt-1">Select</span>
            <input 
              type="file" 
              id="review-images" 
              multiple 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageChange}
              disabled={loading}
            />
          </label>

          {/* Image Previews */}
          {selectedImages.map((img, index) => (
            <div key={index} className="relative w-24 h-24 border rounded-lg overflow-hidden group">
              <Image 
                src={img.preview} 
                alt="preview" 
                fill 
                className="object-cover" 
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <FiX size={12} />
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">You can upload up to 3 photos.</p>
      </div>

      <button 
        type="submit" 
        disabled={loading} 
        className="w-full sm:w-auto px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:bg-orange-300 font-semibold flex items-center justify-center gap-2"
      >
        {loading ? (
          <>Loading...</>
        ) : (
          <>Submit Review</>
        )}
      </button>
    </form>
  );
};

export default ReviewForm;