// components/ProductCard.jsx

'use client';

import React from 'react';
import Image from 'next/image';
import { useAppContext } from '@/context/AppContext';
import { FiHeart } from 'react-icons/fi';

const ProductCard = ({ product }) => {
  const { router, wishlist, addToWishlist, removeFromWishlist } = useAppContext();

  if (!product) return null;

  const isFavorited = wishlist.some(item => item.product_id === product.id);

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (isFavorited) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  const getValidImage = (imageUrls) => {
    if (
      Array.isArray(imageUrls) &&
      imageUrls.length > 0 &&
      typeof imageUrls[0] === 'string' &&
      imageUrls[0].trim() !== ''
    ) {
      return imageUrls[0];
    }
    return '/assets/placeholder.jpg';
  };

  return (
    <div
      onClick={() => router.push('/product/' + product.id)}
      className="flex flex-col items-start w-full max-w-[260px] cursor-pointer group"
    >
      <div className="relative rounded-none w-full aspect-[4/4] overflow-hidden bg-gray-100">
        <Image
          src={getValidImage(product.image_urls)}
          alt={product.name || 'Product image'}
          className="group-hover:scale-105 transition-transform duration-300 object-cover w-full h-full"
          fill
          sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 25vw"
        />

        {/* Favori butonu */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md transition-all z-10 hover:scale-110"
        >
          <FiHeart
            className={`w-4 h-4 ${
              isFavorited ? 'fill-[#be531c] text-[#be531c]' : 'text-gray-600'
            }`}
          />
        </button>
      </div>

      {/* Ürün ismi */}
      <div className="mt-3 w-full text-center">
        <h3 className="text-base font-medium text-gray-800 truncate hover:text-[#be531c] transition-colors">
          {product.name}
        </h3>
      </div>
    </div>
  );
};

export default ProductCard;
