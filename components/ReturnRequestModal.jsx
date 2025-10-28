// components/ReturnRequestModal.jsx

'use client';

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext'; // AppContext'i import et
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';

// Olası iade nedenleri listesi
const RETURN_REASONS = [
  'Ürün hasarlı geldi',
  'Yanlış ürün gönderildi',
  'Fikrimi değiştirdim',
  'Ürün beden/ölçü olarak uymadı',
  'Beklediğim kalitede değil',
  'Açıklama ile uyuşmuyor',
  'Diğer',
];

const ReturnRequestModal = ({ isOpen, onClose, order }) => {
  const { user, submitReturnRequest } = useAppContext(); // submitReturnRequest fonksiyonunu context'ten al
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [otherReasonText, setOtherReasonText] = useState(''); // "Diğer" seçeneği için metin alanı
  const [loading, setLoading] = useState(false);

  // Modal kapandığında state'leri sıfırla
  useEffect(() => {
    if (!isOpen) {
      setSelectedReasons([]);
      setOtherReasonText('');
      setLoading(false);
    }
  }, [isOpen]);

  // Checkbox değişimini yöneten fonksiyon
  const handleCheckboxChange = (event) => {
    const { value, checked } = event.target;
    if (checked) {
      setSelectedReasons((prev) => [...prev, value]);
    } else {
      setSelectedReasons((prev) => prev.filter((reason) => reason !== value));
      // Eğer "Diğer" seçeneği kaldırılırsa, metin alanını da temizle
      if (value === 'Diğer') {
        setOtherReasonText('');
      }
    }
  };

  // İade talebini gönderme fonksiyonu
  const handleSubmit = async () => {
    if (!user || !order) return; // Kullanıcı veya sipariş yoksa işlem yapma
    if (selectedReasons.length === 0) {
      return toast.error('Lütfen en az bir iade nedeni seçin.');
    }
    // "Diğer" seçiliyse ama metin boşsa hata ver
    if (selectedReasons.includes('Diğer') && !otherReasonText.trim()) {
      return toast.error('Lütfen "Diğer" nedenini açıklayın.');
    }

    setLoading(true);

    // "Diğer" seçeneği varsa, açıklamasını da nedenlere ekle
    const reasonsToSubmit = selectedReasons.map(reason =>
      reason === 'Diğer' ? `Diğer: ${otherReasonText.trim()}` : reason
    );

    // Context'teki fonksiyonu çağır
    const success = await submitReturnRequest(order.id, reasonsToSubmit);

    setLoading(false);

    if (success) {
      toast.success('İade talebiniz başarıyla alındı.');
      onClose(); // Başarılı olursa modal'ı kapat
    }
    // Hata mesajı submitReturnRequest içinde gösterilecek
  };

  if (!isOpen || !order) return null; // Modal açık değilse veya sipariş yoksa null döndür

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex justify-center items-center p-4 transition-opacity duration-300">
      <div className="bg-white rounded-lg w-full max-w-lg shadow-2xl transform transition-all duration-300 scale-95 opacity-0 animate-scale-in">
        <div className="p-6">
          {/* Başlık ve Kapatma Butonu */}
          <div className="flex justify-between items-center border-b pb-3 mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              İade Talebi Oluştur (#{order.id.slice(0, 8)})
            </h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-500 hover:text-gray-800 transition disabled:opacity-50"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* İade Nedenleri */}
          <div className="space-y-4 mb-6">
            <p className="text-gray-700 font-medium">İade Nedeniniz Nedir? (Birden fazla seçebilirsiniz)</p>
            {RETURN_REASONS.map((reason) => (
              <label key={reason} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                <input
                  type="checkbox"
                  value={reason}
                  checked={selectedReasons.includes(reason)}
                  onChange={handleCheckboxChange}
                  disabled={loading}
                  className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-gray-700">{reason}</span>
              </label>
            ))}
            {/* "Diğer" seçeneği seçiliyse açıklama alanı */}
            {selectedReasons.includes('Diğer') && (
              <div className="pl-8 mt-2">
                <textarea
                  value={otherReasonText}
                  onChange={(e) => setOtherReasonText(e.target.value)}
                  placeholder="Lütfen iade nedeninizi açıklayın..."
                  rows={3}
                  maxLength={250} // Karakter sınırı (isteğe bağlı)
                  disabled={loading}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                />
                 <p className="text-xs text-gray-400 text-right">{otherReasonText.length}/250</p>
              </div>
            )}
          </div>

          {/* Gönder Butonu */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold disabled:opacity-50"
            >
              İptal
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || selectedReasons.length === 0 || (selectedReasons.includes('Diğer') && !otherReasonText.trim())}
              className="px-5 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold disabled:bg-orange-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Gönderiliyor...' : 'İade Talebi Gönder'}
            </button>
          </div>
        </div>
      </div>
      {/* Basit scale-in animasyonu */}
      <style jsx>{`
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scaleIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ReturnRequestModal;

// Stil için globals.css veya tailwind.config.js'e ekleme yapmanız gerekebilir:
/*
@layer utilities {
  .animate-scale-in {
    animation: scaleIn 0.2s ease-out forwards;
  }
}
@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
*/