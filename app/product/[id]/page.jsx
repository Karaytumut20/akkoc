// app/product/[id]/page.jsx

"use client"
import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import Image from "next/image";
import { useParams } from "next/navigation";
import Loading from "@/components/Loading";
import { useAppContext } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";
import React from "react";
import Link from "next/link";
import StarRating from "@/components/StarRating";
import { FiChevronLeft, FiChevronRight, FiHeart } from "react-icons/fi";
import ReviewModal from "@/components/ReviewModal";
import toast from "react-hot-toast";

const Product = () => {
    const { id } = useParams();
    const { router, addToCart, products: allProducts, getSafeImageUrl, user, myOrders, authLoading, wishlist, addToWishlist, removeFromWishlist } = useAppContext();

    const [productData, setProductData] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isReviewModalOpen, setReviewModalOpen] = useState(false);
    const [hasPurchased, setHasPurchased] = useState(false);

    // --- Veri Çekme Fonksiyonları (Değişiklik Yok) ---
    const fetchProductData = async () => {
        if (!id) return;
        setLoading(true);
        const { data, error } = await supabase.from('products').select('*, categories(name)').eq('id', id).single();
        if (error) {
            console.error("Ürün alınamadı:", error.message);
            setProductData(null);
        } else {
            let imageUrls = [];
            if (typeof data.image_urls === 'string') {
                try { imageUrls = JSON.parse(data.image_urls); } catch { imageUrls = []; }
            } else if (Array.isArray(data.image_urls)) {
                imageUrls = data.image_urls;
            }
            setProductData({ ...data, image_urls: imageUrls });
        }
        setLoading(false);
    };

    const fetchReviews = async () => {
        if (!id) return;
        const { data, error } = await supabase.from('reviews').select('*, users(email)').eq('product_id', id).eq('is_approved', true).order('created_at', { ascending: false });
        if (!error) setReviews(data || []);
    };

    useEffect(() => {
        fetchProductData();
        fetchReviews();
    }, [id]);

    useEffect(() => {
        if (authLoading) return;
        if (user && myOrders && myOrders.length > 0 && productData) {
            const purchased = myOrders.some(order => order.order_items.some(item => item.product_id === productData.id));
            setHasPurchased(purchased);
        } else {
            setHasPurchased(false);
        }
    }, [user, myOrders, productData, authLoading]);

    useEffect(() => {
        if (productData && allProducts.length > 0) {
            setRelatedProducts(allProducts.filter(p => p.category_id === productData.category_id && p.id !== productData.id).slice(0, 5));
        }
    }, [productData, allProducts]);

    const isFavorited = wishlist.some(item => item.product_id === productData?.id);

    const handleFavoriteClick = (e) => {
        e.stopPropagation();
        if (!user) {
            toast.error("Favorilere eklemek için lütfen giriş yapın.");
            router.push('/auth');
            return;
        }
        if (isFavorited) {
            removeFromWishlist(productData.id);
        } else {
            addToWishlist(productData.id);
        }
    };

    if (loading || !productData) return <Loading />;

    const averageRating = reviews.length > 0 ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length : 0;
    const mainImage = productData.image_urls[currentImageIndex] || getSafeImageUrl(productData.image_urls, 0);

    const handleNextImage = () => setCurrentImageIndex((prev) => (prev + 1) % productData.image_urls.length);
    const handlePrevImage = () => setCurrentImageIndex((prev) => (prev - 1 + productData.image_urls.length) % productData.image_urls.length);

    return (
        <>
            <div className="bg-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12">
                        {/* SOL TARAF: GÖRSEL GALERİ VE FAVORİ BUTONU */}
                        <div className="w-full">
                            <div className="relative w-full aspect-square rounded-lg overflow-hidden group mb-4">
                                <Image src={mainImage} alt={productData.name} fill className="object-contain" sizes="(max-width: 1024px) 90vw, 45vw" priority />
                                <button
                                    onClick={handleFavoriteClick}
                                    className="absolute top-3 right-3 z-10 p-2 bg-white rounded-full shadow-md transition-all hover:scale-110"
                                    aria-label={isFavorited ? "Favorilerden kaldır" : "Favorilere ekle"}
                                >
                                    <FiHeart className={`w-5 h-5 transition-all duration-300 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                                </button>
                                {productData.image_urls.length > 1 && (
                                    <>
                                        <button onClick={handlePrevImage} className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-white/60 hover:bg-white p-2 rounded-full shadow-md transition z-10 opacity-0 group-hover:opacity-100"><FiChevronLeft className="w-5 h-5" /></button>
                                        <button onClick={handleNextImage} className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-white/60 hover:bg-white p-2 rounded-full shadow-md transition z-10 opacity-0 group-hover:opacity-100"><FiChevronRight className="w-5 h-5" /></button>
                                    </>
                                )}
                            </div>
                            <div className="flex justify-center gap-3">
                                {productData.image_urls.map((image, index) => (
                                    <button key={index} onClick={() => setCurrentImageIndex(index)} className={`w-16 h-16 rounded-md overflow-hidden relative border-2 transition ${currentImageIndex === index ? 'border-gray-900' : 'border-transparent hover:border-gray-400'}`}>
                                        <Image src={image} alt={`Thumbnail ${index + 1}`} fill className="object-cover" sizes="10vw" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* SAĞ TARAF: ÜRÜN BİLGİLERİ */}
                        <div className="w-full flex flex-col pt-8 lg:pt-0">
                            <h1 className="text-3xl font-serif tracking-wide text-gray-900">{productData.name}</h1>
                            <p className="text-2xl text-gray-700 mt-2">${productData.price}</p>
                            
                            {/* DÜZENLENMİŞ TIKLANABİLİR DEĞERLENDİRME ALANI */}
                            <div 
                                className="inline-flex items-center gap-3 mt-4 cursor-pointer group"
                                onClick={() => setReviewModalOpen(true)}
                                onKeyDown={(e) => e.key === 'Enter' && setReviewModalOpen(true)}
                                role="button"
                                tabIndex={0}
                                aria-label="Değerlendirmeleri gör ve yorum yap"
                            >
                                {reviews.length > 0 && (
                                    <span className="font-bold text-lg text-gray-800">{averageRating.toFixed(1)}</span>
                                )}
                                <StarRating rating={averageRating} />
                                <span className="text-gray-500 text-sm group-hover:text-gray-800 transition group-hover:underline">
                                    {reviews.length > 0 ? `${reviews.length} Değerlendirme` : "İlk değerlendirmeyi yap"}
                                </span>
                            </div>

                            <div className="mt-8">
                                <button onClick={() => addToCart(productData)} className="w-full py-4 bg-teal-600 text-white hover:bg-teal-700 transition rounded-md font-semibold text-base tracking-wider">
                                    Sepete Ekle
                                </button>
                            </div>
                            
                            <div className="mt-10 space-y-8">
                                <div>
                                    <h2 className="font-semibold text-lg text-gray-800 mb-3">Ürün Açıklaması</h2>
                                    <p className="text-gray-600 leading-relaxed">{productData.description || "Bu ürün için bir açıklama mevcut değil."}</p>
                                </div>
                                <div>
                                    <h2 className="font-semibold text-lg text-gray-800 mb-3">Ürün Detayları</h2>
                                    <div className="flex flex-wrap items-center text-sm text-gray-600">
                                        <span className="detail-item">Kategori: {productData.categories?.name || 'Belirtilmemiş'}</span>
                                        <span className="detail-item">Stok: {productData.stock} adet</span>
                                        <span className="detail-item">Ürün Kodu: {productData.id.substring(0, 8)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {relatedProducts.length > 0 && (
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 border-t mt-16">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-serif text-gray-900">İlgili Ürünler</h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10 w-full">
                            {relatedProducts.map((product) => <ProductCard key={product.id} product={product} />)}
                        </div>
                    </div>
                )}
            </div>

            <ReviewModal 
                isOpen={isReviewModalOpen}
                onClose={() => setReviewModalOpen(false)}
                reviews={reviews}
                productId={id}
                fetchReviews={fetchReviews}
                hasPurchased={hasPurchased}
            />

            <Footer />
        </>
    );
};

export default Product;