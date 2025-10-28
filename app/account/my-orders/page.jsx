// app/account/my-orders/page.jsx

'use client';
import React, { useEffect, useState, useCallback } from "react"; // useState eklendi
import { useAppContext } from "@/context/AppContext";
import Loading from "@/components/Loading";
import Image from "next/image";
import { getSafeImageUrl } from "@/lib/utils";
import toast from 'react-hot-toast';
import { supabase } from "@/lib/supabaseClient";
import ReturnReasonModal from "@/components/ReturnReasonModal"; // Yeni modal import edildi

const MyOrdersPage = () => {
    // Context'ten gerekli değerleri ve fonksiyonları al
    const { currency, myOrders, fetchMyOrders, user, authLoading } = useAppContext();

    // Modal state'leri
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false); // Modalın açık/kapalı durumu
    const [itemToReturn, setItemToReturn] = useState(null); // İade edilecek ürün bilgilerini tutar

    // Kullanıcı değiştiğinde siparişleri getir
    useEffect(() => {
        if (user) {
            fetchMyOrders(user.id);
        }
    }, [user, fetchMyOrders]);

    // Sipariş durumuna göre renk döndüren yardımcı fonksiyon (değişiklik yok)
    const getStatusColor = (status) => {
        switch (status) {
            case 'Teslim Edildi': case 'Delivered': return 'bg-green-100 text-green-800';
            case 'Kargolandı': case 'Shipped': return 'bg-blue-100 text-blue-800';
            case 'İptal Edildi': case 'Canceled': return 'bg-red-100 text-red-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    // İade Et butonuna tıklandığında modalı açan fonksiyon
    const openReturnModal = (order, item) => {
        setItemToReturn({ // İade edilecek ürünün bilgilerini state'e kaydet
            orderId: order.id,
            orderItemId: item.id,
            productId: item.products.id,
            productName: item.products.name,
            itemData: item // Modal içinde ürün detayını göstermek için tüm item bilgisi
        });
        setIsReturnModalOpen(true); // Modalı aç
    };

    // Modalı kapatan fonksiyon
    const closeReturnModal = () => {
        setIsReturnModalOpen(false);
        setItemToReturn(null); // Seçili ürünü sıfırla
    };

    // İade talebini veritabanına gönderen fonksiyon (artık 'reason' parametresi alıyor)
    const submitReturnRequest = useCallback(async (reason) => {
        // Eğer iade edilecek ürün bilgisi yoksa işlemi durdur (güvenlik kontrolü)
        if (!itemToReturn) {
            toast.error('İade edilecek ürün bilgisi bulunamadı.');
            return;
        }

        const { orderId, orderItemId, productId, productName } = itemToReturn;
        const toastId = toast.loading('İade talebi oluşturuluyor...');

        try {
            const { error } = await supabase
                .from('returns')
                .insert({
                    order_id: orderId,
                    order_item_id: orderItemId,
                    product_id: productId,
                    user_id: user.id,
                    status: 'Pending',
                    reason: reason // Seçilen iade nedenini 'reason' sütununa kaydet
                });

            if (error) {
                if (error.code === '23505') {
                    toast.error('Bu ürün için zaten bir iade talebiniz mevcut.', { id: toastId });
                } else {
                    throw error;
                }
            } else {
                toast.success(`'${productName}' için iade talebi alındı.`, { id: toastId });
                closeReturnModal(); // Başarılı olunca modalı kapat
                // İsteğe bağlı: İade edilen ürünün butonunu gizlemek için myOrders state'ini güncelleyebilirsin
                // Veya fetchMyOrders(user.id) ile listeyi yenileyebilirsin
            }
        } catch (err) {
            console.error("İade talebi hatası:", err);
            toast.error('İade talebi oluşturulurken bir hata oluştu: ' + err.message, { id: toastId });
        }
    }, [user, itemToReturn]); // user ve itemToReturn bağımlılıkları

    // Kimlik doğrulama yükleniyorsa Loading component'ini göster
    if (authLoading) return <Loading />;

    return (
        <div>
            {/* Sayfa başlığı */}
            <h1 className="text-2xl sm:text-3xl font-semibold mb-8 text-gray-800">My Orders</h1>
            {/* Sipariş yoksa mesaj göster */}
            {myOrders.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                    <p>You haven't placed any orders yet.</p>
                </div>
            ) : (
                // Siparişleri listele
                <div className="space-y-6">
                    {myOrders.map(order => (
                        <div key={order.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 sm:p-6">
                            {/* Sipariş başlık bilgileri */}
                            <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                <div>
                                    <p className="font-bold text-gray-800">Order ID: #{order.id.slice(0, 8)}</p>
                                    <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="font-semibold text-lg">{currency}{order.total_amount.toFixed(2)}</p>
                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                            {/* Sipariş kalemleri */}
                            <div className="border-t pt-4 mt-4">
                                {order.order_items.map(item => (
                                    <div key={item.id} className="flex items-start sm:items-center justify-between gap-4 mb-3 flex-wrap">
                                        <div className="flex items-center gap-4">
                                            <Image
                                                src={getSafeImageUrl(item.products.image_urls)}
                                                alt={item.products.name}
                                                width={64}
                                                height={64}
                                                className="rounded-md object-cover w-16 h-16"
                                            />
                                            <div>
                                                <p className="font-medium text-gray-800">{item.products.name}</p>
                                                <p className="text-sm text-gray-600">{item.quantity} x {currency}{item.price.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        {/* İade Et Butonu - Artık modalı açıyor */}
                                        {(order.status === 'Teslim Edildi' || order.status === 'Delivered') && (
                                            <button
                                                onClick={() => openReturnModal(order, item)} // Modalı açan fonksiyonu çağır
                                                className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-semibold rounded-md hover:bg-red-200 transition mt-2 sm:mt-0"
                                            >
                                                Return Item
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* İade Nedeni Modalı */}
            <ReturnReasonModal
                isOpen={isReturnModalOpen}
                onClose={closeReturnModal}
                orderItem={itemToReturn?.itemData} // Modal'a ürün bilgisini props olarak geç
                onSubmitReturn={submitReturnRequest} // Modaldan çağrılacak submit fonksiyonu
            />
        </div>
    );
};

export default MyOrdersPage;