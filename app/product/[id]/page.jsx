'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import Loading from '@/components/Loading';
import Footer from '@/components/Footer';
import { useAppContext } from '@/context/AppContext';
import ProductCard from '@/components/ProductCard';
import ProductGallery from '@/components/ProductGallery';
import ProductInfoBox from '@/components/ProductInfoBox';
import ProductTabs from '@/components/ProductTabs';
import ReviewSection from '@/components/ReviewSection';
import TrustBadges from '@/components/TrustBadges';
import { FiChevronLeft, FiChevronRight, FiHeart } from "react-icons/fi";

const Product = () => {
  const { id } = useParams();
  const {
    router,
    products: allProducts,
    user,
    addToCart,
    addToWishlist,
    removeFromWishlist,
    wishlist,
    currency
  } = useAppContext();

  const [productData, setProductData] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const imageContainerRef = useRef(null);
  const mobileCarouselRef = useRef(null);

  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [userReview, setUserReview] = useState(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  const isFavorited = productData
    ? wishlist.some((item) => item.product_id === productData.id)
    : false;

  const fetchProductDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data: productInfo } = await supabase
        .from("products")
        .select("*, categories(name), price_2_pack, price_3_pack, price_4_pack")
        .eq("id", id)
        .single();

      let imageUrls = [];
      if (typeof productInfo.image_urls === "string") {
        try {
          imageUrls = JSON.parse(productInfo.image_urls);
        } catch {
          imageUrls = [];
        }
      } else if (Array.isArray(productInfo.image_urls)) {
        imageUrls = productInfo.image_urls;
      }
      setProductData({ ...productInfo, image_urls: imageUrls });

      const { data: reviewData } = await supabase
        .from("reviews")
        .select("*, users(email)")
        .eq("product_id", id)
        .order("created_at", { ascending: false });

      setReviews(reviewData || []);
      const approvedReviews = (reviewData || []).filter(r => r.is_approved);
      const totalRating = approvedReviews.reduce((sum, r) => sum + r.rating, 0);
      setAverageRating(approvedReviews.length > 0 ? totalRating / approvedReviews.length : 0);
    } catch (err) {
      console.error(err);
      toast.error("Ürün detayları yüklenirken bir sorun oluştu.");
    }
    setLoading(false);
  }, [id]);

  const checkIfUserCanReview = useCallback(async () => {
    if (!user || !id || !productData) {
      setUserReview(null);
      setHasPurchased(false);
      return;
    }

    const { data: userRev } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", id)
      .eq("user_id", user.id)
      .single();
    setUserReview(userRev || null);

    const { data: purchaseData } = await supabase
      .from("order_items")
      .select(`id, product_id, orders!inner (user_id)`)
      .eq("product_id", id)
      .eq("orders.user_id", user.id)
      .limit(1);

    setHasPurchased(purchaseData.length > 0);
  }, [user, id, productData]);

  useEffect(() => {
    fetchProductDetails();
  }, [fetchProductDetails]);

  useEffect(() => {
    if (productData) {
      checkIfUserCanReview();
    }
  }, [productData, checkIfUserCanReview]);

  useEffect(() => {
    if (productData && allProducts.length > 0) {
      setRelatedProducts(
        allProducts
          .filter(
            (p) => p.category_id === productData.category_id && p.id !== productData.id
          )
          .slice(0, 5)
      );
    }
  }, [productData, allProducts]);

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Favorilere eklemek için giriş yapın.");
      router.push("/auth");
      return;
    }
    if (isFavorited) {
      removeFromWishlist(productData.id);
    } else {
      addToWishlist(productData.id);
    }
  };

  const handleAddToCart = () => {
    addToCart(productData, quantity);
    setQuantity(1);
  };

  const handleBulkAddToCart = (quantity, price, packName) => {
    addToCart(productData, quantity, price);
    toast.success(`${packName} kampanyası sepete eklendi!`);
  };

  if (loading || !productData) return <Loading />;

  const availablePacks = [
    { quantity: 2, price: productData.price_2_pack, name: "2 Adet Paket" },
    { quantity: 3, price: productData.price_3_pack, name: "3 Adet Paket" },
    { quantity: 4, price: productData.price_4_pack, name: "4 Adet Paket" },
  ].filter(pack => pack.price > 0 && pack.quantity <= productData.stock);

  const sharedProps = {
    product: productData,
    isFavorited,
    handleFavoriteClick,
    currentImageIndex,
    setCurrentImageIndex,
    imageContainerRef,
    mobileCarouselRef,
    quantity,
    setQuantity,
    handleAddToCart,
    reviews,
    averageRating,
    activeTab,
    setActiveTab,
    userReview,
    hasPurchased,
    fetchReviews: fetchProductDetails,
    currency,
  };

  return (
    <>
      <div className="min-h-screen mt-0 md:mt-8 lg:mt-16 bg-[#ECE4DC]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 xl:gap-x-12">
            <div className="lg:col-span-2 flex flex-col md:flex-row gap-4 lg:sticky lg:top-20 lg:self-start lg:h-[90vh]">
              <ProductGallery {...sharedProps} />
            </div>

            <div className="w-full flex flex-col justify-start mt-4 lg:mt-0 lg:col-span-1 lg:sticky lg:top-20 lg:self-start z-10">
              <ProductInfoBox {...sharedProps} />

              <BulkBuyOptions
                availablePacks={availablePacks}
                handleBulkAddToCart={handleBulkAddToCart}
                basePrice={productData.price}
              />
            </div>
          </div>

          <div className="mt-16 bg-[#ECE4DC] rounded-xl border border-[#ECE4DC] p-4 sm:p-8">
            <ProductTabs {...sharedProps} />
          </div>

          {relatedProducts.length > 0 && (
            <div className="py-16 border-t border-[#ECE4DC] mt-16">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-serif text-gray-900">İlgili Ürünler</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
                {relatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <MobileCta {...sharedProps} />
      <Footer />
    </>
  );
};

const BulkBuyOptions = ({ availablePacks, handleBulkAddToCart, basePrice }) => {
  if (availablePacks.length === 0) return null;
  const bestValuePack = availablePacks.reduce((best, current) => {
    const currentOriginalPrice = basePrice * current.quantity;
    const currentSaving = currentOriginalPrice - current.price;
    const bestOriginalPrice = basePrice * (best.quantity || 0);
    const bestSaving = bestOriginalPrice - (best.price || 0);
    if (best.price === undefined || currentSaving > bestSaving) {
      return current;
    }
    return best;
  }, availablePacks[0]);

  return (
    <div className="mt-4 p-4 bg-[#ECE4DC] rounded-xl border-2 border-[#ECE4DC]">
      <h3 className="text-xl font-bold text-[#be531c] mb-4 text-center">
        🛍️ Daha Çok Al, Daha Çok Kazan!
      </h3>
      <div className="grid grid-cols-1 gap-4">
        {availablePacks.map(pack => {
          const originalTotalPrice = basePrice * pack.quantity;
          const savingsAmount = originalTotalPrice - pack.price;
          const isBestValue =
            pack.price === bestValuePack.price && pack.quantity === bestValuePack.quantity;
          const savingsPercentage = ((savingsAmount / originalTotalPrice) * 100).toFixed(0);

          return (
            <div
              key={pack.quantity}
              className={`relative p-4 rounded-xl transition duration-300 ${
                isBestValue
                  ? 'bg-white border-2 border-[#be531c]'
                  : 'bg-white border border-[#ECE4DC]'
              }`}
            >
              {isBestValue && (
                <span className="absolute top-0 right-0 bg-[#be531c] text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl">
                  EN AVANTAJLI
                </span>
              )}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-xl font-extrabold text-gray-900">
                    {pack.quantity} Adet Paket
                  </p>
                  <p className="text-sm text-gray-500 line-through mt-1">
                    ${originalTotalPrice.toFixed(2)}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-3xl font-extrabold text-black leading-none">
                    ${Number(pack.price).toFixed(2)}
                  </p>
                  <p className="text-sm font-semibold text-[#be531c] mt-1">
                    %{savingsPercentage} İNDİRİM!
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleBulkAddToCart(pack.quantity, pack.price, pack.name)}
                className={`w-full mt-4 py-2 text-white font-semibold rounded-lg transition duration-300 ${
                  isBestValue
                    ? 'bg-[#be531c] hover:bg-[#a64919]'
                    : 'bg-[#be531c]/90 hover:bg-[#a64919]'
                }`}
              >
                {pack.quantity} Adet Sepete Ekle
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MobileCta = ({ product, handleAddToCart }) => (
  <div
    className="lg:hidden p-4 bg-[#ECE4DC] border-t border-gray-200 z-50"
    style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
  >
    <TrustBadges />
    <button
      onClick={handleAddToCart}
      disabled={product?.stock < 1}
      className={`w-full py-4 text-white rounded-lg font-semibold text-lg transition duration-300 mt-4 ${
        product?.stock < 1
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-[#be531c] hover:bg-[#a64919]'
      }`}
    >
      {product?.stock < 1 ? 'Stokta Yok' : `Sepete Ekle`}
    </button>
  </div>
);

export default Product;
