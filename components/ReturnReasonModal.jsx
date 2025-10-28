// components/ReturnReasonModal.jsx
'use client';

import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import Image from 'next/image';
import { getSafeImageUrl } from '@/lib/utils'; // Resim URL'si için

// İade nedenleri listesi (isteğe göre genişletilebilir)
const RETURN_REASONS = [
    "Yanlış ürün geldi",
    "Ürün hasarlı veya kusurlu",
    "Açıklamayla uyuşmuyor",
    "Artık ihtiyacım yok",
    "Yanlış beden/boyut sipariş ettim",
    "Daha iyi bir fiyat buldum",
    "Diğer", // 'Diğer' seçeneği için
];

const ReturnReasonModal = ({ isOpen, onClose, orderItem, onSubmitReturn }) => {
    // Seçilen iade nedenlerini tutmak için state
    const [selectedReasons, setSelectedReasons] = useState([]);
    // 'Diğer' nedeni için açıklama alanı
    const [otherReasonText, setOtherReasonText] = useState('');
    // Yükleme durumu
    const [loading, setLoading] = useState(false);

    // Modal kapalıysa hiçbir şey gösterme
    if (!isOpen || !orderItem) return null;

    // Checkbox değişimini yöneten fonksiyon
    const handleCheckboxChange = (event) => {
        const { value, checked } = event.target;
        setSelectedReasons(prev =>
            checked ? [...prev, value] : prev.filter(reason => reason !== value)
        );
        // Eğer 'Diğer' seçeneği kaldırılırsa, metin alanını da temizle
        if (value === 'Diğer' && !checked) {
            setOtherReasonText('');
        }
    };

    // İade talebini gönderme işlemi
    const handleSubmit = async () => {
        // En az bir neden seçildiğinden emin ol
        if (selectedReasons.length === 0) {
            alert('Lütfen en az bir iade nedeni seçin.');
            return;
        }
        // Eğer 'Diğer' seçiliyse ve metin alanı boşsa uyar
        if (selectedReasons.includes('Diğer') && !otherReasonText.trim()) {
             alert('Lütfen \'Diğer\' iade nedenini açıklayın.');
             return;
        }

        setLoading(true); // Yüklemeyi başlat

        // Seçilen nedenleri birleştir (Diğer açıklaması dahil)
        let finalReason = selectedReasons.filter(r => r !== 'Diğer').join(', ');
        if (selectedReasons.includes('Diğer') && otherReasonText.trim()) {
            finalReason += (finalReason ? '; ' : '') + `Diğer: ${otherReasonText.trim()}`;
        }

        // Ana component'ten gelen onSubmitReturn fonksiyonunu çağır
        await onSubmitReturn(finalReason);

        setLoading(false); // Yüklemeyi bitir
        // Başarılı gönderim sonrası state'leri sıfırla (opsiyonel, modal kapanacaksa)
        // setSelectedReasons([]);
        // setOtherReasonText('');
    };

    return (
        // Modal arkaplanı ve ortalama
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose} // Arka plana tıklayınca kapat
        >
            {/* Modal içeriği */}
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative transform transition-all"
                onClick={(e) => e.stopPropagation()} // İçeriğe tıklayınca kapanmasın
            >
                {/* Kapatma butonu */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 transition p-1"
                    aria-label="Kapat"
                >
                    <FiX size={24} />
                </button>

                {/* Başlık */}
                <h2 className="text-xl font-semibold text-gray-800 mb-4">İade Nedeni Seçin</h2>

                {/* İade Edilen Ürün Bilgisi */}
                <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg border">
                    <Image
                        src={getSafeImageUrl(orderItem.products.image_urls)}
                        alt={orderItem.products.name}
                        width={48}
                        height={48}
                        className="rounded-md object-cover w-12 h-12"
                    />
                    <div>
                        <p className="font-medium text-gray-700">{orderItem.products.name}</p>
                        <p className="text-xs text-gray-500">Adet: {orderItem.quantity}</p>
                    </div>
                </div>

                {/* İade Nedenleri Checkbox'ları */}
                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-2">
                    {RETURN_REASONS.map((reason) => (
                        <label key={reason} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-100">
                            <input
                                type="checkbox"
                                value={reason}
                                checked={selectedReasons.includes(reason)}
                                onChange={handleCheckboxChange}
                                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                            <span className="text-gray-700">{reason}</span>
                        </label>
                    ))}
                </div>

                {/* 'Diğer' nedeni için metin alanı */}
                {selectedReasons.includes('Diğer') && (
                    <div className="mb-6">
                        <label htmlFor="otherReason" className="block text-sm font-medium text-gray-600 mb-1">
                            Lütfen 'Diğer' nedenini belirtin:
                        </label>
                        <textarea
                            id="otherReason"
                            value={otherReasonText}
                            onChange={(e) => setOtherReasonText(e.target.value)}
                            rows={3}
                            className="w-full border border-gray-300 rounded-md p-2 focus:ring-orange-500 focus:border-orange-500 transition resize-none"
                            placeholder="İade nedeninizi buraya yazın..."
                            maxLength={250} // Karakter limiti (isteğe bağlı)
                        />
                    </div>
                )}

                {/* Gönder ve İptal Butonları */}
                <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || selectedReasons.length === 0 || (selectedReasons.includes('Diğer') && !otherReasonText.trim())} // Koşullar eklendi
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Gönderiliyor...' : 'İade Talebi Oluştur'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReturnReasonModal;