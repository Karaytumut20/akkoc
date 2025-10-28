// app/account/page.jsx

'use client';
import { useAppContext } from "@/context/AppContext"; // Context hook'u
import { useSearchParams } from "next/navigation"; // URL parametrelerini okumak için
import { useState, Suspense } from "react"; // State ve Suspense
import Loading from "@/components/Loading"; // Yükleme component'i
import Link from "next/link"; // Link component'i
import Image from "next/image"; // Resim component'i
import { FiChevronRight, FiStar, FiBell, FiCreditCard, FiInfo, FiCheckCircle, FiRefreshCw, FiUser, FiPackage, FiHeart, FiMapPin, FiLock } from "react-icons/fi"; // İkonlar
import toast from "react-hot-toast"; // Bildirimler
import StarRating from "@/components/StarRating"; // Yıldız component'i
import { getSafeImageUrl } from "@/lib/utils"; // Güvenli resim URL'si
import FloatingLabelInput from "@/components/ui/FloatingLabelInput"; // Özel input component'i
import MyReturns from "./MyReturns"; // <-- YENİ: İadeler component'ini import et

// ===================================================================
// ALT COMPONENT'LER
// ===================================================================

// Hesap Paneli (Dashboard) Component'i
const AccountDashboard = () => {
    // Context'ten kullanıcı, siparişler ve para birimini al
    const { user, myOrders, currency } = useAppContext();
    // En son siparişi al (varsa)
    const latestOrder = myOrders?.[0];

    return (
        <div>
            {/* Karşılama mesajı */}
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Hoş Geldin, {user?.user_metadata?.full_name || user.email.split('@')[0]}!</h2>
            <p className="text-gray-500 mb-8">Hesap bilgilerini yönetebilir ve siparişlerini buradan takip edebilirsin.</p>
            {/* Özet kutuları */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Son Sipariş Kutusu */}
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-gray-700 mb-3">Son Sipariş</h3>
                    {latestOrder ? ( // Eğer son sipariş varsa göster
                        <div>
                            {/* Sipariş detayları */}
                            <div className="flex justify-between items-center text-sm mb-2"><span className="text-gray-500">Sipariş ID:</span><span className="font-medium text-gray-800">#{latestOrder.id.slice(0, 8)}</span></div>
                            <div className="flex justify-between items-center text-sm mb-2"><span className="text-gray-500">Tarih:</span><span className="font-medium text-gray-800">{new Date(latestOrder.created_at).toLocaleDateString()}</span></div>
                            <div className="flex justify-between items-center text-sm mb-4"><span className="text-gray-500">Tutar:</span><span className="font-bold text-lg text-orange-600">{currency}{latestOrder.total_amount.toFixed(2)}</span></div>
                            {/* Tüm siparişleri görme linki */}
                            <Link href="/account/my-orders" className="text-sm font-semibold text-orange-600 hover:underline flex items-center gap-1">Tüm Siparişleri Gör <FiChevronRight /></Link>
                        </div>
                    ) : ( // Sipariş yoksa mesaj göster
                         <p className="text-sm text-gray-500 py-4 text-center">Henüz hiç sipariş vermedin.</p>
                    )}
                </div>
                {/* Hızlı Erişim Kutusu */}
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                     <h3 className="font-semibold text-gray-700 mb-3">Hızlı Erişim</h3>
                     {/* Hızlı erişim linkleri */}
                     <div className="space-y-2">
                        <Link href="/account/addresses" className="flex items-center justify-between text-sm text-gray-600 hover:text-orange-600 transition group"><span>Adreslerim</span><FiChevronRight className="transform transition-transform group-hover:translate-x-1"/></Link>
                        <Link href="/account/wishlist" className="flex items-center justify-between text-sm text-gray-600 hover:text-orange-600 transition group"><span>Favorilerim</span><FiChevronRight className="transform transition-transform group-hover:translate-x-1"/></Link>
                         <Link href="/account?tab=password" className="flex items-center justify-between text-sm text-gray-600 hover:text-orange-600 transition group"><span>Şifre Güvenliği</span><FiChevronRight className="transform transition-transform group-hover:translate-x-1"/></Link>
                         {/* İadelerim linki (isteğe bağlı, kenar menüde zaten var) */}
                         {/* <Link href="/account?tab=returns" className="flex items-center justify-between text-sm text-gray-600 hover:text-orange-600 transition group"><span>İadelerim</span><FiChevronRight className="transform transition-transform group-hover:translate-x-1"/></Link> */}
                     </div>
                </div>
            </div>
        </div>
    );
};

// Şifre Değiştirme Component'i
const ChangePassword = () => {
    // Context'ten şifre değiştirme fonksiyonunu al
    const { changeUserPassword } = useAppContext();
    // Şifre alanları için state'ler
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false); // Yükleme durumu

    // Form gönderildiğinde çalışacak fonksiyon
    const handlePasswordUpdate = async (e) => {
        e.preventDefault(); // Sayfanın yeniden yüklenmesini engelle
        // Alanların dolu olup olmadığını kontrol et
        if (!currentPassword || !newPassword || !confirmPassword) return toast.error("Lütfen tüm alanları doldurun.");
        // Yeni şifrelerin eşleşip eşleşmediğini kontrol et
        if (newPassword !== confirmPassword) return toast.error("Yeni şifreler eşleşmiyor!");
        // Yeni şifrenin minimum uzunlukta olup olmadığını kontrol et
        if (newPassword.length < 6) return toast.error("Yeni şifre en az 6 karakter olmalıdır.");

        setLoading(true); // Yüklemeyi başlat
        // Context'teki şifre değiştirme fonksiyonunu çağır
        const success = await changeUserPassword(currentPassword, newPassword);
        // Eğer başarılıysa alanları temizle
        if (success) {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
        setLoading(false); // Yüklemeyi bitir
    };

    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Şifre Değiştir</h2>
            {/* Şifre değiştirme formu */}
            <form onSubmit={handlePasswordUpdate} className="space-y-8 max-w-lg">
                {/* Mevcut şifre alanı */}
                <FloatingLabelInput id="currentPassword" name="currentPassword" type="password" label="Mevcut Şifre" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                {/* Yeni şifre alanı */}
                <FloatingLabelInput id="newPassword" name="newPassword" type="password" label="Yeni Şifre" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                {/* Yeni şifre (tekrar) alanı */}
                <FloatingLabelInput id="confirmPassword" name="confirmPassword" type="password" label="Yeni Şifreyi Onayla" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                {/* Güncelle butonu */}
                <button type="submit" disabled={loading} className="py-2 px-4 text-white bg-orange-600 rounded-md hover:bg-orange-700 focus:outline-none disabled:bg-orange-300">
                    {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                </button>
            </form>
        </div>
    );
};

// Yeni Kart Ekleme Modalı Component'i
const AddCardModal = ({ onClose }) => {
    // Context'ten kart ekleme fonksiyonunu al
    const { addSavedCard } = useAppContext();
    const [loading, setLoading] = useState(false); // Yükleme durumu
    // Kart bilgileri için state
    const [cardData, setCardData] = useState({ cardNumber: '', cardName: '', expMonth: '', expYear: '', cvc: '' });

    // Input değişikliklerini yöneten fonksiyon
    const handleChange = (e) => {
        const { name, value } = e.target;
        // State'i güncelle
        setCardData(prev => ({ ...prev, [name]: value }));
    };

    // Form gönderildiğinde çalışacak fonksiyon
    const handleSubmit = async (e) => {
        e.preventDefault(); // Sayfa yenilemeyi engelle
        setLoading(true); // Yüklemeyi başlat
        // Basit kart numarası ve CVC uzunluk kontrolü
        if (cardData.cardNumber.length < 16 || cardData.cvc.length < 3) {
            toast.error("Lütfen geçerli kart bilgileri girin.");
            setLoading(false);
            return;
        }
        // Context'teki kart ekleme fonksiyonunu çağır
        const success = await addSavedCard(cardData);
        setLoading(false); // Yüklemeyi bitir
        // Başarılıysa modalı kapat
        if (success) {
            onClose();
        }
    };

    return (
        // Modal arkaplanı ve ortalama
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex justify-center items-center p-4">
            {/* Modal içeriği */}
            <div className="bg-white rounded-lg w-full max-w-md shadow-2xl">
                <form onSubmit={handleSubmit} className="p-6">
                    {/* Modal başlığı ve kapatma butonu */}
                    <div className="flex justify-between items-center border-b pb-3 mb-6">
                        <h2 className="text-xl font-semibold text-gray-800">Yeni Kart Ekle</h2>
                        <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
                    </div>
                    {/* Form alanları */}
                    <div className="space-y-8">
                        <FloatingLabelInput id="cardNumber" name="cardNumber" label="Kart Numarası" value={cardData.cardNumber} onChange={handleChange} required />
                        <FloatingLabelInput id="cardName" name="cardName" label="Kart Üzerindeki İsim" value={cardData.cardName} onChange={handleChange} required />
                        {/* Son kullanma tarihi ve CVC için yan yana alanlar */}
                        <div className="flex gap-4">
                            <FloatingLabelInput id="expMonth" name="expMonth" label="Ay (MM)" value={cardData.expMonth} onChange={handleChange} required />
                            <FloatingLabelInput id="expYear" name="expYear" label="Yıl (YY)" value={cardData.expYear} onChange={handleChange} required />
                            <FloatingLabelInput id="cvc" name="cvc" label="CVC" value={cardData.cvc} onChange={handleChange} required />
                        </div>
                    </div>
                    {/* Kaydet butonu */}
                    <button type="submit" disabled={loading} className="w-full mt-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-orange-400">
                        {loading ? "Kaydediliyor..." : "Kartı Kaydet"}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Kayıtlı Kartlar Component'i
const SavedCards = () => {
    // Context'ten kayıtlı kartları ve silme fonksiyonunu al
    const { savedCards, deleteSavedCard } = useAppContext();
    // Modalın açık/kapalı durumu için state
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div>
            {/* Başlık ve Yeni Kart Ekle butonu */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Kayıtlı Kartlarım</h2>
                {/* Yeni kart ekleme modalını açan buton */}
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition shadow-md text-sm">
                    <FiCreditCard /><span>Yeni Kart Ekle</span>
                </button>
            </div>
            {/* Kayıtlı kart listesi veya mesaj */}
            {savedCards.length > 0 ? ( // Eğer kart varsa listele
                <div className="space-y-4">
                    {savedCards.map(card => (
                        <div key={card.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                            {/* Kart bilgileri */}
                            <div className="flex items-center gap-4">
                                {/* Kart ikonu (varsayılan visa) */}
                                {/* Gerçek projede kart markasına göre ikon değişmeli */}
                                <img src={`/assets/visa.png`} alt={card.card_brand} className="w-10 h-auto"/>
                                <div>
                                    {/* Maskelenmiş kart numarası */}
                                    <p className="font-semibold">**** **** **** {card.last4}</p>
                                    {/* Son kullanma tarihi */}
                                    <p className="text-sm text-gray-500">Son Kul.: {card.exp_month}/{card.exp_year}</p>
                                </div>
                            </div>
                            {/* Sil butonu */}
                            <button onClick={() => {if(confirm('Bu kartı silmek istediğinizden emin misiniz?')) deleteSavedCard(card.id)}} className="text-sm text-red-600 hover:underline">Sil</button>
                        </div>
                    ))}
                </div>
            ) : ( // Kart yoksa mesaj göster
                <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-lg">
                    <FiCreditCard className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                    <p>Henüz kayıtlı kartınız bulunmuyor.</p>
                </div>
            )}
            {/* Yeni Kart Ekle Modalı (açıksa gösterilir) */}
            {isModalOpen && <AddCardModal onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};


// Yorumlarım Component'i
const MyReviews = () => {
    // Context'ten yorumları ve yükleme durumunu al
    const { myReviews, authLoading } = useAppContext();

    // Yükleniyorsa Loading component'ini göster
    if (authLoading) return <Loading />;

    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Yorumlarım</h2>
            {/* Eğer yorum yoksa mesaj göster */}
            {myReviews.length === 0 ? (
                 <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-lg">
                    <FiStar className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                    <p>Henüz hiç ürün yorumlamadınız.</p>
                </div>
            ) : (
                // Yorumlar varsa listele
                <div className="space-y-6">
                    {myReviews.map(review => {
                        // Yorumun onay durumuna göre stil belirle
                        const status = review.is_approved
                            ? { text: 'Onaylandı ve Yayında', color: 'text-green-600 bg-green-100' }
                            : { text: 'Onay Bekliyor', color: 'text-yellow-600 bg-yellow-100' };
                        return (
                            // Her yorum için bir bölüm
                            <div key={review.id} className="border-b pb-4">
                                {/* Ürün bilgisi ve yorum durumu */}
                                <div className="flex items-start justify-between">
                                    {/* Ürün resmi ve adı */}
                                    <div className="flex items-center">
                                         {/* Ürün detay sayfasına link */}
                                         <Link href={`/product/${review.products.id}`}>
                                            <div className="relative w-16 h-16 rounded-md overflow-hidden cursor-pointer bg-gray-100">
                                                {/* Güvenli resim URL'si al */}
                                                <Image src={getSafeImageUrl(review.products.image_urls)} alt={review.products.name} fill className="object-cover" />
                                            </div>
                                        </Link>
                                        {/* Ürün adı ve yorum tarihi */}
                                        <div className="ml-4">
                                            <Link href={`/product/${review.products.id}`}>
                                                <p className="font-semibold text-gray-800 hover:text-orange-600 transition">{review.products.name}</p>
                                            </Link>
                                            <p className="text-sm text-gray-500">{new Date(review.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    {/* Yorum durumu etiketi */}
                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${status.color}`}>{status.text}</span>
                                </div>
                                {/* Yıldız derecelendirmesi ve yorum metni */}
                                <div className="mt-3 pl-20"> {/* Ürün resminin hizasından başlatmak için padding */}
                                    {/* Yıldızlar */}
                                    <StarRating rating={review.rating} />
                                    {/* Yorum metni */}
                                    <p className="text-gray-700 mt-2">{review.comment}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

// Bildirim Tercihleri Component'i
const NotificationPreferences = () => {
    // Bildirim tercihleri için state (varsayılan değerler)
     const [preferences, setPreferences] = useState({ campaigns: true, orderStatus: true, specialOffers: false });
    const [loading, setLoading] = useState(false); // Kaydetme yükleme durumu

    // Tercihi değiştirme fonksiyonu
    const handleToggle = (key) => setPreferences(prev => ({ ...prev, [key]: !prev[key] }));

    // Kaydetme fonksiyonu (şimdilik sadece gecikme simülasyonu)
    const handleSave = () => {
        setLoading(true);
        // Gerçek bir API çağrısı yerine 1 saniye bekleme simülasyonu
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 1000)),
            {
                loading: 'Kaydediliyor...',
                success: 'Tercihleriniz güncellendi!',
                error: 'Bir hata oluştu.', // Bu örnekte hata oluşmaz ama gerçek uygulamada olabilir
            }
        ).finally(() => setLoading(false)); // Yüklemeyi bitir
    }

    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Bildirim ve İletişim İzinleri</h2>
            {/* Tercih seçenekleri */}
            <div className="space-y-4 max-w-lg">
                {/* Kampanya E-postaları */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                    <label className="font-medium text-gray-700">Kampanya ve İndirim E-postaları</label>
                    {/* Açma/Kapatma butonu */}
                    <button onClick={() => handleToggle('campaigns')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.campaigns ? 'bg-orange-600' : 'bg-gray-300'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.campaigns ? 'translate-x-6' : 'translate-x-1'}`}/>
                    </button>
                </div>
                {/* Sipariş Durumu Bildirimleri */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                    <label className="font-medium text-gray-700">Sipariş Durumu Bildirimleri</label>
                    <button onClick={() => handleToggle('orderStatus')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.orderStatus ? 'bg-orange-600' : 'bg-gray-300'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.orderStatus ? 'translate-x-6' : 'translate-x-1'}`}/>
                    </button>
                </div>
                {/* Kişiselleştirilmiş Teklifler */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                    <label className="font-medium text-gray-700">Kişiselleştirilmiş Teklifler</label>
                    <button onClick={() => handleToggle('specialOffers')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.specialOffers ? 'bg-orange-600' : 'bg-gray-300'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.specialOffers ? 'translate-x-6' : 'translate-x-1'}`}/>
                    </button>
                </div>
                {/* Kaydet butonu */}
                <button onClick={handleSave} disabled={loading} className="py-2 px-4 mt-4 text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:bg-orange-300">
                    {loading ? "Kaydediliyor..." : "Tercihleri Kaydet"}
                </button>
            </div>
        </div>
    )
};


// ANA SAYFA İÇERİK YÖNETİCİSİ (Hangi sekmenin aktif olduğunu belirler)
const AccountPageContent = () => {
    // URL'den 'tab' parametresini al
    const searchParams = useSearchParams();
    // Eğer 'tab' parametresi yoksa varsayılan olarak 'dashboard' kullan
    const activeTab = searchParams.get('tab') || 'dashboard';

    // Aktif sekmeye göre ilgili component'i render et
    const renderContent = () => {
        switch (activeTab) {
            case 'password': return <ChangePassword />; // Şifre sekmesi
            case 'reviews': return <MyReviews />;     // Yorumlar sekmesi
            case 'notifications': return <NotificationPreferences />; // Bildirimler sekmesi
            case 'saved-cards': return <SavedCards />; // Kayıtlı Kartlar sekmesi
            case 'returns': return <MyReturns />;      // <-- YENİ: İadeler sekmesi
            case 'dashboard':                           // Varsayılan veya dashboard sekmesi
            default: return <AccountDashboard />;
        }
    };

    // Seçilen içeriği döndür
    return <>{renderContent()}</>;
};

// ANA SAYFA COMPONENT'İ (Suspense ile yükleme durumunu yönetir)
const AccountPage = () => (
    // Suspense, URL parametreleri okunurken bekleme durumu için kullanılır
    <Suspense fallback={<Loading />}>
        {/* İçerik yöneticisini çağır */}
        <AccountPageContent />
    </Suspense>
);

export default AccountPage; // Ana component'i export et