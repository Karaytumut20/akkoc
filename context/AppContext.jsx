// context/AppContext.jsx
'use client';

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient"; // Supabase istemcisini içe aktar
import toast from "react-hot-toast"; // Bildirimler için
import { getSafeImageUrl } from "@/lib/utils"; // Güvenli resim URL'si almak için yardımcı fonksiyon

// Context'i oluştur
export const AppContext = createContext(undefined);

// AppContext'i kullanmak için hook
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppContextProvider'); // Hata mesajı: AppContextProvider içinde kullanılmalı
    }
    return context;
};

// Veritabanındaki yorum izni ayarının anahtarı
const REVIEW_PERMISSION_KEY = 'review_permission';
// Vergi oranını context kapsamında tanımla
const CALIFORNIA_TAX_RATE = 0.0825; // California vergi oranı (örnek)

// Context Provider Bileşeni
export const AppContextProvider = (props) => {
    // ---- STATE DEĞİŞKENLERİ ----
    const currency = process.env.NEXT_PUBLIC_CURRENCY || "$"; // Para birimi sembolü
    const router = useRouter(); // Next.js router

    // Ürün state'i
    const [products, setProducts] = useState([]); // Tüm ürünler
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
    const [wishlist, setWishlist] = useState([]); // Kullanıcının favori listesi öğeleri
    const [myReviews, setMyReviews] = useState([]); // Kullanıcının gönderdiği yorumlar
    const [savedCards, setSavedCards] = useState([]); // Kullanıcının kayıtlı ödeme kartları
    const [myReturnRequests, setMyReturnRequests] = useState([]); // Kullanıcının iade talepleri (YENİ EKLENDİ)

    // Mağaza ayarları state'i
    const [reviewPermissionSetting, setReviewPermissionSetting] = useState('purchasers_only'); // Varsayılan yorum izni

    // Hareketsizlik zamanlayıcısı state'i
    const inactivityTimer = useRef(null); // Hareketsizlik zamanlayıcısı referansı

    // ---- FONKSİYONLAR ----

    // Belirli bir süre hareketsizlikten sonra oturumu kapat
    const signOutAfterInactivity = useCallback(() => {
        toast('Hareketsizlik nedeniyle oturum sona erdi, çıkış yapılıyor.', { icon: '👋' }); // Türkçe bildirim
        supabase.auth.signOut(); // Oturumu kapat
    }, []);

    // Kullanıcı etkinliğinde hareketsizlik zamanlayıcısını sıfırla
    const resetInactivityTimer = useCallback(() => {
        clearTimeout(inactivityTimer.current); // Mevcut zamanlayıcıyı temizle
        // Zamanlayıcıyı 10 dakikaya ayarla (10 * 60 * 1000 milisaniye)
        inactivityTimer.current = setTimeout(signOutAfterInactivity, 10 * 60 * 1000);
    }, [signOutAfterInactivity]);

    // Hareketsizlik zamanlayıcısı dinleyicisini yönetmek için Effect
    useEffect(() => {
        if (user) { // Sadece kullanıcı giriş yapmışsa
            const events = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll']; // Takip edilecek olaylar
            // Kullanıcı etkinliği için olay dinleyicilerini ekle
            events.forEach(event => window.addEventListener(event, resetInactivityTimer));
            resetInactivityTimer(); // Zamanlayıcıyı başlangıçta başlat

            // Component kaldırıldığında veya kullanıcı değiştiğinde dinleyicileri kaldır ve zamanlayıcıyı temizle
            return () => {
                events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
                clearTimeout(inactivityTimer.current);
            };
        }
    }, [user, resetInactivityTimer]);

    // Kimlik doğrulama durumu değişikliklerini dinlemek için Effect
    useEffect(() => {
        setAuthLoading(true); // Kimlik doğrulama kontrolü yükleniyor
        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user; // Mevcut oturumun kullanıcısı
            setUser(currentUser || null); // Kullanıcı state'ini güncelle
            // Kullanıcı çıkış yaparsa ilgili verilerini temizle
            if (!currentUser) {
                setCartItems({});
                setAddresses([]);
                setMyOrders([]);
                setWishlist([]);
                setMyReviews([]);
                setSavedCards([]);
                setMyReturnRequests([]); // İade taleplerini de temizle (YENİ EKLENDİ)
            }
            setAuthLoading(false); // Kimlik doğrulama kontrolü tamamlandı
        });

        // Dinleyiciden aboneliği kaldırmak için temizleme fonksiyonu
        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    // Kullanıcı kayıt fonksiyonu
    const signUp = async (email, password, fullName, phone) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { // Meta verileri ekle
                    full_name: fullName,
                    phone: phone || null
                }
            }
        });
        if (error) {
            toast.error(error.message); // Hata mesajını göster
            return false; // Başarısızlığı belirt
        }
        toast.success('Kayıt başarılı! Lütfen e-postanızı doğrulayın.'); // Türkçe başarı mesajı
        return true; // Başarıyı belirt
    };

    // Kullanıcı giriş fonksiyonu
    const signIn = async (email, password, source) => {
        const { data: signInData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

        if (authError) {
            toast.error('Geçersiz kullanıcı adı veya şifre.'); // Türkçe genel hata mesajı
            return; // Hata durumunda işlemi durdur
        }

        if (signInData.user) {
            toast.success('Giriş başarılı!'); // Türkçe başarı mesajı
            // Bildirim mesajının görünmesi için yönlendirmeyi biraz geciktir
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
        await supabase.auth.signOut(); // Supabase oturumunu kapat
        clearTimeout(inactivityTimer.current); // Hareketsizlik zamanlayıcısını temizle
        router.push('/'); // Anasayfaya yönlendir
        toast.success('Başarıyla çıkış yapıldı.'); // Türkçe başarı mesajı
    }, [router]); // router bir bağımlılık

    // Kullanıcı şifresini değiştirme fonksiyonu
    const changeUserPassword = async (currentPassword, newPassword) => {
        if (!user) { // Kullanıcı kontrolü
            toast.error("Bu işlemi yapmak için giriş yapmalısınız."); // Türkçe hata mesajı
            return false;
        }
        const toastId = toast.loading("İşleniyor..."); // Yükleme göstergesi
        try {
            // Önce mevcut şifreyi doğrula
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            });
            if (signInError) { // Mevcut şifre yanlışsa
                throw new Error("Mevcut şifre yanlış."); // Türkçe hata
            }
            // Mevcut şifre doğruysa, yeni şifreyle güncelle
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });
            if (updateError) { // Güncelleme hatası olursa
                throw new Error("Şifre güncellenirken hata: " + updateError.message); // Türkçe hata
            }
            toast.success("Şifre başarıyla güncellendi!", { id: toastId }); // Türkçe başarı mesajı
            return true; // Başarıyı belirt
        } catch (error) {
            toast.error(error.message, { id: toastId }); // Hata mesajını göster
            return false; // Başarısızlığı belirt
        }
    };

    // Kullanıcı meta verilerini (örn: tam ad, telefon) güncelle
    const updateUserData = async (data) => {
        const toastId = toast.loading("Bilgileriniz güncelleniyor..."); // Türkçe yükleme mesajı
        const { error } = await supabase.auth.updateUser({ data }); // Meta verileri güncelle
        if (error) {
            toast.error("Bilgi güncellenirken hata: " + error.message, { id: toastId }); // Türkçe hata
            return false; // Başarısızlığı belirt
        }
        toast.success("Bilgiler başarıyla güncellendi!", { id: toastId }); // Türkçe başarı mesajı
        return true; // Başarıyı belirt
    };

    // Tüm ürünleri getiren fonksiyon
    const fetchProducts = useCallback(async () => {
        setLoading(true); setError(null); // Yükleme ve hata durumunu sıfırla
        // Ürünleri ve ilişkili kategori adını seç
        const { data, error: fetchError } = await supabase.from('products').select('*, categories(name)');
        if (fetchError) {
            setError(fetchError.message); setProducts([]); // Hata varsa state'i ayarla
        } else {
            // image_urls'ün her zaman bir dizi olmasını sağla
            const formattedProducts = (data || []).map(p => ({
                ...p,
                image_urls: Array.isArray(p.image_urls) ? p.image_urls : [],
            }));
            setProducts(formattedProducts); // Ürün state'ini güncelle
        }
        setLoading(false); // Yüklemeyi bitir
    }, []); // Bağımlılık yok, sadece ilk renderda çalışır

    // Kullanıcının kayıtlı adreslerini getiren fonksiyon
    const fetchAddresses = useCallback(async (userId) => {
        if (!userId) return; // Kullanıcı ID'si yoksa getirme
        const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', userId) // Kullanıcı ID'sine göre filtrele
            .order('created_at', { ascending: false }); // En yeniden eskiye sırala
        if (!error) setAddresses(data || []); // Adres state'ini güncelle
        // Hata yönetimi (isteğe bağlı): else console.error("Adresleri getirirken hata:", error);
    }, []);

    // Kullanıcının siparişlerini (ürün detayları ile birlikte) getiren fonksiyon
    const fetchMyOrders = useCallback(async (userId) => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('orders')
            .select(`*, order_items(*, products(*, categories(name)))`) // Derinlemesine getirme
            .eq('user_id', userId) // Kullanıcı ID'sine göre filtrele
            .order('created_at', { ascending: false }); // En yeniden eskiye sırala
        if (!error) setMyOrders(data || []); // Sipariş state'ini güncelle
        // Hata yönetimi (isteğe bağlı): else console.error("Siparişleri getirirken hata:", error);
    }, []);

    // Kullanıcının favori listesini (ürün detayları ile birlikte) getiren fonksiyon
    const fetchWishlist = useCallback(async (userId) => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('wishlist')
            .select('*, product:products(*)') // İlişkili ürün detaylarını getir
            .eq('user_id', userId); // Kullanıcı ID'sine göre filtrele
        if (!error) setWishlist(data || []); // Favori listesi state'ini güncelle
        // Hata yönetimi (isteğe bağlı): else console.error("Favori listesini getirirken hata:", error);
    }, []);

    // Kullanıcının yorumlarını (ürün detayları ile birlikte) getiren fonksiyon
    const fetchMyReviews = useCallback(async (userId) => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('reviews')
            .select(`*, products (id, name, image_urls)`) // İlişkili ürün detaylarını getir
            .eq('user_id', userId) // Kullanıcı ID'sine göre filtrele
            .order('created_at', { ascending: false }); // En yeniden eskiye sırala
        if (!error) setMyReviews(data || []); // Yorum state'ini güncelle
        // Hata yönetimi (isteğe bağlı): else console.error("Yorumları getirirken hata:", error);
    }, []);

    // Kullanıcının kayıtlı ödeme kartlarını getiren fonksiyon
    const fetchSavedCards = useCallback(async (userId) => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('saved_cards')
            .select('*')
            .eq('user_id', userId) // Kullanıcı ID'sine göre filtrele
            .order('created_at', { ascending: false }); // En yeniden eskiye sırala
        if (!error) setSavedCards(data || []); // Kayıtlı kartlar state'ini güncelle
        // Hata yönetimi (isteğe bağlı): else console.error("Kayıtlı kartları getirirken hata:", error);
    }, []);

    // Kullanıcının iade taleplerini getiren fonksiyon (YENİ EKLENDİ)
    const fetchMyReturnRequests = useCallback(async (userId) => {
        if (!userId) return; // Kullanıcı ID'si yoksa getirme
        const { data, error } = await supabase
            .from('return_requests') // İade talepleri tablosu
            .select(`
                *,
                order_item:order_items(
                    id, quantity, price,
                    product:products(id, name, image_urls)
                )
            `) // İlişkili sipariş öğesi ve ürün detaylarını getir
            .eq('user_id', userId) // Kullanıcı ID'sine göre filtrele
            .order('created_at', { ascending: false }); // En yeniden eskiye sırala

        if (!error) {
            setMyReturnRequests(data || []); // İade talepleri state'ini güncelle
        } else {
            console.error("İade taleplerini getirirken hata:", error);
            // toast.error('İade talepleri alınamadı.'); // İsteğe bağlı bildirim
        }
    }, []); // Bağımlılık yok

    // Yeni bir kayıtlı kart ekle (şu anki haliyle yer tutucu token mantığı kullanır)
    const addSavedCard = async (cardData) => {
        if (!user) return toast.error("Kart eklemek için giriş yapmalısınız."); // Türkçe hata

        // Yer tutucu token mantığı - Gerçek Stripe/ödeme sağlayıcı entegrasyonu ile değiştirilmelidir
        const fakeToken = `tok_${Math.random().toString(36).substr(2, 14)}`;
        const last4 = cardData.cardNumber.slice(-4);
        const cardBrand = "visa"; // Gerçekte temel marka tespiti gerekir

        const { error } = await supabase.from('saved_cards').insert({
            user_id: user.id,
            card_brand: cardBrand,
            last4: last4,
            exp_month: parseInt(cardData.expMonth),
            exp_year: parseInt(cardData.expYear),
            payment_provider_token: fakeToken, // Yer tutucu token'ı sakla
        });

        if (error) {
            toast.error("Kart eklenirken hata: " + error.message); // Türkçe hata
            return false; // Başarısızlığı belirt
        } else {
            toast.success("Kart başarıyla eklendi!"); // Türkçe başarı mesajı
            fetchSavedCards(user.id); // Kayıtlı kart listesini yenile
            return true; // Başarıyı belirt
        }
    };

    // Kayıtlı bir kartı sil
    const deleteSavedCard = async (cardId) => {
        if (!user) return toast.error("Bu işlem için giriş yapmalısınız."); // Türkçe hata

        const { error } = await supabase.from('saved_cards').delete().eq('id', cardId);

        if (error) {
            toast.error("Kart silinirken hata: " + error.message); // Türkçe hata
        } else {
            toast.success("Kart başarıyla silindi."); // Türkçe başarı mesajı
            // Daha iyi kullanıcı deneyimi için yerel state'i hemen güncelle
            setSavedCards(prev => prev.filter(card => card.id !== cardId));
        }
    };

    // Bir ürünü favori listesine ekle
    const addToWishlist = async (productId) => {
        if (!user) return toast.error("Favorilere eklemek için lütfen giriş yapın."); // Türkçe hata
        // Favori listesi tablosuna ekle
        const { error } = await supabase.from('wishlist').insert({ user_id: user.id, product_id: productId });
        if (error) {
            // Potansiyel çift kayıt hatasını ele al (kod 23505)
            if (error.code === '23505') {
                 toast.error("Bu ürün zaten favorilerinizde."); // Türkçe hata
            } else {
                 toast.error("Favorilere eklenirken hata: " + error.message); // Türkçe hata
            }
        } else {
            toast.success("Ürün favorilere eklendi!"); // Türkçe başarı mesajı
            fetchWishlist(user.id); // Favori listesini yenile
        }
    };

    // Bir ürünü favori listesinden çıkar
    const removeFromWishlist = async (productId) => {
        if (!user) return; // Giriş yapmış kullanıcılar için gösterilen butonda olmamalı
        // Kullanıcı ve ürün ID'sine göre favori listesi tablosundan sil
        const { error } = await supabase.from('wishlist').delete().match({ user_id: user.id, product_id: productId });
        if (error) {
            toast.error("Favorilerden çıkarılırken hata oluştu."); // Türkçe hata
        } else {
            toast.success("Ürün favorilerden çıkarıldı!"); // Türkçe başarı mesajı
            fetchWishlist(user.id); // Favori listesini yenile
        }
    };

    // Kullanıcı nesnesi değiştiğinde kullanıcıya özel verileri getirmek için Effect
    useEffect(() => {
        if (user) {
            fetchAddresses(user.id);
            fetchMyOrders(user.id);
            fetchWishlist(user.id);
            fetchMyReviews(user.id);
            fetchSavedCards(user.id);
            fetchMyReturnRequests(user.id); // Kullanıcının iade taleplerini getir (YENİ EKLENDİ)
        } else {
            // Kullanıcı çıkış yapınca state'leri temizle
            setAddresses([]);
            setMyOrders([]);
            setWishlist([]);
            setMyReviews([]);
            setSavedCards([]);
            setMyReturnRequests([]); // (YENİ EKLENDİ)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]); // Kullanıcı nesnesi değiştiğinde çalıştır (fetch fonksiyonlarını bağımlılıklara eklemek sonsuz döngüye neden olabilir, bu yüzden eslint-disable kullanıldı)


    // Yeni bir adres ekle
    const addAddress = async (addressData) => {
        if (!user) return toast.error("Adres eklemek için giriş yapmalısınız."); // Türkçe hata
        const toastId = toast.loading("Adres ekleniyor..."); // Türkçe yükleme mesajı
        try {
            // Kullanıcıya bağlı yeni adresi ekle
            const { error } = await supabase.from('addresses').insert({ ...addressData, user_id: user.id });
            if (error) throw error; // Hata varsa fırlat
            await fetchAddresses(user.id); // Adres listesini yenile
            toast.success("Adres başarıyla eklendi!", { id: toastId }); // Türkçe başarı mesajı
            return true; // Başarıyı belirt
        } catch (error) {
            toast.error("Adres eklenirken hata: " + error.message, { id: toastId }); // Türkçe hata
            return false; // Başarısızlığı belirt
        }
    };

    // Mevcut bir adresi güncelle
    const updateAddress = async (addressId, addressData) => {
        if (!user) return toast.error("Adres güncellemek için giriş yapmalısınız."); // Türkçe hata
        const toastId = toast.loading("Adres güncelleniyor..."); // Türkçe yükleme mesajı
        try {
            // Doğrudan güncellenmemesi gereken alanları çıkar
            const { id, user_id, created_at, ...updateData } = addressData;
            const { error } = await supabase.from('addresses').update(updateData).eq('id', addressId);
            if (error) throw error; // Hata varsa fırlat
            await fetchAddresses(user.id); // Adres listesini yenile
            toast.success("Adres başarıyla güncellendi!", { id: toastId }); // Türkçe başarı mesajı
            return true; // Başarıyı belirt
        } catch (error) {
            toast.error("Adres güncellenirken hata: " + error.message, { id: toastId }); // Türkçe hata
            return false; // Başarısızlığı belirt
        }
    };

    // Bir adresi sil
    const deleteAddress = async (addressId) => {
        if (!user) return toast.error("Adres silmek için giriş yapmalısınız."); // Türkçe hata
        const toastId = toast.loading("Adres siliniyor..."); // Türkçe yükleme mesajı
        try {
            const { error } = await supabase.from('addresses').delete().eq('id', addressId);
            if (error) throw error; // Hata varsa fırlat
            // Anında UI geri bildirimi için yerel state'i güncelle
            setAddresses(prev => prev.filter(addr => addr.id !== addressId));
            toast.success("Adres başarıyla silindi!", { id: toastId }); // Türkçe başarı mesajı
        } catch (error) {
            toast.error("Adres silinirken hata: " + error.message, { id: toastId }); // Türkçe hata
        }
    };

    // İlk mount işleminde localStorage'dan sepet öğelerini yüklemek için Effect
    useEffect(() => {
        try {
             const storedCart = localStorage.getItem("cartItems"); // localStorage'dan al
             if (storedCart) { // Eğer veri varsa
                setCartItems(JSON.parse(storedCart)); // State'i güncelle
             }
        } catch (e) {
             console.error("localStorage'dan sepet yüklenemedi:", e); // Türkçe hata logu
             // İsteğe bağlı olarak bozuk veriyi temizle: localStorage.removeItem("cartItems");
        }
    }, []); // Boş bağımlılık dizisi sadece ilk mount'ta çalıştırır

    // cartItems state'i her değiştiğinde localStorage'a kaydetmek için Effect
    useEffect(() => {
        try {
            if (Object.keys(cartItems).length > 0) { // Sepet boş değilse
                localStorage.setItem("cartItems", JSON.stringify(cartItems)); // localStorage'a kaydet
            } else { // Sepet boşsa
                localStorage.removeItem("cartItems"); // localStorage'dan kaldır
            }
        } catch(e) {
            console.error("Sepet localStorage'a kaydedilemedi:", e); // Türkçe hata logu
        }
    }, [cartItems]); // cartItems değiştiğinde çalıştır

    // Bir ürünü sepete ekle (miktar ve stok kontrolü yapar)
    const addToCart = (product, quantity = 1, priceOverride = null) => {
        // Eğer varsa fiyat geçersiz kılmayı kullan (toplu fiyatlandırma için), yoksa ürünün standart fiyatını kullan
        const priceToAdd = priceOverride !== null ? priceOverride : product.price;
        // Eklenecek miktarı belirle (toplu eklemeler için 1'den fazla olabilir)
        const effectiveQuantity = quantity;

        // Bu ürünün sepetteki mevcut miktarını al
        const currentItem = cartItems[product.id];
        const currentQuantityInCart = currentItem ? currentItem.quantity : 0;

        // İstenen miktarı eklemenin mevcut stoğu aşıp aşmadığını kontrol et
        if (product.stock < currentQuantityInCart + effectiveQuantity) {
            toast.error(`Üzgünüz, stokta sadece ${product.stock} adet var. Sepetinizde zaten ${currentQuantityInCart} adet bulunuyor.`); // Türkçe hata
            return; // Yeterli stok yoksa fonksiyonu durdur
        }

        // cartItems state'ini güncelle
        setCartItems(prev => {
            const existingItem = prev[product.id]; // Mevcut öğeyi al
            // Bu ürün için yeni toplam miktarı hesapla
            const newQuantity = (existingItem ? existingItem.quantity : 0) + effectiveQuantity;

            // Güncellenmiş sepet state'ini döndür
            return {
                ...prev, // Mevcut öğeleri koru
                [product.id]: { // Öğeyi ekle veya güncelle
                    // Ürün detaylarını, yeni miktarı ve bu ekleme için kullanılan *birim başına* fiyatı sakla
                    product: { ...product, price: priceToAdd / effectiveQuantity }, // Tek bir ürünün fiyatını sakla
                    quantity: newQuantity,
                    // İsteğe bağlı: Fiyatın nasıl belirlendiğini sakla (örn: 'standard', '2_pack')
                    // priceSource: priceOverride ? 'bulk' : 'standard'
                }
            };
        });

        // Başarı mesajını göster
        toast.success(`${effectiveQuantity} x ${product.name} sepete eklendi!`); // Türkçe başarı mesajı
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
                toast.error(`Maksimum ${product.stock} adet izin veriliyor.`); // Türkçe hata
                newItems[productId].quantity = product.stock; // Miktarı maksimum stoğa ayarla
                return newItems; // Güncellenmiş state'i döndür
            }

            // Miktar 0 veya daha az ise, öğeyi sepetten kaldır
            if (quantity <= 0) {
                delete newItems[productId]; // Öğeyi sil
                 toast.success(`${product.name} sepetten çıkarıldı.`); // Türkçe onay mesajı (isteğe bağlı)
            }
            // Aksi takdirde, mevcut öğenin miktarını güncelle
            else {
                 newItems[productId].quantity = quantity;
            }
            return newItems; // Değiştirilmiş sepet state'ini döndür
        });
    };

    // Sepetteki toplam ürün sayısını hesapla
    const getCartCount = () => Object.values(cartItems).reduce((sum, item) => sum + (item?.quantity || 0), 0); // Miktarları güvenli bir şekilde topla

    // Sepetin ara toplamını, vergi tutarını ve toplam tutarını hesapla
    const getCartAmount = (taxRate = CALIFORNIA_TAX_RATE) => { // Vergi oranı geçersiz kılmayı kabul et, varsayılan olarak sabiti kullan
        // Ara toplamı güvenli bir şekilde hesapla, fiyat ve miktarın sayı olduğundan emin ol
        const subtotal = Object.values(cartItems).reduce((sum, item) => {
            const price = item?.product?.price ?? 0; // Fiyat eksikse 0 olarak varsay
            const quantity = item?.quantity ?? 0;   // Miktar eksikse 0 olarak varsay
            return sum + (price * quantity);
        }, 0); // Toplamı 0'dan başlat

        // Vergi tutarını hesapla
        const taxAmount = subtotal * taxRate;
        // Toplam tutarı hesapla
        const totalAmount = subtotal + taxAmount;

        // Her zaman sayı değerleri içeren bir nesne döndür, varsayılan olarak 0
        return {
            subtotal: subtotal || 0,
            taxAmount: taxAmount || 0,
            totalAmount: totalAmount || 0,
        };
    };

    // İlk mount'ta ürünleri getirmek için Effect
    useEffect(() => { fetchProducts(); }, [fetchProducts]); // fetchProducts useCallback ile tanımlandığı için bağımlılıklara eklendi

    // İlk mount'ta yorum izni ayarını getirmek için Effect
    const fetchReviewPermissionSetting = useCallback(async () => {
        const { data, error } = await supabase
            .from('store_settings')
            .select('setting_value')
            .eq('setting_key', REVIEW_PERMISSION_KEY) // Ayar anahtarına göre filtrele
            .single(); // Tek bir sonuç bekle

        if (!error && data) {
            setReviewPermissionSetting(data.setting_value); // State'i getirilen değerle güncelle
        } else if (error && error.code !== 'PGRST116') { // 'Bulunamadı' hatasını yoksay
             console.error("Yorum ayarı getirilemedi:", error.message); // Türkçe log
        }
        // Hata veya ayar bulunamazsa, varsayılan 'purchasers_only' kalır
    }, []); // Bu fonksiyon için bağımlılık gerekmez

    useEffect(() => {
        fetchReviewPermissionSetting(); // Ayar getirme fonksiyonunu çağır
    }, [fetchReviewPermissionSetting]); // fetch fonksiyonu kullanılabilir olduğunda çalıştır

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
        myReturnRequests, // Kullanıcının iade taleplerini dışa aktar (YENİ EKLENDİ)
        fetchMyReturnRequests, // Kullanıcı iade taleplerini getirme fonksiyonunu dışa aktar (YENİ EKLENDİ)
    };

    // Provider'ı, children bileşenlerini sararak döndür
    return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};