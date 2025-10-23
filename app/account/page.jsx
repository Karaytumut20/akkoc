'use client';
import { useAppContext } from "@/context/AppContext";
import { useSearchParams } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import Loading from "@/components/Loading";
import Link from "next/link";
import Image from "next/image";
import { FiChevronRight, FiStar, FiBell, FiCreditCard, FiInfo, FiCheckCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import StarRating from "@/components/StarRating";
import { getSafeImageUrl } from "@/lib/utils";
import FloatingLabelInput from "@/components/ui/FloatingLabelInput";

// ===================================================================
// BİLEŞENLER
// ===================================================================

const AccountDashboard = () => {
  const { user, myOrders } = useAppContext();
  const latestOrder = myOrders?.[0];

  return (
<div>
  <h2 className="text-xl font-semibold text-gray-800 mb-2">
    Hoş Geldiniz, {user?.user_metadata?.full_name || user.email.split('@')[0]}!
  </h2>
  <p className="text-gray-500 mb-8">
    Hesap bilgilerinizi buradan yönetebilir ve siparişlerinizi takip edebilirsiniz.
  </p>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* 🧾 Son Siparişiniz Kutusu */}
    <div className="bg-[#ffffff] p-5 rounded-lg border border-gray-200">
      <h3 className="font-semibold text-gray-700 mb-3">Son Siparişiniz</h3>
      {latestOrder ? (
        <div>
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-gray-500">Sipariş ID:</span>
            <span className="font-medium text-gray-800">
              #{latestOrder.id.slice(0, 8)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-gray-500">Tarih:</span>
            <span className="font-medium text-gray-800">
              {new Date(latestOrder.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm mb-4">
            <span className="text-gray-500">Tutar:</span>
            <span className="font-bold text-lg text-[#be531c]">
              ${latestOrder.total_amount.toFixed(2)}
            </span>
          </div>
          <Link
            href="/account/my-orders"
            className="text-sm font-semibold text-[#be531c] hover:underline flex items-center gap-1"
          >
            Tüm Siparişleri Gör <FiChevronRight />
          </Link>
        </div>
      ) : (
        <p className="text-sm text-gray-500 py-4 text-center">
          Henüz bir sipariş vermediniz.
        </p>
      )}
    </div>

    {/* ⚡ Hızlı Erişim Kutusu */}
    <div className="bg-[#ffffff] p-5 rounded-lg border border-gray-200">
      <h3 className="font-semibold text-gray-700 mb-3">Hızlı Erişim</h3>
      <div className="space-y-2">
        <Link
          href="/account?tab=profile"
          className="flex items-center justify-between text-sm text-gray-600 hover:text-[#be531c] transition group"
        >
          <span>Profil Bilgilerim</span>
          <FiChevronRight className="transform transition-transform group-hover:translate-x-1" />
        </Link>
        <Link
          href="/account/addresses"
          className="flex items-center justify-between text-sm text-gray-600 hover:text-[#be531c] transition group"
        >
          <span>Adres Bilgilerim</span>
          <FiChevronRight className="transform transition-transform group-hover:translate-x-1" />
        </Link>
        <Link
          href="/account?tab=password"
          className="flex items-center justify-between text-sm text-gray-600 hover:text-[#be531c] transition group"
        >
          <span>Parola Güvenliği</span>
          <FiChevronRight className="transform transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  </div>
</div>

  );
};

const ProfileSettings = () => {
  const { user, updateUserData } = useAppContext();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.user_metadata) {
      setFullName(user.user_metadata.full_name || '');
      setPhone(user.user_metadata.phone || '');
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      return toast.error("Tüm alanları doldurmanız gerekmektedir.");
    }
    setLoading(true);
    await updateUserData({
      full_name: fullName,
      phone: phone,
    });
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Profil Bilgileri
      </h2>
      <form onSubmit={handleProfileUpdate} className="space-y-8 max-w-lg">
        <FloatingLabelInput
          id="email"
          name="email"
          type="email"
          label="E-posta Adresi (Değiştirilemez)"
          value={user?.email || ''}
          disabled
          readOnly
        />
        <FloatingLabelInput
          id="fullName"
          name="fullName"
          type="text"
          label="Ad Soyad"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <FloatingLabelInput
          id="phone"
          name="phone"
          type="tel"
          label="Telefon Numarası"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="py-2 px-4 text-white bg-[#be531c] rounded-md hover:bg-[#be531c] focus:outline-none disabled:bg-[#be531c]"
        >
          {loading ? 'Güncelleniyor...' : 'Bilgileri Güncelle'}
        </button>
      </form>
    </div>
  );
};

const ChangePassword = () => {
  const { changeUserPassword } = useAppContext();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword)
      return toast.error("Lütfen tüm alanları doldurun.");
    if (newPassword !== confirmPassword)
      return toast.error("Yeni parolalar eşleşmiyor!");
    if (newPassword.length < 6)
      return toast.error("Yeni parola en az 6 karakter olmalıdır.");
    setLoading(true);
    const success = await changeUserPassword(currentPassword, newPassword);
    if (success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Parola Değiştir
      </h2>
      <form onSubmit={handlePasswordUpdate} className="space-y-8 max-w-lg">
        <FloatingLabelInput
          id="currentPassword"
          name="currentPassword"
          type="password"
          label="Mevcut Parola"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <FloatingLabelInput
          id="newPassword"
          name="newPassword"
          type="password"
          label="Yeni Parola"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <FloatingLabelInput
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Yeni Parolayı Onayla"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="py-2 px-4 text-white bg-[#be531c] rounded-md hover:bg-[#be531c] focus:outline-none disabled:bg-[#be531c]"
        >
          {loading ? 'Güncelleniyor...' : 'Parolayı Güncelle'}
        </button>
      </form>
    </div>
  );
};

// 💬 Bildirim ve İzinler
const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState({
    campaigns: true,
    orderStatus: true,
    specialOffers: false,
  });
  const [loading, setLoading] = useState(false);

  const handleToggle = (key) =>
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSave = () => {
    setLoading(true);
    toast
      .promise(
        new Promise((resolve) => setTimeout(resolve, 1000)),
        {
          loading: 'Kaydediliyor...',
          success: 'Tercihleriniz güncellendi!',
          error: 'Bir hata oluştu.',
        }
      )
      .finally(() => setLoading(false));
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Bildirim ve İletişim İzinleri
      </h2>
      <div className="space-y-4 max-w-lg">
        {[
          { key: 'campaigns', label: 'Kampanya ve indirim E-postaları' },
          { key: 'orderStatus', label: 'Sipariş durumu bildirimleri' },
          { key: 'specialOffers', label: 'Kişiye özel teklifler' },
        ].map(({ key, label }) => (
          <div
            key={key}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
          >
            <label className="font-medium text-gray-700">{label}</label>
            <button
              onClick={() => handleToggle(key)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences[key] ? 'bg-[#be531c]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences[key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
        <button
          onClick={handleSave}
          disabled={loading}
          className="py-2 px-4 mt-4 text-white bg-[#be531c] rounded-md hover:bg-[#be531c] disabled:bg-[#be531c]"
        >
          {loading ? "Kaydediliyor..." : "Tercihleri Kaydet"}
        </button>
      </div>
    </div>
  );
};

// ANA SAYFA İÇERİK YÖNETİCİSİ
const AccountPageContent = () => {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return <ProfileSettings />;
      case 'password': return <ChangePassword />;
      case 'notifications': return <NotificationPreferences />;
      case 'dashboard': default: return <AccountDashboard />;
    }
  };

  return <>{renderContent()}</>;
};

// ANA SAYFA BİLEŞENİ
const AccountPage = () => (
  <Suspense fallback={<Loading />}>
    <AccountPageContent />
  </Suspense>
);

export default AccountPage;
