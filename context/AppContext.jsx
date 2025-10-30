// context/AppContext.jsx
'use client'

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { getSafeImageUrl } from "@/lib/utils";
import USPSService from '@/lib/uspsService';

// Context oluştur
export const AppContext = createContext(undefined);

// Context'i kullanmak için hook
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppContextProvider');
    }
    return context;
};

// Constants
const REVIEW_PERMISSION_KEY = 'review_permission';
const CALIFORNIA_TAX_RATE = 0.0825;
const INACTIVITY_TIMEOUT = 10 * 60 * 1000;

// Context Provider Component'i
export const AppContextProvider = ({ children }) => {
    const currency = process.env.NEXT_PUBLIC_CURRENCY || "$";
    const router = useRouter();
    const uspsService = new USPSService();

    // ---- STATE DEĞİŞKENLERİ ----
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
    const [myReturns, setMyReturns] = useState([]);
    const [reviewPermissionSetting, setReviewPermissionSetting] = useState('purchasers_only');
    const inactivityTimer = useRef(null);

    // ---- FONKSİYONLAR ----

    // Inactivity Management
    const signOutAfterInactivity = useCallback(() => {
        toast('Session ended due to inactivity. Signing out...', { icon: '👋' });
        supabase.auth.signOut();
    }, []);

    const resetInactivityTimer = useCallback(() => {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = setTimeout(signOutAfterInactivity, INACTIVITY_TIMEOUT);
    }, [signOutAfterInactivity]);

    // Hareketsizlik zamanlayıcısını yöneten useEffect
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

    // Kimlik doğrulama durumunu dinleyen useEffect
    useEffect(() => {
        setAuthLoading(true);
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
                await Promise.all([
                    fetchAddresses(currentUser.id),
                    fetchMyOrders(currentUser.id),
                    fetchWishlist(currentUser.id),
                    fetchMyReviews(currentUser.id),
                    fetchSavedCards(currentUser.id),
                    fetchMyReturns(currentUser.id)
                ]);
            }
            setAuthLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Authentication Functions
    const signUp = async (email, password) => {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
            toast.error(error.message);
            return false;
        }
        toast.success('Registration successful! Please check your email for verification.');
        return true;
    };

    const signIn = async (email, password, source = 'user') => {
        const { data: signInData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

        if (authError) {
            toast.error('Invalid email or password.');
            return;
        }

        if (signInData.user) {
            toast.success('Login successful!');
            setTimeout(() => {
                router.push(source === 'seller' ? '/seller/product-list' : '/');
            }, 50);
        }
    };

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        clearTimeout(inactivityTimer.current);
        router.push('/');
        toast.success('Successfully signed out.');
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
            if (signInError) throw new Error("Current password is incorrect.");

            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });
            if (updateError) throw new Error("Error updating password: " + updateError.message);

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

    // Data Fetching Functions
    const fetchProducts = async () => {
        setLoading(true); setError(null);
        const { data, error: fetchError } = await supabase.from('products').select('*, categories(name)');
        if (fetchError) {
            setError(fetchError.message); setProducts([]);
        } else {
            const formattedProducts = (data || []).map(p => ({
                ...p,
                image_urls: Array.isArray(p.image_urls) ? p.image_urls : [],
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
        const { data, error } = await supabase
            .from('returns')
            .select(`*, product:products (id, name, image_urls), order_item:order_items (quantity, price)`)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (!error) setMyReturns(data || []);
    }, []);

    const fetchReviewPermissionSetting = useCallback(async () => {
        const { data, error } = await supabase
            .from('store_settings')
            .select('setting_value')
            .eq('setting_key', REVIEW_PERMISSION_KEY)
            .single();
        if (!error && data) setReviewPermissionSetting(data.setting_value);
    }, []);

    // Payment Methods
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

    // Wishlist Methods
    const addToWishlist = async (productId) => {
        if (!user) return toast.error("Please log in to add items to your wishlist.");
        const { error } = await supabase.from('wishlist').insert({ user_id: user.id, product_id: productId });
        if (error) {
            if (error.code === '23505') {
                toast.error("This product is already in your wishlist.");
            } else {
                toast.error("Error adding to wishlist: " + error.message);
            }
        } else {
            toast.success("Product added to wishlist!");
            fetchWishlist(user.id);
        }
    };

    const removeFromWishlist = async (productId) => {
        if (!user) return;
        const { error } = await supabase.from('wishlist').delete().match({ user_id: user.id, product_id: productId });
        if (error) {
            toast.error("Error removing from wishlist.");
        } else {
            toast.success("Product removed from wishlist!");
            fetchWishlist(user.id);
        }
    };

    // Address Methods
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

    // Cart Management
    useEffect(() => {
        try {
            const storedCart = localStorage.getItem("cartItems");
            if (storedCart) setCartItems(JSON.parse(storedCart));
        } catch (e) {
            console.error("Error loading cart from localStorage:", e);
        }
    }, []);

    useEffect(() => {
        try {
            if (Object.keys(cartItems).length > 0) {
                localStorage.setItem("cartItems", JSON.stringify(cartItems));
            } else {
                localStorage.removeItem("cartItems");
            }
        } catch (e) {
            console.error("Error saving cart to localStorage:", e);
        }
    }, [cartItems]);

    const addToCart = (product, quantity = 1, priceOverride = null) => {
        const priceToAdd = priceOverride !== null ? priceOverride : product.price;
        const effectiveQuantity = quantity;
        const currentItem = cartItems[product.id];
        const currentQuantityInCart = currentItem ? currentItem.quantity : 0;

        if (product.stock < currentQuantityInCart + effectiveQuantity) {
            toast.error(`Sorry, only ${product.stock} items available in stock. You already have ${currentQuantityInCart} in your cart.`);
            return;
        }

        setCartItems(prev => {
            const existingItem = prev[product.id];
            const newQuantity = (existingItem ? existingItem.quantity : 0) + effectiveQuantity;
            return {
                ...prev,
                [product.id]: {
                    product: { ...product, price: priceToAdd / effectiveQuantity },
                    quantity: newQuantity,
                }
            };
        });
        toast.success(`${effectiveQuantity} x ${product.name} added to cart!`);
    };

    const updateCartQuantity = (productId, quantity) => {
        setCartItems(prev => {
            const newItems = { ...prev };
            const item = newItems[productId];
            if (!item || !item.product) return newItems;
            const product = item.product;

            if (quantity > product.stock) {
                toast.error(`Maximum ${product.stock} items allowed.`);
                newItems[productId].quantity = product.stock;
                return newItems;
            }

            if (quantity <= 0) {
                delete newItems[productId];
                toast.success(`${product.name} removed from cart.`);
            } else {
                newItems[productId].quantity = quantity;
            }
            return newItems;
        });
    };

    const getCartCount = () => Object.values(cartItems).reduce((sum, item) => sum + (item.quantity || 0), 0);

    const getCartAmount = (taxRate = CALIFORNIA_TAX_RATE) => {
        const subtotal = Object.values(cartItems).reduce((sum, item) => {
            const price = item?.product?.price ?? 0;
            const quantity = item?.quantity ?? 0;
            return sum + (price * quantity);
        }, 0);
        const taxAmount = subtotal * taxRate;
        const totalAmount = subtotal + taxAmount;
        return { subtotal: subtotal || 0, taxAmount: taxAmount || 0, totalAmount: totalAmount || 0 };
    };

    // USPS INTEGRATION FUNCTIONS
    const createOrder = async (orderData) => {
        if (!user) {
            toast.error("You must be logged in to create an order.");
            return false;
        }

        const toastId = toast.loading("Creating order and generating tracking number...");
        
        try {
            console.log('🔄 USPS takip kodu oluşturuluyor...');
            const uspsResponse = await uspsService.createTrackingNumber(orderData);
            
            if (!uspsResponse.success) {
                throw new Error('Failed to create tracking number');
            }

            console.log('✅ Takip kodu alındı:', uspsResponse.trackingNumber);

            const orderPayload = {
                user_id: user.id,
                total_amount: orderData.total_amount,
                status: 'confirmed',
                shipping_address: orderData.shippingAddress,
                tracking_number: uspsResponse.trackingNumber,
                shipping_cost: orderData.shipping_cost || 9.99,
                estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                items: Object.values(cartItems).map(item => ({
                    product_id: item.product.id,
                    quantity: item.quantity,
                    price: item.product.price
                }))
            };

            const { data: order, error } = await supabase
                .from('orders')
                .insert([orderPayload])
                .select()
                .single();

            if (error) throw error;

            setCartItems({});
            localStorage.removeItem("cartItems");

            let successMessage = `Order created successfully! `;
            
            if (uspsResponse.isReal) {
                successMessage += `USPS Tracking: ${uspsResponse.trackingNumber}`;
                toast.success(successMessage, { id: toastId, duration: 6000 });
            } else {
                successMessage += `Test Tracking: ${uspsResponse.trackingNumber}`;
                toast.success(successMessage, { id: toastId, duration: 8000 });
            }

            setTimeout(() => {
                router.push(`/orders/${order.id}`);
            }, 2000);

            return order;

        } catch (error) {
            console.error('❌ Sipariş oluşturma hatası:', error);
            toast.error("Error creating order: " + error.message, { id: toastId, duration: 5000 });
            return false;
        }
    };

    const getTrackingInfo = async (trackingNumber) => {
        if (!trackingNumber) {
            toast.error("No tracking number provided.");
            return null;
        }

        const toastId = toast.loading("Fetching tracking information...");
        try {
            const trackingInfo = await uspsService.getTrackingInfo(trackingNumber);
            toast.success("Tracking information updated", { id: toastId });
            return trackingInfo;
        } catch (error) {
            toast.error("Error fetching tracking info: " + error.message, { id: toastId });
            return null;
        }
    };

    // Initial Data Fetching
    useEffect(() => {
        fetchProducts();
        fetchReviewPermissionSetting();
    }, [fetchReviewPermissionSetting]);

    // Context Value
    const value = {
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
        fetchMyReviews,
        myReturns,
        fetchMyReturns,
        getSafeImageUrl,
        wishlist,
        addToWishlist,
        removeFromWishlist,
        savedCards,
        addSavedCard,
        deleteSavedCard,
        reviewPermissionSetting,
        createOrder,
        getTrackingInfo
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};