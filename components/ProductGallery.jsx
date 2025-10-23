// components/ProductGallery.jsx

'use client';
import Image from 'next/image';
import React, { useEffect } from 'react';

const ProductGallery = ({
  product,
  isFavorited,
  handleFavoriteClick,
  currentImageIndex,
  setCurrentImageIndex,
  imageContainerRef,
  mobileCarouselRef
}) => {

  const handleNextImage = () => {
    const newIndex = (currentImageIndex + 1) % (product.image_urls.length || 1);
    setCurrentImageIndex(newIndex);
  };

  const handlePrevImage = () => {
    const newIndex = (currentImageIndex - 1 + (product.image_urls.length || 1)) % (product.image_urls.length || 1);
    setCurrentImageIndex(newIndex);
  };

  // 📌 Scroll davranışı - LG ve üzeri
  useEffect(() => {
    if (!product || !imageContainerRef.current || window.innerWidth < 1024) return;

    const container = imageContainerRef.current;
    let timeoutId;

    const handleScroll = () => {
      if (!container) return;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const imageWrapperHeight = container.clientHeight;
        const scrollPosition = container.scrollTop;
        const newIndex = Math.round(scrollPosition / (imageWrapperHeight + 32));
        if (newIndex !== currentImageIndex) {
          setCurrentImageIndex(Math.max(0, Math.min(newIndex, product.image_urls.length - 1)));
        }
      }, 100);
    };

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [product, currentImageIndex, setCurrentImageIndex]);

  // 📌 Mobil yatay kaydırma
  useEffect(() => {
    if (!product || !mobileCarouselRef.current || window.innerWidth >= 1024) return;

    const container = mobileCarouselRef.current;
    const imageWidth = container.clientWidth;

    container.scrollTo({
      left: imageWidth * currentImageIndex,
      behavior: 'smooth'
    });

    let timeoutId;
    const handleScrollEnd = () => {
      const scrollPosition = container.scrollLeft;
      const newIndex = Math.round(scrollPosition / imageWidth);
      if (newIndex !== currentImageIndex) setCurrentImageIndex(newIndex);
    };

    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScrollEnd, 150);
    };

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [product, currentImageIndex, setCurrentImageIndex]);

  const handleThumbnailClick = (index) => {
    setCurrentImageIndex(index);
    const container = imageContainerRef.current;
    if (container && window.innerWidth >= 1024) {
      const imageWrapperHeight = container.clientHeight;
      const spacing = 32;
      const targetScrollTop = index * (imageWrapperHeight + spacing);
      container.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      {/* 📱 MOBİL / TABLET */}
      <div className="lg:hidden w-full relative min-h-[60vh] rounded-xl overflow-hidden mb-4 bg-[#ECE4DC]">
        <div
          ref={mobileCarouselRef}
          className="absolute inset-0 flex overflow-x-scroll snap-x snap-mandatory scroll-smooth"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {product.image_urls.map((url, index) => (
            <div
              key={`mobile-${index}`}
              className="flex-shrink-0 w-full h-full relative snap-center flex items-center justify-center p-4"
              style={{ minWidth: '100%' }}
            >
              <Image
                src={url}
                alt={`${product.name} - ${index + 1}`}
                fill
                className="object-contain object-center"
                priority={index === 0}
              />
            </div>
          ))}
        </div>

        {/* Altındaki indicator noktaları */}
        {product.image_urls.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1 z-10">
            {product.image_urls.map((_, index) => (
              <div
                key={`indicator-${index}`}
                className={`w-2 h-2 rounded-full transition-colors duration-300 cursor-pointer ${
                  index === currentImageIndex ? 'bg-[#be531c]' : 'bg-gray-300'
                }`}
                onClick={() => setCurrentImageIndex(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 🖼️ Thumbnail sütunu (LG+) */}
      {product.image_urls.length > 1 && (
        <div
          className="hidden lg:flex flex-shrink-0 md:flex-col gap-3 overflow-y-scroll w-20 lg:w-24 lg:self-start pr-1"
          style={{ maxHeight: '90vh' }}
        >
          {product.image_urls.map((url, index) => (
            <div
              key={`thumb-${index}`}
              className={`w-full aspect-square rounded-xl cursor-pointer overflow-hidden transition-all duration-200 bg-[#ECE4DC] p-1 ${
                index === currentImageIndex
                  ? 'border-4 border-[#be531c]'
                  : 'border-4 border-[#ECE4DC] hover:border-[#be531c] hover:opacity-80'
              }`}
              onClick={() => handleThumbnailClick(index)}
            >
              <Image
                src={url}
                alt={`Ürün Görseli ${index + 1}`}
                width={100}
                height={100}
                className="object-contain w-full h-full"
              />
            </div>
          ))}
        </div>
      )}

      {/* 🖼️ Büyük görseller alanı (LG+) */}
      <div
        className="hidden lg:block flex-grow space-y-8 overflow-y-auto pr-2"
        ref={imageContainerRef}
        style={{ maxHeight: 'calc(90vh - 4px)' }}
      >
        {product.image_urls.map((url, index) => (
          <div
            key={`full-${index}`}
            className="relative rounded-xl overflow-hidden bg-[#ECE4DC] flex justify-center items-center"
            style={{ height: '90vh' }}
          >
            <Image
              src={url}
              alt={product.name}
              fill
              className="object-contain object-center transition-all duration-300 p-8"
              priority={index === 0}
            />
          </div>
        ))}
      </div>
    </>
  );
};

export default ProductGallery;
