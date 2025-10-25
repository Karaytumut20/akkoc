// components/ProductInfoBox.jsx

'use client';

import React from 'react';
import StarRating from '@/components/StarRating';
import TrustBadges from './TrustBadges';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FiHeart } from 'react-icons/fi';

const ProductInfoBox = ({
  product,
  averageRating,
  reviews,
  quantity,
  setQuantity,
  handleAddToCart,
  isFavorited,
  handleFavoriteClick,
}) => {
  const { currency } = useAppContext();
  const router = useRouter();

  const increaseQuantity = () => {
    if (quantity < product.stock) {
      setQuantity((prev) => prev + 1);
    } else {
      toast.error('There is not enough stock for this product.');
    }
  };

  const decreaseQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const getStockStatus = (stock) => {
    if (stock > 10) return { text: 'In Stock', color: 'text-green-600', pulse: true };
    if (stock > 0) return { text: `${stock} Adet Kaldı`, color: 'text-orange-600', pulse: false };
    return { text: 'Tükendi', color: 'text-red-600', pulse: false };
  };

  const { text, color, pulse } = getStockStatus(product.stock);

  // 📌 Kategoriye tıklanınca yönlendirme
  const handleCategoryClick = () => {
    if (product.category_id) {
      router.push(`/all-products?category_id=${product.category_id}`);
    } else {
      router.push(`/all-products`);
    }
  };
    // Onaylı yorum sayısını hesapla
    const approvedReviewCount = reviews.filter((r) => r.is_approved).length;


  return (
    <div className="bg-[#ECE4DC] p-4 sm:p-6 rounded-xl border border-[#ECE4DC]">
      {/* Başlık + Favori */}
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-4">
          <h1 className="text-3xl font-serif tracking-wide text-gray-900 leading-tight">
            {product.name}
          </h1>
          <p className="text-3xl font-bold text-[#be531c] mt-2">
            {currency}
            {product.price.toFixed(2)}
          </p>

          {/* 🧡 Kategori butonu */}
          {product.categories?.name && (
            <button
              onClick={handleCategoryClick}
              className="mt-3 text-sm font-semibold text-[#be531c] hover:underline hover:text-[#a64919] transition"
            >
              {product.categories.name}
            </button>
          )}
        </div>

        {/* Favori ikonu */}
        <button
          onClick={handleFavoriteClick}
          className="flex-shrink-0 p-3 bg-[#ECE4DC] rounded-full border border-[#ECE4DC] hover:scale-110 transition"
aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <FiHeart
            className={`w-6 h-6 transition-all duration-300 ${
              isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'
            }`}
          />
        </button>
      </div>

      {/* Yosrum puanı */}
      <div className="inline-flex items-center gap-3 mt-4 group pb-4 border-b border-[#ECE4DC]">
        {reviews.length > 0 && (
          <span className="font-bold text-xl text-gray-800">{averageRating.toFixed(1)}</span>
        )}
        <StarRating rating={averageRating} size={24} />
        {/* ⭐ REVİZYON: Yorum sayısı gösterimi sadece (sayı) olarak değiştirildi. */}
        <span className="text-gray-500 text-sm">
          ({approvedReviewCount})
        </span>
      </div>

      {/* Miktar seçici */}
      <div className="mt-6 flex items-center justify-between p-2 bg-[#ECE4DC] rounded-lg border border-[#ECE4DC]">
        <label htmlFor="quantity" className="text-lg font-medium text-gray-700">
         Quantity

        </label>
        <div className="flex items-center">
          <button
            onClick={decreaseQuantity}
            disabled={quantity <= 1}
            className="p-2 text-gray-600 hover:bg-[#E1D7CE] disabled:opacity-50 disabled:cursor-not-allowed transition rounded-l-md"
          >
            <span className="sr-only">Decrease Quantity</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path>
            </svg>
          </button>
          <input
            type="number"
            id="quantity"
            value={quantity}
            onChange={(e) =>
              setQuantity(Math.max(1, Math.min(product.stock, Number(e.target.value))))
            }
            className="w-10 text-center bg-transparent py-1 outline-none text-lg font-semibold text-gray-800"
            min="1"
            max={product.stock}
            readOnly
          />
          <button
            onClick={increaseQuantity}
            disabled={quantity >= product.stock}
            className="p-2 text-gray-600 hover:bg-[#E1D7CE] disabled:opacity-50 disabled:cursor-not-allowed transition rounded-r-md"
          >
            <span className="sr-only">Increase Quantity</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Sepete ekle butonu */}
      <div className="mt-4 hidden lg:block">
        <button
          onClick={handleAddToCart}
          disabled={product.stock < 1}
          className={`w-full py-4 text-white rounded-lg font-semibold text-lg transition duration-300 ${
            product.stock < 1
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-[#be531c] hover:bg-[#a64919]'
          }`}
        >
          {product.stock < 1 ? 'Stokta Yok' : 'Sepete Ekle'}
        </button>
      </div>

      {/* Güven rozetleri */}
      <div className="hidden lg:block">
        <TrustBadges />
      </div>

      {/* Stok durumu */}
      <div className="mt-6 pt-4 border-t border-[#ECE4DC]">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span className="font-medium">Stock Status:</span>
          <span className={`font-semibold flex items-center gap-2 ${color}`}>
            {pulse && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-600 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-600"></span>
              </span>
            )}
            {text}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductInfoBox;