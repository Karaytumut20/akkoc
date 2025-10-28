// context/AppContext.jsx

'use client'

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { getSafeImageUrl } from "@/lib/utils";

// Context'i oluştur
export const AppContext = createContext(undefined);

// AppContext'i kullanmak için hook
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppContextProvider');
    }
    return context;
};

// Veritabanındaki yorum izni ayarının anahtarı
const REVIEW_PERMISSION_KEY = 'review_permission';
// Vergi oranını context kapsamında tanımla
const CALIFORNIA_TAX_RATE = 0.0825;
// Context Sağlayıcı Bileşeni
export const AppContextProvider = (props) => {
    // ---- STATE DEĞİŞKENLERİ ----
    const currency = process.env.NEXT_PUBLIC_CURRENCY || "$"; // Para birimi sembolü
    const router = useRouter(); // Next.js router

    // Ürün state'i
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true); // Ürünler için genel yükleme durumu
    const [error, setError] = useState(null); // Ürün getirme için hata durumu

    // Sepet state'i
    const [cartItems, setCartItems] = useState({}); // Sepet öğeleri { productId: { product, quantity } }

    // Kullanıcı kimlik doğrulama state'i
    const [user, setUser] = useState(null); // Mevcut giriş yapmış kullanıcı nesnesi
    const [authLoading, setAuthLoading] = useState(true); // Kimlik doğrulama kontrolleri için yükleme durumu

    // Kullanıcı hesabı ile ilgili state'ler
    const [addresses, setAddresses] = useState([]); // Kullanıcının kayıtlı adresleri
    const [myOrders, setMyOrders] = useState([]); // Kullanıcının geçmiş siparişleri
    const [wishlist, setWishlist] = useState([]); // Kullanıcının istek listesi öğeleri
    const [myReviews, setMyReviews] = useState([]); // Kullanıcının gönderdiği yorumlar
    const [savedCards, setSavedCards] = useState([]); // Kullanıcının kayıtlı ödeme kartları
    const [myReturnRequests, setMyReturnRequests] = useState([]); // Kullanıcının iade talepleri state'i

    // Mağaza ayarları state'i
    const [reviewPermissionSetting, setReviewPermissionSetting] = useState('purchasers_only'); // Varsayılan yorum izni

    // Hareketsizlik zamanlayıcısı state'i
    const inactivityTimer = useRef(null);

    // ---- FONKSİYONLAR ----

    // Belirli bir süre hareketsizlikten sonra çıkış yap
    const signOutAfterInactivity = useCallback(() => {
        toast('Hareketsizlik nedeniyle oturum sona erdi, çıkış yapılıyor.', { icon: '👋' });
        supabase.auth.signOut();
    }, []);

    // Kullanıcı etkinliğinde hareketsizlik zamanlayıcısını sıfırla
    const resetInactivityTimer = useCallback(() => {
        clearTimeout(inactivityTimer.current);
        // Zamanlayıcıyı 10 dakikaya ayarla (10 * 60 * 1000 milisaniye)
        inactivityTimer.current = setTimeout(signOutAfterInactivity, 10 * 60 * 1000);
    }, [signOutAfterInactivity]);

    // Hareketsizlik zamanlayıcısı dinleyicisini yönetmek için effect
    useEffect(() => {
        if (user) {
            const events = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'];
            // Kullanıcı etkinliği için olay dinleyicilerini ekle
            events.forEach(event => window.addEventListener(event, resetInactivityTimer));
            resetInactivityTimer(); // Zamanlayıcıyı başlangıçta başlat

            // Component kaldırıldığında veya kullanıcı değiştiğinde dinleyicileri kaldırmak ve zamanlayıcıyı temizlemek için temizleme fonksiyonu
            return () => {
                events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
                clearTimeout(inactivityTimer.current);
            };
        }
    }, [user, resetInactivityTimer]);

    // Kimlik doğrulama durumu değişikliklerini dinlemek için effect
    useEffect(() => {
        setAuthLoading(true);
        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user;
            setUser(currentUser || null); // Kullanıcı state'ini güncelle
            // Kullanıcı çıkış yaparsa, ilgili verilerini temizle
            if (!currentUser) {
                setCartItems({});
                setAddresses([]);
                setMyOrders([]);
                setWishlist([]);
                setMyReviews([]);
                setSavedCards([]);
                setMyReturnRequests([]); // İade taleplerini de sıfırla
            }
            setAuthLoading(false); // Kimlik doğrulama kontrolü bitti
        });

        // Dinleyiciden aboneliği kaldırmak için temizleme fonksiyonu
        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    // Kullanıcı kayıt fonksiyonu
    const signUp = async (email, password) => {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
            toast.error(error.message);
            return false; // Başarısızlığı belirt
        }
        toast.success('Kayıt başarılı! Lütfen e-postanızı doğrulayın.');
        return true; // Başarıyı belirt
    };

    // Kullanıcı giriş fonksiyonu
    const signIn = async (email, password, source) => {
        const { data: signInData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

        if (authError) {
            toast.error('Geçersiz kullanıcı adı veya şifre.'); // Genel hata mesajı
            return; // Hata durumunda işlemi durdur
        }

        if (signInData.user) {
            toast.success('Giriş başarılı!');
            // Toast mesajının görünmeye başlaması için yönlendirmeyi biraz geciktir
            setTimeout(() => {
                if (source === 'seller') {
                    router.push('/seller/product-list'); // Satıcıyı yönlendir
                } else {
                    router.push('/'); // Normal kullanıcıyı yönlendir
                }
            }, 50);
        }
    };

    // Kullanıcı çıkış fonksiyonu
    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        clearTimeout(inactivityTimer.current); // Hareketsizlik zamanlayıcısını temizle
        router.push('/'); // Anasayfaya yönlendir
        toast.success('Başarıyla çıkış yapıldı.');
    }, [router]); // router bir bağımlılıktır

    // Kullanıcı şifresini değiştirme fonksiyonu
    const changeUserPassword = async (currentPassword, newPassword) => {
        if (!user) {
            toast.error("Bu işlemi yapmak için giriş yapmış olmalısınız.");
            return false;
        }
        const toastId = toast.loading("İşleniyor..."); // Yükleme göstergesi göster
        try {
            // Önce mevcut şifreyi doğrula
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            });
            if (signInError) {
                throw new Error("Mevcut şifre yanlış.");
            }
            // Mevcut şifre doğruysa, yeni şifreyle güncelle
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });
            if (updateError) {
                throw new Error("Şifre güncellenirken hata oluştu: " + updateError.message);
            }
            toast.success("Şifre başarıyla güncellendi!", { id: toastId });
            return true; // Başarıyı belirt
        } catch (error) {
            toast.error(error.message, { id: toastId });
            return false; // Başarısızlığı belirt
        }
    };

    // Kullanıcı meta verilerini (tam ad, telefon gibi) güncelle
    const updateUserData = async (data) => {
        const toastId = toast.loading("Bilgileriniz güncelleniyor...");
        const { error } = await supabase.auth.updateUser({ data });
        if (error) {
            toast.error("Bilgi güncellenirken hata oluştu: " + error.message, { id: toastId });
            return false;
        }
        toast.success("Bilgiler başarıyla güncellendi!", { id: toastId });
        return true;
    };

    // Tüm ürünleri getir
    const fetchProducts = async () => {
        setLoading(true); setError(null);
        // Ürünleri seç ve ilişki üzerinden kategori adını dahil et
        const { data, error: fetchError } = await supabase.from('products').select('*, categories(name)');
        if (fetchError) {
            setError(fetchError.message); setProducts([]);
        } else {
            // image_urls'in her zaman bir dizi olmasını sağla
            const formattedProducts = (data || []).map(p => ({
                ...p,
                image_urls: Array.isArray(p.image_urls) ? p.image_urls : [],
            }));
            setProducts(formattedProducts);
        }
        setLoading(false);
    };

    // Kullanıcının kayıtlı adreslerini getir
    const fetchAddresses = async (userId) => {
        if (!userId) return; // Kullanıcı ID'si yoksa getirme
        const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }); // En yeniler önce
        if (!error) setAddresses(data || []);
         // Gerekirse hatayı işle: else console.error("Adresler getirilirken hata:", error);
    };

    // Kullanıcının siparişlerini, öğeleri ve ürün detaylarıyla birlikte getir
    const fetchMyOrders = async (userId) => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('orders')
            .select(`*, order_items(*, products(*, categories(name)))`) // Derinlemesine getirme
            .eq('user_id', userId)
            .order('created_at', { ascending: false }); // En yeniler önce
        if (!error) setMyOrders(data || []);
         // Gerekirse hatayı işle: else console.error("Siparişler getirilirken hata:", error);
    };

    // Kullanıcının istek listesini ürün detaylarıyla birlikte getir
    const fetchWishlist = async (userId) => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('wishlist')
            .select('*, product:products(*)') // İlişkili ürün detaylarını getir
            .eq('user_id', userId);
        if (!error) setWishlist(data || []);
         // Gerekirse hatayı işle: else console.error("İstek listesi getirilirken hata:", error);
    };

    // Kullanıcının yorumlarını ürün detaylarıyla birlikte getir
    const fetchMyReviews = async (userId) => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('reviews')
            .select(`*, products (id, name, image_urls)`) // İlişkili ürün detaylarını getir
            .eq('user_id', userId)
            .order('created_at', { ascending: false }); // En yeniler önce
        if (!error) setMyReviews(data || []);
         // Gerekirse hatayı işle: else console.error("Yorumlar getirilirken hata:", error);
    };

    // Kullanıcının kayıtlı ödeme kartlarını getir
    const fetchSavedCards = async (userId) => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('saved_cards')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }); // En yeniler önce
        if (!error) setSavedCards(data || []);
        // Gerekirse hatayı işle: else console.error("Kayıtlı kartlar getirilirken hata:", error);
    };

    // Yeni bir kayıtlı kart ekle (şu anda yer tutucu token mantığı kullanıyor)
    const addSavedCard = async (cardData) => {
        if (!user) return toast.error("Kart eklemek için giriş yapmalısınız.");

        // Tokenizasyon için yer tutucu mantık - gerçek Stripe/ödeme sağlayıcı entegrasyonu ile değiştirin
        const fakeToken = `tok_${Math.random().toString(36).substr(2, 14)}`;
        const last4 = cardData.cardNumber.slice(-4);
        const cardBrand = "visa"; // Gerçekte burada temel marka tespiti gerekli

        const { error } = await supabase.from('saved_cards').insert({
            user_id: user.id,
            card_brand: cardBrand,
            last4: last4,
            exp_month: parseInt(cardData.expMonth),
            exp_year: parseInt(cardData.expYear),
            payment_provider_token: fakeToken, // Yer tutucu token'ı sakla
        });

        if (error) {
            toast.error("Kart eklenirken hata oluştu: " + error.message);
            return false;
        } else {
            toast.success("Kart başarıyla eklendi!");
            fetchSavedCards(user.id); // Kayıtlı kart listesini yenile
            return true;
        }
    };

    // Kayıtlı bir kartı sil
    const deleteSavedCard = async (cardId) => {
        if (!user) return toast.error("Bu işlem için giriş yapmalısınız.");

        const { error } = await supabase.from('saved_cards').delete().eq('id', cardId);

        if (error) {
            toast.error("Kart silinirken hata oluştu: " + error.message);
        } else {
            toast.success("Kart başarıyla silindi.");
            // Daha iyi UX için yerel state'i hemen güncelle
            setSavedCards(prev => prev.filter(card => card.id !== cardId));
        }
    };

    // İstek listesine ürün ekle
    const addToWishlist = async (productId) => {
        if (!user) return toast.error("İstek listenize öğe eklemek için lütfen giriş yapın.");
        // Wishlist tablosuna ekle
        const { error } = await supabase.from('wishlist').insert({ user_id: user.id, product_id: productId });
        if (error) {
            // Olası çift kayıt hatasını işle (kod 23505)
            if (error.code === '23505') {
                 toast.error("Bu öğe zaten istek listenizde.");
            } else {
                 toast.error("İstek listesine eklenirken hata oluştu: " + error.message);
            }
        } else {
            toast.success("Öğe istek listesine eklendi!");
            fetchWishlist(user.id); // İstek listesini yenile
        }
    };

    // İstek listesinden ürün kaldır
    const removeFromWishlist = async (productId) => {
        if (!user) return; // Buton sadece giriş yapmış kullanıcılara gösteriliyorsa bu olmamalı
        // Kullanıcı ve ürün ID'sine göre wishlist tablosundan sil
        const { error } = await supabase.from('wishlist').delete().match({ user_id: user.id, product_id: productId });
        if (error) {
            toast.error("İstek listesinden kaldırılırken hata oluştu.");
        } else {
            toast.success("Öğe istek listesinden kaldırıldı!");
            fetchWishlist(user.id); // İstek listesini yenile
        }
    };

    // Yeni adres ekle
    const addAddress = async (addressData) => {
        if (!user) return toast.error("Adres eklemek için giriş yapmalısınız.");
        const toastId = toast.loading("Adres ekleniyor...");
        try {
            // Kullanıcıya bağlı yeni adresi ekle
            const { error } = await supabase.from('addresses').insert({ ...addressData, user_id: user.id });
            if (error) throw error;
            await fetchAddresses(user.id); // Adres listesini yenile
            toast.success("Adres başarıyla eklendi!", { id: toastId });
            return true;
        } catch (error) {
            toast.error("Adres eklenirken hata oluştu: " + error.message, { id: toastId });
            return false;
        }
    };

    // Mevcut bir adresi güncelle
    const updateAddress = async (addressId, addressData) => {
        if (!user) return toast.error("Adresi güncellemek için giriş yapmalısınız.");
        const toastId = toast.loading("Adres güncelleniyor...");
        try {
            // Doğrudan güncellenmemesi gereken alanları hariç tut
            const { id, user_id, created_at, ...updateData } = addressData;
            const { error } = await supabase.from('addresses').update(updateData).eq('id', addressId);
            if (error) throw error;
            await fetchAddresses(user.id); // Adres listesini yenile
            toast.success("Adres başarıyla güncellendi!", { id: toastId });
            return true;
        } catch (error) {
            toast.error("Adres güncellenirken hata oluştu: " + error.message, { id: toastId });
            return false;
        }
    };

    // Adresi sil
    const deleteAddress = async (addressId) => {
        if (!user) return toast.error("Adresi silmek için giriş yapmalısınız.");
        const toastId = toast.loading("Adres siliniyor...");
        try {
            const { error } = await supabase.from('addresses').delete().eq('id', addressId);
            if (error) throw error;
            // Anında UI geri bildirimi için yerel state'i güncelle
            setAddresses(prev => prev.filter(addr => addr.id !== addressId));
            toast.success("Adres başarıyla silindi!", { id: toastId });
        } catch (error) {
            toast.error("Adres silinirken hata oluştu: " + error.message, { id: toastId });
        }
    };

    // İlk yüklemede localStorage'dan sepet öğelerini yüklemek için effect
    useEffect(() => {
        try {
             const storedCart = localStorage.getItem("cartItems");
             if (storedCart) {
                setCartItems(JSON.parse(storedCart));
             }
        } catch (e) {
             console.error("localStorage'dan sepet yüklenemedi:", e);
             // İsteğe bağlı olarak bozuk veriyi temizle: localStorage.removeItem("cartItems");
        }
    }, []); // Boş bağımlılık dizisi, sadece ilk yüklemede çalıştır anlamına gelir

    // cartItems state'i her değiştiğinde localStorage'a kaydetmek için effect
    useEffect(() => {
        try {
            if (Object.keys(cartItems).length > 0) {
                localStorage.setItem("cartItems", JSON.stringify(cartItems));
            } else {
                // Sepet boşsa, öğeyi localStorage'dan kaldır
                localStorage.removeItem("cartItems");
            }
        } catch(e) {
            console.error("localStorage'a sepet kaydedilemedi:", e);
        }
    }, [cartItems]); // cartItems değiştiğinde çalıştır

    // Sepete ürün ekle (miktar ve stok kontrolünü yapar)
    const addToCart = (product, quantity = 1, priceOverride = null) => {
        // Varsa priceOverride'ı kullan (toplu fiyatlandırma için), yoksa ürünün standart fiyatını kullan
        const priceToAdd = priceOverride !== null ? priceOverride : product.price;
        // Eklenecek miktarı belirle (toplu eklemeler için 1'den fazla olabilir)
        const effectiveQuantity = quantity;

        // Bu ürünün sepetteki mevcut miktarını al
        const currentItem = cartItems[product.id];
        const currentQuantityInCart = currentItem ? currentItem.quantity : 0;

        // İstenen miktarın eklenmesinin mevcut stoğu aşıp aşmadığını kontrol et
        if (product.stock < currentQuantityInCart + effectiveQuantity) {
            toast.error(`Üzgünüz, sadece ${product.stock} adet mevcut. Sepetinizde zaten ${currentQuantityInCart} adet var.`);
            return; // Yeterli stok yoksa fonksiyonu durdur
        }

        // cartItems state'ini güncelle
        setCartItems(prev => {
            const existingItem = prev[product.id];
            // Bu ürün için yeni toplam miktarı hesapla
            const newQuantity = (existingItem ? existingItem.quantity : 0) + effectiveQuantity;

            // Güncellenmiş sepet state'ini döndür
            return {
                ...prev, // Mevcut öğeleri koru
                [product.id]: { // Öğeyi ekle veya güncelle
                    // Ürün detaylarını, yeni miktarı ve bu ekleme için kullanılan *birim başına* fiyatı sakla
                    product: { ...product, price: priceToAdd / effectiveQuantity }, // Birim başına fiyatı sakla
                    quantity: newQuantity,
                }
            };
        });

        // Başarı mesajı göster
        toast.success(`${effectiveQuantity} x ${product.name} sepete eklendi!`);
    };

    // Sepetteki bir öğenin miktarını güncelle
    const updateCartQuantity = (productId, quantity) => {
        setCartItems(prev => {
            const newItems = { ...prev }; // Sepetin bir kopyasını oluştur
            const item = newItems[productId]; // Belirli öğeyi al

            // Öğe sepette yoksa (normalde olmamalı), hiçbir şey yapma
            if (!item || !item.product) return newItems;

            const product = item.product; // Öğeden ürün detaylarını al

            // Miktarı artırırken stok sınırını kontrol et
            if (quantity > product.stock) {
                toast.error(`Maksimum ${product.stock} adet izin verilir.`);
                newItems[productId].quantity = product.stock; // Miktarı maksimum stoğa ayarla
                return newItems; // Güncellenmiş state'i döndür
            }

            // Miktar 0 veya daha az ise, öğeyi sepetten kaldır
            if (quantity <= 0) {
                delete newItems[productId];
                 toast.success(`${product.name} sepetten kaldırıldı.`); // İsteğe bağlı onay
            }
            // Aksi takdirde, mevcut öğenin miktarını güncelle
            else {
                 newItems[productId].quantity = quantity;
            }
            return newItems; // Değiştirilmiş sepet state'ini döndür
        });
    };

    // Sepetteki toplam öğe sayısını hesapla
    const getCartCount = () => Object.values(cartItems).reduce((sum, item) => sum + (item.quantity || 0), 0); // Miktarları güvenli bir şekilde topla

    // Sepet için ara toplam, vergi ve toplam tutarı hesapla
    const getCartAmount = (taxRate = CALIFORNIA_TAX_RATE) => { // Vergi oranı geçersiz kılmayı kabul et, varsayılan olarak sabiti kullan
        // Ara toplamı güvenli bir şekilde hesapla, fiyat ve miktarın sayı olduğundan emin ol
        const subtotal = Object.values(cartItems).reduce((sum, item) => {
            const price = item?.product?.price ?? 0; // Fiyat eksikse varsayılan olarak 0 kullan
            const quantity = item?.quantity ?? 0;   // Miktar eksikse varsayılan olarak 0 kullan
            return sum + (price * quantity);
        }, 0); // Toplamı 0'dan başlat

        // Vergi tutarını hesapla
        const taxAmount = subtotal * taxRate;
        // Toplam tutarı hesapla
        const totalAmount = subtotal + taxAmount;

        // Her zaman sayı değerleri olan bir nesne döndür, varsayılan olarak 0
        return {
            subtotal: subtotal || 0,
            taxAmount: taxAmount || 0,
            totalAmount: totalAmount || 0,
        };
    };

    // İade talebini veritabanına gönderen fonksiyon
    const submitReturnRequest = async (orderId, reasons) => {
        if (!user) {
            toast.error("İade talebi oluşturmak için giriş yapmalısınız.");
            return false; // Başarısız
        }
        if (!orderId || !reasons || reasons.length === 0) {
            toast.error("Geçersiz talep bilgileri.");
            return false; // Başarısız
        }

        const toastId = toast.loading("İade talebiniz gönderiliyor...");

        try {
            const { error } = await supabase
                .from('return_requests')
                .insert({
                    order_id: orderId,
                    user_id: user.id,
                    reasons: reasons, // Nedenleri dizi olarak gönder
                    status: 'pending' // Başlangıç durumu
                });

            if (error) {
                if (error.code === '23505') { // PostgreSQL unique violation
                     toast.error('Bu sipariş için zaten bir iade talebiniz mevcut.', { id: toastId });
                } else {
                     throw error; // Diğer hataları fırlat
                }
                return false; // Başarısız
            }

            toast.success("İade talebiniz başarıyla gönderildi!", { id: toastId });
            // İsteğe bağlı: Kullanıcının iade talepleri listesini yeniden çekebilirsiniz.
            fetchMyReturnRequests(user.id);
            return true; // Başarılı

        } catch (error) {
            console.error("İade talebi gönderme hatası:", error);
            toast.error(`Bir hata oluştu: ${error.message}`, { id: toastId });
            return false; // Başarısız
        }
    };

    // ✨ YENİ: Kullanıcının iade taleplerini getir
    const fetchMyReturnRequests = async (userId) => {
        if (!userId) return; // Kullanıcı ID'si yoksa getirme
        // Sipariş ID'si ile birlikte talepleri getir
        const { data, error: returnError } = await supabase
            .from('return_requests')
            .select(`
                *,
                order:orders ( id )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false }); // En yeniler önce

        if (!returnError) {
            setMyReturnRequests(data || []);
        } else {
            console.error("İade talepleri getirilirken hata:", returnError);
            setMyReturnRequests([]); // Hata durumunda boş dizi ata
        }
    };


    // Kullanıcı nesnesi değiştiğinde kullanıcıya özel verileri getirmek için effect
    useEffect(() => {
        if (user) {
            fetchAddresses(user.id);
            fetchMyOrders(user.id);
            fetchWishlist(user.id);
            fetchMyReviews(user.id);
            fetchSavedCards(user.id);
            fetchMyReturnRequests(user.id); // İade taleplerini de getir
        } else {
            // Kullanıcı çıkış yaptığında state'leri sıfırla
            setAddresses([]);
            setMyOrders([]);
            setWishlist([]);
            setMyReviews([]);
            setSavedCards([]);
            setMyReturnRequests([]); // İade taleplerini de sıfırla
            setCartItems({}); // Sepeti de sıfırlayalım
        }
    }, [user]); // Kullanıcı nesnesi değiştiğinde çalıştır


    // İlk yüklemede ürünleri getirmek için effect
    useEffect(() => { fetchProducts(); }, []); // Boş dizi, bir kez çalıştır anlamına gelir

    // ⭐️ İlk yüklemede yorum izni ayarını getirmek için effect
    const fetchReviewPermissionSetting = useCallback(async () => {
        const { data, error } = await supabase
            .from('store_settings')
            .select('setting_value')
            .eq('setting_key', REVIEW_PERMISSION_KEY)
            .single();

        if (!error && data) {
            setReviewPermissionSetting(data.setting_value); // Getirilen değerle state'i güncelle
        } else if (error && error.code !== 'PGRST116') { // 'Not Found' hatasını yoksay
             console.error("Yorum ayarı getirilemedi:", error.message);
        }
        // Hata veya ayar bulunamazsa, varsayılan 'purchasers_only' kalır
    }, []); // Bu fonksiyonun kendisi için bağımlılık gerekmez

    useEffect(() => {
        fetchReviewPermissionSetting(); // Getirme fonksiyonunu çağır
    }, [fetchReviewPermissionSetting]); // Getirme fonksiyon tanımı mevcut olduğunda çalıştır

    // ---- CONTEXT DEĞERİ ----
    // Context tarafından sağlanan değeri tanımla
    const value = {
        currency, router, products, loading, error, fetchProducts,
        cartItems, setCartItems, addToCart, updateCartQuantity, getCartCount, getCartAmount,
        user, authLoading, signUp, signIn, signOut,
        changeUserPassword,
        updateUserData,
        addresses, fetchAddresses, addAddress, updateAddress, deleteAddress,
        myOrders, fetchMyOrders,
        myReviews, // Kullanıcının yorumlarını dışa aktar
        getSafeImageUrl, // Yardımcı fonksiyon
        wishlist, addToWishlist, removeFromWishlist,
        savedCards, addSavedCard, deleteSavedCard,
        reviewPermissionSetting, // Yorum izni ayarını context değerine ekle
        submitReturnRequest, // İade talebi fonksiyonunu context değerine ekle
        myReturnRequests, // İade talepleri state'ini context'e ekle
        fetchMyReturnRequests, // İade taleplerini getirme fonksiyonunu context'e ekle
    };

    // Sağlayıcıyı, alt bileşenleri sararak döndür
    return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};