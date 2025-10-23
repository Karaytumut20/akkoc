// context/AppContext.jsx

'use client'

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { getSafeImageUrl } from "@/lib/utils";

export const AppContext = createContext(undefined);

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppContextProvider');
    }
    return context;
};

export const AppContextProvider = (props) => {
    const currency = process.env.NEXT_PUBLIC_CURRENCY || "$";
    const router = useRouter();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cartItems, setCartItems] = useState({});
    
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    
    const [addresses, setAddresses] = useState([]);
    const [myOrders, setMyOrders] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [myReviews, setMyReviews] = useState([]);
    const [savedCards, setSavedCards] = useState([]);

    const inactivityTimer = useRef(null);

    const signOutAfterInactivity = useCallback(() => {
        toast('Oturum süreniz doldu, otomatik olarak çıkış yapıldı.', { icon: '👋' });
        supabase.auth.signOut();
    }, []);

    const resetInactivityTimer = useCallback(() => {
        clearTimeout(inactivityTimer.current);
        // 10 dakika
        inactivityTimer.current = setTimeout(signOutAfterInactivity, 10 * 60 * 1000); 
    }, [signOutAfterInactivity]);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        clearTimeout(inactivityTimer.current);
        router.push('/');
        toast.success('Başarıyla çıkış yapıldı.');
    }, [router]);
    
    // ===================================
    // FETCHERS (useCallback ile)
    // ===================================

    const fetchProducts = useCallback(async () => {
        setLoading(true); setError(null);
        // Yeni fiyat alanları fetch işlemine eklendi
        const { data, error } = await supabase.from('products').select('*, categories(name), price_2_pack, price_3_pack, price_4_pack'); 
        if (error) {
            setError(error.message); setProducts([]);
        } else {
            const formattedProducts = (data || []).map(p => ({
                ...p,
                image_urls: Array.isArray(p.image_urls) ? p.image_urls : [],
            }));
            setProducts(formattedProducts);
        }
        setLoading(false);
    }, []);

    const fetchAddresses = useCallback(async (userId) => {
        if (!userId) return;
        const { data, error } = await supabase.from('addresses').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (!error) setAddresses(data || []);
    }, []);

    const fetchMyOrders = useCallback(async (userId) => {
        if (!userId) return;
        const { data, error } = await supabase.from('orders').select(`*, order_items(*, products(*, categories(name)))`).eq('user_id', userId).order('created_at', { ascending: false });
        if (!error) setMyOrders(data || []);
    }, []);

    const fetchWishlist = useCallback(async (userId) => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('wishlist')
            .select('*, product:products(*)')
            .eq('user_id', userId);

        if (!error) {
            setWishlist(data || []);
        }
    }, []);

    const fetchMyReviews = useCallback(async (userId) => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('reviews')
            .select(`*, products (id, name, image_urls)`)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
    
        if (!error) {
            setMyReviews(data || []);
        }
    }, []);

    const fetchSavedCards = useCallback(async (userId) => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('saved_cards')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (!error) {
            setSavedCards(data || []);
        }
    }, [supabase]);
    
    // ===================================
    // WISHLIST MUTATORS (useCallback ile)
    // ===================================
    
    const addToWishlist = useCallback(async (productId) => {
        if (!user) return toast.error("Favorilere eklemek için giriş yapmalısınız.");
        const { error } = await supabase.from('wishlist').insert({ user_id: user.id, product_id: productId });
        if (error) {
            toast.error("Bu ürün zaten favorilerinizde.");
        } else {
            toast.success("Ürün favorilere eklendi!");
            fetchWishlist(user.id);
        }
    }, [user, fetchWishlist]);

    const removeFromWishlist = useCallback(async (productId) => {
        if (!user) return;
        const { error } = await supabase.from('wishlist').delete().match({ user_id: user.id, product_id: productId });
        if (error) {
            toast.error("Favorilerden kaldırırken hata oluştu.");
        } else {
            toast.success("Ürün favorilerden kaldırıldı!");
            fetchWishlist(user.id);
        }
    }, [user, fetchWishlist]);
    
    // ===================================
    // AUTH VE DİĞER FONKSİYONLAR
    // ===================================
    
    const signUp = async (email, password) => {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
            toast.error(error.message);
            return false;
        }
        toast.success('Kayıt başarılı! Lütfen e-postanızı doğrulayın.');
        return true;
    };

    const signIn = async (email, password, source) => {
        const { data: signInData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        
        if (authError) {
            toast.error('Kullanıcı adı veya parola hatalı.');
            return;
        }
        
        if (signInData.user) {
            toast.success('Giriş başarılı!');
            if (source === 'seller') {
                router.push('/seller/product-list');
            } else {
                router.push('/');
            }
        }
    };

    const changeUserPassword = async (currentPassword, newPassword) => {
        if (!user) {
            toast.error("Bu işlem için giriş yapmış olmalısınız.");
            return false;
        }
        const toastId = toast.loading("İşlem yürütülüyor...");
        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            });
            if (signInError) {
                throw new Error("Mevcut parolanız hatalı.");
            }
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });
            if (updateError) {
                throw new Error("Parola güncellenirken bir hata oluştu: " + updateError.message);
            }
            toast.success("Parolanız başarıyla güncellendi!", { id: toastId });
            return true;
        } catch (error) {
            toast.error(error.message, { id: toastId });
            return false;
        }
    };

    const updateUserData = async (data) => {
        const toastId = toast.loading("Bilgileriniz güncelleniyor...");
        const { error } = await supabase.auth.updateUser({ data });
        if (error) {
            toast.error("Bilgiler güncellenirken hata: " + error.message, { id: toastId });
            return false;
        }
        toast.success("Bilgileriniz başarıyla güncellendi!", { id: toastId });
        return true;
    };


    const addSavedCard = async (cardData) => {
        if (!user) return toast.error("Kart eklemek için giriş yapmalısınız.");
        
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
            toast.error("Kart eklenirken bir hata oluştu: " + error.message);
            return false;
        } else {
            toast.success("Kart başarıyla eklendi!");
            fetchSavedCards(user.id);
            return true;
        }
    };

    const deleteSavedCard = async (cardId) => {
        if (!user) return toast.error("Bu işlem için giriş yapmalısınız.");

        const { error } = await supabase.from('saved_cards').delete().eq('id', cardId);

        if (error) {
            toast.error("Kart silinirken bir hata oluştu: " + error.message);
        } else {
            toast.success("Kart başarıyla silindi.");
            setSavedCards(prev => prev.filter(card => card.id !== cardId));
        }
    };


    const addAddress = async (addressData) => {
        if (!user) return toast.error("Adres eklemek için giriş yapmalısınız.");
        const toastId = toast.loading("Adresiniz ekleniyor...");
        try {
            const { error } = await supabase.from('addresses').insert({ ...addressData, user_id: user.id });
            if (error) throw error;
            await fetchAddresses(user.id);
            toast.success("Adres başarıyla eklendi!", { id: toastId });
            return true;
        } catch (error) {
            toast.error("Adres eklenirken hata: " + error.message, { id: toastId });
            return false;
        }
    };
    
    const updateAddress = async (addressId, addressData) => {
        if (!user) return toast.error("Adres güncellemek için giriş yapmalısınız.");
        const toastId = toast.loading("Adresiniz güncelleniyor...");
        try {
            const { id, user_id, created_at, ...updateData } = addressData;
            const { error } = await supabase.from('addresses').update(updateData).eq('id', addressId);
            if (error) throw error;
            await fetchAddresses(user.id);
            toast.success("Adres başarıyla güncellendi!", { id: toastId });
            return true;
        } catch (error) {
            toast.error("Adres güncellenirken hata: " + error.message, { id: toastId });
            return false;
        }
    };

    const deleteAddress = async (addressId) => {
        if (!user) return toast.error("Adres silmek için giriş yapmalısınız.");
        const toastId = toast.loading("Adresiniz siliniyor...");
        try {
            const { error } = await supabase.from('addresses').delete().eq('id', addressId);
            if (error) throw error;
            setAddresses(prev => prev.filter(addr => addr.id !== addressId));
            toast.success("Adres başarıyla silindi!", { id: toastId });
        } catch (error) {
            toast.error("Adres silinirken hata: " + error.message, { id: toastId });
        }
    };

    /**
     * Sepete ürün eklerken yeni fiyat ve adet desteği ekler.
     * @param {object} product - Ürün verisi (kampanyalı fiyatlar dahil).
     * @param {number} [quantityToAdd=1] - Sepete eklenecek adet.
     * @param {number} [customPrice] - Opsiyonel olarak, toplu alımlarda kullanılacak birim fiyat.
     */
    const addToCart = (product, quantityToAdd = 1, customPrice) => {
        const currentQuantityInCart = cartItems[product.id]?.quantity || 0;

        if (product.stock < quantityToAdd) {
             return toast.error(`Üzgünüz, maksimum ${product.stock} adet ekleyebilirsiniz.`);
        }
        
        if (currentQuantityInCart + quantityToAdd > product.stock) {
             return toast.error(`Bu üründen zaten ${currentQuantityInCart} adet sepette. Maksimum ${product.stock} adet ekleyebilirsiniz.`);
        }

        const priceToUse = customPrice !== undefined
            ? customPrice / quantityToAdd 
            : product.price;

        setCartItems(prev => {
            const existingItem = prev[product.id];
            
            // Tekli ekleme ise mevcut adeti artır:
            if (customPrice === undefined) {
                return { 
                    ...prev, 
                    [product.id]: { 
                        product: existingItem ? existingItem.product : product, 
                        quantity: currentQuantityInCart + quantityToAdd,
                        price: product.price, // Tekli fiyatı koru
                        isBulk: false
                    } 
                };
            }
            
            // Toplu ekleme ise, ürünün birim fiyatını güncelliyoruz ve miktarı ayarlıyoruz.
            return { 
                ...prev, 
                [product.id]: { 
                    product: { ...product, price: priceToUse }, 
                    quantity: quantityToAdd,
                    price: priceToUse, 
                    isBulk: customPrice !== undefined
                } 
            };
        });
        
        if (customPrice === undefined) {
            toast.success(`${product.name} sepete eklendi!`);
        }
    };

    const updateCartQuantity = (productId, quantity) => {
        setCartItems(prev => {
            const newItems = { ...prev };
            const product = newItems[productId]?.product;
            // Orjinal ürün bilgisini tüm ürünler listesinden bul
            const originalProduct = products.find(p => p.id === productId); 
            
            if (!product || !originalProduct) return prev;

            if (quantity > originalProduct.stock) {
                toast.error(`Maksimum ${originalProduct.stock} adet ekleyebilirsiniz.`);
                newItems[productId].quantity = originalProduct.stock;
                return newItems;
            }

            if (quantity <= 0) {
                delete newItems[productId];
                return newItems;
            }
            
            // Birim fiyatı temel fiyata çek.
            const newPriceToUse = originalProduct.price; 
            
            newItems[productId] = {
                product: { ...product, price: newPriceToUse }, 
                quantity: quantity,
                price: newPriceToUse,
                isBulk: false // Miktar değiştirildiği için kampanya bozuldu.
            };
            
            return newItems;
        });
    };

    const getCartCount = () => Object.values(cartItems).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    
    // HATA KORUMASI: item.price'ın sayı olduğundan emin ol.
    const getCartAmount = () => Object.values(cartItems).reduce((sum, item) => {
        const price = Number(item.price) || 0; 
        const quantity = Number(item.quantity) || 0;
        return sum + price * quantity;
    }, 0);
    
    // ===================================
    // USE EFFECTS
    // ===================================
    
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
            }
            setAuthLoading(false);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (user) {
            fetchAddresses(user.id);
            fetchMyOrders(user.id);
            fetchWishlist(user.id);
            fetchMyReviews(user.id);
            fetchSavedCards(user.id);
        }
    }, [user, fetchAddresses, fetchMyOrders, fetchWishlist, fetchMyReviews, fetchSavedCards]);

    useEffect(() => {
        try { const storedCart = localStorage.getItem("cartItems"); if (storedCart) setCartItems(JSON.parse(storedCart)); } catch (e) { console.error(e); }
    }, []);

    useEffect(() => {
        if (Object.keys(cartItems).length > 0) {
            localStorage.setItem("cartItems", JSON.stringify(cartItems));
        } else {
            localStorage.removeItem("cartItems");
        }
    }, [cartItems]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    // ===================================
    // CONTEXT VALUE
    // ===================================

    const value = {
        currency, router, products, loading, error, fetchProducts,
        cartItems, setCartItems, addToCart, updateCartQuantity, getCartCount, getCartAmount,
        user, authLoading, signUp, signIn, signOut, 
        changeUserPassword, 
        updateUserData,
        addresses, fetchAddresses, addAddress, updateAddress, deleteAddress,
        myOrders, fetchMyOrders,
        myReviews,
        getSafeImageUrl,
        wishlist, addToWishlist, removeFromWishlist,
        savedCards, addSavedCard, deleteSavedCard
    };

    return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};