// app/account/MyReturns.jsx
'use client';

import React from 'react';
import { useAppContext } from '@/context/AppContext'; // AppContext'i import et
import Loading from '@/components/Loading'; // Yükleme component'i
import Image from 'next/image';
import { getSafeImageUrl } from '@/lib/utils'; // Güvenli resim URL'si
import { FiRefreshCw, FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi'; // İkonlar

const MyReturns = () => {
    // Context'ten iade taleplerini, yükleme durumunu ve para birimini al
    const { myReturns, authLoading, currency } = useAppContext();

    // İade durumu için renk ve ikon belirleyen fonksiyon
    const getReturnStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved': // Onaylandı
                return { color: 'text-green-600 bg-green-100', icon: <FiCheckCircle /> };
            case 'rejected': // Reddedildi
                return { color: 'text-red-600 bg-red-100', icon: <FiXCircle /> };
            case 'pending': // Beklemede
                return { color: 'text-yellow-600 bg-yellow-100', icon: <FiRefreshCw className="animate-spin" /> };
            default: // Diğer veya bilinmeyen durumlar
                return { color: 'text-gray-600 bg-gray-100', icon: <FiAlertCircle /> };
        }
    };

    // Veri yükleniyorsa Loading component'ini göster
    if (authLoading) {
        return <Loading />;
    }

    return (
        <div>
            {/* Bölüm başlığı */}
            <h2 className="text-xl font-semibold text-gray-800 mb-6">My Return Requests</h2>

            {/* İade talebi yoksa gösterilecek mesaj */}
            {myReturns.length === 0 ? (
                <div className="text-center py-16 text-gray-500 bg-gray-50 rounded-lg">
                    {/* İkon */}
                    <FiRefreshCw className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                    <p>You haven't requested any returns yet.</p>
                </div>
            ) : (
                // İade taleplerini listele
                <div className="space-y-6">
                    {myReturns.map((ret) => {
                        // İade durumuna göre stil ve ikonu al
                        const { color, icon } = getReturnStatusStyle(ret.status);
                        // Ürün bilgilerini güvenli bir şekilde al (ürün veya sipariş kalemi silinmiş olabilir)
                        const productName = ret.product?.name || 'Product Not Available'; // Ürün adı yoksa varsayılan metin
                        const productImageUrl = getSafeImageUrl(ret.product?.image_urls); // Güvenli resim URL'si al
                        const itemQuantity = ret.order_item?.quantity || '?'; // Adet bilgisi yoksa '?' göster
                        const itemPrice = ret.order_item?.price ?? 0; // Fiyat bilgisi yoksa 0 kabul et

                        return (
                            // Her bir iade talebi için kart yapısı
                            <div key={ret.id} className="border rounded-lg bg-white shadow-sm overflow-hidden transition hover:shadow-md">
                                {/* Üst Kısım: Talep ID, Tarih ve Durum */}
                                <div className="flex flex-wrap justify-between items-center p-3 sm:p-4 bg-gray-50 border-b gap-2">
                                    <div>
                                        {/* İade ID'si (kısaltılmış) */}
                                        <p className="text-sm font-medium text-gray-800">Return ID: #{ret.id.slice(0, 8)}</p>
                                        {/* Talep tarihi */}
                                        <p className="text-xs text-gray-500">Requested: {new Date(ret.created_at).toLocaleDateString()}</p>
                                    </div>
                                    {/* Durum etiketi */}
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 ${color}`}>
                                        {icon} {/* Durum ikonu */}
                                        {ret.status || 'Unknown'} {/* Durum metni */}
                                    </span>
                                </div>

                                {/* Alt Kısım: Ürün Bilgisi ve İade Nedeni */}
                                <div className="p-3 sm:p-4 flex flex-col sm:flex-row gap-4">
                                    {/* Ürün Resmi */}
                                    <Image
                                        src={productImageUrl}
                                        alt={productName}
                                        width={80} // Genişlik
                                        height={80} // Yükseklik
                                        className="rounded-md object-cover w-20 h-20 flex-shrink-0 border bg-gray-100" // Stil tanımlamaları
                                    />
                                    {/* Ürün Detayları ve İade Nedeni */}
                                    <div className="flex-grow">
                                        <p className="font-semibold text-gray-800">{productName}</p> {/* Ürün adı */}
                                        <p className="text-sm text-gray-600">Quantity: {itemQuantity}</p> {/* Adet */}
                                        <p className="text-sm text-gray-600">Price per item: {currency}{itemPrice.toFixed(2)}</p> {/* Birim fiyat */}
                                        {/* İade Nedeni (eğer varsa) */}
                                        {ret.reason && (
                                            <div className="mt-2 pt-2 border-t border-gray-100">
                                                <p className="text-xs font-medium text-gray-500 mb-1">Reason for Return:</p>
                                                {/* Nedeni vurgulu göstermek için sarı arkaplan */}
                                                <p className="text-sm text-gray-700 bg-yellow-50 p-2 rounded border border-yellow-200">{ret.reason}</p>
                                            </div>
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

export default MyReturns; // Component'i export et