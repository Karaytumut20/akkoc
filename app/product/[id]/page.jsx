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
// ReviewSection importuna gerek yok, ProductTabs içinde kullanılıyor
// import ReviewSection from '@/components/ReviewSection';
import TrustBadges from '@/components/TrustBadges';
import { FiChevronLeft, FiChevronRight, FiHeart } from "react-icons/fi";

const Product = () => {
  const { id } = useParams(); // Get product ID from URL
  const {
    router,
    products: allProducts, // All products from context
    user, // Current user from context
    addToCart, // Function to add to cart
    addToWishlist, // Function to add to wishlist
    removeFromWishlist, // Function to remove from wishlist
    wishlist, // Current wishlist items
    currency // Currency symbol
  } = useAppContext();

  // State for product data, related products, and loading status
  const [productData, setProductData] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // State and refs for image gallery
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageContainerRef = useRef(null); // Ref for desktop image scroll container
  const mobileCarouselRef = useRef(null); // Ref for mobile image carousel

  // State for product reviews and ratings
  const [reviews, setReviews] = useState([]); // All reviews for the product
  const [averageRating, setAverageRating] = useState(0); // Average rating of approved reviews
  const [userReview, setUserReview] = useState(null); // The current user's review, if any
  const [hasPurchased, setHasPurchased] = useState(false); // Whether the current user purchased this product

  // State for active tab (description or reviews)
  const [activeTab, setActiveTab] = useState('description');

  // State for quantity selection
  const [quantity, setQuantity] = useState(1);

  // Check if the current product is in the user's wishlist
  const isFavorited = productData
    ? wishlist.some((item) => item.product_id === productData.id)
    : false;

  // Function to fetch product details and reviews
  const fetchProductDetails = useCallback(async () => {
    if (!id) return; // Exit if no ID is present
    setLoading(true); // Start loading indicator
    try {
      // Fetch product information including category and bulk prices
      const { data: productInfo, error: productError } = await supabase
        .from("products")
        .select("*, categories(name), price_2_pack, price_3_pack, price_4_pack") // Select related category name and bulk prices
        .eq("id", id) // Filter by product ID
        .single(); // Expect only one result

      // Handle product fetch error
      if (productError) {
          console.error("Product fetch error:", productError);
          toast.error("An error occurred while loading product details.");
          setLoading(false);
          setProductData(null); // Ensure productData is null on error
          return; // Exit function on error
      }

      // Process image URLs: ensure it's always an array
      let imageUrls = [];
      if (typeof productInfo.image_urls === "string") {
        try {
          imageUrls = JSON.parse(productInfo.image_urls); // Parse if it's a JSON string
        } catch {
          imageUrls = []; // Default to empty array on parse error
        }
      } else if (Array.isArray(productInfo.image_urls)) {
        imageUrls = productInfo.image_urls; // Use if it's already an array
      }
      // Update product data state with processed image URLs
      setProductData({ ...productInfo, image_urls: imageUrls });

      // Fetch reviews for the product (without joining users table directly)
      const { data: reviewData, error: reviewError } = await supabase
        .from("reviews")
        .select(`id, product_id, user_id, rating, comment, is_approved, created_at`) // Select all necessary review columns
        .eq("product_id", id) // Filter by product ID
        .order("created_at", { ascending: false }); // Newest reviews first

      // Handle review fetch error (log it but continue rendering)
      if (reviewError) {
          console.error("Review fetch error:", reviewError);
          setReviews([]);
          setAverageRating(0);
      } else {
          let finalReviews = reviewData || [];
          
          if (finalReviews.length > 0) {
              const userIds = [...new Set(finalReviews.map(r => r.user_id).filter(id => id))];
              
              // === Yorumu yapan kullanıcı bilgilerini çekme (user_id'ler ile) ===
              // auth.users tablosundan bilgi çekmek için RPC fonksiyonu kullanıyoruz.
              // Bu fonksiyonun (get_users_by_ids) Supabase'de tanımlı olması gerekir.
              let usersData = [];
              const { data: fetchedUsers, error: usersError } = await supabase
                  .rpc('get_users_by_ids', { user_ids: userIds }); 

              if (usersError) {
                  // RPC başarısız olursa, bir hata mesajı logla ama devam et
                  console.error("Kullanıcı bilgileri RPC ile alınamadı:", usersError.message);
              } else {
                  // Kullanıcı verilerini (id, email, raw_user_meta_data) içeren bir dizi beklenir.
                  usersData = fetchedUsers || [];
              }
              // =================================================================================

              // Yorumları kullanıcı bilgileriyle birleştir
              finalReviews = finalReviews.map(review => {
                  const userProfile = usersData.find(u => u.id === review.user_id);
                  return {
                      ...review,
                      reviewer: userProfile ? {
                          email: userProfile.email,
                          // Display Name, Full Name ve Phone'u raw_user_meta_data'dan al
                          display_name: userProfile.raw_user_meta_data?.display_name || null,
                          full_name: userProfile.raw_user_meta_data?.full_name || null, // Full Name'i metadata'dan al
                          phone: userProfile.raw_user_meta_data?.phone || null,
                      } : null
                  };
              });
          }

          // Güncel verilerle state'leri ayarla
          setReviews(finalReviews);
          // Ortalama puanı onaylaı yorumlara göre hesapla
          const approvedReviews = finalReviews.filter(r => r.is_approved === true || r.is_approved === 'true' || r.is_approved === 1);
          const totalRating = approvedReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
          setAverageRating(approvedReviews.length > 0 ? totalRating / approvedReviews.length : 0);
      }

    } catch (err) { // Catch any unexpected errors during fetch
      console.error("General fetch error in product page:", err);
      toast.error("An unexpected error occurred while loading the page.");
      setProductData(null); // Reset product data on error
      setReviews([]); // Reset reviews
      setAverageRating(0);
    }
    setLoading(false); // Stop loading indicator
  }, [id]); // Dependency: re-run if product ID changes

  // Function to check if the current user can review (has purchased, hasn't reviewed yet)
  const checkIfUserCanReview = useCallback(async () => {
    // Exit if no user, ID, or product data is available
    if (!user || !id || !productData) {
      setUserReview(null);
      setHasPurchased(false);
      return;
    }

    try {
        // Check if the user has already left a review for this product
        const { data: userRev, error: reviewCheckError } = await supabase
          .from("reviews")
          .select("*")
          .eq("product_id", id)
          .eq("user_id", user.id)
          .maybeSingle(); // Use maybeSingle to handle 0 or 1 result without error
        if (reviewCheckError) console.error("Error checking user review:", reviewCheckError);
        setUserReview(userRev || null); // Set user's review or null

        // Check if the user has purchased this product by looking at order_items
        const { data: purchaseData, error: purchaseCheckError } = await supabase
          .from("order_items")
          .select(`id, orders!inner(user_id)`) // Select via inner join to orders table
          .eq("product_id", id) // Match product ID
          .eq("orders.user_id", user.id) // Match user ID in the orders table
          .limit(1); // Only need one record to confirm purchase

        if (purchaseCheckError) console.error("Error checking purchase status:", purchaseCheckError);
        // Set purchase status based on whether any matching records were found
        setHasPurchased(purchaseData && purchaseData.length > 0);

    } catch (err) {
        console.error("Error in checkIfUserCanReview:", err);
        // Reset states in case of error
        setUserReview(null);
        setHasPurchased(false);
    }
  }, [user, id, productData]); // Dependencies: run when these change

  // Fetch product details when the component mounts or ID changes
  useEffect(() => {
    fetchProductDetails();
  }, [fetchProductDetails]);

  // Check review eligibility when product data or user changes
  useEffect(() => {
    if (productData && user) { // Only run if both product data and user are available
      checkIfUserCanReview();
    } else if (!user) { // Reset if user logs out
        setUserReview(null);
        setHasPurchased(false);
    }
  }, [productData, user, checkIfUserCanReview]); // Added user as dependency

  // Find related products (same category, different ID) when product data or all products change
  useEffect(() => {
    if (productData && allProducts.length > 0) {
      setRelatedProducts(
        allProducts
          .filter(
            (p) => p.category_id === productData.category_id && p.id !== productData.id
          )
          .slice(0, 5) // Limit to 5 related products
      );
    }
  }, [productData, allProducts]);

  // Handle click on the favorite (heart) icon
  const handleFavoriteClick = (e) => {
    e.stopPropagation(); // Prevent triggering parent onClick (e.g., navigating)
    if (!user) {
      toast.error("Please log in to add items to your favorites.");
      router.push("/auth"); // Redirect to login if not logged in
      return;
    }
    // Toggle favorite status
    if (isFavorited) {
      removeFromWishlist(productData.id);
    } else {
      addToWishlist(productData.id);
    }
  };

  // Handle adding the selected quantity to the cart
  const handleAddToCart = () => {
    if (!productData) return; // Ensure product data is loaded
    addToCart(productData, quantity); // Use the addToCart function from context
    setQuantity(1); // Reset quantity selector to 1 after adding
  };

  // Handle adding bulk buy options to the cart
  const handleBulkAddToCart = (packQuantity, packPrice, packName) => {
    if (!productData) return;
    // Pass the quantity, total pack price, and product data to addToCart
    addToCart(productData, packQuantity, packPrice);
    toast.success(`${packName} added to cart!`);
  };

  // Show loading component if data is still loading or productData is null
  if (loading || !productData) return <Loading />;

  // Prepare available bulk buy packs based on stock and defined prices
  const availablePacks = [
    { quantity: 2, price: productData.price_2_pack, name: "2 Piece Package" },
    { quantity: 3, price: productData.price_3_pack, name: "3 Piece Package" },
    { quantity: 4, price: productData.price_4_pack, name: "4 Piece Package" },
  ].filter(pack => pack.price > 0 && pack.quantity <= productData.stock); // Only show valid packs with stock

  // Props to pass down to child components
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
    reviews, // Pass the fetched reviews
    averageRating,
    activeTab,
    setActiveTab,
    userReview, // Pass the current user's review status
    hasPurchased, // Pass the purchase status
    fetchReviews: fetchProductDetails, // Pass function to re-fetch reviews after submission
    currency,
  };

  return (
    <>
      <div className="min-h-screen mt-0 md:mt-8 lg:mt-16 bg-[#ECE4DC]"> {/* Main container */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8"> {/* Content wrapper */}
          {/* Main grid layout: Gallery (2 cols) + Info (1 col) on large screens */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 xl:gap-x-12">
            {/* Product Gallery Section */}
            <div className="lg:col-span-2 flex flex-col md:flex-row gap-4 lg:sticky lg:top-20 lg:self-start lg:h-[90vh]">
              <ProductGallery {...sharedProps} />
            </div>

            {/* Product Information Section */}
            <div className="w-full flex flex-col justify-start mt-4 lg:mt-0 lg:col-span-1 lg:sticky lg:top-20 lg:self-start z-10">
              <ProductInfoBox {...sharedProps} />

              {/* Bulk Buy Options Component */}
              <BulkBuyOptions
                availablePacks={availablePacks}
                handleBulkAddToCart={handleBulkAddToCart}
                basePrice={productData.price}
              />
            </div>
          </div>

          {/* Product Tabs (Description & Reviews) Section */}
          <div className="mt-16 bg-[#ECE4DC] rounded-xl border border-[#ECE4DC] p-4 sm:p-8">
            <ProductTabs {...sharedProps} />
          </div>

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <div className="py-16 border-t border-[#ECE4DC] mt-16">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-serif text-gray-900">Related Products</h2>
              </div>
              {/* Grid for related product cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
                {relatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Call-to-Action Bar (Fixed at bottom) */}
      <MobileCta {...sharedProps} />
      <Footer /> {/* Footer component */}
    </>
  );
};

// --- Sub-Component: BulkBuyOptions ---
const BulkBuyOptions = ({ availablePacks, handleBulkAddToCart, basePrice }) => {
  // Hide if no bulk options are available
  if (!availablePacks || availablePacks.length === 0) return null;

  // Find the pack with the best value (highest saving)
  const bestValuePack = availablePacks.reduce((best, current) => {
    const currentOriginalPrice = basePrice * current.quantity;
    const currentSaving = currentOriginalPrice - current.price;
    // Calculate potential saving for the current 'best'
    const bestOriginalPrice = basePrice * (best?.quantity || 0); // Handle initial case where best might be undefined
    const bestSaving = bestOriginalPrice - (best?.price || 0);

    // If current pack saves more, it becomes the new best
    if (currentSaving > bestSaving) {
      return current;
    }
    return best; // Otherwise, keep the existing best
  }, availablePacks[0]); // Start comparison with the first pack

  return (
    <div className="mt-4 p-4 bg-[#ECE4DC] rounded-xl border-2 border-[#ECE4DC]">
      <h3 className="text-xl font-bold text-[#be531c] mb-4 text-center">
        🛍️ Buy More, Save More!
      </h3>
      <div className="grid grid-cols-1 gap-4">
        {availablePacks.map(pack => {
          // Calculate savings for display
          const originalTotalPrice = basePrice * pack.quantity;
          const savingsAmount = originalTotalPrice - pack.price;
          // Check if this pack is the best value
          const isBestValue = pack.price === bestValuePack.price && pack.quantity === bestValuePack.quantity;
          // Calculate savings percentage
          const savingsPercentage = originalTotalPrice > 0 ? ((savingsAmount / originalTotalPrice) * 100).toFixed(0) : 0;

          return (
            <div
              key={pack.quantity}
              className={`relative p-4 rounded-xl transition duration-300 ${
                isBestValue
                  ? 'bg-white border-2 border-[#be531c]' // Highlight best value
                  : 'bg-white border border-[#ECE4DC]'
              }`}
            >
              {/* "Best Value" Tag */}
              {isBestValue && (
                <span className="absolute top-0 right-0 bg-[#be531c] text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl">
                  BEST VALUE
                </span>
              )}
              <div className="flex items-center justify-between">
                {/* Pack details */}
                <div className="flex flex-col">
                  <p className="text-xl font-extrabold text-gray-900">
                    {pack.name} {/* e.g., "2 Piece Package" */}
                  </p>
                  {/* Original price (strikethrough) */}
                  <p className="text-sm text-gray-500 line-through mt-1">
                    ${originalTotalPrice.toFixed(2)}
                  </p>
                </div>
                {/* Pack price and savings */}
                <div className="flex flex-col items-end">
                  <p className="text-3xl font-extrabold text-black leading-none">
                    ${Number(pack.price).toFixed(2)} {/* Pack price */}
                  </p>
                  {savingsPercentage > 0 && ( // Only show discount if there is one
                  <p className="text-sm font-semibold text-[#be531c] mt-1">
                    {savingsPercentage}% OFF!
                  </p>
                  )}
                </div>
              </div>
              {/* Add to Cart button for the pack */}
              <button
                onClick={() => handleBulkAddToCart(pack.quantity, pack.price, pack.name)}
                className={`w-full mt-4 py-2 text-white font-semibold rounded-lg transition duration-300 ${
                  isBestValue
                    ? 'bg-[#be531c] hover:bg-[#a64919]' // Different style for best value button
                    : 'bg-[#be531c]/90 hover:bg-[#a64919]'
                }`}
              >
                Add {pack.quantity} to Cart
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Sub-Component: MobileCta ---
// Fixed bar at the bottom for mobile screens containing Add to Cart button.
const MobileCta = ({ product, handleAddToCart }) => (
  <div
    className="lg:hidden p-4 bg-[#ECE4DC] border-t border-gray-200 z-50" // Hidden on large screens and up
    style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} // Fixed position
  >
    <TrustBadges /> {/* Show trust badges */}
    <button
      onClick={handleAddToCart}
      disabled={!product || product.stock < 1} // Disable if out of stock or product not loaded
      className={`w-full py-4 text-white rounded-lg font-semibold text-lg transition duration-300 mt-4 ${
        !product || product.stock < 1
          ? 'bg-gray-400 cursor-not-allowed' // Disabled style
          : 'bg-[#be531c] hover:bg-[#a64919]' // Enabled style
      }`}
    >
      {!product || product.stock < 1 ? 'Out of Stock' : 'Add to Cart'}
    </button>
  </div>
);

export default Product; // Export the main component