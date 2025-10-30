// context/AppContext.jsx

'use client'

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient"; // Supabase client'ı import et
import toast from "react-hot-toast"; // Bildirimler için
import { getSafeImageUrl } from "@/lib/utils"; // Güvenli resim URL'si için yardımcı fonksiyon

// Context oluştur
export const AppContext = createContext(undefined);

// Context'i kullanmak için hook
export const useAppContext = () => {
    const context = useContext(AppContext);
    // Context'in Provider içinde kullanıldığından emin ol
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppContextProvider');
    }
    return context;
};

// Veritabanındaki ayar anahtarı
const REVIEW_PERMISSION_KEY = 'review_permission';
// Vergi oranı (örnek)
const CALIFORNIA_TAX_RATE = 0.0825; // Bunu kendi ihtiyacına göre ayarla

// Context Provider Component'i
export const AppContextProvider = (props) => {
    // ---- STATE DEĞİŞKENLERİ ----
    const currency = process.env.NEXT_PUBLIC_CURRENCY || "$"; // Para birimi sembolü (ortam değişkeninden veya varsayılan)
    const router = useRouter(); // Next.js router hook'u

    // Ürünler
    const [products, setProducts] = useState([]); // Tüm ürünler listesi
    const [loading, setLoading] = useState(true); // Ürünler için yükleme durumu
    const [error, setError] = useState(null); // Ürün çekme hatası

    // Sepet
    const [cartItems, setCartItems] = useState({}); // Sepetteki ürünler: { productId: { product, quantity } }

    // Kullanıcı Kimlik Doğrulama
    const [user, setUser] = useState(null); // Giriş yapmış kullanıcı bilgisi
    const [authLoading, setAuthLoading] = useState(true); // Kimlik doğrulama yükleme durumu

    // Kullanıcı Hesabı Verileri
    const [addresses, setAddresses] = useState([]); // Kayıtlı adresler
    const [myOrders, setMyOrders] = useState([]); // Geçmiş siparişler
    const [wishlist, setWishlist] = useState([]); // Favori listesi
    const [myReviews, setMyReviews] = useState([]); // Kullanıcının yorumları
    const [savedCards, setSavedCards] = useState([]); // Kayıtlı kartlar
    const [myReturns, setMyReturns] = useState([]); // <-- YENİ: Kullanıcının iade talepleri

    // Mağaza Ayarları
    const [reviewPermissionSetting, setReviewPermissionSetting] = useState('purchasers_only'); // Yorum izni (varsayılan)

    // Hareketsizlik Zamanlayıcısı
    const inactivityTimer = useRef(null); // Zamanlayıcı referansı

    // ---- FONKSİYONLAR ----

    // Hareketsizlik sonrası çıkış yap
    const signOutAfterInactivity = useCallback(() => {
        toast('Oturum hareketsizlik nedeniyle sona erdi, çıkış yapılıyor.', { icon: '👋' });
        supabase.auth.signOut();
    }, []);

    // Hareketsizlik zamanlayıcısını sıfırla
    const resetInactivityTimer = useCallback(() => {
        clearTimeout(inactivityTimer.current);
        // Zamanlayıcıyı 10 dakikaya ayarla (10 dk * 60 sn * 1000 ms)
        inactivityTimer.current = setTimeout(signOutAfterInactivity, 10 * 60 * 1000);
    }, [signOutAfterInactivity]);

    // Hareketsizlik zamanlayıcısını yöneten useEffect
    useEffect(() => {
        // Sadece kullanıcı giriş yapmışsa zamanlayıcıyı başlat
        if (user) {
            const events = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'];
            // Aktivite dinleyicilerini ekle
            events.forEach(event => window.addEventListener(event, resetInactivityTimer));
            resetInactivityTimer(); // Başlangıçta zamanlayıcıyı kur

            // Component kaldırıldığında veya kullanıcı değiştiğinde temizle
            return () => {
                events.forEach(event => window.removeEventListener(event, resetInactivityTimer));
                clearTimeout(inactivityTimer.current);
            };
        }
    }, [user, resetInactivityTimer]); // user veya fonksiyon değiştiğinde çalışır

    // Kimlik doğrulama durumunu dinleyen useEffect
    useEffect(() => {
        setAuthLoading(true); // Yüklemeyi başlat
        // Supabase auth durumu değişikliğini dinle
        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user; // Mevcut oturumdaki kullanıcı
            setUser(currentUser || null); // Kullanıcı state'ini güncelle

            if (!currentUser) {
                // Kullanıcı çıkış yaparsa ilgili tüm verileri temizle
                setCartItems({});
                setAddresses([]);
                setMyOrders([]);
                setWishlist([]);
                setMyReviews([]);
                setSavedCards([]);
                setMyReturns([]); // <-- YENİ: İadeleri temizle
            } else {
                 // Kullanıcı giriş yaparsa veya oturum yenilenirse verilerini çek
                 // Not: Bu fonksiyonların tanımları aşağıda
                 fetchAddresses(currentUser.id);
                 fetchMyOrders(currentUser.id);
                 fetchWishlist(currentUser.id);
                 fetchMyReviews(currentUser.id);
                 fetchSavedCards(currentUser.id);
                 fetchMyReturns(currentUser.id); // <-- YENİ: İadeleri çek
            }
            setAuthLoading(false); // Yüklemeyi bitir
        });

        // Component kaldırıldığında dinleyiciyi kaldır
        return () => {
            authListener.subscription.unsubscribe();
        };
     }, []); // Sadece ilk mount'ta çalışır (fetchMyReturns bağımlılığı gereksiz)


    // Kayıt olma fonksiyonu
    const signUp = async (email, password) => {
        // Supabase ile kayıt işlemi
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
            toast.error(error.message); // Hata varsa göster
            return false; // Başarısız
        }
        toast.success('Kayıt başarılı! Lütfen e-postanızı doğrulayın.'); // Başarı mesajı
        return true; // Başarılı
    };

    // Giriş yapma fonksiyonu
    const signIn = async (email, password, source = 'user') => { // source parametresi eklendi (seller/user)
        // Supabase ile giriş yapma
        const { data: signInData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

        if (authError) {
            toast.error('Geçersiz kullanıcı adı veya şifre.'); // Genel hata mesajı
            return; // Hata durumunda dur
        }

        // Giriş başarılıysa
        if (signInData.user) {
            toast.success('Giriş başarılı!');
            // Yönlendirmeyi küçük bir gecikmeyle yap (toast mesajı görünsün diye)
            setTimeout(() => {
                // Kaynağa göre yönlendir (satıcı paneli veya ana sayfa)
                if (source === 'seller') {
                    router.push('/seller/product-list');
                } else {
                    router.push('/');
                }
            }, 50);
        }
    };

    // Çıkış yapma fonksiyonu
    const signOut = useCallback(async () => {
        await supabase.auth.signOut(); // Supabase oturumunu kapat
        clearTimeout(inactivityTimer.current); // Hareketsizlik zamanlayıcısını temizle
        router.push('/'); // Ana sayfaya yönlendir
        toast.success('Başarıyla çıkış yapıldı.');
    }, [router]); // router bağımlılığı

    // Şifre değiştirme fonksiyonu
    const changeUserPassword = async (currentPassword, newPassword) => {
        // Kullanıcı giriş yapmamışsa hata ver
        if (!user) {
            toast.error("Bu işlemi yapmak için giriş yapmalısınız.");
            return false;
        }
        const toastId = toast.loading("İşleniyor..."); // Yükleniyor göstergesi
        try {
            // Mevcut şifreyi doğrula (tekrar giriş yapmayı deneyerek)
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            });
            // Mevcut şifre yanlışsa hata fırlat
            if (signInError) {
                throw new Error("Mevcut şifre yanlış.");
            }
            // Mevcut şifre doğruysa yeni şifreyi güncelle
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });
            // Güncelleme sırasında hata olursa fırlat
            if (updateError) {
                throw new Error("Şifre güncellenirken hata oluştu: " + updateError.message);
            }
            toast.success("Şifre başarıyla güncellendi!", { id: toastId }); // Başarı mesajı
            return true; // Başarılı
        } catch (error) {
            toast.error(error.message, { id: toastId }); // Hata mesajı
            return false; // Başarısız
        }
    };

    // Kullanıcı meta verilerini (isim, telefon vb.) güncelleme fonksiyonu
    const updateUserData = async (data) => {
        const toastId = toast.loading("Bilgileriniz güncelleniyor...");
        // Supabase'de kullanıcı verilerini güncelle
        const { error } = await supabase.auth.updateUser({ data });
        if (error) {
            toast.error("Bilgiler güncellenirken hata oluştu: " + error.message, { id: toastId });
            return false; // Başarısız
        }
        toast.success("Bilgiler başarıyla güncellendi!", { id: toastId }); // Başarı mesajı
        return true; // Başarılı
    };

    // Tüm ürünleri çekme fonksiyonu
    const fetchProducts = async () => {
        setLoading(true); setError(null); // Yüklemeyi başlat, hatayı sıfırla
        // Ürünleri ve ilişkili kategori adını çek
        const { data, error: fetchError } = await supabase.from('products').select('*, categories(name)');
        if (fetchError) {
            setError(fetchError.message); setProducts([]); // Hata varsa state'i güncelle
        } else {
            // image_urls'ün her zaman dizi olmasını sağla
            const formattedProducts = (data || []).map(p => ({
                ...p,
                image_urls: Array.isArray(p.image_urls) ? p.image_urls : [],
            }));
            setProducts(formattedProducts); // Ürün state'ini güncelle
        }
        setLoading(false); // Yüklemeyi bitir
    };

    // Kullanıcının kayıtlı adreslerini çekme fonksiyonu
    const fetchAddresses = useCallback(async (userId) => {
        if (!userId) return; // Kullanıcı ID'si yoksa çık
        // Adresleri çek, en yeniden eskiye sırala
        const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        // Hata yoksa adres state'ini güncelle
        if (!error) setAddresses(data || []);
        // Hata varsa konsola yazdır (isteğe bağlı)
        // else console.error("Adresler çekilirken hata:", error);
    }, []); // Bağımlılık yok

    // Kullanıcının siparişlerini (ürün detayları ile) çekme fonksiyonu
    const fetchMyOrders = useCallback(async (userId) => {
        if (!userId) return;
        // Siparişleri, sipariş kalemlerini, ürünleri ve kategori adlarını çek
        const { data, error } = await supabase
            .from('orders')
            .select(`*, order_items(*, products(*, categories(name)))`)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (!error) setMyOrders(data || []);
        // else console.error("Siparişler çekilirken hata:", error);
    }, []); // Bağımlılık yok

    // Kullanıcının favori listesini (ürün detayları ile) çekme fonksiyonu
    const fetchWishlist = useCallback(async (userId) => {
        if (!userId) return;
        // Favori listesini ve ilişkili ürün detaylarını çek
        const { data, error } = await supabase
            .from('wishlist')
            .select('*, product:products(*)')
            .eq('user_id', userId);
        if (!error) setWishlist(data || []);
        // else console.error("Favori listesi çekilirken hata:", error);
    }, []); // Bağımlılık yok

    // Kullanıcının yorumlarını (ürün detayları ile) çekme fonksiyonu
    const fetchMyReviews = useCallback(async (userId) => {
        if (!userId) return;
        // Yorumları ve ilişkili ürün (id, name, image_urls) bilgilerini çek
        const { data, error } = await supabase
            .from('reviews')
            .select(`*, products (id, name, image_urls)`)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (!error) setMyReviews(data || []);
        // else console.error("Yorumlar çekilirken hata:", error);
    }, []); // Bağımlılık yok

    // Kullanıcının kayıtlı kartlarını çekme fonksiyonu
    const fetchSavedCards = useCallback(async (userId) => {
        if (!userId) return;
        const { data, error } = await supabase
            .from('saved_cards') // 'saved_cards' tablosunu varsayıyoruz
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (!error) setSavedCards(data || []);
        // else console.error("Kayıtlı kartlar çekilirken hata:", error);
    }, []); // Bağımlılık yok

    // YENİ Fonksiyon: Kullanıcının iade taleplerini çek (Detaylı sorgu ile)
    const fetchMyReturns = useCallback(async (userId) => {
        if (!userId) return;
        // RLS politikaları sayesinde sadece doğru kullanıcı verileri dönecektir.
        const { data, error: returnsError } = await supabase
            .from('returns') // 'returns' tablosundan çek
            .select(`
                *,
                product:products (id, name, image_urls),
                order_item:order_items (quantity, price)
            `) // İlişkili ürün ve sipariş kalemi bilgilerini de dahil et
            .eq('user_id', userId) // Kullanıcı ID'sine göre filtrele (RLS zaten yapar)
            .order('created_at', { ascending: false }); // En yeniden eskiye sırala

        if (!returnsError) {
            setMyReturns(data || []); // Gelen veriyi state'e ata
        } else {
             console.error("İade talepleri çekilirken hata:", returnsError);
             setMyReturns([]); // Hata durumunda state'i temizle
             toast.error("İade talepleri yüklenirken bir sorun oluştu.");
        }
    }, []); // Bağımlılık yok

    // Yeni kayıtlı kart ekleme fonksiyonu (placeholder token mantığı ile)
    const addSavedCard = async (cardData) => {
        if (!user) return toast.error("Kart eklemek için giriş yapmalısınız.");

        // Gerçek ödeme sağlayıcı entegrasyonu (örn: Stripe) burada yapılmalı
        // Bu kısım şimdilik sahte token oluşturuyor
        const fakeToken = `tok_${Math.random().toString(36).substr(2, 14)}`;
        const last4 = cardData.cardNumber.slice(-4); // Kartın son 4 hanesi
        const cardBrand = "visa"; // Gerçekte kart markası tespiti gerekir

        // Supabase'e kart bilgisini (token ile birlikte) kaydet
        const { error } = await supabase.from('saved_cards').insert({
            user_id: user.id,
            card_brand: cardBrand,
            last4: last4,
            exp_month: parseInt(cardData.expMonth),
            exp_year: parseInt(cardData.expYear),
            payment_provider_token: fakeToken, // Sahte token'ı kaydet
        });

        if (error) {
            toast.error("Kart eklenirken hata oluştu: " + error.message);
            return false; // Başarısız
        } else {
            toast.success("Kart başarıyla eklendi!");
            fetchSavedCards(user.id); // Kart listesini yenile
            return true; // Başarılı
        }
    };

    // Kayıtlı kart silme fonksiyonu
    const deleteSavedCard = async (cardId) => {
        if (!user) return toast.error("Bu işlem için giriş yapmalısınız.");

        // Supabase'den kartı sil
        const { error } = await supabase.from('saved_cards').delete().eq('id', cardId);

        if (error) {
            toast.error("Kart silinirken hata oluştu: " + error.message);
        } else {
            toast.success("Kart başarıyla silindi.");
            // State'i anında güncelle (daha iyi UX için)
            setSavedCards(prev => prev.filter(card => card.id !== cardId));
        }
    };

    // Favori listesine ürün ekleme fonksiyonu
    const addToWishlist = async (productId) => {
        if (!user) return toast.error("Favorilere eklemek için lütfen giriş yapın.");
        // 'wishlist' tablosuna ekle
        const { error } = await supabase.from('wishlist').insert({ user_id: user.id, product_id: productId });
        if (error) {
            // Eğer ürün zaten favorilerdeyse (unique constraint hatası)
            if (error.code === '23505') {
                 toast.error("Bu ürün zaten favorilerinizde.");
            } else {
                 toast.error("Favorilere eklenirken hata oluştu: " + error.message);
            }
        } else {
            toast.success("Ürün favorilere eklendi!");
            fetchWishlist(user.id); // Favori listesini yenile
        }
    };

    // Favori listesinden ürün çıkarma fonksiyonu
    const removeFromWishlist = async (productId) => {
        if (!user) return; // Giriş yapılmış olmalı
        // 'wishlist' tablosundan kullanıcı ve ürün ID'sine göre sil
        const { error } = await supabase.from('wishlist').delete().match({ user_id: user.id, product_id: productId });
        if (error) {
            toast.error("Favorilerden çıkarılırken hata oluştu.");
        } else {
            toast.success("Ürün favorilerden çıkarıldı!");
            fetchWishlist(user.id); // Favori listesini yenile
        }
    };

    // Yeni adres ekleme fonksiyonu
    const addAddress = async (addressData) => {
        if (!user) return toast.error("Adres eklemek için giriş yapmalısınız.");
        const toastId = toast.loading("Adres ekleniyor...");
        try {
            // 'addresses' tablosuna yeni adresi kullanıcı ID'si ile ekle
            const { error } = await supabase.from('addresses').insert({ ...addressData, user_id: user.id });
            if (error) throw error; // Hata varsa fırlat
            await fetchAddresses(user.id); // Adres listesini yenile
            toast.success("Adres başarıyla eklendi!", { id: toastId });
            return true; // Başarılı
        } catch (error) {
            toast.error("Adres eklenirken hata oluştu: " + error.message, { id: toastId });
            return false; // Başarısız
        }
    };

    // Mevcut adresi güncelleme fonksiyonu
    const updateAddress = async (addressId, addressData) => {
        if (!user) return toast.error("Adres güncellemek için giriş yapmalısınız.");
        const toastId = toast.loading("Adres güncelleniyor...");
        try {
            // Güncellenmemesi gereken alanları çıkar (id, user_id, created_at)
            const { id, user_id, created_at, ...updateData } = addressData;
            // 'addresses' tablosunda ID'ye göre güncelle
            const { error } = await supabase.from('addresses').update(updateData).eq('id', addressId);
            if (error) throw error; // Hata varsa fırlat
            await fetchAddresses(user.id); // Adres listesini yenile
            toast.success("Adres başarıyla güncellendi!", { id: toastId });
            return true; // Başarılı
        } catch (error) {
            toast.error("Adres güncellenirken hata oluştu: " + error.message, { id: toastId });
            return false; // Başarısız
        }
    };

    // Adres silme fonksiyonu
    const deleteAddress = async (addressId) => {
        if (!user) return toast.error("Adres silmek için giriş yapmalısınız.");
        const toastId = toast.loading("Adres siliniyor...");
        try {
            // 'addresses' tablosundan ID'ye göre sil
            const { error } = await supabase.from('addresses').delete().eq('id', addressId);
            if (error) throw error; // Hata varsa fırlat
            // State'i anında güncelle
            setAddresses(prev => prev.filter(addr => addr.id !== addressId));
            toast.success("Adres başarıyla silindi!", { id: toastId });
        } catch (error) {
            toast.error("Adres silinirken hata oluştu: " + error.message, { id: toastId });
        }
    };

    // Sepet verilerini localStorage'dan yükleyen useEffect
    useEffect(() => {
        try {
             // Sayfa yüklendiğinde localStorage'daki sepeti al
             const storedCart = localStorage.getItem("cartItems");
             // Eğer veri varsa, JSON'dan parse edip state'e ata
             if (storedCart) {
                setCartItems(JSON.parse(storedCart));
             }
        } catch (e) {
             console.error("localStorage'dan sepet yüklenemedi:", e);
             // Hatalı veriyi temizle (isteğe bağlı)
             // localStorage.removeItem("cartItems");
        }
    }, []); // Sadece ilk mount'ta çalışır

    // Sepet verilerini localStorage'a kaydeden useEffect
    useEffect(() => {
        try {
            // Eğer sepette ürün varsa
            if (Object.keys(cartItems).length > 0) {
                // Sepeti JSON string olarak localStorage'a kaydet
                localStorage.setItem("cartItems", JSON.stringify(cartItems));
            } else {
                // Eğer sepet boşsa, localStorage'dan 'cartItems' anahtarını kaldır
                localStorage.removeItem("cartItems");
            }
        } catch(e) {
            console.error("localStorage'a sepet kaydedilemedi:", e);
        }
    }, [cartItems]); // cartItems state'i her değiştiğinde çalışır

    // Sepete ürün ekleme fonksiyonu (adet ve stok kontrolü ile)
    const addToCart = (product, quantity = 1, priceOverride = null) => {
        // Eğer fiyat override edilmişse onu kullan (toplu alım için), yoksa ürünün normal fiyatını al
        const priceToAdd = priceOverride !== null ? priceOverride : product.price;
        // Eklenecek adet (toplu alımda 1'den fazla olabilir)
        const effectiveQuantity = quantity;

        // Ürünün sepetteki mevcut adedini al
        const currentItem = cartItems[product.id];
        const currentQuantityInCart = currentItem ? currentItem.quantity : 0;

        // İstenen adedi ekleyince stok aşılıyor mu kontrol et
        if (product.stock < currentQuantityInCart + effectiveQuantity) {
            toast.error(`Üzgünüz, stokta sadece ${product.stock} adet var. Sepetinizde zaten ${currentQuantityInCart} adet bulunuyor.`);
            return; // Stok yetersizse işlemi durdur
        }

        // cartItems state'ini güncelle
        setCartItems(prev => {
            const existingItem = prev[product.id];
            // Bu ürün için yeni toplam adedi hesapla
            const newQuantity = (existingItem ? existingItem.quantity : 0) + effectiveQuantity;

            // Güncellenmiş sepet state'ini döndür
            return {
                ...prev, // Önceki ürünleri koru
                [product.id]: { // İlgili ürünü ekle veya güncelle
                    // Ürün detaylarını, yeni adedi ve *birim* fiyatı kaydet
                    product: { ...product, price: priceToAdd / effectiveQuantity }, // Tekil ürün fiyatını kaydet
                    quantity: newQuantity,
                }
            };
        });

        // Başarı mesajı göster
        toast.success(`${effectiveQuantity} x ${product.name} sepete eklendi!`);
    };

    // Sepetteki ürünün adedini güncelleme fonksiyonu
    const updateCartQuantity = (productId, quantity) => {
        setCartItems(prev => {
            const newItems = { ...prev }; // Sepetin kopyasını oluştur
            const item = newItems[productId]; // İlgili ürünü al

            // Eğer ürün sepette yoksa (olmamalı ama kontrol edelim), bir şey yapma
            if (!item || !item.product) return newItems;

            const product = item.product; // Ürün detaylarını al

            // Adet artırılırken stok kontrolü yap
            if (quantity > product.stock) {
                toast.error(`Maksimum ${product.stock} adet izin veriliyor.`);
                newItems[productId].quantity = product.stock; // Adedi maksimum stoğa ayarla
                return newItems; // Güncellenmiş state'i döndür
            }

            // Eğer adet 0 veya daha az ise ürünü sepetten çıkar
            if (quantity <= 0) {
                delete newItems[productId]; // Ürünü sil
                 toast.success(`${product.name} sepetten çıkarıldı.`); // Onay mesajı (isteğe bağlı)
            }
            // Aksi halde (adet 0'dan büyükse) adedi güncelle
            else {
                 newItems[productId].quantity = quantity;
            }
            return newItems; // Değiştirilmiş sepet state'ini döndür
        });
    };

    // Sepetteki toplam ürün sayısını hesaplama fonksiyonu
    const getCartCount = () => Object.values(cartItems).reduce((sum, item) => sum + (item.quantity || 0), 0); // Adetleri güvenli bir şekilde topla

    // Sepetin ara toplamını, vergisini ve genel toplamını hesaplama fonksiyonu
    const getCartAmount = (taxRate = CALIFORNIA_TAX_RATE) => { // Vergi oranı override edilebilir
        // Ara toplamı hesapla (fiyat ve adet sayı değilse 0 kabul et)
        const subtotal = Object.values(cartItems).reduce((sum, item) => {
            const price = item?.product?.price ?? 0; // Fiyat yoksa 0
            const quantity = item?.quantity ?? 0;   // Adet yoksa 0
            return sum + (price * quantity);
        }, 0); // Toplamı 0'dan başlat

        // Vergi miktarını hesapla
        const taxAmount = subtotal * taxRate;
        // Genel toplamı hesapla
        const totalAmount = subtotal + taxAmount;

        // Her zaman sayı değerleri içeren bir nesne döndür (varsayılan 0)
        return {
            subtotal: subtotal || 0,
            taxAmount: taxAmount || 0,
            totalAmount: totalAmount || 0,
        };
    };

    // Yorum izni ayarını çekme fonksiyonu
    const fetchReviewPermissionSetting = useCallback(async () => {
        // 'store_settings' tablosundan ilgili ayarı çek
        const { data, error } = await supabase
            .from('store_settings')
            .select('setting_value')
            .eq('setting_key', REVIEW_PERMISSION_KEY)
            .single(); // Tek bir kayıt bekliyoruz

        // Hata yoksa ve veri varsa state'i güncelle
        if (!error && data) {
            setReviewPermissionSetting(data.setting_value);
        }
        // 'Kayıt bulunamadı' hatasını (PGRST116) görmezden gel, diğer hataları logla
        else if (error && error.code !== 'PGRST116') {
             console.error("Yorum ayarı çekilemedi:", error.message);
        }
        // Hata durumunda veya ayar bulunamazsa varsayılan ('purchasers_only') kalır
    }, []); // Bağımlılık yok

    // Component mount edildiğinde ilk verileri (ürünler, ayarlar) çek
    useEffect(() => {
        fetchProducts();
        fetchReviewPermissionSetting();
    }, [fetchReviewPermissionSetting]); // fetchReviewPermissionSetting bağımlılığı

    // ---- CONTEXT DEĞERİ ----
    // Provider aracılığıyla paylaşılacak tüm state ve fonksiyonlar
    const value = {
        currency, router, products, loading, error, fetchProducts,
        cartItems, setCartItems, addToCart, updateCartQuantity, getCartCount, getCartAmount,
        user, authLoading, signUp, signIn, signOut,
        changeUserPassword,
        updateUserData,
        addresses, fetchAddresses, addAddress, updateAddress, deleteAddress,
        myOrders, fetchMyOrders,
        myReviews, fetchMyReviews,
        myReturns, fetchMyReturns, // <-- YENİ: İade state'i ve fonksiyonu eklendi
        getSafeImageUrl, // Yardımcı fonksiyonu da paylaş
        wishlist, addToWishlist, removeFromWishlist,
        savedCards, addSavedCard, deleteSavedCard,
        reviewPermissionSetting // Yorum izni ayarını da paylaş
    };

    // Provider component'ini döndür
    return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};