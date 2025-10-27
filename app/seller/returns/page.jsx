// app/seller/returns/page.jsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import Loading from '@/components/Loading';
import Image from 'next/image';
import { FiCheck, FiX, FiEdit, FiInfo } from 'react-icons/fi';
import { useAppContext } from '@/context/AppContext';
import FloatingLabelInput from '@/components/ui/FloatingLabelInput'; // Seller notları için

// Durum renkleri için yardımcı fonksiyon
const getReturnStatusColor = (status) => {
  switch (status) {
    case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'Approved': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'Rejected': return 'bg-red-100 text-red-800 border-red-300';
    case 'Processing': return 'bg-purple-100 text-purple-800 border-purple-300'; // İade kargosu bekleniyor/işleniyor
    case 'Completed': return 'bg-green-100 text-green-800 border-green-300'; // İade tamamlandı
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

// Satıcı notları için modal (opsiyonel ama kullanışlı)
const SellerNotesModal = ({ returnRequest, onClose, onSave }) => {
    const [notes, setNotes] = useState(returnRequest.seller_notes || '');
    const [loading, setLoading] = useState(false);

    const handleSaveNotes = async () => {
        setLoading(true);
        await onSave(returnRequest.id, notes);
        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex justify-between items-center p-5 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">Satıcı Notları Ekle/Düzenle</h2>
                    <button onClick={onClose}><FiX className="w-6 h-6 text-gray-500 hover:text-gray-800" /></button>
                </div>
                <div className="p-6 space-y-5">
                    <FloatingLabelInput
                        as="textarea"
                        id="seller_notes"
                        name="seller_notes"
                        label="Notlarınız (Müşteri görmeyecek)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                    />
                    <div className="flex justify-end gap-3">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">İptal</button>
                        <button onClick={handleSaveNotes} disabled={loading} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-orange-400">
                            {loading ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const ReturnsPage = () => {
  const { currency } = useAppContext();
  const [returnRequests, setReturnRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingNotesRequest, setEditingNotesRequest] = useState(null); // Not modalı için

  // İade taleplerini getiren fonksiyon
  const fetchReturnRequests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('return_requests')
      .select(`
        *,
        user:profiles(id, email),
        order:orders(id),
        order_item:order_items(
          id,
          quantity,
          price,
          product:products(id, name, image_urls)
        )
      `)
      .order('created_at', { ascending: false }); // En yeniden eskiye sırala

    if (error) {
      toast.error('İade talepleri alınamadı: ' + error.message);
      setReturnRequests([]);
    } else {
      setReturnRequests(data || []);
    }
    setLoading(false);
  }, []);

  // Component yüklendiğinde talepleri getir
  useEffect(() => {
    fetchReturnRequests();
  }, [fetchReturnRequests]);

  // İade talebi durumunu güncelleyen fonksiyon
  const handleUpdateStatus = async (requestId, newStatus) => {
    const { error } = await supabase
      .from('return_requests')
      .update({ status: newStatus })
      .eq('id', requestId);

    if (error) {
      toast.error('Durum güncellenemedi: ' + error.message);
    } else {
      toast.success(`İade durumu "${newStatus}" olarak güncellendi.`);
      // State'i de güncelle
      setReturnRequests(prev =>
        prev.map(req => req.id === requestId ? { ...req, status: newStatus } : req)
      );
    }
  };

  // Satıcı notlarını kaydeden fonksiyon
  const handleSaveNotes = async (requestId, notes) => {
    const { error } = await supabase
        .from('return_requests')
        .update({ seller_notes: notes })
        .eq('id', requestId);

    if (error) {
        toast.error('Notlar kaydedilemedi: ' + error.message);
    } else {
        toast.success('Satıcı notları güncellendi.');
        setReturnRequests(prev =>
            prev.map(req => req.id === requestId ? { ...req, seller_notes: notes } : req)
        );
    }
  };


  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-900 border-b pb-4">
        İade Talepleri Yönetimi
      </h1>

      {returnRequests.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">Bekleyen iade talebi bulunmuyor.</p>
      ) : (
        <div className="space-y-6">
          {returnRequests.map((req) => (
            <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b pb-4 mb-4">
                {/* Talep Bilgileri */}
                <div>
                  <p className="text-sm text-gray-500">Talep ID: <span className="font-medium text-gray-700">#{req.id.slice(0, 8)}</span></p>
                  <p className="text-sm text-gray-500">Sipariş ID: <span className="font-medium text-gray-700">#{req.order_id.slice(0, 8)}</span></p>
                  <p className="text-sm text-gray-500">Kullanıcı: <span className="font-medium text-gray-700">{req.user?.email || 'Bilinmiyor'}</span></p>
                  <p className="text-sm text-gray-500">Tarih: <span className="font-medium text-gray-700">{new Date(req.created_at).toLocaleString()}</span></p>
                </div>
                {/* Durum Seçimi */}
                <div className="flex flex-col items-start md:items-end gap-2">
                   <select
                        value={req.status}
                        onChange={(e) => handleUpdateStatus(req.id, e.target.value)}
                        className={`text-sm font-semibold rounded-full px-3 py-1.5 border focus:ring-2 focus:ring-orange-500 transition ${getReturnStatusColor(req.status)}`}
                    >
                        <option value="Pending">Beklemede</option>
                        <option value="Approved">Onaylandı (Kargo Bekleniyor)</option>
                        <option value="Rejected">Reddedildi</option>
                        <option value="Processing">İşleniyor (Ürün Geldi)</option>
                        <option value="Completed">Tamamlandı (İade Yapıldı)</option>
                    </select>
                    {/* Satıcı Notları Butonu */}
                    <button
                        onClick={() => setEditingNotesRequest(req)}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                        <FiEdit /> Not Ekle/Düzenle
                    </button>
                </div>
              </div>

              {/* Ürün ve Sebep Bilgisi */}
              <div className="flex flex-col sm:flex-row items-start gap-4">
                 <div className="w-20 h-20 relative rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                    <Image
                        src={req.order_item?.product?.image_urls?.[0] || "/assets/placeholder.jpg"}
                        alt={req.order_item?.product?.name || 'Ürün'}
                        fill
                        className="object-cover"
                    />
                 </div>
                 <div className="flex-grow">
                    <p className="font-semibold text-gray-800">{req.order_item?.product?.name || 'Bilinmeyen Ürün'}</p>
                    <p className="text-sm text-gray-600">Adet: {req.order_item?.quantity || '-'}</p>
                    <p className="text-sm text-gray-600">Fiyat: {currency}{(req.order_item?.price || 0).toFixed(2)}</p>
                    <p className="text-sm text-gray-600 mt-2"><b>İade Sebebi:</b> {req.reason}</p>
                    {req.seller_notes && (
                        <p className="text-xs text-gray-500 mt-1 bg-gray-100 p-2 rounded border italic">
                            <b>Satıcı Notu:</b> {req.seller_notes}
                        </p>
                    )}
                 </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Satıcı Notları Modal'ı */}
      {editingNotesRequest && (
        <SellerNotesModal
            returnRequest={editingNotesRequest}
            onClose={() => setEditingNotesRequest(null)}
            onSave={handleSaveNotes}
        />
      )}
    </div>
  );
};

export default ReturnsPage;