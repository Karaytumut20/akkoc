// context/AppContext.jsx

'use client'

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { getSafeImageUrl } from "@/lib/utils";

// CALIFORNIA_TAX_RATE constant defined here
const CALIFORNIA_TAX_RATE = 0.0825;

// Database setting key
const REVIEW_PERMISSION_KEY = 'review_permission';

// Create Context
export const AppContext = createContext(undefined);

// Hook to use context
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppContextProvider');
    }
    return context;
};

// YENİ: Akıllı fiyat hesaplama fonksiyonu - TAMAMEN DÜZELTİLMİŞ
const calculatePriceForQuantity = (product, quantity) => {
  // 1 adet için her zaman normal fiyat
  if (quantity === 1) {
    return {
      unitPrice: product.price,
      totalPrice: product.price,
      priceType: 'standard',
      isPromotional: false
    };
  }

  // Paket fiyatlarını kontrol et (2'den 11'e kadar)
  const packPriceField = `price_${quantity}_pack`;
  
  // Paket fiyatı var mı, geçerli mi ve 0'dan büyük mü kontrol et
  const packPrice = product[packPriceField];
  const hasValidPackPrice = packPrice !== undefined && 
                           packPrice !== null && 
                           !isNaN(packPrice) && 
                           Number(packPrice) > 0;

  if (hasValidPackPrice) {
    // Geçerli paket fiyatı varsa - PAKET FİYATINI kullan
    const packPriceValue = Number(packPrice);
    const unitPrice = packPriceValue / quantity; // Birim fiyat hesapla (gösterim için)
    return {
      unitPrice: unitPrice, // Birim fiyat (gösterim)
      totalPrice: packPriceValue, // Toplam fiyat (paket fiyatı)
      priceType: `${quantity}_pack`,
      isPromotional: true,
      originalUnitPrice: product.price // Orijinal birim fiyatı sakla
    };
  } else {
    // Paket fiyatı yoksa veya geçersizse - NORMAL FİYAT × MİKTAR kullan
    return {
      unitPrice: product.price, // Normal birim fiyat
      totalPrice: product.price * quantity, // Normal fiyat × miktar
      priceType: 'standard',
      isPromotional: false
    };
  }
};

// Context Provider Component
export const AppContextProvider = (props) => {
    // ---- STATE VARIABLES ----
    const currency = process.env.NEXT_PUBLIC_CURRENCY || "$";
    const router = useRouter();

    // Products
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Cart
    const [cartItems, setCartItems] = useState({});

    // User Authentication
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    // User Account Data
    const [addresses, setAddresses] = useState([]);
    const [myOrders, setMyOrders] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [myReviews, setMyReviews] = useState([]);
    const [savedCards, setSavedCards] = useState([]);
    const [myReturns, setMyReturns] = useState([]);

    // Store Settings
    const [reviewPermissionSetting, setReviewPermissionSetting] = useState('purchasers_only');

    // Inactivity Timer
    const inactivityTimer = useRef(null);

    // ---- YARDIMCI FONKSİYONLAR ----

    // Benzersiz cart item ID oluştur
    const generateCartItemId = () => {
        return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    };

    // ---- TEMEL FONKSİYONLAR ----

    // Sign out after inactivity
    const signOutAfterInactivity = useCallback(() => {
        toast('Session ended due to inactivity, signing out.', { icon: '👋' });
        supabase.auth.signOut();
    }, []);

    // Reset inactivity timer
    const resetInactivityTimer = useCallback(() => {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = setTimeout(signOutAfterInactivity, 10 * 60 * 1000);
    }, [signOutAfterInactivity]);

    // useEffect managing inactivity timer
    useEffect(() => {
        if (user) {
            const events = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'];
            events.forEach(event => window.addEventListener(event, resetInactivityTimer));
            resetInactivityTimer();

            return () => {
                events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
                clearTimeout(inactivityTimer.current);
            };
        }
    }, [user, resetInactivityTimer]);

    // useEffect listening to authentication state
    useEffect(() => {
        setAuthLoading(true);
        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user;
            setUser(currentUser || null);

            if (!currentUser) {
                setCartItems({});
                setAddresses([]);
                setMyOrders([]);
                setWishlist([]);
                setMyReviews([]);
                setSavedCards([]);
                setMyReturns([]);
            } else {
                fetchAddresses(currentUser.id);
                fetchMyOrders(currentUser.id);
                fetchWishlist(currentUser.id);
                fetchMyReviews(currentUser.id);
                fetchSavedCards(currentUser.id);
                fetchMyReturns(currentUser.id);
            }
            setAuthLoading(false);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    // ---- AUTH FONKSİYONLARI ----

    const signUp = async (email, password) => {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
            toast.error(error.message);
            return false;
        }
        toast.success('Registration successful! Please verify your email.');
        return true;
    };

    const signIn = async (email, password, source = 'user') => {
        const { data: signInData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

        if (authError) {
            toast.error('Invalid username or password.');
            return;
        }

        if (signInData.user) {
            toast.success('Login successful!');
            setTimeout(() => {
                if (source === 'seller') {
                    router.push('/seller/product-list');
                } else {
                    router.push('/');
                }
            }, 50);
        }
    };

    const signOut = useCallback(async () => {
        try {
            const { error } = await supabase.auth.signOut({ scope: 'global' });

            if (error && !error.message.includes("Auth session missing")) throw error;

            const domain = window.location.hostname;
            const baseDomain = domain.startsWith('www.') ? domain.replace('www.', '') : domain;

            document.cookie = `sb-access-token=; Max-Age=0; path=/; domain=${baseDomain}; secure; SameSite=None`;
            document.cookie = `sb-refresh-token=; Max-Age=0; path=/; domain=${baseDomain}; secure; SameSite=None`;
            document.cookie = `supabase-auth-token=; Max-Age=0; path=/; domain=${baseDomain}; secure; SameSite=None`;

            localStorage.removeItem("supabase.auth.token");
            localStorage.removeItem("sb-access-token");
            localStorage.removeItem("sb-refresh-token");
            localStorage.clear();
            sessionStorage.clear();

            setUser(null);
            clearTimeout(inactivityTimer.current);

            toast.success("Successfully signed out.");
            router.push("/auth");

            setTimeout(() => window.location.reload(), 400);
        } catch (err) {
            console.error("Logout error:", err.message);
            toast.error("Logout failed: " + err.message);
        }
    }, [router]);

    const changeUserPassword = async (currentPassword, newPassword) => {
        if (!user) {
            toast.error("You must be logged in to perform this action.");
            return false;
        }
        const toastId = toast.loading("Processing...");
        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            });
            if (signInError) {
                throw new Error("Current password is incorrect.");
            }
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });
            if (updateError) {
                throw new Error("Error updating password: " + updateError.message);
            }
            toast.success("Password updated successfully!", { id: toastId });
            return true;
        } catch (error) {
            toast.error(error.message, { id: toastId });
            return false;
        }
    };

    const updateUserData = async (data) => {
        const toastId = toast.loading("Updating your information...");
        const { error } = await supabase.auth.updateUser({ data });
        if (error) {
            toast.error("Error updating information: " + error.message, { id: toastId });
            return false;
        }
        toast.success("Information updated successfully!", { id: toastId });
        return true;
    };

    // ---- VERİ ÇEKME FONKSİYONLARI ----

    const fetchProducts = async () => {
        setLoading(true); setError(null);
        const { data, error: fetchError } = await supabase.from('products').select('*, categories(name)');
        if (fetchError) {
            setError(fetchError.message); setProducts([]);
        } else {
            const formattedProducts = (data || []).map(p => ({
                ...p,
                image_urls: Array.isArray(p.image_urls) ? p.image_urls : [],
                // Fiyatları number'a çevir
                price: Number(p.price) || 0,
                // Paket fiyatlarını da number'a çevir
                price_2_pack: Number(p.price_2_pack) || 0,
                price_3_pack: Number(p.price_3_pack) || 0,
                price_4_pack: Number(p.price_4_pack) || 0,
                price_5_pack: Number(p.price_5_pack) || 0,
                price_6_pack: Number(p.price_6_pack) || 0,
                price_7_pack: Number(p.price_7_pack) || 0,
                price_8_pack: Number(p.price_8_pack) || 0,
                price_9_pack: Number(p.price_9_pack) || 0,
                price_10_pack: Number(p.price_10_pack) || 0,
                price_11_pack: Number(p.price_11_pack) || 0,
            }));
            setProducts(formattedProducts);
        }
        setLoading(false);
    };

    const fetchAddresses = useCallback(async (userId) => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (!error) setAddresses(data || []);
    }, []);

    const fetchMyOrders = useCallback(async (userId) => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('orders')
            .select(`*, order_items(*, products(*, categories(name)))`)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (!error) setMyOrders(data || []);
    }, []);

    const fetchWishlist = useCallback(async (userId) => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('wishlist')
            .select('*, product:products(*)')
            .eq('user_id', userId);
        if (!error) setWishlist(data || []);
    }, []);

    const fetchMyReviews = useCallback(async (userId) => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('reviews')
            .select(`*, products (id, name, image_urls)`)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (!error) setMyReviews(data || []);
    }, []);

    const fetchSavedCards = useCallback(async (userId) => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('saved_cards')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (!error) setSavedCards(data || []);
    }, []);

    const fetchMyReturns = useCallback(async (userId) => {
        if (!userId) return;
        const { data, error: returnsError } = await supabase
            .from('returns')
            .select(`
                *,
                product:products (id, name, image_urls),
                order_item:order_items (quantity, price)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (!returnsError) {
            setMyReturns(data || []);
        } else {
            console.error("Error fetching return requests:", returnsError);
            setMyReturns([]);
        }
    }, []);

    // ---- SEPET FONKSİYONLARI - YENİ SİSTEM ----

    // useEffect to load cart data from localStorage
    useEffect(() => {
        try {
            const storedCart = localStorage.getItem("cartItems");
            if (storedCart) {
                setCartItems(JSON.parse(storedCart));
            }
        } catch (e) {
            console.error("Failed to load cart from localStorage:", e);
        }
    }, []);

    // useEffect to save cart data to localStorage
    useEffect(() => {
        try {
            if (Object.keys(cartItems).length > 0) {
                localStorage.setItem("cartItems", JSON.stringify(cartItems));
            } else {
                localStorage.removeItem("cartItems");
            }
        } catch(e) {
            console.error("Failed to save cart to localStorage:", e);
        }
    }, [cartItems]);

    // YENİ: Sepete ürün ekleme - TAMAMEN DÜZELTİLMİŞ FİYAT SİSTEMİ
    const addToCart = (product, quantity = 1) => {
        // Stok kontrolü
        if (product.stock < quantity) {
            toast.error(`Sorry, only ${product.stock} items in stock.`);
            return;
        }

        // Miktara göre fiyat hesapla (DÜZELTİLMİŞ FONKSİYON)
        const priceInfo = calculatePriceForQuantity(product, quantity);
        
        // Benzersiz cart item ID oluştur
        const cartItemId = generateCartItemId();
        
        // Sepete ekle - ORİJİNAL FİYATI KORU
        setCartItems(prev => ({
            ...prev,
            [cartItemId]: {
                product: { 
                    ...product,
                    // ÖNEMLİ: Orijinal fiyatı koru, hesaplanan fiyatları ayrı tut
                    price: priceInfo.unitPrice, // Gösterim için birim fiyat
                    originalPrice: product.price, // Orijinal birim fiyat
                    calculatedTotal: priceInfo.totalPrice, // Toplam fiyat
                    originalUnitPrice: priceInfo.originalUnitPrice || product.price // Orijinal birim fiyat
                },
                quantity: quantity,
                priceType: priceInfo.priceType,
                isPromotional: priceInfo.isPromotional,
                cartItemId: cartItemId,
                addedAt: new Date().toISOString()
            }
        }));

        // Başarı mesajı
        const message = priceInfo.isPromotional 
            ? `${quantity} x ${product.name} added with special package price!` 
            : `${quantity} x ${product.name} added to cart!`;
        
        toast.success(message);
    };

    // YENİ: Sepet öğesi miktarını güncelle - TAMAMEN DÜZELTİLMİŞ
    const updateCartQuantity = (cartItemId, newQuantity) => {
        setCartItems(prev => {
            const item = prev[cartItemId];
            if (!item) return prev;

            // Stok kontrolü
            if (newQuantity > item.product.stock) {
                toast.error(`Maximum ${item.product.stock} items allowed.`);
                newQuantity = item.product.stock;
            }

            // Yeni miktar 0 veya daha az ise öğeyi sil
            if (newQuantity <= 0) {
                const newItems = { ...prev };
                delete newItems[cartItemId];
                toast.success(`${item.product.name} removed from cart.`);
                return newItems;
            }

            // ÖNEMLİ: Orijinal ürün bilgisiyle yeni fiyat hesapla
            const originalProduct = {
                ...item.product,
                price: item.product.originalPrice, // Orijinal fiyatı kullan
                originalPrice: item.product.originalPrice // Orijinal fiyatı koru
            };

            // Yeni miktar için fiyat hesapla (ORİJİNAL ÜRÜN ile)
            const priceInfo = calculatePriceForQuantity(originalProduct, newQuantity);

            // Miktarı ve fiyatı güncelle
            return {
                ...prev,
                [cartItemId]: {
                    ...item,
                    quantity: newQuantity,
                    product: {
                        ...item.product,
                        price: priceInfo.unitPrice, // Yeni birim fiyat
                        calculatedTotal: priceInfo.totalPrice, // Yeni toplam fiyat
                        originalPrice: originalProduct.originalPrice, // Orijinal fiyatı koru
                        originalUnitPrice: priceInfo.originalUnitPrice || originalProduct.originalPrice
                    },
                    priceType: priceInfo.priceType,
                    isPromotional: priceInfo.isPromotional
                }
            };
        });
    };

    // YENİ: Sepet öğesini tamamen kaldır
    const removeCartItem = (cartItemId) => {
        setCartItems(prev => {
            const item = prev[cartItemId];
            const newItems = { ...prev };
            delete newItems[cartItemId];
            
            if (item) {
                toast.success(`${item.product.name} removed from cart.`);
            }
            
            return newItems;
        });
    };

    // Sepetteki toplam ürün sayısını hesapla
    const getCartCount = () => {
        return Object.values(cartItems).reduce((sum, item) => sum + (item.quantity || 0), 0);
    };

    // Sepet toplamını hesapla
    const getCartAmount = (taxRate = CALIFORNIA_TAX_RATE) => {
        const subtotal = Object.values(cartItems).reduce((sum, item) => {
            // calculatedTotal kullan - bu doğru toplam fiyatı içeriyor
            return sum + (item?.product?.calculatedTotal || 0);
        }, 0);

        const taxAmount = subtotal * taxRate;
        const totalAmount = subtotal + taxAmount;

        return {
            subtotal: subtotal || 0,
            taxAmount: taxAmount || 0,
            totalAmount: totalAmount || 0,
        };
    };

    // ---- DİĞER FONKSİYONLAR ----

    const addSavedCard = async (cardData) => {
        if (!user) return toast.error("You must be logged in to add a card.");

        const fakeToken = `tok_${Math.random().toString(36).substr(2, 14)}`;
        const last4 = cardData.cardNumber.slice(-4);
        const cardBrand = "visa";

        const { error } = await supabase.from('saved_cards').insert({
            user_id: user.id,
            card_brand: cardBrand,
            last4: last4,
            exp_month: parseInt(cardData.expMonth),
            exp_year: parseInt(cardData.expYear),
            payment_provider_token: fakeToken,
        });

        if (error) {
            toast.error("Error adding card: " + error.message);
            return false;
        } else {
            toast.success("Card added successfully!");
            fetchSavedCards(user.id);
            return true;
        }
    };

    const deleteSavedCard = async (cardId) => {
        if (!user) return toast.error("You must be logged in to perform this action.");

        const { error } = await supabase.from('saved_cards').delete().eq('id', cardId);

        if (error) {
            toast.error("Error deleting card: " + error.message);
        } else {
            toast.success("Card successfully deleted.");
            setSavedCards(prev => prev.filter(card => card.id !== cardId));
        }
    };

    const addToWishlist = async (productId) => {
        if (!user) return toast.error("Please log in to add to favorites.");
        const { error } = await supabase.from('wishlist').insert({ user_id: user.id, product_id: productId });
        if (error) {
            if (error.code === '23505') {
                toast.error("This product is already in your favorites.");
            } else {
                toast.error("Error adding to favorites: " + error.message);
            }
        } else {
            toast.success("Product added to favorites!");
            fetchWishlist(user.id);
        }
    };

    const removeFromWishlist = async (productId) => {
        if (!user) return;
        const { error } = await supabase.from('wishlist').delete().match({ user_id: user.id, product_id: productId });
        if (error) {
            toast.error("Error removing from favorites.");
        } else {
            toast.success("Product removed from favorites!");
            fetchWishlist(user.id);
        }
    };

    const addAddress = async (addressData) => {
        if (!user) return toast.error("You must be logged in to add an address.");
        const toastId = toast.loading("Adding address...");
        try {
            const { error } = await supabase.from('addresses').insert({ ...addressData, user_id: user.id });
            if (error) throw error;
            await fetchAddresses(user.id);
            toast.success("Address successfully added!", { id: toastId });
            return true;
        } catch (error) {
            toast.error("Error adding address: " + error.message, { id: toastId });
            return false;
        }
    };

    const updateAddress = async (addressId, addressData) => {
        if (!user) return toast.error("You must be logged in to update an address.");
        const toastId = toast.loading("Updating address...");
        try {
            const { id, user_id, created_at, ...updateData } = addressData;
            const { error } = await supabase.from('addresses').update(updateData).eq('id', addressId);
            if (error) throw error;
            await fetchAddresses(user.id);
            toast.success("Address successfully updated!", { id: toastId });
            return true;
        } catch (error) {
            toast.error("Error updating address: " + error.message, { id: toastId });
            return false;
        }
    };

    const deleteAddress = async (addressId) => {
        if (!user) return toast.error("You must be logged in to delete an address.");
        const toastId = toast.loading("Deleting address...");
        try {
            const { error } = await supabase.from('addresses').delete().eq('id', addressId);
            if (error) throw error;
            setAddresses(prev => prev.filter(addr => addr.id !== addressId));
            toast.success("Address successfully deleted!", { id: toastId });
        } catch (error) {
            toast.error("Error deleting address: " + error.message, { id: toastId });
        }
    };

    const fetchReviewPermissionSetting = useCallback(async () => {
        const { data, error } = await supabase
            .from('store_settings')
            .select('setting_value')
            .eq('setting_key', REVIEW_PERMISSION_KEY)
            .single();

        if (!error && data) {
            setReviewPermissionSetting(data.setting_value);
        }
        else if (error && error.code !== 'PGRST116') {
            console.error("Failed to fetch review setting:", error.message);
        }
    }, []);

    // Fetch initial data
    useEffect(() => {
        fetchProducts();
        fetchReviewPermissionSetting();
    }, [fetchReviewPermissionSetting]);

    // ---- CONTEXT VALUE ----
    const value = {
        currency, router, products, loading, error, fetchProducts,
        // YENİ SEPET FONKSİYONLARI
        cartItems, setCartItems, addToCart, updateCartQuantity, removeCartItem, getCartCount, getCartAmount,
        user, authLoading, signUp, signIn, signOut,
        changeUserPassword,
        updateUserData,
        addresses, fetchAddresses, addAddress, updateAddress, deleteAddress,
        myOrders, fetchMyOrders,
        myReviews, fetchMyReviews,
        myReturns, fetchMyReturns,
        getSafeImageUrl,
        wishlist, addToWishlist, removeFromWishlist,
        savedCards, addSavedCard, deleteSavedCard,
        reviewPermissionSetting
    };

    return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};