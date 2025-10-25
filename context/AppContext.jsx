// context/AppContext.jsx

'use client'

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { getSafeImageUrl } from "@/lib/utils";

// Create the context
export const AppContext = createContext(undefined);

// Hook to use the AppContext
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppContextProvider');
    }
    return context;
};

// Key for the review permission setting in the database
const REVIEW_PERMISSION_KEY = 'review_permission';
// Define the tax rate within the context scope
const CALIFORNIA_TAX_RATE = 0.08; // Example tax rate (8%)

// Context Provider Component
export const AppContextProvider = (props) => {
    // ---- STATE VARIABLES ----
    const currency = process.env.NEXT_PUBLIC_CURRENCY || "$"; // Currency symbol
    const router = useRouter(); // Next.js router

    // Product state
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true); // General loading state for products
    const [error, setError] = useState(null); // Error state for product fetching

    // Cart state
    const [cartItems, setCartItems] = useState({}); // Cart items { productId: { product, quantity } }

    // User authentication state
    const [user, setUser] = useState(null); // Current logged-in user object
    const [authLoading, setAuthLoading] = useState(true); // Loading state for authentication checks

    // User account related state
    const [addresses, setAddresses] = useState([]); // User's saved addresses
    const [myOrders, setMyOrders] = useState([]); // User's past orders
    const [wishlist, setWishlist] = useState([]); // User's wishlist items
    const [myReviews, setMyReviews] = useState([]); // User's submitted reviews
    const [savedCards, setSavedCards] = useState([]); // User's saved payment cards

    // Store settings state
    const [reviewPermissionSetting, setReviewPermissionSetting] = useState('purchasers_only'); // Default review permission

    // Inactivity timer state
    const inactivityTimer = useRef(null);

    // ---- FUNCTIONS ----

    // Sign out after a period of inactivity
    const signOutAfterInactivity = useCallback(() => {
        toast('Session expired due to inactivity, logging out.', { icon: '👋' });
        supabase.auth.signOut();
    }, []);

    // Reset the inactivity timer on user activity
    const resetInactivityTimer = useCallback(() => {
        clearTimeout(inactivityTimer.current);
        // Set timer for 10 minutes (10 * 60 * 1000 milliseconds)
        inactivityTimer.current = setTimeout(signOutAfterInactivity, 10 * 60 * 1000);
    }, [signOutAfterInactivity]);

    // Effect to manage inactivity timer listener
    useEffect(() => {
        if (user) {
            const events = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'];
            // Add event listeners for user activity
            events.forEach(event => window.addEventListener(event, resetInactivityTimer));
            resetInactivityTimer(); // Start the timer initially

            // Cleanup function to remove listeners and clear timer on unmount or user change
            return () => {
                events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
                clearTimeout(inactivityTimer.current);
            };
        }
    }, [user, resetInactivityTimer]);

    // Effect to listen for authentication state changes
    useEffect(() => {
        setAuthLoading(true);
        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user;
            setUser(currentUser || null); // Update user state
            // If user logs out, clear their related data
            if (!currentUser) {
                setCartItems({});
                setAddresses([]);
                setMyOrders([]);
                setWishlist([]);
                setMyReviews([]);
                setSavedCards([]);
            }
            setAuthLoading(false); // Authentication check finished
        });

        // Cleanup function to unsubscribe from the listener
        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    // User sign up function
    const signUp = async (email, password) => {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
            toast.error(error.message);
            return false; // Indicate failure
        }
        toast.success('Registration successful! Please verify your email.');
        return true; // Indicate success
    };

    // User sign in function
    const signIn = async (email, password, source) => {
        const { data: signInData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

        if (authError) {
            toast.error('Invalid username or password.'); // Generic error message
            return; // Stop execution on error
        }

        if (signInData.user) {
            toast.success('Login successful!');
            // Delay redirection slightly to allow toast message to start showing
            setTimeout(() => {
                if (source === 'seller') {
                    router.push('/seller/product-list'); // Redirect seller
                } else {
                    router.push('/'); // Redirect regular user
                }
            }, 50);
        }
    };

    // User sign out function
    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        clearTimeout(inactivityTimer.current); // Clear inactivity timer
        router.push('/'); // Redirect to homepage
        toast.success('Successfully logged out.');
    }, [router]); // router is a dependency

    // Change user password function
    const changeUserPassword = async (currentPassword, newPassword) => {
        if (!user) {
            toast.error("You must be logged in to perform this action.");
            return false;
        }
        const toastId = toast.loading("Processing..."); // Show loading indicator
        try {
            // First, verify the current password by trying to sign in with it
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            });
            if (signInError) {
                throw new Error("Incorrect current password.");
            }
            // If current password is correct, update to the new password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });
            if (updateError) {
                throw new Error("Error updating password: " + updateError.message);
            }
            toast.success("Password updated successfully!", { id: toastId });
            return true; // Indicate success
        } catch (error) {
            toast.error(error.message, { id: toastId });
            return false; // Indicate failure
        }
    };

    // Update user metadata (like full name, phone)
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

    // Fetch all products
    const fetchProducts = async () => {
        setLoading(true); setError(null);
        // Select products and include the category name via relationship
        const { data, error: fetchError } = await supabase.from('products').select('*, categories(name)');
        if (fetchError) {
            setError(fetchError.message); setProducts([]);
        } else {
            // Ensure image_urls is always an array
            const formattedProducts = (data || []).map(p => ({
                ...p,
                image_urls: Array.isArray(p.image_urls) ? p.image_urls : [],
            }));
            setProducts(formattedProducts);
        }
        setLoading(false);
    };

    // Fetch user's saved addresses
    const fetchAddresses = async (userId) => {
        if (!userId) return; // Don't fetch if no user ID
        const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }); // Newest first
        if (!error) setAddresses(data || []);
         // Handle error if needed: else console.error("Error fetching addresses:", error);
    };

    // Fetch user's orders with items and product details
    const fetchMyOrders = async (userId) => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('orders')
            .select(`*, order_items(*, products(*, categories(name)))`) // Deep fetch
            .eq('user_id', userId)
            .order('created_at', { ascending: false }); // Newest first
        if (!error) setMyOrders(data || []);
         // Handle error if needed: else console.error("Error fetching orders:", error);
    };

    // Fetch user's wishlist with product details
    const fetchWishlist = async (userId) => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('wishlist')
            .select('*, product:products(*)') // Fetch related product details
            .eq('user_id', userId);
        if (!error) setWishlist(data || []);
         // Handle error if needed: else console.error("Error fetching wishlist:", error);
    };

    // Fetch user's reviews with product details
    const fetchMyReviews = async (userId) => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('reviews')
            .select(`*, products (id, name, image_urls)`) // Fetch related product details
            .eq('user_id', userId)
            .order('created_at', { ascending: false }); // Newest first
        if (!error) setMyReviews(data || []);
         // Handle error if needed: else console.error("Error fetching reviews:", error);
    };

    // Fetch user's saved payment cards
    const fetchSavedCards = async (userId) => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('saved_cards')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }); // Newest first
        if (!error) setSavedCards(data || []);
        // Handle error if needed: else console.error("Error fetching saved cards:", error);
    };

    // Add a new saved card (currently uses placeholder token logic)
    const addSavedCard = async (cardData) => {
        if (!user) return toast.error("You must be logged in to add a card.");

        // Placeholder logic for tokenization - replace with actual Stripe/payment provider integration
        const fakeToken = `tok_${Math.random().toString(36).substr(2, 14)}`;
        const last4 = cardData.cardNumber.slice(-4);
        const cardBrand = "visa"; // Basic brand detection needed here in reality

        const { error } = await supabase.from('saved_cards').insert({
            user_id: user.id,
            card_brand: cardBrand,
            last4: last4,
            exp_month: parseInt(cardData.expMonth),
            exp_year: parseInt(cardData.expYear),
            payment_provider_token: fakeToken, // Store the placeholder token
        });

        if (error) {
            toast.error("Error adding card: " + error.message);
            return false;
        } else {
            toast.success("Card added successfully!");
            fetchSavedCards(user.id); // Refresh saved cards list
            return true;
        }
    };

    // Delete a saved card
    const deleteSavedCard = async (cardId) => {
        if (!user) return toast.error("You must be logged in for this action.");

        const { error } = await supabase.from('saved_cards').delete().eq('id', cardId);

        if (error) {
            toast.error("Error deleting card: " + error.message);
        } else {
            toast.success("Card deleted successfully.");
            // Update local state immediately for better UX
            setSavedCards(prev => prev.filter(card => card.id !== cardId));
        }
    };

    // Add a product to the wishlist
    const addToWishlist = async (productId) => {
        if (!user) return toast.error("Please log in to add items to your wishlist.");
        // Insert into wishlist table
        const { error } = await supabase.from('wishlist').insert({ user_id: user.id, product_id: productId });
        if (error) {
            // Handle potential duplicate entry error (code 23505)
            if (error.code === '23505') {
                 toast.error("This item is already in your wishlist.");
            } else {
                 toast.error("Error adding to wishlist: " + error.message);
            }
        } else {
            toast.success("Item added to wishlist!");
            fetchWishlist(user.id); // Refresh wishlist
        }
    };

    // Remove a product from the wishlist
    const removeFromWishlist = async (productId) => {
        if (!user) return; // Should not happen if button is shown only to logged-in users
        // Delete from wishlist table based on user and product ID
        const { error } = await supabase.from('wishlist').delete().match({ user_id: user.id, product_id: productId });
        if (error) {
            toast.error("Error removing from wishlist.");
        } else {
            toast.success("Item removed from wishlist!");
            fetchWishlist(user.id); // Refresh wishlist
        }
    };

    // Effect to fetch user-specific data when the user object changes
    useEffect(() => {
        if (user) {
            fetchAddresses(user.id);
            fetchMyOrders(user.id);
            fetchWishlist(user.id);
            fetchMyReviews(user.id);
            fetchSavedCards(user.id);
        }
    }, [user]); // Run whenever the user object changes

    // Add a new address
    const addAddress = async (addressData) => {
        if (!user) return toast.error("You must log in to add an address.");
        const toastId = toast.loading("Adding address...");
        try {
            // Insert new address linked to the user
            const { error } = await supabase.from('addresses').insert({ ...addressData, user_id: user.id });
            if (error) throw error;
            await fetchAddresses(user.id); // Refresh address list
            toast.success("Address added successfully!", { id: toastId });
            return true;
        } catch (error) {
            toast.error("Error adding address: " + error.message, { id: toastId });
            return false;
        }
    };

    // Update an existing address
    const updateAddress = async (addressId, addressData) => {
        if (!user) return toast.error("You must log in to update an address.");
        const toastId = toast.loading("Updating address...");
        try {
            // Exclude fields that shouldn't be updated directly
            const { id, user_id, created_at, ...updateData } = addressData;
            const { error } = await supabase.from('addresses').update(updateData).eq('id', addressId);
            if (error) throw error;
            await fetchAddresses(user.id); // Refresh address list
            toast.success("Address updated successfully!", { id: toastId });
            return true;
        } catch (error) {
            toast.error("Error updating address: " + error.message, { id: toastId });
            return false;
        }
    };

    // Delete an address
    const deleteAddress = async (addressId) => {
        if (!user) return toast.error("You must log in to delete an address.");
        const toastId = toast.loading("Deleting address...");
        try {
            const { error } = await supabase.from('addresses').delete().eq('id', addressId);
            if (error) throw error;
            // Update local state for immediate UI feedback
            setAddresses(prev => prev.filter(addr => addr.id !== addressId));
            toast.success("Address deleted successfully!", { id: toastId });
        } catch (error) {
            toast.error("Error deleting address: " + error.message, { id: toastId });
        }
    };

    // Effect to load cart items from localStorage on initial mount
    useEffect(() => {
        try {
             const storedCart = localStorage.getItem("cartItems");
             if (storedCart) {
                setCartItems(JSON.parse(storedCart));
             }
        } catch (e) {
             console.error("Failed to load cart from localStorage:", e);
             // Optionally clear corrupted data: localStorage.removeItem("cartItems");
        }
    }, []); // Empty dependency array means run only once on mount

    // Effect to save cart items to localStorage whenever cartItems state changes
    useEffect(() => {
        try {
            if (Object.keys(cartItems).length > 0) {
                localStorage.setItem("cartItems", JSON.stringify(cartItems));
            } else {
                // If cart is empty, remove the item from localStorage
                localStorage.removeItem("cartItems");
            }
        } catch(e) {
            console.error("Failed to save cart to localStorage:", e);
        }
    }, [cartItems]); // Run whenever cartItems changes

    // Add a product to the cart (handles quantity and stock check)
    const addToCart = (product, quantity = 1, priceOverride = null) => {
        // Use priceOverride if provided (for bulk pricing), otherwise use product's standard price
        const priceToAdd = priceOverride !== null ? priceOverride : product.price;
        // Determine the quantity to add (can be more than 1 for bulk additions)
        const effectiveQuantity = quantity;

        // Get current quantity of this product in the cart
        const currentItem = cartItems[product.id];
        const currentQuantityInCart = currentItem ? currentItem.quantity : 0;

        // Check if adding the desired quantity exceeds available stock
        if (product.stock < currentQuantityInCart + effectiveQuantity) {
            toast.error(`Sorry, only ${product.stock} items available. You already have ${currentQuantityInCart} in your cart.`);
            return; // Stop the function if not enough stock
        }

        // Update the cartItems state
        setCartItems(prev => {
            const existingItem = prev[product.id];
            // Calculate the new total quantity for this product
            const newQuantity = (existingItem ? existingItem.quantity : 0) + effectiveQuantity;

            // Return the updated cart state
            return {
                ...prev, // Keep existing items
                [product.id]: { // Add or update the item
                    // Store product details, new quantity, and the price *per item* used for this addition
                    product: { ...product, price: priceToAdd / effectiveQuantity }, // Store price per single item
                    quantity: newQuantity,
                    // Optionally: Store how the price was determined (e.g., 'standard', '2_pack') if needed elsewhere
                    // priceSource: priceOverride ? 'bulk' : 'standard'
                }
            };
        });

        // Show success message
        toast.success(`${effectiveQuantity} x ${product.name} added to cart!`);
    };

    // Update the quantity of an item already in the cart
    const updateCartQuantity = (productId, quantity) => {
        setCartItems(prev => {
            const newItems = { ...prev }; // Create a copy of the cart
            const item = newItems[productId]; // Get the specific item

            // If item doesn't exist in cart (shouldn't normally happen), do nothing
            if (!item || !item.product) return newItems;

            const product = item.product; // Get product details from the item

            // Check stock limit when increasing quantity
            if (quantity > product.stock) {
                toast.error(`Maximum ${product.stock} units allowed.`);
                newItems[productId].quantity = product.stock; // Set quantity to max stock
                return newItems; // Return updated state
            }

            // If quantity is 0 or less, remove the item from the cart
            if (quantity <= 0) {
                delete newItems[productId];
                 toast.success(`${product.name} removed from cart.`); // Optional confirmation
            }
            // Otherwise, update the quantity of the existing item
            else {
                 newItems[productId].quantity = quantity;
            }
            return newItems; // Return the modified cart state
        });
    };

    // Calculate the total number of items in the cart
    const getCartCount = () => Object.values(cartItems).reduce((sum, item) => sum + (item.quantity || 0), 0); // Safely sum quantities

    // 🔥 FIX: Ensure getCartAmount always returns numbers, defaulting to 0
    // Calculate subtotal, tax, and total amount for the cart
    const getCartAmount = (taxRate = CALIFORNIA_TAX_RATE) => { // Accept taxRate override, defaults to constant
        // Calculate subtotal safely, ensuring price and quantity are numbers
        const subtotal = Object.values(cartItems).reduce((sum, item) => {
            const price = item?.product?.price ?? 0; // Default to 0 if price missing
            const quantity = item?.quantity ?? 0;   // Default to 0 if quantity missing
            return sum + (price * quantity);
        }, 0); // Start sum at 0

        // Calculate tax amount
        const taxAmount = subtotal * taxRate;
        // Calculate total amount
        const totalAmount = subtotal + taxAmount;

        // Always return an object with number values, defaulting to 0
        return {
            subtotal: subtotal || 0,
            taxAmount: taxAmount || 0,
            totalAmount: totalAmount || 0,
        };
    };


    // Effect to fetch products on initial mount
    useEffect(() => { fetchProducts(); }, []); // Empty array means run once

    // ⭐️ Effect to fetch review permission setting on initial mount
    const fetchReviewPermissionSetting = useCallback(async () => {
        const { data, error } = await supabase
            .from('store_settings')
            .select('setting_value')
            .eq('setting_key', REVIEW_PERMISSION_KEY)
            .single();

        if (!error && data) {
            setReviewPermissionSetting(data.setting_value); // Update state with fetched value
        } else if (error && error.code !== 'PGRST116') { // Ignore 'Not Found' error
             console.error("Failed to fetch review setting:", error.message);
        }
        // If error or setting not found, it keeps the default 'purchasers_only'
    }, []); // No dependencies needed for this function itself

    useEffect(() => {
        fetchReviewPermissionSetting(); // Call the fetch function
    }, [fetchReviewPermissionSetting]); // Run when the fetch function definition is available

    // ---- CONTEXT VALUE ----
    // Define the value provided by the context
    const value = {
        currency, router, products, loading, error, fetchProducts,
        cartItems, setCartItems, addToCart, updateCartQuantity, getCartCount, getCartAmount,
        user, authLoading, signUp, signIn, signOut,
        changeUserPassword,
        updateUserData,
        addresses, fetchAddresses, addAddress, updateAddress, deleteAddress,
        myOrders, fetchMyOrders,
        myReviews, // Expose user's reviews
        getSafeImageUrl, // Utility function
        wishlist, addToWishlist, removeFromWishlist,
        savedCards, addSavedCard, deleteSavedCard,
        reviewPermissionSetting // ⭐️ Add the review permission setting to the context value
    };

    // Return the provider wrapping the children components
    return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};