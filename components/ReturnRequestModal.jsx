// components/ReturnRequestModal.jsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';
import { FiX } from 'react-icons/fi';
import FloatingLabelInput from './ui/FloatingLabelInput'; // Mevcut input component'ınız

// İade sebepleri için seçenekler (isteğe bağlı)
const RETURN_REASONS = [
  "Ürün hasarlı geldi",
  "Yanlış ürün gönderildi",
  "Ürünü beğenmedim",
  "Bedeni uymadı",
  "Diğer",
];

const ReturnRequestModal = ({ orderItem, orderId, onClose, onReturnRequested }) => {
  const { user } = useAppContext();
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState(''); // "Diğer" seçilirse kullanılacak
  const [loading, setLoading] = useState(false);

  // İade talebini veritabanına gönderen fonksiyon
  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    // Kullanıcı girişi kontrolü
    if (!user) {
      toast.error('İade talebi oluşturmak için giriş yapmalısınız.');
      return;
    }
    // Sebep seçimi kontrolü
    if (!reason || (reason === 'Diğer' && !customReason.trim())) {
      toast.error('Lütfen bir iade sebebi belirtin.');
      return;
    }

    setLoading(true); // Yükleme durumunu başlat

    // Gönderilecek iade sebebi
    const finalReason = reason === 'Diğer' ? customReason.trim() : reason;

    try {
      // Supabase'e iade talebini ekle
      const { error } = await supabase
        .from('return_requests') // Yeni oluşturduğunuz tablonun adı
        .insert({
          user_id: user.id,
          order_id: orderId,
          order_item_id: orderItem.id, // Hangi sipariş öğesinin iade edildiği
          reason: finalReason,
          status: 'Pending', // Başlangıç durumu
        });

      // Hata kontrolü
      if (error) throw error;

      toast.success('İade talebiniz başarıyla alındı.');
      onReturnRequested(); // Talep sonrası listeyi yenilemek için callback
      onClose(); // Modalı kapat
    } catch (error) {
      console.error('İade talebi hatası:', error);
      // Spesifik Supabase hatalarını kontrol edebilirsiniz (örn: duplicate)
      toast.error(`İade talebi oluşturulurken bir hata oluştu: ${error.message}`);
    } finally {
      setLoading(false); // Yükleme durumunu bitir
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative">
        {/* Kapatma Butonu */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition"
          aria-label="Kapat"
        >
          <FiX className="w-6 h-6" />
        </button>

        <form onSubmit={handleSubmitReturn} className="p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6 border-b pb-3">
            İade Talebi Oluştur
          </h2>

          {/* İade Edilen Ürün Bilgisi */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border flex items-center gap-4">
            <div className="w-16 h-16 relative rounded-md overflow-hidden flex-shrink-0">
              <Image
                src={orderItem.products?.image_urls?.[0] || "/assets/placeholder.jpg"}
                alt={orderItem.products?.name || 'Ürün'}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="font-medium text-gray-800">{orderItem.products?.name}</p>
              <p className="text-sm text-gray-600">Adet: {orderItem.quantity}</p>
            </div>
          </div>

          {/* İade Sebebi Seçimi */}
          <div className="mb-6">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              İade Sebebi <span className="text-red-500">*</span>
            </label>
            <select
              id="reason"
              name="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#be531c]"
            >
              <option value="" disabled>-- Bir sebep seçin --</option>
              {RETURN_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* "Diğer" seçilirse açılacak alan */}
          {reason === 'Diğer' && (
            <div className="mb-8">
              <FloatingLabelInput
                as="textarea"
                id="customReason"
                name="customReason"
                label="Lütfen iade sebebinizi detaylandırın"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                required
                rows={3}
              />
            </div>
          )}

          {/* Gönder Butonu */}
          <div className="flex justify-end gap-3">
            <button
              type="button" // Formu submit etmemesi için type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium disabled:bg-orange-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Gönderiliyor...' : 'İade Talebi Gönder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnRequestModal;