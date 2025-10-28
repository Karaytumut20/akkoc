// app/seller/return-requests/page.jsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Loading from '@/components/Loading';
import toast from 'react-hot-toast';
import { FiRefreshCw, FiCheck, FiXCircle, FiTruck } from 'react-icons/fi'; // Durum ikonları

// Durum renklerini belirleyen yardımcı fonksiyon
const getStatusBadge = (status) => {
  switch (status) {
    case 'pending':
      return { text: 'Beklemede', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' };
    case 'approved':
      return { text: 'Onaylandı', color: 'bg-blue-100 text-blue-700 border-blue-300' };
    case 'rejected':
      return { text: 'Reddedildi', color: 'bg-red-100 text-red-700 border-red-300' };
    case 'processing':
      return { text: 'İşleniyor', color: 'bg-purple-100 text-purple-700 border-purple-300' };
    case 'completed':
      return { text: 'Tamamlandı', color: 'bg-green-100 text-green-700 border-green-300' };
    default:
      return { text: status, color: 'bg-gray-100 text-gray-700 border-gray-300' };
  }
};

const ReturnRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null); // Hangi talebin durumu güncelleniyor

  // İade taleplerini çeken fonksiyon
  const fetchReturnRequests = useCallback(async () => {
    setLoading(true);
    // Sipariş bilgileri ve kullanıcı email'i ile birlikte talepleri çekiyoruz
    // Kullanıcı email'i için RPC fonksiyonu kullanmak daha güvenli olabilir,
    // ancak şimdilik direkt join yapıyoruz (RLS ayarlarınıza bağlı).
    // Eğer profiles tablonuz varsa ve user_id ile eşleşiyorsa join yapabilirsiniz.
    // Şimdilik sadece order_id ve user_id alıyoruz.
    const { data, error } = await supabase
      .from('return_requests')
      .select(`
        *,
        order:orders ( id, total_amount ),
        user:profiles ( email, full_name )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('İade talepleri alınamadı: ' + error.message);
      setRequests([]);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  }, []);

  // Component yüklendiğinde talepleri çek
  useEffect(() => {
    fetchReturnRequests();
  }, [fetchReturnRequests]);

  // Durumu güncelleme fonksiyonu (Opsiyonel)
  const handleStatusUpdate = async (requestId, newStatus) => {
    setUpdatingStatus(requestId); // Yükleniyor durumunu ayarla
    const { error } = await supabase
      .from('return_requests')
      .update({ status: newStatus })
      .eq('id', requestId);

    setUpdatingStatus(null); // Yükleniyor durumunu kaldır

    if (error) {
      toast.error('Durum güncellenemedi: ' + error.message);
    } else {
      toast.success('İade durumu güncellendi!');
      // State'i anlık güncellemek yerine listeyi tekrar çekmek daha güvenilir
      fetchReturnRequests();
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-900 border-b pb-4">
        İade Talepleri Yönetimi
      </h1>

      {requests.length === 0 ? (
        <p className="text-center text-xl text-gray-500 py-10">
          Henüz iade talebi bulunmuyor.
        </p>
      ) : (
        <div className="overflow-x-auto shadow-lg rounded-xl border border-gray-100 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3 sm:px-6">Talep ID</th>
                <th className="px-4 py-3 sm:px-6">Sipariş ID</th>
                <th className="px-4 py-3 sm:px-6">Kullanıcı</th>
                <th className="px-4 py-3 sm:px-6">Tarih</th>
                <th className="px-4 py-3 sm:px-6">Nedenler</th>
                <th className="px-4 py-3 sm:px-6">Durum</th>
                <th className="px-4 py-3 sm:px-6 text-center">İşlemler (Opsiyonel)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((req) => {
                const { text: statusText, color: statusColor } = getStatusBadge(req.status);
                const isUpdating = updatingStatus === req.id;

                return (
                  <tr key={req.id} className="hover:bg-indigo-50/20 transition duration-150 text-sm">
                    <td className="px-4 py-3 sm:px-6 font-mono text-xs text-gray-500">{req.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 sm:px-6 font-mono text-xs text-blue-600 hover:underline">
                        <a href={`/seller/orders?orderId=${req.order?.id}`} title="Siparişi Gör"> {/* Sipariş detayına link (varsayımsal) */}
                           #{req.order?.id?.slice(0, 8) || 'N/A'}
                        </a>
                    </td>
                     <td className="px-4 py-3 sm:px-6 text-gray-700">
                        {req.user?.full_name || req.user?.email || 'Bilinmiyor'}
                    </td>
                    <td className="px-4 py-3 sm:px-6 text-gray-500">{new Date(req.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 sm:px-6 text-gray-600 max-w-xs">
                      {/* Nedenleri liste olarak göster */}
                      <ul className="list-disc list-inside text-xs">
                        {(req.reasons || []).map((reason, index) => (
                          <li key={index}>{reason}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3 sm:px-6">
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border ${statusColor}`}>
                        {statusText}
                      </span>
                    </td>
                    {/* Opsiyonel Durum Güncelleme Butonları */}
                    <td className="px-4 py-3 sm:px-6 text-center">
                       {/* Basit butonlar veya bir dropdown ile durum değiştirilebilir */}
                       <select
                         value={req.status}
                         onChange={(e) => handleStatusUpdate(req.id, e.target.value)}
                         disabled={isUpdating}
                         className={`text-xs p-1 border rounded ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''} ${statusColor}`}
                       >
                         <option value="pending">Beklemede</option>
                         <option value="approved">Onaylandı</option>
                         <option value="rejected">Reddedildi</option>
                         <option value="processing">İşleniyor</option>
                         <option value="completed">Tamamlandı</option>
                       </select>
                       {isUpdating && <FiRefreshCw className="inline-block animate-spin ml-1 text-gray-500" />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReturnRequestsPage;