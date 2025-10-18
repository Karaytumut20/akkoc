"use client";

import React from "react";
import { FiStar } from "react-icons/fi";

const StarRating = ({ rating = 0, onRatingChange = null }) => {
  const handleClick = (value) => {
    if (onRatingChange) {
      onRatingChange(value);
    }
  };

  return (
    <div className="flex gap-1 relative">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFull = rating >= star;
        const isHalf = rating >= star - 0.5 && rating < star;
        return (
          <div
            key={star}
            className="relative w-6 h-6 cursor-pointer"
          >
            {/* Boş yıldız */}
            <FiStar className="w-6 h-6 text-gray-300 absolute top-0 left-0" />

            {/* Dolu veya yarım yıldız */}
            <div
              className={`absolute top-0 left-0 overflow-hidden ${
                isFull ? "w-full" : isHalf ? "w-1/2" : "w-0"
              }`}
            >
              <FiStar className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            </div>

            {/* Sol yarıya tıklama (0.5 puan) */}
            <div
              className="absolute top-0 left-0 h-full w-1/2 z-10"
              onClick={() => handleClick(star - 0.5)}
            />

            {/* Sağ yarıya tıklama (1 puan) */}
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
