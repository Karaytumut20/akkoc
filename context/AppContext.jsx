// context/AppContext.jsx

'use client'

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient"; // Import Supabase client
import toast from "react-hot-toast"; // For notifications
import { getSafeImageUrl } from "@/lib/utils"; // Helper function for secure image URL

// Create Context
export const AppContext = createContext(undefined);

// Hook to use context
export const useAppContext = () => {
    const context = useContext(AppContext);
    // Ensure context is used within Provider
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppContextProvider');
    }
    return context;
};

// Database setting key
const REVIEW_PERMISSION_KEY = 'review_permission';
// Tax rate (example)
const CALIFORNIA_TAX_RATE = 0.0825; // Adjust according to your needs

// Context Provider Component
export const AppContextProvider = (props) => {
    // ---- STATE VARIABLES ----
    const currency = process.env.NEXT_PUBLIC_CURRENCY || "$"; // Currency symbol (from env variable or default)
    const router = useRouter(); // Next.js router hook

    // Products
    const [products, setProducts] = useState([]); // All products list
    const [loading, setLoading] = useState(true); // Loading state for products
    const [error, setError] = useState(null); // Product fetch error

    // Cart
    const [cartItems, setCartItems] = useState({}); // Cart items: { productId: { product, quantity } }

    // User Authentication
    const [user, setUser] = useState(null); // Logged in user information
    const [authLoading, setAuthLoading] = useState(true); // Authentication loading state

    // User Account Data
    const [addresses, setAddresses] = useState([]); // Saved addresses
    const [myOrders, setMyOrders] = useState([]); // Order history
    const [wishlist, setWishlist] = useState([]); // Wishlist
    const [myReviews, setMyReviews] = useState([]); // User reviews
    const [savedCards, setSavedCards] = useState([]); // Saved cards
    const [myReturns, setMyReturns] = useState([]); // <-- NEW: User return requests

    // Store Settings
    const [reviewPermissionSetting, setReviewPermissionSetting] = useState('purchasers_only'); // Review permission (default)

    // Inactivity Timer
    const inactivityTimer = useRef(null); // Timer reference

    // ---- FUNCTIONS ----

    // Sign out after inactivity
    const signOutAfterInactivity = useCallback(() => {
        toast('Session ended due to inactivity, signing out.', { icon: '👋' });
        supabase.auth.signOut();
    }, []);

    // Reset inactivity timer
    const resetInactivityTimer = useCallback(() => {
        clearTimeout(inactivityTimer.current);
        // Set timer for 10 minutes (10 min * 60 sec * 1000 ms)
        inactivityTimer.current = setTimeout(signOutAfterInactivity, 10 * 60 * 1000);
    }, [signOutAfterInactivity]);

    // useEffect managing inactivity timer
    useEffect(() => {
        // Start timer only if user is logged in
        if (user) {
            const events = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'];
            // Add activity listeners
            events.forEach(event => window.addEventListener(event, resetInactivityTimer));
            resetInactivityTimer(); // Set initial timer

            // Clean up when component unmounts or user changes
            return () => {
                events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
                clearTimeout(inactivityTimer.current);
            };
        }
    }, [user, resetInactivityTimer]); // Runs when user or function changes

    // useEffect listening to authentication state
    useEffect(() => {
        setAuthLoading(true); // Start loading
        // Listen to Supabase auth state change
        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user; // User from current session
            setUser(currentUser || null); // Update user state

            if (!currentUser) {
                // If user signs out, clear all related data
                setCartItems({});
                setAddresses([]);
                setMyOrders([]);
                setWishlist([]);
                setMyReviews([]);
                setSavedCards([]);
                setMyReturns([]); // <-- NEW: Clear returns
            } else {
                 // If user logs in or session refreshes, fetch their data
                 // Note: These functions are defined below
                 fetchAddresses(currentUser.id);
                 fetchMyOrders(currentUser.id);
                 fetchWishlist(currentUser.id);
                 fetchMyReviews(currentUser.id);
                 fetchSavedCards(currentUser.id);
                 fetchMyReturns(currentUser.id); // <-- NEW: Fetch returns
            }
            setAuthLoading(false); // Finish loading
        });

        // Remove listener when component unmounts
        return () => {
            authListener.subscription.unsubscribe();
        };
     }, []); // Runs only on initial mount


    // Sign up function
    const signUp = async (email, password) => {
        // Sign up with Supabase
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
            toast.error(error.message); // Show error if exists
            return false; // Failed
        }
        toast.success('Registration successful! Please verify your email.'); // Success message
        return true; // Successful
    };

    // Sign in function
    const signIn = async (email, password, source = 'user') => { // source parameter added (seller/user)
        // Sign in with Supabase
        const { data: signInData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

        if (authError) {
            toast.error('Invalid username or password.'); // General error message
            return; // Stop on error
        }

        // If login successful
        if (signInData.user) {
            toast.success('Login successful!');
            // Redirect with small delay (to show toast message)
            setTimeout(() => {
                // Redirect based on source (seller panel or home page)
                if (source === 'seller') {
                    router.push('/seller/product-list');
                } else {
                    router.push('/');
                }
            }, 50);
        }
    };

 // Sign out function (FULL MOBILE FIX)
const signOut = useCallback(async () => {
    try {
        // 1️⃣ Supabase çıkışını dene (scope: global ekledik)
        const { error } = await supabase.auth.signOut({ scope: 'global' });

        // 2️⃣ Eğer hata “Auth session missing!” değilse hatayı fırlat
        if (error && !error.message.includes("Auth session missing")) throw error;

        // 3️⃣ Cookie ve localStorage temizliği (mobil cihazlar için şart)
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

        // 4️⃣ State sıfırla
        setUser(null);
        clearTimeout(inactivityTimer.current);

        // 5️⃣ Bildirim + yönlendirme
        toast.success("Successfully signed out.");
        router.push("/auth");

        // 6️⃣ iOS Safari / Android Chrome cache bug fix
        setTimeout(() => window.location.reload(), 400);
    } catch (err) {
        console.error("Logout error:", err.message);
        toast.error("Logout failed: " + err.message);
    }
}, [router]);

    // Change password function
    const changeUserPassword = async (currentPassword, newPassword) => {
        // Error if user not logged in
        if (!user) {
            toast.error("You must be logged in to perform this action.");
            return false;
        }
        const toastId = toast.loading("Processing..."); // Loading indicator
        try {
            // Verify current password (by attempting to sign in again)
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            });
            // Throw error if current password is wrong
            if (signInError) {
                throw new Error("Current password is incorrect.");
            }
            // If current password is correct, update with new password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });
            // Throw error if update fails
            if (updateError) {
                throw new Error("Error updating password: " + updateError.message);
            }
            toast.success("Password updated successfully!", { id: toastId }); // Success message
            return true; // Successful
        } catch (error) {
            toast.error(error.message, { id: toastId }); // Error message
            return false; // Failed
        }
    };

    // Update user metadata (name, phone, etc.) function
    const updateUserData = async (data) => {
        const toastId = toast.loading("Updating your information...");
        // Update user data in Supabase
        const { error } = await supabase.auth.updateUser({ data });
        if (error) {
            toast.error("Error updating information: " + error.message, { id: toastId });
            return false; // Failed
        }
        toast.success("Information updated successfully!", { id: toastId }); // Success message
        return true; // Successful
    };

    // Fetch all products function
    const fetchProducts = async () => {
        setLoading(true); setError(null); // Start loading, reset error
        // Fetch products and related category name
        const { data, error: fetchError } = await supabase.from('products').select('*, categories(name)');
        if (fetchError) {
            setError(fetchError.message); setProducts([]); // Update state if error
        } else {
            // Ensure image_urls is always an array
            const formattedProducts = (data || []).map(p => ({
                ...p,
                image_urls: Array.isArray(p.image_urls) ? p.image_urls : [],
            }));
            setProducts(formattedProducts); // Update product state
        }
        setLoading(false); // Finish loading
    };

    // Fetch user's saved addresses function
    const fetchAddresses = useCallback(async (userId) => {
        if (!userId) return; // Exit if no user ID
        // Fetch addresses, sorted from newest to oldest
        const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        // Update address state if no error
        if (!error) setAddresses(data || []);
        // Log error if exists (optional)
        // else console.error("Error fetching addresses:", error);
    }, []); // No dependencies

    // Fetch user's orders (with product details) function
    const fetchMyOrders = useCallback(async (userId) => {
        if (!userId) return;
        // Fetch orders, order items, products, and category names
        const { data, error } = await supabase
            .from('orders')
            .select(`*, order_items(*, products(*, categories(name)))`)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (!error) setMyOrders(data || []);
        // else console.error("Error fetching orders:", error);
    }, []); // No dependencies

    // Fetch user's wishlist (with product details) function
    const fetchWishlist = useCallback(async (userId) => {
        if (!userId) return;
        // Fetch wishlist and related product details
        const { data, error } = await supabase
            .from('wishlist')
            .select('*, product:products(*)')
            .eq('user_id', userId);
        if (!error) setWishlist(data || []);
        // else console.error("Error fetching wishlist:", error);
    }, []); // No dependencies

    // Fetch user's reviews (with product details) function
    const fetchMyReviews = useCallback(async (userId) => {
        if (!userId) return;
        // Fetch reviews and related product (id, name, image_urls) information
        const { data, error } = await supabase
            .from('reviews')
            .select(`*, products (id, name, image_urls)`)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (!error) setMyReviews(data || []);
        // else console.error("Error fetching reviews:", error);
    }, []); // No dependencies

    // Fetch user's saved cards function
    const fetchSavedCards = useCallback(async (userId) => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('saved_cards') // Assuming 'saved_cards' table
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (!error) setSavedCards(data || []);
        // else console.error("Error fetching saved cards:", error);
    }, []); // No dependencies

    // NEW Function: Fetch user's return requests (with detailed query)
    const fetchMyReturns = useCallback(async (userId) => {
        if (!userId) return;
        // RLS policies will ensure only correct user data is returned.
        const { data, error: returnsError } = await supabase
            .from('returns') // Fetch from 'returns' table
            .select(`
                *,
                product:products (id, name, image_urls),
                order_item:order_items (quantity, price)
            `) // Include related product and order item information
            .eq('user_id', userId) // Filter by user ID (RLS already does this)
            .order('created_at', { ascending: false }); // Sort from newest to oldest

        if (!returnsError) {
            setMyReturns(data || []); // Set incoming data to state
        } else {
             console.error("Error fetching return requests:", returnsError);
             setMyReturns([]); // Clear state in case of error
             toast.error("An issue occurred while loading return requests.");
        }
    }, []); // No dependencies

    // Add new saved card function (with placeholder token logic)
    const addSavedCard = async (cardData) => {
        if (!user) return toast.error("You must be logged in to add a card.");

        // Real payment provider integration (e.g., Stripe) should be done here
        // This part currently creates a fake token
        const fakeToken = `tok_${Math.random().toString(36).substr(2, 14)}`;
        const last4 = cardData.cardNumber.slice(-4); // Last 4 digits of card
        const cardBrand = "visa"; // Real card brand detection would be needed

        // Save card information (with token) to Supabase
        const { error } = await supabase.from('saved_cards').insert({
            user_id: user.id,
            card_brand: cardBrand,
            last4: last4,
            exp_month: parseInt(cardData.expMonth),
            exp_year: parseInt(cardData.expYear),
            payment_provider_token: fakeToken, // Save fake token
        });

        if (error) {
            toast.error("Error adding card: " + error.message);
            return false; // Failed
        } else {
            toast.success("Card added successfully!");
            fetchSavedCards(user.id); // Refresh card list
            return true; // Successful
        }
    };

    // Delete saved card function
    const deleteSavedCard = async (cardId) => {
        if (!user) return toast.error("You must be logged in to perform this action.");

        // Delete card from Supabase
        const { error } = await supabase.from('saved_cards').delete().eq('id', cardId);

        if (error) {
            toast.error("Error deleting card: " + error.message);
        } else {
            toast.success("Card successfully deleted.");
            // Update state immediately (for better UX)
            setSavedCards(prev => prev.filter(card => card.id !== cardId));
        }
    };

    // Add product to wishlist function
    const addToWishlist = async (productId) => {
        if (!user) return toast.error("Please log in to add to favorites.");
        // Insert into 'wishlist' table
        const { error } = await supabase.from('wishlist').insert({ user_id: user.id, product_id: productId });
        if (error) {
            // If product is already in favorites (unique constraint error)
            if (error.code === '23505') {
                 toast.error("This product is already in your favorites.");
            } else {
                 toast.error("Error adding to favorites: " + error.message);
            }
        } else {
            toast.success("Product added to favorites!");
            fetchWishlist(user.id); // Refresh wishlist
        }
    };

    // Remove product from wishlist function
    const removeFromWishlist = async (productId) => {
        if (!user) return; // Must be logged in
        // Delete from 'wishlist' table by user and product ID
        const { error } = await supabase.from('wishlist').delete().match({ user_id: user.id, product_id: productId });
        if (error) {
            toast.error("Error removing from favorites.");
        } else {
            toast.success("Product removed from favorites!");
            fetchWishlist(user.id); // Refresh wishlist
        }
    };

    // Add new address function
    const addAddress = async (addressData) => {
        if (!user) return toast.error("You must be logged in to add an address.");
        const toastId = toast.loading("Adding address...");
        try {
            // Insert new address with user ID into 'addresses' table
            const { error } = await supabase.from('addresses').insert({ ...addressData, user_id: user.id });
            if (error) throw error; // Throw error if exists
            await fetchAddresses(user.id); // Refresh address list
            toast.success("Address successfully added!", { id: toastId });
            return true; // Successful
        } catch (error) {
            toast.error("Error adding address: " + error.message, { id: toastId });
            return false; // Failed
        }
    };

    // Update existing address function
    const updateAddress = async (addressId, addressData) => {
        if (!user) return toast.error("You must be logged in to update an address.");
        const toastId = toast.loading("Updating address...");
        try {
            // Remove fields that shouldn't be updated (id, user_id, created_at)
            const { id, user_id, created_at, ...updateData } = addressData;
            // Update in 'addresses' table by ID
            const { error } = await supabase.from('addresses').update(updateData).eq('id', addressId);
            if (error) throw error; // Throw error if exists
            await fetchAddresses(user.id); // Refresh address list
            toast.success("Address successfully updated!", { id: toastId });
            return true; // Successful
        } catch (error) {
            toast.error("Error updating address: " + error.message, { id: toastId });
            return false; // Failed
        }
    };

    // Delete address function
    const deleteAddress = async (addressId) => {
        if (!user) return toast.error("You must be logged in to delete an address.");
        const toastId = toast.loading("Deleting address...");
        try {
            // Delete from 'addresses' table by ID
            const { error } = await supabase.from('addresses').delete().eq('id', addressId);
            if (error) throw error; // Throw error if exists
            // Update state immediately
            setAddresses(prev => prev.filter(addr => addr.id !== addressId));
            toast.success("Address successfully deleted!", { id: toastId });
        } catch (error) {
            toast.error("Error deleting address: " + error.message, { id: toastId });
        }
    };

    // useEffect to load cart data from localStorage
    useEffect(() => {
        try {
             // Get cart from localStorage when page loads
             const storedCart = localStorage.getItem("cartItems");
             // If data exists, parse from JSON and set to state
             if (storedCart) {
                setCartItems(JSON.parse(storedCart));
             }
        } catch (e) {
             console.error("Failed to load cart from localStorage:", e);
             // Clear corrupted data (optional)
             // localStorage.removeItem("cartItems");
        }
    }, []); // Runs only on initial mount

    // useEffect to save cart data to localStorage
    useEffect(() => {
        try {
            // If there are items in cart
            if (Object.keys(cartItems).length > 0) {
                // Save cart as JSON string to localStorage
                localStorage.setItem("cartItems", JSON.stringify(cartItems));
            } else {
                // If cart is empty, remove 'cartItems' key from localStorage
                localStorage.removeItem("cartItems");
            }
        } catch(e) {
            console.error("Failed to save cart to localStorage:", e);
        }
    }, [cartItems]); // Runs every time cartItems state changes

    // Add to cart function (with quantity and stock control)
    const addToCart = (product, quantity = 1, priceOverride = null) => {
        // Use override price if provided (for bulk purchase), otherwise use product's normal price
        const priceToAdd = priceOverride !== null ? priceOverride : product.price;
        // Quantity to add (can be more than 1 for bulk purchase)
        const effectiveQuantity = quantity;

        // Get product's current quantity in cart
        const currentItem = cartItems[product.id];
        const currentQuantityInCart = currentItem ? currentItem.quantity : 0;

        // Check if requested quantity exceeds stock when added
        if (product.stock < currentQuantityInCart + effectiveQuantity) {
            toast.error(`Sorry, only ${product.stock} items in stock. You already have ${currentQuantityInCart} in your cart.`);
            return; // Stop operation if insufficient stock
        }

        // Update cartItems state
        setCartItems(prev => {
            const existingItem = prev[product.id];
            // Calculate new total quantity for this product
            const newQuantity = (existingItem ? existingItem.quantity : 0) + effectiveQuantity;

            // Return updated cart state
            return {
                ...prev, // Preserve previous items
                [product.id]: { // Add or update relevant product
                    // Save product details, new quantity, and *unit* price
                    product: { ...product, price: priceToAdd / effectiveQuantity }, // Save individual product price
                    quantity: newQuantity,
                }
            };
        });

        // Show success message
        toast.success(`${effectiveQuantity} x ${product.name} added to cart!`);
    };

    // Update cart item quantity function
    const updateCartQuantity = (productId, quantity) => {
        setCartItems(prev => {
            const newItems = { ...prev }; // Create copy of cart
            const item = newItems[productId]; // Get relevant product

            // If product not in cart (shouldn't happen but let's check), do nothing
            if (!item || !item.product) return newItems;

            const product = item.product; // Get product details

            // Check stock when increasing quantity
            if (quantity > product.stock) {
                toast.error(`Maximum ${product.stock} items allowed.`);
                newItems[productId].quantity = product.stock; // Set quantity to max stock
                return newItems; // Return updated state
            }

            // If quantity is 0 or less, remove product from cart
            if (quantity <= 0) {
                delete newItems[productId]; // Delete product
                 toast.success(`${product.name} removed from cart.`); // Confirmation message (optional)
            }
            // Otherwise (quantity greater than 0) update quantity
            else {
                 newItems[productId].quantity = quantity;
            }
            return newItems; // Return modified cart state
        });
    };

    // Calculate total number of items in cart function
    const getCartCount = () => Object.values(cartItems).reduce((sum, item) => sum + (item.quantity || 0), 0); // Safely sum quantities

    // Calculate cart subtotal, tax, and total amount function
    const getCartAmount = (taxRate = CALIFORNIA_TAX_RATE) => { // Tax rate can be overridden
        // Calculate subtotal (consider 0 if price or quantity is not a number)
        const subtotal = Object.values(cartItems).reduce((sum, item) => {
            const price = item?.product?.price ?? 0; // 0 if no price
            const quantity = item?.quantity ?? 0;   // 0 if no quantity
            return sum + (price * quantity);
        }, 0); // Start total from 0

        // Calculate tax amount
        const taxAmount = subtotal * taxRate;
        // Calculate total amount
        const totalAmount = subtotal + taxAmount;

        // Always return an object with number values (default 0)
        return {
            subtotal: subtotal || 0,
            taxAmount: taxAmount || 0,
            totalAmount: totalAmount || 0,
        };
    };

    // Fetch review permission setting function
    const fetchReviewPermissionSetting = useCallback(async () => {
        // Fetch relevant setting from 'store_settings' table
        const { data, error } = await supabase
            .from('store_settings')
            .select('setting_value')
            .eq('setting_key', REVIEW_PERMISSION_KEY)
            .single(); // We expect a single record

        // Update state if no error and data exists
        if (!error && data) {
            setReviewPermissionSetting(data.setting_value);
        }
        // Ignore 'Record not found' error (PGRST116), log other errors
        else if (error && error.code !== 'PGRST116') {
             console.error("Failed to fetch review setting:", error.message);
        }
        // In case of error or setting not found, default ('purchasers_only') remains
    }, []); // No dependencies

    // Fetch initial data (products, settings) when component mounts
    useEffect(() => {
        fetchProducts();
        fetchReviewPermissionSetting();
    }, [fetchReviewPermissionSetting]); // fetchReviewPermissionSetting dependency

    // ---- CONTEXT VALUE ----
    // All state and functions to be shared via Provider
    const value = {
        currency, router, products, loading, error, fetchProducts,
        cartItems, setCartItems, addToCart, updateCartQuantity, getCartCount, getCartAmount,
        user, authLoading, signUp, signIn, signOut,
        changeUserPassword,
        updateUserData,
        addresses, fetchAddresses, addAddress, updateAddress, deleteAddress,
        myOrders, fetchMyOrders,
        myReviews, fetchMyReviews,
        myReturns, fetchMyReturns, // <-- NEW: Return state and function added
        getSafeImageUrl, // Also share helper function
        wishlist, addToWishlist, removeFromWishlist,
        savedCards, addSavedCard, deleteSavedCard,
        reviewPermissionSetting // Also share review permission setting
    };

    // Return Provider component
    return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};