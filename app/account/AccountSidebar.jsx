// app/account/AccountSidebar.jsx

'use client';

import Link from 'next/link'; // Link component'i
import { usePathname, useSearchParams } from 'next/navigation'; // Mevcut yolu ve parametreleri almak için hook'lar
import {
    FiPackage, FiHeart, FiStar, FiMapPin, // İkonlar
    FiLock, FiBell, FiLogOut, FiChevronRight, FiCreditCard, FiUser,
    FiRefreshCw // <-- YENİ: İade ikonu
} from 'react-icons/fi';
import { useAppContext } from "@/context/AppContext"; // Context hook'u

export default function AccountSidebar() {
    // Context'ten kullanıcı ve çıkış fonksiyonunu al
    const { user, signOut } = useAppContext();
    // Mevcut yolu ve URL parametrelerini al
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Menü öğeleri listesi (GÜNCELLENDİ)
    const menuItems = [
        // Profilim sekmesi (varsayılan)
        { name: "Profile Information", href: "/account?tab=profile", activeIdentifier: "profile", isTab: true, icon: <FiUser /> },
        // Siparişlerim sayfası (ayrı sayfa)
        { name: "My Orders", href: "/account/my-orders", activeIdentifier: "/account/my-orders", isTab: false, icon: <FiPackage /> },
        // Favorilerim sayfası (ayrı sayfa)
        { name: "Wishlist", href: "/account/wishlist", activeIdentifier: "/account/wishlist", isTab: false, icon: <FiHeart /> },
        // Yorumlarım sekmesi
        { name: "My Reviews", href: "/account?tab=reviews", activeIdentifier: "reviews", isTab: true, icon: <FiStar /> },
        // İadelerim sekmesi <-- YENİ
        { name: "My Returns", href: "/account?tab=returns", activeIdentifier: "returns", isTab: true, icon: <FiRefreshCw /> },
        // Adreslerim sayfası (ayrı sayfa)
        { name: "My Addresses", href: "/account/addresses", activeIdentifier: "/account/addresses", isTab: false, icon: <FiMapPin /> },
        // Şifre Güvenliği sekmesi
        { name: "Password Security", href: "/account?tab=password", activeIdentifier: "password", isTab: true, icon: <FiLock /> },
        // Kayıtlı Kartlarım sekmesi (isteğe bağlı)
        // { name: "Saved Cards", href: "/account?tab=saved-cards", activeIdentifier: "saved-cards", isTab: true, icon: <FiCreditCard /> },
        // Bildirim Tercihleri sekmesi
        { name: "Notification Preferences", href: "/account?tab=notifications", activeIdentifier: "notifications", isTab: true, icon: <FiBell /> },
    ];

    // Aktif sekme adını URL'den al
    const activeTab = searchParams.get('tab');

    // Kullanıcı yoksa menüyü gösterme
    if (!user) return null;

    return (
        // Kenar menü ana container'ı
        <div className="bg-[#F9F9F6] p-4 rounded-lg shadow-sm border border-gray-200">
            {/* Kullanıcı bilgisi bölümü */}
            <div className="flex items-center mb-4">
                {/* Kullanıcı avatarı (baş harf) */}
                <div className="w-12 h-12 rounded-full bg-[#E5E7EB] flex items-center justify-center text-[#be531c] text-xl font-bold">
                    {/* İsim varsa baş harfi, yoksa e-postanın baş harfi */}
                    {user.user_metadata?.full_name
                        ? user.user_metadata.full_name.charAt(0).toUpperCase()
                        : user.email.charAt(0).toUpperCase()}
                </div>
                {/* Kullanıcı adı ve e-posta */}
                <div className="ml-3 overflow-hidden"> {/* Taşmayı engellemek için overflow-hidden */}
                    <p className="font-semibold text-black truncate"> {/* Uzun isimler için kesme */}
                        {user?.user_metadata?.full_name || user.email.split('@')[0]} {/* İsim yoksa e-posta başı */}
                    </p>
                    <p className="text-sm text-black truncate">{user.email}</p> {/* E-posta (kesilmiş) */}
                </div>
            </div>
            {/* Navigasyon menüsü */}
            <nav className="space-y-1">
                {/* Menü öğelerini map ile oluştur */}
                {menuItems.map((item) => {
                    // Bu öğenin aktif olup olmadığını kontrol et
                    const isActive = item.isTab
                        // Eğer bir sekme ise: yol /account olmalı VE (aktif sekme bu öğeninkiyle aynı olmalı VEYA (aktif sekme yoksa VE bu öğe dashboard ise))
                        ? (pathname === '/account' && (activeTab === item.activeIdentifier || (!activeTab && item.activeIdentifier === 'profile'))) // 'profile' varsayılan olarak düzeltildi
                        // Eğer ayrı bir sayfa ise: mevcut yol bu öğenin href'i ile aynı olmalı
                        : pathname === item.href; // href ile karşılaştırıldı

                    return (
                        // Her menü öğesi için Link
                        <Link href={item.href} key={item.name}>
                            {/* Tıklanabilir alan */}
                            <div className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                                isActive
                                    ? 'bg-[#E5E7EB] text-[#be531c]' // Aktif stil
                                    : 'hover:bg-[#F3F4F6] text-gray-700' // Hover stili
                            }`}>
                                {item.icon} {/* İkon */}
                                <span className="ml-3 font-medium">{item.name}</span> {/* Menü adı */}
                                <FiChevronRight className="ml-auto w-5 h-5" /> {/* Sağ ok ikonu */}
                            </div>
                        </Link>
                    );
                })}
                {/* Çıkış yap butonu */}
                <div
                    onClick={signOut} // Tıklandığında çıkış fonksiyonunu çağır
                    className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-[#F3F4F6] text-gray-700"
                >
                    <FiLogOut /> {/* Çıkış ikonu */}
                    <span className="ml-3 font-medium">Logout</span> {/* Metin */}
                </div>
            </nav>
        </div>
    );
}