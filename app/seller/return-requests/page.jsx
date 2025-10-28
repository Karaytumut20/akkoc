// app/seller/return-requests/page.jsx

'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Supabase client
import toast from 'react-hot-toast'; // Bildirimler
import Loading from '@/components/Loading'; // Yükleme component'i
import Image from 'next/image';
import Link from 'next/link'; // Link component'i import edildi
import { getSafeImageUrl } from '@/lib/utils'; // Güvenli resim URL'si
import { FiRefreshCw, FiCheck, FiX, FiUser, FiMail, FiPhone, FiInfo, FiPackage, FiTag, FiCalendar, FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi'; // İkonlar

// İade durumu için stil döndüren fonksiyon
const getReturnStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
        case 'approved':
            return { color: 'text-green-700 bg-green-100 border-green-200', icon: <FiCheckCircle size={14} />, text: 'Approved' };
        case 'rejected':
            return { color: 'text-red-700 bg-red-100 border-red-200', icon: <FiXCircle size={14} />, text: 'Rejected' };
        case 'pending':
            return { color: 'text-yellow-700 bg-yellow-100 border-yellow-200', icon: <FiRefreshCw size={14} className="animate-spin" />, text: 'Pending' };
        default:
            return { color: 'text-gray-600 bg-gray-100 border-gray-200', icon: <FiInfo size={14} />, text: status || 'Unknown' };
    }
};

// Ana Sayfa Component'i
const SellerReturnRequestsPage = () => {
    // State değişkenleri
    const [returnRequests, setReturnRequests] = useState([]); // Tüm iade talepleri
    const [loading, setLoading] = useState(true); // Yükleme durumu
    const [actionLoading, setActionLoading] = useState(null); // İşlem yapılan talep ID'si (örn: 'approve-uuid')

    // Tüm iade taleplerini çeken fonksiyon
    const fetchAllReturnRequests = useCallback(async () => {
        setLoading(true); // Yüklemeyi başlat

        try {
            // İlgili verilerle birlikte iade taleplerini çek
            const { data: returnsData, error: returnsError } = await supabase
                .from('returns')
                .select(`
                    *,
                    product:products (id, name, image_urls, price),
                    order_item:order_items (quantity, price),
                    order:orders (id, created_at, total_amount, address)
                `)
                .order('created_at', { ascending: false });

            if (returnsError) throw returnsError; // Hata varsa fırlat

            // Veri yoksa veya boşsa state'i temizle ve çık
            if (!returnsData || returnsData.length === 0) {
                setReturnRequests([]);
                setLoading(false);
                return;
            }

            // Kullanıcı bilgilerini çek (RPC ile)
            const userIds = [...new Set(returnsData.map(ret => ret.user_id).filter(id => id))];
            let usersMap = {};
            if (userIds.length > 0) {
                const { data: usersData, error: usersError } = await supabase
                    .rpc('get_users_by_ids', { user_ids: userIds });

                if (usersError) {
                    console.error("Kullanıcı bilgileri RPC ile alınamadı:", usersError.message);
                    toast.warn("Bazı kullanıcı bilgileri yüklenemedi.");
                } else if (usersData) {
                    // Kullanıcıları ID ile eşleştir
                    usersMap = usersData.reduce((acc, user) => {
                        acc[user.id] = user;
                        return acc;
                    }, {});
                }
            }

            // İade taleplerini kullanıcı bilgileriyle birleştir
            const combinedData = returnsData.map(ret => ({
                ...ret,
                user_profile: usersMap[ret.user_id] || null
            }));

            // State'i güncelle
            setReturnRequests(combinedData);

        } catch (error) {
            console.error('İade talepleri çekilirken hata:', error);
            toast.error('İade talepleri yüklenirken bir hata oluştu: ' + error.message);
            setReturnRequests([]); // Hata durumunda state'i temizle
        } finally {
            setLoading(false); // Yüklemeyi bitir
        }
    }, []); // Bağımlılık yok

    // Component yüklendiğinde verileri çek
    useEffect(() => {
        fetchAllReturnRequests();
    }, [fetchAllReturnRequests]);

    // İade talebinin durumunu güncelleyen fonksiyon
    const updateReturnStatus = async (returnId, newStatus) => {
        // İşlem yapılan talebin ID'sini ve türünü state'e ata
        setActionLoading(`${newStatus.toLowerCase()}-${returnId}`);
        const toastId = toast.loading(`İade talebi ${newStatus === 'Approved' ? 'onaylanıyor' : 'reddediliyor'}...`);

        try {
            // Supabase'de 'returns' tablosundaki ilgili kaydın 'status' sütununu güncelle
            // .select() ekleyerek güncellemenin sonucunu kontrol et
            const { data, error } = await supabase
                .from('returns')
                .update({ status: newStatus }) // Yeni durumu ayarla
                .eq('id', returnId)          // ID'ye göre güncelle
                .select();                    // Güncellenen kaydı geri döndür

            // Hata varsa fırlat
            if (error) {
                throw error;
            }

            // Güncelleme başarılı olduysa ve en az bir satır etkilendiyse
            if (data && data.length > 0) {
                 toast.success(`İade talebi başarıyla ${newStatus === 'Approved' ? 'onaylandı' : 'reddedildi'}.`, { id: toastId });
                 // Listeyi güncel verilerle yeniden çekerek UI'ın güncellenmesini sağla
                 fetchAllReturnRequests();
            } else {
                 // Eğer data boş dönerse (genellikle RLS yetkisi yoksa olur)
                 throw new Error("Güncelleme işlemi başarısız oldu veya yetkiniz yok.");
            }

        } catch (error) {
            console.error(`İade durumu güncellenirken hata (${newStatus}):`, error);
            toast.error(`İade talebi güncellenirken bir hata oluştu: ${error.message}`, { id: toastId });
        } finally {
            setActionLoading(null); // İşlem bitince yükleme durumunu sıfırla
        }
    };

    // Yükleme sırasında gösterilecek component
    if (loading) {
        return <Loading />;
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 p-4 sm:p-6 lg:p-8">
            {/* Sayfa başlığı */}
            <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-900 border-b pb-4">
                İade Talepleri Yönetimi
            </h1>

            {/* Eğer hiç iade talebi yoksa gösterilecek mesaj */}
            {returnRequests.length === 0 ? (
                <p className="text-center text-xl text-gray-500 py-20">
                    Henüz hiç iade talebi bulunmuyor.
                </p>
            ) : (
                // İade taleplerini listeleyen ana container
                <div className="space-y-6">
                    {/* Her bir iade talebi için map döngüsü */}
                    {returnRequests.map((ret) => {
                        // İade durumuna göre stil ve ikonu al
                        const { color, icon, text: statusText } = getReturnStatusStyle(ret.status);
                        // İlişkili verileri güvenli bir şekilde al
                        const product = ret.product;
                        const orderItem = ret.order_item;
                        const userProfile = ret.user_profile;
                        const orderAddress = ret.order?.address;

                        // Kullanıcı bilgilerini al
                        const userName = userProfile?.raw_user_meta_data?.full_name || userProfile?.raw_user_meta_data?.display_name || 'İsim Yok';
                        const userEmail = userProfile?.email || 'E-posta Yok';
                        const userPhone = userProfile?.raw_user_meta_data?.phone || 'Telefon Yok';

                        // Bu talep için işlem yapılıyor mu?
                        const isApproving = actionLoading === `approved-${ret.id}`;
                        const isRejecting = actionLoading === `rejected-${ret.id}`;
                        const isProcessing = isApproving || isRejecting;

                        return (
                            // Her iade talebi için bir kart
                            <div key={ret.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                                {/* Kartın başlık bölümü */}
                                <div className={`flex flex-wrap justify-between items-center p-4 border-l-4 ${color.replace('text-', 'border-').replace('bg-', '')}`}>
                                    {/* Talep ID ve Tarih */}
                                    <div>
                                        <p className="font-semibold text-gray-800 text-sm">Return ID: #{ret.id.slice(0, 8)}</p>
                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><FiCalendar size={12}/> {new Date(ret.created_at).toLocaleString()}</p>
                                    </div>
                                    {/* Durum Etiketi */}
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 ${color}`}>
                                        {icon} {statusText}
                                    </span>
                                </div>

                                {/* Kartın gövde bölümü (detaylar) */}
                                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Sol Bölüm: Ürün Bilgileri */}
                                    <div className="md:col-span-1 space-y-3">
                                        <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-1"><FiTag /> Ürün Bilgileri</h3>
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                                            <Image
                                                src={getSafeImageUrl(product?.image_urls)}
                                                alt={product?.name || 'Ürün'}
                                                width={60}
                                                height={60}
                                                className="rounded-md object-cover w-15 h-15 border"
                                            />
                                            <div>
                                                <p className="font-medium text-gray-800 text-sm">{product?.name || 'Ürün Bilgisi Yok'}</p>
                                                <p className="text-xs text-gray-500">Adet: {orderItem?.quantity || '?'}</p>
                                                <p className="text-xs text-gray-500">Birim Fiyat: {product?.price ? `${product.price.toFixed(2)} TL` : '?'}</p>
                                            </div>
                                        </div>
                                        {/* İade Nedeni */}
                                        {ret.reason && (
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 mb-1">İade Nedeni:</p>
                                                <p className="text-sm text-gray-700 bg-yellow-50 p-2 rounded border border-yellow-200">{ret.reason}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Orta Bölüm: Müşteri Bilgileri */}
                                    <div className="md:col-span-1 space-y-2 border-t md:border-t-0 md:border-l md:pl-6 pt-4 md:pt-0">
                                        <h3 className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-1"><FiUser /> Müşteri Bilgileri</h3>
                                        <p className="text-sm text-gray-600 flex items-center gap-2"><FiUser size={14} className="text-gray-400"/> {userName}</p>
                                        <p className="text-sm text-gray-600 flex items-center gap-2"><FiMail size={14} className="text-gray-400"/> {userEmail}</p>
                                        <p className="text-sm text-gray-600 flex items-center gap-2"><FiPhone size={14} className="text-gray-400"/> {userPhone}</p>
                                        {/* Sipariş Adresi */}
                                        {orderAddress && (
                                           <div className='mt-3 pt-3 border-t'>
                                             <p className="text-xs font-medium text-gray-500 mb-1">Sipariş Adresi:</p>
                                             <p className='text-sm text-gray-600'>{`${orderAddress.area}, ${orderAddress.city}, ${orderAddress.state}`}</p>
                                           </div>
                                        )}
                                    </div>

                                    {/* Sağ Bölüm: Aksiyonlar */}
                                    <div className="md:col-span-1 space-y-3 border-t md:border-t-0 md:border-l md:pl-6 pt-4 md:pt-0">
                                        <h3 className="font-semibold text-gray-700 text-sm mb-3">İşlemler</h3>
                                        {/* Sadece 'Pending' durumundaysa butonları göster */}
                                        {ret.status?.toLowerCase() === 'pending' ? (
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                {/* Onayla Butonu */}
                                                <button
                                                    onClick={() => updateReturnStatus(ret.id, 'Approved')}
                                                    disabled={isProcessing} // İşlem sırasında disable et
                                                    className="flex-1 px-3 py-2 bg-green-500 text-white text-xs font-semibold rounded-md hover:bg-green-600 transition disabled:opacity-50 flex items-center justify-center gap-1"
                                                >
                                                    {isApproving ? <FiRefreshCw className="animate-spin"/> : <FiCheck />} Onayla
                                                </button>
                                                {/* Reddet Butonu */}
                                                <button
                                                    onClick={() => updateReturnStatus(ret.id, 'Rejected')}
                                                    disabled={isProcessing} // İşlem sırasında disable et
                                                    className="flex-1 px-3 py-2 bg-red-500 text-white text-xs font-semibold rounded-md hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-1"
                                                >
                                                    {isRejecting ? <FiRefreshCw className="animate-spin"/> : <FiX />} Reddet
                                                </button>
                                            </div>
                                        ) : (
                                            // Eğer durum 'Pending' değilse bilgi mesajı göster
                                            <p className='text-sm text-gray-500 italic'>Bu talep için işlem yapılmış.</p>
                                        )}
                                        {/* İlgili Siparişe Git Linki */}
                                        {ret.order?.id && (
                                            <Link href={`/seller/orders`} className="text-xs text-blue-600 hover:underline mt-2 inline-block">
                                                Siparişi Gör (#{ret.order.id.slice(0, 8)})
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SellerReturnRequestsPage; // Component'i export et