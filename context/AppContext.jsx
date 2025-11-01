// context/AppContext.jsx
'use client';

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient"; // Supabase istemcisi
import toast from "react-hot-toast"; // Bildirimler
import { getSafeImageUrl } from "@/lib/utils"; // Güvenli görsel URL yardımcı

// ---- Context oluşturma ----
export const AppContext = createContext(undefined);

// ---- Context hook'u ----
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};

// ---- Sabitler ----
const REVIEW_PERMISSION_KEY = 'review_permission';
const CALIFORNIA_TAX_RATE = 0.0825; // Örnek vergi oranı

// ---- Provider ----
export const AppContextProvider = (props) => {
  // Genel
  const currency = process.env.NEXT_PUBLIC_CURRENCY || "$";
  const router = useRouter();

  // Ürünler
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sepet
  const [cartItems, setCartItems] = useState({});

  // Auth
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Hesap verileri
  const [addresses, setAddresses] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [savedCards, setSavedCards] = useState([]);
  const [myReturns, setMyReturns] = useState([]);

  // Mağaza ayarları
  const [reviewPermissionSetting, setReviewPermissionSetting] = useState('purchasers_only');

  // Hareketsizlik zamanlayıcısı
  const inactivityTimer = useRef(null);

  // ---- Hareketsizlik sonrası otomatik çıkış ----
  const signOutAfterInactivity = useCallback(() => {
    toast('Session ended due to inactivity, signing out.', { icon: '👋' });
    supabase.auth.signOut();
  }, []);

  const resetInactivityTimer = useCallback(() => {
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(signOutAfterInactivity, 10 * 60 * 1000); // 10 dk
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

  // ---- Auth state dinleyici ----
  useEffect(() => {
    setAuthLoading(true);
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (!currentUser) {
        // Çıkışta ilgili durumları temizle
        setCartItems({});
        setAddresses([]);
        setMyOrders([]);
        setWishlist([]);
        setMyReviews([]);
        setSavedCards([]);
        setMyReturns([]);
      } else {
        // Oturum varsa kullanıcıya ait verileri çek
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

  // ---- Auth işlemleri ----
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
        if (source === 'seller') router.push('/seller/product-list');
        else router.push('/');
      }, 50);
    }
  };

  // ✅ MOBİL UYUMLU (GARANTİLİ) LOGOUT
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;

      // Mobil tarayıcılarda Supabase cookie'lerini zorla temizle (Safari/Chrome Mobile fix)
      const domain = window.location.hostname;
      const baseDomain = domain.startsWith('www.') ? domain.replace('www.', '') : domain;

      document.cookie = `sb-access-token=; Max-Age=0; path=/; domain=${baseDomain}; secure; SameSite=None`;
      document.cookie = `sb-refresh-token=; Max-Age=0; path=/; domain=${baseDomain}; secure; SameSite=None`;

      localStorage.removeItem('supabase.auth.token');
      localStorage.clear();
      sessionStorage.clear();

      clearTimeout(inactivityTimer.current);
      setUser(null);

      toast.success('Successfully signed out.');
      router.push('/auth');

      // bfcache ve cache davranışlarını aşmak için sayfayı yenile
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      console.error('Logout error:', err.message);
      toast.error('Logout failed: ' + err.message);
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
      if (signInError) throw new Error("Current password is incorrect.");
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
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

  // ---- Ürünler ----
  const fetchProducts = async () => {
    setLoading(true); setError(null);
    const { data, error: fetchError } = await supabase.from('products').select('*, categories(name)');
    if (fetchError) {
      setError(fetchError.message); setProducts([]);
    } else {
      const formatted = (data || []).map(p => ({
        ...p,
        image_urls: Array.isArray(p.image_urls) ? p.image_urls : [],
      }));
      setProducts(formatted);
    }
    setLoading(false);
  };

  // ---- Adresler ----
  const fetchAddresses = useCallback(async (userId) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error) setAddresses(data || []);
  }, []);

  // ---- Siparişler ----
  const fetchMyOrders = useCallback(async (userId) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('orders')
      .select(`*, order_items(*, products(*, categories(name)))`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error) setMyOrders(data || []);
  }, []);

  // ---- Favoriler ----
  const fetchWishlist = useCallback(async (userId) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('wishlist')
      .select('*, product:products(*)')
      .eq('user_id', userId);
    if (!error) setWishlist(data || []);
  }, []);

  // ---- Yorumlar ----
  const fetchMyReviews = useCallback(async (userId) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('reviews')
      .select(`*, products (id, name, image_urls)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error) setMyReviews(data || []);
  }, []);

  // ---- Kayıtlı kartlar ----
  const fetchSavedCards = useCallback(async (userId) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('saved_cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error) setSavedCards(data || []);
  }, []);

  // ---- İade talepleri ----
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
    if (!returnsError) setMyReturns(data || []);
    else {
      console.error("Error fetching return requests:", returnsError);
      setMyReturns([]);
      toast.error("An issue occurred while loading return requests.");
    }
  }, []);

  // ---- Kayıtlı kart ekle/sil (dummy) ----
  const addSavedCard = async (cardData) => {
    if (!user) return toast.error("You must be logged in to add a card.");
    const fakeToken = `tok_${Math.random().toString(36).substr(2, 14)}`;
    const last4 = cardData.cardNumber.slice(-4);
    const cardBrand = "visa";
    const { error } = await supabase.from('saved_cards').insert({
      user_id: user.id,
      card_brand: cardBrand,
      last4,
      exp_month: parseInt(cardData.expMonth),
      exp_year: parseInt(cardData.expYear),
      payment_provider_token: fakeToken,
    });
    if (error) {
      toast.error("Error adding card: " + error.message);
      return false;
    }
    toast.success("Card added successfully!");
    fetchSavedCards(user.id);
    return true;
  };

  const deleteSavedCard = async (cardId) => {
    if (!user) return toast.error("You must be logged in to perform this action.");
    const { error } = await supabase.from('saved_cards').delete().eq('id', cardId);
    if (error) toast.error("Error deleting card: " + error.message);
    else {
      toast.success("Card successfully deleted.");
      setSavedCards(prev => prev.filter(card => card.id !== cardId));
    }
  };

  // ---- Favori işlemleri ----
  const addToWishlist = async (productId) => {
    if (!user) return toast.error("Please log in to add to favorites.");
    const { error } = await supabase.from('wishlist').insert({ user_id: user.id, product_id: productId });
    if (error) {
      if (error.code === '23505') toast.error("This product is already in your favorites.");
      else toast.error("Error adding to favorites: " + error.message);
    } else {
      toast.success("Product added to favorites!");
      fetchWishlist(user.id);
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!user) return;
    const { error } = await supabase.from('wishlist').delete().match({ user_id: user.id, product_id: productId });
    if (error) toast.error("Error removing from favorites.");
    else {
      toast.success("Product removed from favorites!");
      fetchWishlist(user.id);
    }
  };

  // ---- Adres CRUD ----
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

  // ---- Sepeti localStorage'a yükle ----
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem("cartItems");
      if (storedCart) setCartItems(JSON.parse(storedCart));
    } catch (e) {
      console.error("Failed to load cart from localStorage:", e);
    }
  }, []);

  // ---- Sepeti localStorage'a kaydet ----
  useEffect(() => {
    try {
      if (Object.keys(cartItems).length > 0) {
        localStorage.setItem("cartItems", JSON.stringify(cartItems));
      } else {
        localStorage.removeItem("cartItems");
      }
    } catch (e) {
      console.error("Failed to save cart to localStorage:", e);
    }
  }, [cartItems]);

  // ---- Sepet işlemleri ----
  const addToCart = (product, quantity = 1, priceOverride = null) => {
    const priceToAdd = priceOverride !== null ? priceOverride : product.price;
    const effectiveQuantity = quantity;
    const currentItem = cartItems[product.id];
    const currentQuantityInCart = currentItem ? currentItem.quantity : 0;

    if (product.stock < currentQuantityInCart + effectiveQuantity) {
      toast.error(`Sorry, only ${product.stock} items in stock. You already have ${currentQuantityInCart} in your cart.`);
      return;
    }

    setCartItems(prev => {
      const existingItem = prev[product.id];
      const newQuantity = (existingItem ? existingItem.quantity : 0) + effectiveQuantity;
      return {
        ...prev,
        [product.id]: {
          product: { ...product, price: priceToAdd / effectiveQuantity }, // birim fiyat
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

  const getCartCount = () =>
    Object.values(cartItems).reduce((sum, item) => sum + (item.quantity || 0), 0);

  const getCartAmount = (taxRate = CALIFORNIA_TAX_RATE) => {
    const subtotal = Object.values(cartItems).reduce((sum, item) => {
      const price = item?.product?.price ?? 0;
      const quantity = item?.quantity ?? 0;
      return sum + (price * quantity);
    }, 0);
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;
    return {
      subtotal: subtotal || 0,
      taxAmount: taxAmount || 0,
      totalAmount: totalAmount || 0,
    };
  };

  // ---- Mağaza ayarı: yorum izni ----
  const fetchReviewPermissionSetting = useCallback(async () => {
    const { data, error } = await supabase
      .from('store_settings')
      .select('setting_value')
      .eq('setting_key', REVIEW_PERMISSION_KEY)
      .single();
    if (!error && data) {
      setReviewPermissionSetting(data.setting_value);
    } else if (error && error.code !== 'PGRST116') {
      console.error("Failed to fetch review setting:", error.message);
    }
  }, []);

  // ---- İlk veri çekimleri ----
  useEffect(() => {
    fetchProducts();
    fetchReviewPermissionSetting();
  }, [fetchReviewPermissionSetting]);

  // ---- Context değeri ----
  const value = {
    currency, router, products, loading, error, fetchProducts,
    cartItems, setCartItems, addToCart, updateCartQuantity, getCartCount, getCartAmount,
    user, authLoading, signUp, signIn, signOut,
    changeUserPassword, updateUserData,
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
