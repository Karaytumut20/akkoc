// context/AppContext.jsx (DÜZELTİLMİŞ KOD)

'use client'

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from "react";
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
        // 10 dakika (600000 ms)
        inactivityTimer.current = setTimeout(signOutAfterInactivity, 10 * 60 * 1000); 
    }, [signOutAfterInactivity]);

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
    
    // --- AUTH Fonskiyonları useCallback ile sarmalandı ---
    const signUp = useCallback(async (email, password) => {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
            toast.error(error.message);
            return false;
        }
        toast.success('Kayıt başarılı! Lütfen e-postanızı doğrulayın.');
        return true;
    }, []);

    const signIn = useCallback(async (email, password, source) => {
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
    }, [router]);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        clearTimeout(inactivityTimer.current);
        router.push('/');
        toast.success('Başarıyla çıkış yapıldı.');
    }, [router]);
    
    const changeUserPassword = useCallback(async (currentPassword, newPassword) => {
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
    }, [user]);

    const updateUserData = useCallback(async (data) => {
        const toastId = toast.loading("Bilgileriniz güncelleniyor...");
        const { error } = await supabase.auth.updateUser({ data });
        if (error) {
            toast.error("Bilgiler güncellenirken hata: " + error.message, { id: toastId });
            return false;
        }
        toast.success("Bilgileriniz başarıyla güncellendi!", { id: toastId });
        return true;
    }, []);
    // --- AUTH Fonskiyonları sonu ---

    // --- FETCH Fonskiyonları useCallback ile sarmalandı ---
    const fetchProducts = useCallback(async () => {
        setLoading(true); setError(null);
        const { data, error } = await supabase.from('products').select('*, categories(name)');
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
    }, []);
    // --- FETCH Fonskiyonları sonu ---


    // --- ADDRESS Fonskiyonları useCallback ile sarmalandı ---
    const addAddress = useCallback(async (addressData) => {
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
    }, [user, fetchAddresses]);
    
    const updateAddress = useCallback(async (addressId, addressData) => {
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
    }, [user, fetchAddresses]);

    const deleteAddress = useCallback(async (addressId) => {
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
    }, [user]);
    // --- ADDRESS Fonskiyonları sonu ---


    // --- KART ve FAVORİ Fonskiyonları useCallback ile sarmalandı ---
    const addSavedCard = useCallback(async (cardData) => {
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
    }, [user, fetchSavedCards]);

    const deleteSavedCard = useCallback(async (cardId) => {
        if (!user) return toast.error("Bu işlem için giriş yapmalısınız.");

        const { error } = await supabase.from('saved_cards').delete().eq('id', cardId);

        if (error) {
            toast.error("Kart silinirken bir hata oluştu: " + error.message);
        } else {
            toast.success("Kart başarıyla silindi.");
            setSavedCards(prev => prev.filter(card => card.id !== cardId));
        }
    }, [user]);

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
    // --- KART ve FAVORİ Fonskiyonları sonu ---

    // --- SEPET Fonskiyonları useCallback ile sarmalandı ---
    const getCartCount = useCallback(() => Object.values(cartItems).reduce((sum, item) => sum + item.quantity, 0), [cartItems]);
    const getCartAmount = useCallback(() => Object.values(cartItems).reduce((sum, item) => sum + item.product.price * item.quantity, 0), [cartItems]);
    
    const addToCart = useCallback((product) => {
        const currentQuantityInCart = cartItems[product.id]?.quantity || 0;
        if (product.stock <= currentQuantityInCart) {
            return toast.error("Üzgünüz, bu ürünün stoğu tükendi.");
        }

        setCartItems(prev => ({ ...prev, [product.id]: { product, quantity: (prev[product.id]?.quantity || 0) + 1 } }));
        toast.success(`${product.name} sepete eklendi!`);
    }, [cartItems]); // cartItems bağımlılığı eklendi

    const updateCartQuantity = useCallback((productId, quantity) => {
        setCartItems(prev => {
            const newItems = { ...prev };
            const product = newItems[productId]?.product;

            if (product && quantity > product.stock) {
                toast.error(`Maksimum ${product.stock} adet ekleyebilirsiniz.`);
                newItems[productId].quantity = product.stock;
                return newItems;
            }

            if (quantity <= 0) delete newItems[productId];
            else if (newItems[productId]) newItems[productId].quantity = quantity;
            return newItems;
        });
    }, []);
    // --- SEPET Fonskiyonları sonu ---


    // --- Ana useEffect Blokları (Bağımlılıklar güncellendi) ---

    // Sepet verilerini yerel depolamadan çek
    useEffect(() => {
        try { 
            const storedCart = localStorage.getItem("cartItems"); 
            if (storedCart) setCartItems(JSON.parse(storedCart)); 
        } catch (e) { 
            console.error(e); 
        }
    }, []);

    // Sepet verilerini yerel depolamaya kaydet
    useEffect(() => {
        if (Object.keys(cartItems).length > 0) {
            localStorage.setItem("cartItems", JSON.stringify(cartItems));
        } else {
            localStorage.removeItem("cartItems");
        }
    }, [cartItems]);
    
    // Ürünleri başlangıçta bir kez çek
    useEffect(() => { 
        fetchProducts(); 
    }, [fetchProducts]);

    // Kullanıcıya bağlı verileri çek (user değiştiğinde ve fetch fonksiyonları sabit kaldığında çalışır)
    useEffect(() => {
        if (user) {
            fetchAddresses(user.id);
            fetchMyOrders(user.id);
            fetchWishlist(user.id);
            fetchMyReviews(user.id);
            fetchSavedCards(user.id);
        }
    }, [user, fetchAddresses, fetchMyOrders, fetchWishlist, fetchMyReviews, fetchSavedCards]);

    // --- Context Value Memoization (useMemo ile sarmalandı) ---
    // Bu, yalnızca bağımlılıkları değiştiğinde yeni bir 'value' nesnesi oluşturur.
    const value = useMemo(() => ({
        currency, 
        router, 
        products, 
        loading, 
        error, 
        fetchProducts,
        cartItems, 
        setCartItems, 
        addToCart, 
        updateCartQuantity, 
        getCartCount, 
        getCartAmount,
        user, 
        authLoading, 
        signUp, 
        signIn, 
        signOut, 
        changeUserPassword, 
        updateUserData,
        addresses, 
        fetchAddresses, 
        addAddress, 
        updateAddress, 
        deleteAddress,
        myOrders, 
        fetchMyOrders,
        myReviews,
        getSafeImageUrl,
        wishlist, 
        addToWishlist, 
        removeFromWishlist,
        savedCards, 
        addSavedCard, 
        deleteSavedCard
    }), [
        currency, router, products, loading, error, fetchProducts,
        cartItems, setCartItems, addToCart, updateCartQuantity, getCartCount, getCartAmount,
        user, authLoading, signUp, signIn, signOut, 
        changeUserPassword, 
        updateUserData,
        addresses, fetchAddresses, addAddress, updateAddress, deleteAddress,
        myOrders, fetchMyOrders,
        myReviews,
        getSafeImageUrl, // Statik fonksiyon olduğu için değişmez, ancak bağımlılık olarak bırakılabilir
        wishlist, addToWishlist, removeFromWishlist,
        savedCards, addSavedCard, deleteSavedCard
    ]);

    return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};