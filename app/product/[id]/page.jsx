'use client';

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
    FiCheckCircle,
    FiTruck, // Kargo
    FiRefreshCw, // İade
    FiLock // Güvenli Ödeme
} from "react-icons/fi";
import toast from "react-hot-toast";
import { getSafeImageUrl } from "@/lib/utils";
import StarRating from "@/components/StarRating";

// --- YENİ BİLEŞEN: GÜVEN ROZETLERİ ---
const TrustBadges = () => (
    <div className="flex justify-around items-center text-center mt-6 py-4 border-t border-b border-gray-100 bg-[#f8fcf8] rounded-lg">
        <div className="flex flex-col items-center gap-1">
            <FiTruck className="w-6 h-6 text-teal-600" />
            <span className="text-xs font-medium text-gray-700">Ücretsiz Kargo</span>
        </div>
        <div className="flex flex-col items-center gap-1">
            <FiRefreshCw className="w-6 h-6 text-teal-600" />
            <span className="text-xs font-medium text-gray-700">Kolay İade</span>
        </div>
        <div className="flex flex-col items-center gap-1">
            <FiLock className="w-6 h-6 text-teal-600" />
            <span className="text-xs font-medium text-gray-700">Güvenli Ödeme</span>
        </div>
    </div>
);
// ----------------------------------------

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
    
    // Aktif Sekmeyi tutar. Değerler string olarak tutulur ('description' veya 'reviews').
    const [activeTab, setActiveTab] = useState('description'); 

    // Yorum Yazma Formu State'leri
    const [userRating, setUserRating] = useState(0);
    const [userComment, setUserComment] = useState("");
    const [userReview, setUserReview] = useState(null);
    const [hasPurchased, setHasPurchased] = useState(false);

    // Büyük (LG+) ekranlardaki dikey kaydırılabilir alana referans
    const imageContainerRef = useRef(null); 
    // MOBİL (LG-) ekranlardaki yatay kaydırılabilir alana referans
    const mobileCarouselRef = useRef(null); 

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
                .select("*, user_profiles(full_name)")
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
            console.error(err);
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

    // LG ve üzeri için scroll ile görsel değiştirme mantığı (Dikey) - Orijinal mantık korundu
    useEffect(() => {
        if (!productData || !imageContainerRef.current || window.innerWidth < 1024) return;

        const imageWrapperHeight = window.innerHeight * 0.9;
        const spacing = 32; 

        let timeoutId;
        const handleScroll = () => {
            const container = imageContainerRef.current;
            if (!container) return;

            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const currentScrollTop = container.scrollTop;
                const threshold = (imageWrapperHeight + spacing) / 2;
                
                const newIndex = Math.floor((currentScrollTop + threshold) / (imageWrapperHeight + spacing));

                if (newIndex !== currentImageIndex) {
                    setCurrentImageIndex(Math.max(0, Math.min(newIndex, productData.image_urls.length - 1)));
                }
            }, 100);
        };

        const containerElement = imageContainerRef.current;
        containerElement.addEventListener("scroll", handleScroll);

        return () => {
            containerElement.removeEventListener("scroll", handleScroll);
            clearTimeout(timeoutId);
        };
    }, [productData, currentImageIndex]);

    // Mobil (LG-) için index değişimine göre yatay kaydırma senkronizasyonu - Orijinal mantık korundu
    useEffect(() => {
        if (!productData || !mobileCarouselRef.current || window.innerWidth >= 1024) return;
        
        const container = mobileCarouselRef.current;

        // currentImageIndex değiştiğinde (buton/indikatör ile), konteyneri kaydır
        container.scrollTo({
            left: container.clientWidth * currentImageIndex,
            behavior: 'smooth'
        });

        // Mobil kaydırmada indeksi güncelleme (Kullanıcı kaydırmayı bitirdiğinde)
        let timeoutId;
        const handleScrollEnd = () => {
            const scrollPosition = container.scrollLeft;
            const imageWidth = container.clientWidth;
            
            const newIndex = Math.round(scrollPosition / imageWidth);
            
            if (newIndex !== currentImageIndex) {
                setCurrentImageIndex(newIndex);
            }
        };

        const handleScroll = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(handleScrollEnd, 150); // Debounce
        };

        container.addEventListener("scroll", handleScroll);

        return () => {
            container.removeEventListener("scroll", handleScroll);
            clearTimeout(timeoutId);
        };
    }, [currentImageIndex, productData]);


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

    const approvedReviews = reviews.filter((r) => r.is_approved === true);
    
    // Yorumu Gönderme İşlevi
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
        
        if (userComment.trim().length < 10) {
            toast.error("Yorumunuz en az 10 karakter olmalıdır.");
            return;
        }

        try {
            const { error } = await supabase.from("reviews").insert([
                {
                    product_id: productData.id,
                    user_id: user.id,
                    rating: Number(userRating),
                    comment: userComment,
                    is_approved: false, // Onay bekliyor
                },
            ]);

            if (error) {
                console.error(error);
                throw new Error("Supabase insert error");
            }

            toast.success("Yorumunuz incelenmek üzere gönderildi! Teşekkür ederiz.");
            setUserRating(0);
            setUserComment("");
            fetchProductDetails(); // Yorumu yenile
        } catch (e) {
             toast.error("Yorum gönderilemedi.");
        }
    };

    // YAN THUMBNAIL'E TIKLAMA İŞLEVİ (LG ve üzeri) - Orijinal mantık korundu
    const handleThumbnailClick = (index) => {
        setCurrentImageIndex(index);
        
        const container = imageContainerRef.current;
        if (!container) return;

        const imageWrapperHeight = window.innerHeight * 0.9;
        const spacing = 32; 
        
        const targetScrollTop = index * (imageWrapperHeight + spacing); 
        
        // Pencereyi değil, iç konteyneri kaydır
        container.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
        });
    }

    if (loading || !productData) return <Loading />;
    
    // --- BİLEŞEN: YORUM YAZMA FORMU ---
    const ReviewForm = () => {
        if (!user) {
            return (
                <p className="text-center text-red-500 text-sm py-4 border-t border-gray-100">
                    Yorum yazmak için lütfen <button onClick={() => router.push("/auth")} className="text-teal-600 font-semibold underline hover:no-underline">giriş yapın</button>.
                </p>
            );
        }

        if (userReview) {
            return (
                <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-3">
                    <FiCheckCircle className="w-5 h-5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold">Yorumunuz Gönderildi!</p>
                        <p className="text-sm">Bu ürün için zaten bir yorum yaptınız. Yorumunuz onay sürecindedir.</p>
                    </div>
                </div>
            );
        }

        if (!hasPurchased) {
            return (
                <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg flex items-center gap-3">
                    <FiCheckCircle className="w-5 h-5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold">Satın Alma Gerekli</p>
                        <p className="text-sm">Yorum yazabilmek için ürünü **satın almış olmanız** gerekiyor 🛍️</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="pt-4 border-t border-gray-100">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Sizin Yorumunuz</h3>
                <div className="flex justify-center mb-3">
                    <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                            <button 
                                key={i} 
                                type="button" 
                                onClick={() => setUserRating(i + 1)} 
                                className="focus:outline-none"
                            >
                                <svg 
                                    className={`w-7 h-7 transition-colors duration-200 ${i < userRating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`} 
                                    fill="currentColor" 
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.561-.955L10 0l2.95 5.955 6.561.955-4.756 4.635 1.123 6.545z" />
                                </svg>
                            </button>
                        ))}
                    </div>
                </div>
                <textarea
                    value={userComment}
                    onChange={(e) => setUserComment(e.target.value)}
                    placeholder="Ürünle ilgili düşüncelerinizi yazın (min. 10 karakter)..."
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none mb-3 transition"
                    maxLength={500}
                />
                <button
                    onClick={handleSubmitReview}
                    disabled={userRating === 0 || userComment.trim().length < 10}
                    className={`w-full font-semibold py-3 rounded-lg transition duration-300 ${
                        userRating === 0 || userComment.trim().length < 10
                            ? "bg-gray-400 cursor-not-allowed text-gray-100"
                            : "bg-teal-600 hover:bg-teal-700 text-white shadow-md"
                    }`}
                >
                    Yorumu Gönder
                </button>
            </div>
        );
    };


    // --- BİLEŞEN: YORUMLAR LİSTESİ ---
    const ReviewsList = () => (
        <div className="pt-4 space-y-4">
            {approvedReviews.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Bu ürün için henüz onaylanmış bir yorum yok.</p>
            ) : (
                approvedReviews.map((review) => (
                    <div
                        key={review.id}
                        className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col gap-2"
                    >
                        <div className="flex items-center justify-between">
                            <StarRating rating={Number(review.rating)} size={20} />
                            <span className={`text-sm font-medium ${review.user_id === user?.id ? "text-teal-600" : "text-gray-600"}`}>
                                {review.user_id === user?.id 
                                    ? "Siz (Yorumunuz)" 
                                    : review.user_profiles?.full_name ? `${review.user_profiles.full_name.split(' ')[0]}...` : "Kullanıcı"}
                            </span>
                        </div>
                        <p className="text-gray-800 text-base leading-relaxed">"{review.comment}"</p>
                        <span className="text-xs text-gray-400">
                            {new Date(review.created_at).toLocaleDateString("tr-TR", { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                ))
            )}
        </div>
    );


    // --- BİLEŞEN: AÇIKLAMA İÇERİĞİ ---
    const DescriptionContent = () => (
        <div className="mt-6 space-y-6 bg-gradient-to-br from-[#FFFFF0] to-[#f0fff0] rounded-xl border border-gray-100 p-6 shadow-sm">
            <div className="border-b pb-4">
                <h2 className="font-semibold text-xl text-gray-900 mb-2 tracking-wide">
                    Ürün Açıklaması
                </h2>
                <p className="text-gray-700 leading-relaxed text-base">
                    {productData.description || "Bu ürün için bir açıklama mevcut değil."}
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
    );

    // --- RENDER BÖLÜMÜ ---
    return (
        <>
            <div className="min-h-screen mt-0 md:mt-8 lg:mt-16 bg-[#FFFFF0]"> 
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 xl:gap-x-12">
                        
                        {/* 🖼️ GÖRSEL BÖLÜMÜ - LG: Sol ve Orta Sütun */}
                        <div 
                            className="lg:col-span-2 flex flex-col md:flex-row gap-4 lg:sticky lg:top-20 lg:self-start lg:h-[90vh]" 
                            style={{ top: '20px' }} 
                        >
                            {/* 1. MOBİL/TABLET GÖRÜNÜMÜ (<= lg) - Swipeable Carousel */}
                            <div className="lg:hidden w-full relative min-h-[60vh] rounded-lg overflow-hidden mb-4 shadow-md border border-gray-100"> 
                                {/* Yatay kaydırılabilir görsel listesi */}
                                <div 
                                    ref={mobileCarouselRef} 
                                    className="absolute inset-0 flex overflow-x-scroll snap-x snap-mandatory scroll-smooth"
                                >
                                    {productData.image_urls.map((url, index) => (
                                        <div 
                                            key={`mobile-${index}`} 
                                            className="flex-shrink-0 w-full h-full relative snap-center"
                                            style={{ minWidth: '100%' }} 
                                        >
                                            <Image
                                                src={url}
                                                alt={`${productData.name} - ${index + 1}`}
                                                fill
                                                className="object-contain object-center"
                                                priority={index === 0}
                                            />
                                        </div>
                                    ))}
                                </div>
                                
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
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1 z-10">
                                            {productData.image_urls.map((_, index) => (
                                                <div 
                                                    key={index}
                                                    className={`w-2 h-2 rounded-full transition-colors duration-300 cursor-pointer ${
                                                        index === currentImageIndex ? 'bg-teal-600' : 'bg-gray-300' 
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

                            {/* 2. LG VE ÜZERİ GÖRÜNÜMÜ (> lg) - Sticky Scroll Effect */}

                            {/* 📸 Küçük Görsel Önizlemeler - Sol Sütun (Sadece LG ve üzeri) */}
                            {productData.image_urls.length > 1 && (
                                <div className="hidden lg:flex flex-shrink-0 md:flex-col gap-2 overflow-x-auto md:overflow-y-auto w-full md:w-20 lg:w-24 pb-2 md:pb-0 lg:self-start">
                                    {productData.image_urls.map((url, index) => (
                                        <div
                                            key={index}
                                            className={`w-full aspect-square rounded-lg cursor-pointer overflow-hidden transition-all duration-200 ${
                                                index === currentImageIndex
                                                    ? "border-2 border-teal-500 scale-105 shadow-md"
                                                    : "border border-gray-200 hover:opacity-80"
                                            }`}
                                            onClick={() => handleThumbnailClick(index)}
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

                            {/* 🖼️ TÜM GÖRSELLERİN ALT ALTA LİSTESİ - Orta Sütun (Sadece LG ve üzeri, Kendi içinde kaydırılabilir) */}
                            <div 
                                className="hidden lg:block flex-grow space-y-8 overflow-y-auto pr-2" 
                                ref={imageContainerRef}
                                style={{ maxHeight: 'calc(90vh - 4px)' }} 
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

                        {/* 🧾 ÜRÜN BİLGİLERİ - Sağ Sütun (CTA kısmı) */}
                        <div 
                            className="w-full flex flex-col justify-start mt-4 lg:mt-0 lg:col-span-1 lg:sticky lg:top-20 lg:self-start z-10"
                            style={{ top: '20px' }} 
                        >
                            
                            {/* TÜM BİLGİLERİ İÇEREN ANA BLOK */}
                            <div className="bg-[#FFFFF0] p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
                                
                                {/* Başlık ve Fiyat */}
                                <h1 className="text-3xl font-serif tracking-wide text-gray-900 leading-tight">
                                    {productData.name}
                                </h1>
                                <p className="text-3xl font-bold text-teal-600 mt-2">${productData.price}</p>

                                {/* Yorum Puanı ve Sayısı (Yorum sekmesine geçiş) */}
                                <div
                                    onClick={() => setActiveTab('reviews')} // Yorum sekmesine geçiş
                                    className="inline-flex items-center gap-3 mt-4 cursor-pointer group pb-4 border-b border-gray-100"
                                >
                                    {approvedReviews.length > 0 && (
                                    <span className="font-bold text-xl text-gray-800">
                                        {averageRating.toFixed(1)}
                                    </span>
                                    )}
                                    <StarRating rating={averageRating} size={24} /> 
                                    <span className="text-gray-500 text-sm underline group-hover:text-gray-800 transition">
                                    {approvedReviews.length} Yorum
                                    </span>
                                </div>
                                
                                {/* Miktar Seçici */}
                                <div className="mt-6 flex items-center justify-between p-2 bg-[#f0fff0] rounded-lg border border-gray-100"> 
                                    <label htmlFor="quantity" className="text-lg font-medium text-gray-700">Miktar</label>
                                    <div className="flex items-center">
                                        <button 
                                            onClick={decreaseQuantity}
                                            disabled={quantity <= 1}
                                            className="p-2 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition rounded-l-md"
                                        >
                                            <span className="sr-only">Miktarı azalt</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
                                        </button>
                                        <input 
                                            type="number" 
                                            id="quantity"
                                            value={quantity}
                                            onChange={(e) => setQuantity(Math.max(1, Math.min(productData.stock, Number(e.target.value))))}
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
                                            <span className="sr-only">Miktarı artır</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                        </button>
                                    </div>
                                </div>
                                
                                {/* SEPTE EKLE BUTONU (LG ve üzeri) */}
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

                                {/* ⭐ YENİ EKLEME: GÜVEN ROZETLERİ (LG VE ÜZERİ) ⭐ */}
                                <div className="hidden lg:block">
                                    <TrustBadges />
                                </div>
                                {/* ⭐ BİTİŞ: GÜVEN ROZETLERİ (LG VE ÜZERİ) ⭐ */}
                                
                            </div>
                        </div>
                    </div>
                    
                    {/* 👇 YENİ BÖLÜM: AÇIKLAMA VE YORUMLAR SEKMELERİ */}
                    <div className="mt-16 bg-[#FFFFF0] rounded-xl shadow-lg border border-gray-100 p-4 sm:p-8">
                        {/* Sekmeler */}
                        <div className="flex border-b border-gray-200 mb-6">
                            <button
                                onClick={() => setActiveTab('description')}
                                className={`py-3 px-6 text-lg font-medium transition-colors duration-300 ${
                                    activeTab === 'description' 
                                        ? 'border-b-2 border-teal-600 text-teal-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Açıklama & Detaylar
                            </button>
                            <button
                                onClick={() => setActiveTab('reviews')}
                                className={`py-3 px-6 text-lg font-medium transition-colors duration-300 flex items-center gap-2 ${
                                    activeTab === 'reviews' 
                                        ? 'border-b-2 border-teal-600 text-teal-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Yorumlar 
                                <span className={`text-sm rounded-full px-2 py-0.5 font-bold ${activeTab === 'reviews' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                    {approvedReviews.length}
                                </span>
                            </button>
                        </div>

                        {/* İçerik */}
                        <div className="min-h-[300px]">
                            {activeTab === 'description' && <DescriptionContent />}
                            {activeTab === 'reviews' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Yorum Listesi */}
                                    <div className="lg:order-2">
                                        <h3 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">
                                            Müşteri Yorumları
                                        </h3>
                                        <div className="max-h-[500px] overflow-y-auto pr-2">
                                            <ReviewsList />
                                        </div>
                                    </div>
                                    {/* Yorum Yazma Formu */}
                                    <div className="lg:order-1 bg-gray-50 p-6 rounded-xl shadow-inner border border-gray-200">
                                        <ReviewForm />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* 🛍️ İLGİLİ ÜRÜNLER */}
                    {relatedProducts.length > 0 && (
                        <div className="py-16 border-t border-teal-100 mt-16">
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
            
            {/* 🚀 MOBİL CTA BUTON ALANI */}
            <div 
                className="lg:hidden p-4 bg-[#FFFFF0] border-t border-gray-200 z-50 shadow-2xl" 
                style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} 
            >
                {/* ⭐ YENİ EKLEME: GÜVEN ROZETLERİ (MOBİL) ⭐ */}
                <TrustBadges />
                {/* ⭐ BİTİŞ: GÜVEN ROZETLERİ (MOBİL) ⭐ */}

                <button
                    onClick={handleAddToCart}
                    disabled={productData?.stock < 1}
                    className={`w-full py-4 text-white rounded-lg font-semibold text-lg transition duration-300 shadow-lg mt-4 ${
                        productData?.stock < 1 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-teal-600 hover:bg-teal-700 hover:shadow-xl'
                    }`}
                >
                    {productData?.stock < 1 ? 'Stokta Yok' : `Sepete Ekle`}
                </button>
            </div>

            {/* Footer'dan önce, sabit mobil CTA div'inin yüksekliği kadar boşluk bırakıldı. */}
            {/* Not: Mobil CTA alanına TrustBadges eklendiği için yaklaşık 40px daha yükseklik eklenmesi gerekebilir. */}
            <div className="mb-[150px] lg:mb-0"> 
                <Footer />
            </div>
        </>
    );
};

export default Product;