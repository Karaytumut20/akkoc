// app/account/page.jsx
'use client';

import { useAppContext } from "@/context/AppContext";
import { useSearchParams } from "next/navigation";
import { useState, Suspense, useEffect } from "react"; // useEffect eklendi
import Loading from "@/components/Loading";
import Link from "next/link";
import Image from "next/image";
import { FiChevronRight, FiStar, FiBell, FiCreditCard, FiInfo, FiCheckCircle, FiArchive } from "react-icons/fi"; // FiArchive eklendi
import toast from "react-hot-toast";
import StarRating from "@/components/StarRating";
import { getSafeImageUrl } from "@/lib/utils";
import FloatingLabelInput from "@/components/ui/FloatingLabelInput";

// ===================================================================
// BİLEŞENLER (COMPONENTS)
// ===================================================================

// Hesap Paneli (Dashboard) Bileşeni
const AccountDashboard = () => {
    const { user, myOrders, currency } = useAppContext(); // currency context'ten alındı
    const latestOrder = myOrders?.[0]; // En son siparişi al

    return (
        <div>
            {/* Hoşgeldin mesajı */}
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Hoşgeldin, {user?.user_metadata?.full_name || user.email.split('@')[0]}!</h2>
            <p className="text-gray-500 mb-8">Hesap bilgilerinizi yönetebilir ve siparişlerinizi buradan takip edebilirsiniz.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Son Sipariş Kartı */}
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
                    ) : (<p className="text-sm text-gray-500 py-4 text-center">Henüz sipariş vermediniz.</p>) /* Sipariş yoksa mesaj */}
                </div>
                {/* Hızlı Erişim Kartı */}
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                     <h3 className="font-semibold text-gray-700 mb-3">Hızlı Erişim</h3>
                     <div className="space-y-2">
                        {/* Hızlı erişim linkleri */}
                        <Link href="/account/addresses" className="flex items-center justify-between text-sm text-gray-600 hover:text-orange-600 transition group"><span>Adreslerim</span><FiChevronRight className="transform transition-transform group-hover:translate-x-1"/></Link>
                        <Link href="/account/wishlist" className="flex items-center justify-between text-sm text-gray-600 hover:text-orange-600 transition group"><span>Favorilerim</span><FiChevronRight className="transform transition-transform group-hover:translate-x-1"/></Link>
                        <Link href="/account?tab=returns" className="flex items-center justify-between text-sm text-gray-600 hover:text-orange-600 transition group"><span>İade Taleplerim</span><FiChevronRight className="transform transition-transform group-hover:translate-x-1"/></Link> {/* İade linki eklendi */}
                        <Link href="/account?tab=password" className="flex items-center justify-between text-sm text-gray-600 hover:text-orange-600 transition group"><span>Şifre Güvenliği</span><FiChevronRight className="transform transition-transform group-hover:translate-x-1"/></Link>
                     </div>
                </div>
            </div>
        </div>
    );
};

// Şifre Değiştirme Bileşeni
const ChangePassword = () => {
    const { changeUserPassword } = useAppContext(); // Context'ten fonksiyonu al
    // State'ler: mevcut şifre, yeni şifre, yeni şifre tekrarı, yükleme durumu
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Şifre güncelleme işlemini yöneten fonksiyon
    const handlePasswordUpdate = async (e) => {
        e.preventDefault(); // Formun varsayılan gönderimini engelle
        // Alanların dolu olup olmadığını kontrol et
        if (!currentPassword || !newPassword || !confirmPassword) return toast.error("Lütfen tüm alanları doldurun.");
        // Yeni şifrelerin eşleşip eşleşmediğini kontrol et
        if (newPassword !== confirmPassword) return toast.error("Yeni şifreler eşleşmiyor!");
        // Yeni şifrenin minimum uzunlukta olup olmadığını kontrol et
        if (newPassword.length < 6) return toast.error("Yeni şifre en az 6 karakter olmalıdır.");
        setLoading(true); // Yükleme durumunu başlat
        const success = await changeUserPassword(currentPassword, newPassword); // Context fonksiyonunu çağır
        if (success) { // Başarılı olursa inputları temizle
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
        setLoading(false); // Yükleme durumunu bitir
    };

    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Şifre Değiştir</h2>
            {/* Şifre değiştirme formu */}
            <form onSubmit={handlePasswordUpdate} className="space-y-8 max-w-lg">
                <FloatingLabelInput id="currentPassword" name="currentPassword" type="password" label="Mevcut Şifre" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                <FloatingLabelInput id="newPassword" name="newPassword" type="password" label="Yeni Şifre" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                <FloatingLabelInput id="confirmPassword" name="confirmPassword" type="password" label="Yeni Şifreyi Onayla" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                {/* Güncelle butonu */}
                <button type="submit" disabled={loading} className="py-2 px-4 text-white bg-orange-600 rounded-md hover:bg-orange-700 focus:outline-none disabled:bg-orange-300">{loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}</button>
            </form>
        </div>
    );
};

// Yeni Kart Ekleme Modalı (Basit hali, gerçek entegrasyon gerekir)
const AddCardModal = ({ onClose }) => {
    const { addSavedCard } = useAppContext(); // Context'ten fonksiyonu al
    const [loading, setLoading] = useState(false); // Yükleme durumu
    // Kart bilgileri state'i
    const [cardData, setCardData] = useState({ cardNumber: '', cardName: '', expMonth: '', expYear: '', cvc: '' });

    // Input değişikliklerini yöneten fonksiyon
    const handleChange = (e) => {
        const { name, value } = e.target;
        setCardData(prev => ({ ...prev, [name]: value }));
    };

    // Form gönderme işlemini yöneten fonksiyon
    const handleSubmit = async (e) => {
        e.preventDefault(); // Varsayılan gönderimi engelle
        setLoading(true); // Yükleme durumunu başlat
        // Basit validasyon
        if (cardData.cardNumber.length < 16 || cardData.cvc.length < 3) {
            toast.error("Lütfen geçerli kart bilgileri girin.");
            setLoading(false);
            return;
        }
        const success = await addSavedCard(cardData); // Context fonksiyonunu çağır
        setLoading(false); // Yükleme durumunu bitir
        if (success) { // Başarılıysa modalı kapat
            onClose();
        }
    };

    return (
        // Modal arkaplanı ve merkezi konumlandırma
        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex justify-center items-center p-4">
            {/* Modal içeriği */}
            <div className="bg-white rounded-lg w-full max-w-md shadow-2xl">
                <form onSubmit={handleSubmit} className="p-6">
                    {/* Modal başlığı ve kapatma butonu */}
                    <div className="flex justify-between items-center border-b pb-3 mb-6">
                        <h2 className="text-xl font-semibold text-gray-800">Yeni Kart Ekle</h2>
                        <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
                    </div>
                    {/* Kart bilgisi inputları */}
                    <div className="space-y-8">
                        <FloatingLabelInput id="cardNumber" name="cardNumber" label="Kart Numarası" value={cardData.cardNumber} onChange={handleChange} required />
                        <FloatingLabelInput id="cardName" name="cardName" label="Kart Üzerindeki İsim" value={cardData.cardName} onChange={handleChange} required />
                        <div className="flex gap-4"> {/* Ay, Yıl, CVC yan yana */}
                            <FloatingLabelInput id="expMonth" name="expMonth" label="AA" value={cardData.expMonth} onChange={handleChange} required />
                            <FloatingLabelInput id="expYear" name="expYear" label="YY" value={cardData.expYear} onChange={handleChange} required />
                            <FloatingLabelInput id="cvc" name="cvc" label="CVC" value={cardData.cvc} onChange={handleChange} required />
                        </div>
                    </div>
                    {/* Kaydet butonu */}
                    <button type="submit" disabled={loading} className="w-full mt-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-orange-400">{loading ? "Kaydediliyor..." : "Kartı Kaydet"}</button>
                </form>
            </div>
        </div>
    );
};

// Kayıtlı Kartlar Bileşeni
const SavedCards = () => {
    const { savedCards, deleteSavedCard } = useAppContext(); // Context'ten state ve fonksiyonu al
    const [isModalOpen, setIsModalOpen] = useState(false); // Modal açık/kapalı durumu

    return (
        <div>
            {/* Başlık ve Yeni Kart Ekle butonu */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Kayıtlı Kartlarım</h2>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition shadow-md text-sm"><FiCreditCard /><span>Yeni Kart Ekle</span></button>
            </div>
            {/* Kayıtlı kart listesi veya kart yok mesajı */}
            {savedCards.length > 0 ? (
                <div className="space-y-4">
                    {savedCards.map(card => ( // Her kart için
                        <div key={card.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                            <div className="flex items-center gap-4">
                                {/* Kart ikonu (varsayılan veya marka tespiti ile) */}
                                <Image src={`/assets/visa.png`} alt={card.card_brand || 'card'} width={40} height={25} className="w-10 h-auto"/>
                                <div>
                                    {/* Maskelenmiş kart numarası ve son kullanma tarihi */}
                                    <p className="font-semibold">**** **** **** {card.last4}</p>
                                    <p className="text-sm text-gray-500">Son Kul.: {card.exp_month}/{card.exp_year}</p>
                                </div>
                            </div>
                            {/* Silme butonu */}
                            <button onClick={() => {if(confirm('Bu kartı silmek istediğinizden emin misiniz?')) deleteSavedCard(card.id)}} className="text-sm text-red-600 hover:underline">Sil</button>
                        </div>
                    ))}
                </div>
            ) : ( // Kayıtlı kart yoksa gösterilecek alan
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

// Yorumlarım Bileşeni
const MyReviews = () => {
    const { myReviews, authLoading } = useAppContext(); // Context'ten yorumları ve yükleme durumunu al

    if (authLoading) return <Loading />; // Yükleniyorsa Loading göster

    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Yorumlarım</h2>
            {/* Yorum listesi veya yorum yok mesajı */}
            {myReviews.length === 0 ? (
                 <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-lg">
                    <FiStar className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                    <p>Henüz hiçbir ürünü yorumlamadınız.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {myReviews.map(review => { // Her yorum için
                        // Yorumun onay durumuna göre stil belirle
                        const status = review.is_approved
                            ? { text: 'Onaylandı ve Yayında', color: 'text-green-600 bg-green-100' }
                            : { text: 'Onay Bekliyor', color: 'text-yellow-600 bg-yellow-100' };
                        return (
                            <div key={review.id} className="border-b pb-4">
                                {/* Ürün bilgisi ve onay durumu */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center">
                                         {/* Ürün detay sayfasına link */}
                                         <Link href={`/product/${review.products?.id}`}>
                                            <div className="relative w-16 h-16 rounded-md overflow-hidden cursor-pointer bg-gray-100">
                                                {/* Ürün resmi (güvenli URL ile) */}
                                                <Image src={getSafeImageUrl(review.products?.image_urls)} alt={review.products?.name || 'Ürün'} fill className="object-cover" />
                                            </div>
                                        </Link>
                                        <div className="ml-4">
                                            {/* Ürün adı (linkli) ve yorum tarihi */}
                                            <Link href={`/product/${review.products?.id}`}>
                                                <p className="font-semibold text-gray-800 hover:text-orange-600 transition">{review.products?.name || 'Bilinmeyen Ürün'}</p>
                                            </Link>
                                            <p className="text-sm text-gray-500">{new Date(review.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    {/* Onay durumu etiketi */}
                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${status.color}`}>{status.text}</span>
                                </div>
                                {/* Yıldız derecelendirmesi ve yorum metni */}
                                <div className="mt-3 pl-20"> {/* Ürün resmine göre hizalama */}
                                    <StarRating rating={review.rating} />
                                    <p className="text-gray-700 mt-2">{review.comment || <i>Yorum metni yok</i>}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

// Bildirim Tercihleri Bileşeni
const NotificationPreferences = () => {
     // Tercih state'i ve yükleme durumu
     const [preferences, setPreferences] = useState({ campaigns: true, orderStatus: true, specialOffers: false });
    const [loading, setLoading] = useState(false);

    // Tercihi değiştiren fonksiyon
    const handleToggle = (key) => setPreferences(prev => ({ ...prev, [key]: !prev[key] }));

    // Ayarları kaydeden (simüle edilmiş) fonksiyon
    const handleSave = () => {
        setLoading(true); // Yüklemeyi başlat
        // 1 saniyelik gecikme ile bir Promise kullanarak kaydetme işlemini simüle et
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 1000)),
            { // Toast mesajları
                loading: 'Kaydediliyor...',
                success: 'Tercihleriniz güncellendi!',
                error: 'Bir hata oluştu.',
            }
        ).finally(() => setLoading(false)); // Yüklemeyi bitir
    }

    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Bildirim ve İletişim İzinleri</h2>
            <div className="space-y-4 max-w-lg">
                {/* Kampanya e-postaları tercihi */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                    <label className="font-medium text-gray-700">Kampanya ve İndirim E-postaları</label>
                    {/* Açma/kapama butonu */}
                    <button onClick={() => handleToggle('campaigns')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.campaigns ? 'bg-orange-600' : 'bg-gray-300'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.campaigns ? 'translate-x-6' : 'translate-x-1'}`}/>
                    </button>
                </div>
                {/* Sipariş durumu bildirimleri tercihi */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                    <label className="font-medium text-gray-700">Sipariş Durumu Bildirimleri</label>
                    <button onClick={() => handleToggle('orderStatus')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.orderStatus ? 'bg-orange-600' : 'bg-gray-300'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.orderStatus ? 'translate-x-6' : 'translate-x-1'}`}/>
                    </button>
                </div>
                {/* Kişiselleştirilmiş teklifler tercihi */}
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

// Kullanıcının İade Taleplerini Listeleme Bileşeni (YENİ EKLENDİ)
const MyReturnRequests = () => {
    const { myReturnRequests, currency, fetchMyReturnRequests, user } = useAppContext(); // Context'ten iade taleplerini ve diğer gerekli bilgileri al
    const { authLoading } = useAppContext(); // authLoading durumunu da alalım

    // Component mount olduğunda veya kullanıcı değiştiğinde iade taleplerini getir
    useEffect(() => {
        if(user && !authLoading) {
            fetchMyReturnRequests(user.id);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, authLoading]); // fetchMyReturnRequests'ı bağımlılıklara eklemeyin

    // Durum renklerini belirleyen yardımcı fonksiyon (Seller sayfasındaki ile aynı olabilir)
    const getReturnStatusColor = (status) => {
      switch (status) {
        case 'Pending': return 'bg-yellow-100 text-yellow-800';
        case 'Approved': return 'bg-blue-100 text-blue-800';
        case 'Rejected': return 'bg-red-100 text-red-800';
        case 'Processing': return 'bg-purple-100 text-purple-800';
        case 'Completed': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    // Yükleniyorsa veya kullanıcı bilgisi gelmediyse Loading göster
    if (authLoading) return <Loading />;

    // İade talebi yoksa gösterilecek mesaj
    if (!myReturnRequests || myReturnRequests.length === 0) {
        return (
            <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-6">İade Taleplerim</h2>
                <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-lg">
                    <FiArchive className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                    <p>Henüz oluşturulmuş bir iade talebiniz bulunmuyor.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">İade Taleplerim</h2>
            <div className="space-y-6">
                {myReturnRequests.map(req => ( // Her bir iade talebi için
                    <div key={req.id} className="border rounded-lg p-4 bg-white shadow-sm">
                        {/* Talep üst bilgisi: ID, Tarih, Durum */}
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3 border-b pb-3">
                            <div>
                                <p className="text-sm text-gray-500">Talep ID: <span className="font-medium">#{req.id.slice(0,8)}</span></p>
                                <p className="text-sm text-gray-500">Tarih: <span className="font-medium">{new Date(req.created_at).toLocaleDateString()}</span></p>
                            </div>
                            {/* İade durumu etiketi */}
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${getReturnStatusColor(req.status)}`}>
                                {req.status === 'Pending' ? 'Beklemede' :
                                 req.status === 'Approved' ? 'Onaylandı' :
                                 req.status === 'Rejected' ? 'Reddedildi' :
                                 req.status === 'Processing' ? 'İşleniyor' :
                                 req.status === 'Completed' ? 'Tamamlandı' : req.status}
                            </span>
                        </div>
                        {/* Ürün bilgisi ve iade sebebi */}
                        <div className="flex items-start gap-4">
                             {/* Ürün resmi */}
                             <div className="w-16 h-16 relative rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                                <Image
                                    src={getSafeImageUrl(req.order_item?.product?.image_urls)} // Güvenli URL al
                                    alt={req.order_item?.product?.name || 'Ürün'}
                                    fill
                                    className="object-cover"
                                />
                             </div>
                             {/* Ürün adı, adet, sebep */}
                             <div>
                                <p className="font-medium text-gray-800">{req.order_item?.product?.name || 'Bilinmeyen Ürün'}</p>
                                <p className="text-sm text-gray-600">Adet: {req.order_item?.quantity}</p>
                                <p className="text-sm text-gray-600">Sebep: {req.reason}</p>
                                {/* Satıcı notu (opsiyonel olarak gösterilebilir) */}
                                {/* {req.seller_notes && (
                                    <p className="text-xs text-blue-600 mt-1 italic">Satıcı Notu: {req.seller_notes}</p>
                                )} */}
                             </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


// ANA SAYFA İÇERİK YÖNETİCİSİ
const AccountPageContent = () => {
    const searchParams = useSearchParams(); // URL'deki sorgu parametrelerini al
    const activeTab = searchParams.get('tab') || 'dashboard'; // 'tab' parametresini al veya varsayılan olarak 'dashboard' kullan

    // Aktif sekmeye göre ilgili bileşeni render et
    const renderContent = () => {
        switch (activeTab) {
            // case 'profile': return <UserProfile />; // Profil bileşeni varsa
            case 'password': return <ChangePassword />;
            case 'reviews': return <MyReviews />;
            case 'notifications': return <NotificationPreferences />;
            case 'saved-cards': return <SavedCards />;
            case 'returns': return <MyReturnRequests />; // <-- İADE TALEPLERİ SEKMESİ EKLENDİ
            case 'dashboard': // Varsayılan sekme
            default: return <AccountDashboard />;
        }
    };

    return <>{renderContent()}</>; // Seçilen içeriği render et
};

// ANA SAYFA BİLEŞENİ
const AccountPage = () => (
    // Suspense, içerik yüklenirken Loading göstermek için kullanılır
    <Suspense fallback={<Loading />}>
        <AccountPageContent />
    </Suspense>
);

export default AccountPage; // Ana sayfayı dışa aktar