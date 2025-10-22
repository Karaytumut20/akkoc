// components/StarRating.jsx

import React from 'react';

const StarRating = ({ rating = 0, size = 20 }) => {
  const fullStars = Math.round(rating); // Puanı en yakın tam sayıya yuvarla
  const emptyStars = 5 - fullStars;

  const starStyle = {
    width: `${size}px`,
    height: `${size}px`,
  };

  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <svg key={`full-${i}`} className="text-yellow-400" style={starStyle} fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.561-.955L10 0l2.95 5.955 6.561.955-4.756 4.635 1.123 6.545z" />
        </svg>
      ))}
      {[...Array(emptyStars)].map((_, i) => (
        <svg key={`empty-${i}`} className="text-gray-300" style={starStyle} fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.561-.955L10 0l2.95 5.955 6.561.955-4.756 4.635 1.123 6.545z" />
        </svg>
      ))}
    </div>
  );
};

export default StarRating;