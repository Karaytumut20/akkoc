"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import Image from "next/image";
import { useParams } from "next/navigation";
import Loading from "@/components/Loading";
import { useAppContext } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";
import React from "react";
import { 
    FiChevronLeft, 
    FiChevronRight, 
    FiHeart, 
    FiX, 
    FiPlus, 
    FiMinus, 
    FiTruck, 
    FiBox,
    FiCheckCircle 
} from "react-icons/fi";
import toast from "react-hot-toast";
import { getSafeImageUrl } from "@/lib/utils";
import StarRating from "@/components/StarRating";

const Product = () => {
  const { id } = useParams();
  const {
    router,
    addToCart,
    products: allProducts,
    user,
    wishlist,
    addToWishlist,
    removeFromWishlist,
  } = useAppContext();

  const [productData, setProductData] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0); 
  
  const [quantity, setQuantity] = useState(1); 

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [userReview, setUserReview] = useState(null);
  const [hasPurchased, setHasPurchased] = useState(false);

  const imageContainerRef = useRef(null);

  const fetchProductDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data: productInfo } = await supabase
        .from("products")
        .select("*, categories(name)")
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
      setCurrentImageIndex(0);

      const { data: reviewData } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", id)
        .order("created_at", { ascending: false });
      setReviews(reviewData || []);

      if (user) {
        const { data: userRev } = await supabase
          .from("reviews")
          .select("*")
          .eq("product_id", id)
          .eq("user_id", user.id)
          .single();
        setUserReview(userRev || null);
      }

      const { data: avgRatingData } = await supabase.rpc(
        "get_average_rating",
        { p_product_id: id }
      );
      setAverageRating(avgRatingData || 0);
    } catch (err) {
      toast.error("Veri çekilirken bir sorun oluştu.");
    }
    setLoading(false);
  }, [id, user]);

  const checkIfUserPurchased = useCallback(async () => {
    if (!user || !id) return;

    const { data, error } = await supabase
      .from("order_items")
      .select(
        `
          id,
          product_id,
          orders!inner (user_id)
        `
      )
      .eq("product_id", id)
      .eq("orders.user_id", user.id)
      .limit(1);

    if (error) {
      console.error("Satın alma kontrol hatası:", error);
      setHasPurchased(false);
      return;
    }

    setHasPurchased(data.length > 0);
  }, [user, id]);

  useEffect(() => {
    fetchProductDetails();
  }, [id, fetchProductDetails]);

  useEffect(() => {
    checkIfUserPurchased();
  }, [checkIfUserPurchased]);

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


  useEffect(() => {
    if (!productData || !imageContainerRef.current || productData.image_urls.length <= 1) return;

    const isLargeScreen = window.innerWidth >= 1024; 
    if (!isLargeScreen) return; 

    const imageWrapperHeight = window.innerHeight * 0.9; 

    const handleScroll = () => {
      const container = imageContainerRef.current;
      if (!container) return;

      const containerTop = container.getBoundingClientRect().top;
      const scrollStartOffset = 200; 

      const totalScrollY = (scrollStartOffset - containerTop);
      let nextIndex = Math.floor(totalScrollY / imageWrapperHeight);

      nextIndex = Math.max(0, Math.min(nextIndex, productData.image_urls.length - 1));

      if (nextIndex !== currentImageIndex) {
        setCurrentImageIndex(nextIndex);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [productData, currentImageIndex]);


  const isFavorited = wishlist.some((item) => item.product_id === productData?.id);

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Favorilere eklemek için giriş yapın.");
      router.push("/auth");
      return;
    }
    if (isFavorited) removeFromWishlist(productData.id);
    else addToWishlist(productData.id);
  };

  const handleNextImage = () => {
    const newIndex = (currentImageIndex + 1) % (productData.image_urls.length || 1);
    setCurrentImageIndex(newIndex);
  };
    
  const handlePrevImage = () => {
    const newIndex = (currentImageIndex - 1 + (productData.image_urls.length || 1)) % (productData.image_urls.length || 1);
    setCurrentImageIndex(newIndex);
  };
    
  const increaseQuantity = () => {
    if (quantity < productData.stock) {
        setQuantity(prev => prev + 1);
    } else {
        toast.error("Stokta bu kadar ürün yok.");
    }
  }

  const decreaseQuantity = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  }

  const handleAddToCart = () => {
    addToCart(productData, quantity);
    setQuantity(1); 
  }

  const approvedReviews = reviews.filter((r) => r.is_approved == true);
  if (loading || !productData) return <Loading />;
  
  const handleStarClick = () => {
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error("Yorum yapmak için giriş yapın.");
      router.push("/auth");
      return;
    }

    if (!hasPurchased) {
      toast.error("Yorum yazabilmek için ürünü satın almış olmanız gerekiyor.");
      return;
    }

    if (userReview) {
      toast.error("Bu ürün için zaten yorum yaptınız.");
      return;
    }

    if (userRating === 0) {
      toast.error("Lütfen bir yıldız puanı seçin.");
      return;
    }

    const { error } = await supabase.from("reviews").insert([
      {
        product_id: productData.id,
        user_id: user.id,
        rating: Number(userRating),
        comment: userComment,
        is_approved: false,
      },
    ]);

    if (error) {
      toast.error("Yorum gönderilemedi.");
      return;
    }

    toast.success("Yorumunuz incelenmek üzere gönderildi!");
    setIsReviewModalOpen(false);
    setUserRating(0);
    setUserComment("");
    fetchProductDetails();
  };


  return (
    <>
      {/* Genel sayfa arka planı kaldırıldı - varsayılan beyaz veya parent'tan gelen renk */}
      {/* mt-0 sm:mt-4 md:mt-8 lg:mt-12 transition-all duration-300 */}
     <div className="min-h-screen mt-0 md:mt-8 lg:mt-16">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">

          {/* GÖRSEL VE BİLGİ KISMI */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 xl:gap-x-12">
            
            {/* 🖼️ GÖRSEL BÖLÜMÜ - Mobil: Üstte Carousel, LG: Sol ve Orta Sütun */}
            <div 
              className="lg:col-span-2 flex flex-col md:flex-row gap-4 lg:sticky lg:top-20 lg:self-start lg:h-[90vh]" 
              style={{ top: '20px' }} 
            >
                {/* ------------------------------------- */}
                {/* 1. MOBİL/TABLET GÖRÜNÜMÜ (<= lg) - Slider/Carousel */}
                {/* ------------------------------------- */}
                <div className="lg:hidden w-full relative min-h-[60vh] rounded-lg overflow-hidden mb-4 shadow-md border border-gray-100"> {/* min-h-[60vh] ve shadow-md eklendi, border hafifletildi */}
                    <Image
                        src={productData.image_urls[currentImageIndex] || getSafeImageUrl(productData.image_urls, 0)}
                        alt={productData.name}
                        fill
                        className="object-contain object-center transition-all duration-300" // aspect-square kaldırıldı
                        priority
                    />
                    
                    {/* Mobil Navigasyon Butonları */}
                    {productData.image_urls.length > 1 && (
                        <>
                            <button
                                onClick={handlePrevImage}
                                className="absolute top-1/2 left-3 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg border border-gray-200 z-10 hover:bg-white transition"
                            >
                                <FiChevronLeft className="w-5 h-5 text-gray-700" />
                            </button>
                            <button
                                onClick={handleNextImage}
                                className="absolute top-1/2 right-3 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg border border-gray-200 z-10 hover:bg-white transition"
                            >
                                <FiChevronRight className="w-5 h-5 text-gray-700" />
                            </button>
                            
                            {/* İndikatörler */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1">
                                {productData.image_urls.map((_, index) => (
                                    <div 
                                        key={index}
                                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                                            index === currentImageIndex ? 'bg-teal-600' : 'bg-gray-300' // İndikatör rengi daha belirgin yapıldı
                                        }`}
                                        onClick={() => setCurrentImageIndex(index)}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                     {/* Favori Butonu */}
                    <button
                        onClick={handleFavoriteClick}
                        className="absolute top-3 right-3 z-10 p-2 bg-white rounded-full border border-gray-200 hover:scale-110 transition shadow"
                    >
                        <FiHeart
                            className={`w-5 h-5 ${
                                isFavorited ? "fill-red-500 text-red-500" : "text-gray-600"
                            }`}
                        />
                    </button>
                </div>

                {/* ------------------------------------- */}
                {/* 2. LG VE ÜZERİ GÖRÜNÜMÜ (> lg) - Sticky Scroll Effect */}
                {/* ------------------------------------- */}

                {/* 📸 Küçük Görsel Önizlemeler - Sol Sütun (Sadece LG ve üzeri) */}
                {productData.image_urls.length > 1 && (
                    <div className="hidden lg:flex flex-shrink-0 md:flex-col gap-2 overflow-x-auto md:overflow-y-auto w-full md:w-20 lg:w-24 pb-2 md:pb-0 lg:sticky lg:top-20 lg:self-start">
                        {productData.image_urls.map((url, index) => (
                            <div
                                key={index}
                                className={`w-full aspect-square rounded-lg cursor-pointer overflow-hidden transition-all duration-200 ${
                                    index === currentImageIndex
                                        ? "border-2 border-teal-500 scale-105 shadow-md"
                                        : "border border-gray-200 hover:opacity-80"
                                }`}
                                onClick={() => {
                                    setCurrentImageIndex(index);
                                    const imageWrapperHeight = window.innerHeight * 0.9;
                                    const targetScrollY = 
                                        (imageContainerRef.current ? imageContainerRef.current.offsetTop : 0) + 
                                        (imageWrapperHeight * index);
                                    
                                    window.scrollTo({
                                        top: targetScrollY - 200, 
                                        behavior: 'smooth'
                                    });
                                }}
                            >
                                <Image
                                    src={url}
                                    alt={`Ürün Görseli ${index + 1}`}
                                    width={100}
                                    height={100}
                                    className="object-cover w-full h-full"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* 🖼️ TÜM GÖRSELLERİN ALT ALTA LİSTESİ - Orta Sütun (Sadece LG ve üzeri, kendi içinde kaydırılabilir) */}
                <div 
                    className="hidden lg:block flex-grow space-y-8 overflow-y-auto pr-2" 
                    ref={imageContainerRef}
                    style={{ maxHeight: 'calc(90vh - 20px)' }} 
                >
                    
                    {productData.image_urls.map((url, index) => (
                        <div 
                            key={`full-${index}`}
                            className="relative rounded-lg overflow-hidden bg-gray-50 flex justify-center items-center border border-gray-100 shadow-sm"
                            style={{ height: '90vh' }} 
                        >
                            <Image
                                src={url}
                                alt={productData.name}
                                fill
                                className="object-contain object-center transition-all duration-300"
                                priority={index === 0} 
                            />
                            
                            <div className="absolute bottom-4 right-4 bg-black/50 text-white text-sm px-3 py-1 rounded-full z-10">
                                {index + 1} / {productData.image_urls.length}
                            </div>
                            
                            <button
                                onClick={handleFavoriteClick}
                                className="absolute top-3 right-3 z-10 p-2 bg-white rounded-full border border-gray-200 hover:scale-110 transition shadow"
                            >
                                <FiHeart
                                    className={`w-5 h-5 ${
                                        isFavorited ? "fill-red-500 text-red-500" : "text-gray-600"
                                    }`}
                                />
                            </button>
                        </div>
                    ))}
                    
                </div>
            </div>

            {/* 🧾 ÜRÜN BİLGİLERİ - Sağ Sütun (MOBİLDE AKIŞKAN, LG VE ÜZERİNDE STICKY) */}
            <div 
                className="w-full flex flex-col justify-start mt-4 lg:mt-0 lg:col-span-1 lg:sticky lg:top-20 lg:self-start z-10"
                style={{ top: '20px' }} 
            >
              
                {/* Tüm bilgileri içeren ana blok */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm lg:p-0 lg:rounded-none lg:shadow-none"> {/* Mobil için padding ve gölge eklendi */}
                    
                    {/* Başlık ve Fiyat */}
                    <h1 className="text-3xl font-serif tracking-wide text-gray-900 leading-tight"> {/* leading-tight eklendi */}
                        {productData.name}
                    </h1>
                    <p className="text-3xl font-bold text-teal-600 mt-2">${productData.price}</p>

                    {/* Yorumlar */}
                    <div
                        onClick={handleStarClick}
                        className="inline-flex items-center gap-3 mt-4 cursor-pointer group pb-4 border-b border-gray-100"
                    >
                        {approvedReviews.length > 0 && (
                        <span className="font-bold text-xl text-gray-800">
                            {averageRating.toFixed(1)}
                        </span>
                        )}
                        <StarRating rating={averageRating} size={24} /> {/* Star boyutu büyütüldü */}
                        <span className="text-gray-500 text-sm underline group-hover:text-gray-800 transition">
                        {approvedReviews.length} Yorumu Gör
                        </span>
                    </div>
                    
                    {/* Miktar Seçici */}
                    <div className="mt-6 flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100"> {/* Mobil için daha şık bir miktar seçici */}
                        <label htmlFor="quantity" className="text-lg font-medium text-gray-700">Miktar</label>
                        <div className="flex items-center">
                            <button 
                                onClick={decreaseQuantity}
                                disabled={quantity <= 1}
                                className="p-2 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition rounded-l-md"
                            >
                                <FiMinus className="w-4 h-4" />
                            </button>
                            <input 
                                type="number" 
                                id="quantity"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                                className="w-10 text-center bg-transparent py-1 outline-none text-lg font-semibold text-gray-800"
                                min="1"
                                max={productData.stock}
                                readOnly
                            />
                            <button 
                                onClick={increaseQuantity}
                                disabled={quantity >= productData.stock}
                                className="p-2 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition rounded-r-md"
                            >
                                <FiPlus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    
                    {/* SEPTE EKLE BUTONU (SADECE LG VE ÜZERİ İÇİN BURADA KALIR) */}
                    <div className="mt-4 hidden lg:block">
                        <button
                            onClick={handleAddToCart}
                            disabled={productData.stock < 1}
                            className={`w-full py-4 text-white rounded-lg font-semibold text-lg transition duration-300 shadow-lg ${
                                productData.stock < 1 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-teal-600 hover:bg-teal-700 hover:shadow-xl'
                            }`}
                        >
                            {productData.stock < 1 ? 'Stokta Yok' : 'Sepete Ekle'}
                        </button>
                    </div>

                    {/* Kargo/Teslimat Bilgileri */}
                 
                
                    {/* Ürün Açıklaması ve Detayları */}
                    <div className="mt-8 space-y-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 p-6 shadow-sm"> {/* shadow-sm eklendi */}
                        <div className="border-b pb-4">
                        <h2 className="font-semibold text-xl text-gray-900 mb-2 tracking-wide">
                            Ürün Açıklaması
                        </h2>
                        <p className="text-gray-700 leading-relaxed text-base">
                            {productData.description ||
                            "Bu ürün için bir açıklama mevcut değil."}
                        </p>
                        </div>

                        <div>
                        <h2 className="font-semibold text-xl text-gray-900 mb-2 tracking-wide">
                            Ürün Detayları
                        </h2>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
                            <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full font-medium">
                            <strong>Kategori:</strong>{" "}
                            {productData.categories?.name || "Belirtilmemiş"}
                            </span>
                            <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full font-medium">
                            <strong>Stok:</strong> {productData.stock} adet
                            </span>
                            <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full font-medium">
                            <strong>Kod:</strong>{" "}
                            {productData.id.substring(0, 8)}
                            </span>
                        </div>
                        </div>
                    </div>
                </div>

            </div>
          </div>

          {/* 🛍️ İLGİLİ ÜRÜNLER */}
          {relatedProducts.length > 0 && (
            <div className="py-16 border-t mt-16">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-serif text-gray-900">
                  İlgili Ürünler
                </h2>
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
      
      {/* 🚀 MOBİL CTA BUTON ALANI (Ekranın en altında sabitlenir) */}
      <div 
        className="lg:hidden p-4 bg-white border-t border-gray-200 z-50 shadow-2xl" // Daha belirgin bir gölge
        style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} 
      >
        <button
            onClick={handleAddToCart}
            disabled={productData?.stock < 1}
            className={`w-full py-4 text-white rounded-lg font-semibold text-lg transition duration-300 shadow-lg ${ // Butonun kendi gölgesi
                productData?.stock < 1 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-teal-600 hover:bg-teal-700 hover:shadow-xl'
            }`}
        >
            {productData?.stock < 1 ? 'Stokta Yok' : `Sepete Ekle`}
        </button>
      </div>

      {/* ✨ POPUP — Yorumlar + Yorum Yazma */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg relative max-h-[90vh] flex flex-col border border-gray-100 shadow-xl"> {/* Yorum modalına gölge eklendi */}
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
            >
              <FiX className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
              Ürün Yorumları ({approvedReviews.length})
            </h2>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4 border-b pb-4">
              {approvedReviews.length === 0 ? (
                <p className="text-gray-500 text-center">Henüz onaylanmış yorum yok.</p>
              ) : (
                approvedReviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-b pb-3 last:border-none flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-2">
                      <StarRating rating={Number(review.rating)} size={20} /> {/* Yıldız boyutu ayarlandı */}
                      <span className="text-sm font-medium text-gray-600">
                          {review.user_id === user?.id ? "Siz" : "Kullanıcı"}
                      </span>
                    </div>
                    <p className="text-gray-800 text-sm">{review.comment}</p>
                    <span className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleString("tr-TR", { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                ))
              )}
            </div>

            {!user ? (
              <p className="text-center text-red-500 text-sm py-4 border-t">
                Yorum yazmak için lütfen <button onClick={() => router.push("/auth")} className="text-teal-600 underline hover:no-underline">giriş yapın</button>.
              </p>
            ) : userReview ? (
              <p className="text-center text-gray-500 text-sm py-4 border-t">
                Bu ürün için zaten bir yorum yaptınız. Yorumunuz onayda olabilir.
              </p>
            ) : hasPurchased ? (
              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Yorumunuzu Yazın</h3>
                <div className="flex justify-center mb-3">
                  <StarRating
                    rating={userRating}
                    onRatingChange={setUserRating}
                    size={30}
                  />
                </div>
                <textarea
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  placeholder="Yorumunuzu yazın..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none mb-3 transition"
                />
                <button
                  onClick={handleSubmitReview}
                  disabled={userRating === 0 || userComment.trim().length < 10}
                  className={`w-full font-semibold py-3 rounded-lg transition duration-300 ${
                    userRating === 0 || userComment.trim().length < 10
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-teal-600 hover:bg-teal-700 text-white"
                  }`}
                >
                  Yorumu Gönder
                </button>
              </div>
            ) : (
              <p className="text-center text-gray-500 text-sm py-4 border-t">
                Yorum yazmak için önce bu ürünü satın almış olmalısınız 🛍️
              </p>
            )}
          </div>
        </div>
      )}

      {/* Footer'dan önce, sabit mobil CTA div'inin yüksekliği kadar boşluk bırakıldı. */}
      <div className="mb-[90px] lg:mb-0"> 
        <Footer />
      </div>
    </>
  );
};

export default Product;