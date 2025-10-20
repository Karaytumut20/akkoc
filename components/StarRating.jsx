"use client";

import React from "react";
import { FiStar } from "react-icons/fi";

/**
 * StarRating Component
 * @param {number} rating - 0 ile 5 arası puan (0.5'lik dilimlere destek verir)
 * @param {function|null} onRatingChange - Yıldız tıklanınca çalışacak fonksiyon (isteğe bağlı)
 * @param {number} size - Yıldız boyutu (varsayılan 24px)
 */
const StarRating = ({ rating = 0, onRatingChange = null, size = 24 }) => {
  const handleClick = (value) => {
    if (onRatingChange) onRatingChange(value);
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFull = rating >= star;
        const isHalf = rating >= star - 0.5 && rating < star;

        return (
          <div
            key={star}
            className="relative cursor-pointer"
            style={{ width: size, height: size }}
          >
            {/* Boş yıldız */}
            <FiStar
              className="absolute top-0 left-0 text-gray-300"
              style={{ width: size, height: size }}
            />

            {/* Dolu veya yarım yıldız */}
            <div
              className={`absolute top-0 left-0 overflow-hidden ${
                isFull ? "w-full" : isHalf ? "w-1/2" : "w-0"
              }`}
            >
              <FiStar
                className="text-yellow-400 fill-yellow-400"
                style={{ width: size, height: size }}
              />
            </div>

            {/* Sol yarı tıklama */}
            <div
              className="absolute top-0 left-0 h-full w-1/2 z-10"
              onClick={() => handleClick(star - 0.5)}
            />

            {/* Sağ yarı tıklama */}
            <div
              className="absolute top-0 right-0 h-full w-1/2 z-10"
              onClick={() => handleClick(star)}
            />
          </div>
        );
      })}
    </div>
  );
};

export default StarRating;
