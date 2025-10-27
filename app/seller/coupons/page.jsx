// app/seller/coupons/page.jsx (Yeni dosya oluştur)

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import Loading from '@/components/Loading';
import FloatingLabelInput from '@/components/ui/FloatingLabelInput';
import { FiPlus, FiTrash2, FiEdit, FiToggleLeft, FiToggleRight } from 'react-icons/fi';

const CouponManagementPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false); // Form submit veya silme/güncelleme için
  const [editingCoupon, setEditingCoupon] = useState(null); // Düzenlenen kuponun ID'si
  
  // Yeni veya düzenlenecek kupon formu state'i
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage', // Default type
    discount_value: '',
    min_purchase_amount: '',
    max_discount_amount: '',
    expires_at: '',
    usage_limit: '',
    is_active: true,
  });

  // Mevcut kuponları çek
  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Kuponlar alınamadı: ' + error.message);
      setCoupons([]);
    } else {
      setCoupons(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  // Form değişikliklerini handle et
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  
  // Formu temizle
  const resetForm = () => {
    setFormData({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        min_purchase_amount: '',
        max_discount_amount: '',
        expires_at: '',
        usage_limit: '',
        is_active: true,
      });
      setEditingCoupon(null); // Düzenleme modundan çık
  };

  // Yeni kupon ekle veya mevcut kuponu güncelle
  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    const toastId = toast.loading(editingCoupon ? 'Kupon güncelleniyor...' : 'Kupon ekleniyor...');

    // Veri dönüşümleri ve temizleme
    const dataToSubmit = {
      ...formData,
      code: formData.code.toUpperCase().trim(), // Kodu büyük harfe çevir ve boşlukları temizle
      discount_value: parseFloat(formData.discount_value) || 0,
      min_purchase_amount: formData.min_purchase_amount ? parseFloat(formData.min_purchase_amount) : null,
      max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
      expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
    };
    
    // Basit doğrulama
    if (!dataToSubmit.code || dataToSubmit.discount_value <= 0) {
        toast.error('Kupon kodu ve indirim değeri zorunludur ve değer 0\'dan büyük olmalıdır.', { id: toastId });
        setActionLoading(false);
        return;
    }
    if (dataToSubmit.discount_type === 'percentage' && (dataToSubmit.discount_value > 100)) {
        toast.error('Yüzdelik indirim 100\'den büyük olamaz.', { id: toastId });
        setActionLoading(false);
        return;
    }


    let error;
    if (editingCoupon) {
      // Güncelleme işlemi
      const { error: updateError } = await supabase
        .from('coupons')
        .update(dataToSubmit)
        .eq('id', editingCoupon);
      error = updateError;
    } else {
      // Ekleme işlemi
      const { error: insertError } = await supabase
        .from('coupons')
        .insert([dataToSubmit]);
      error = insertError;
    }

    if (error) {
      // Unique constraint hatasını kontrol et (code zaten varsa)
      if (error.code === '23505') {
          toast.error(`'${dataToSubmit.code}' kodlu kupon zaten mevcut!`, { id: toastId });
      } else {
          toast.error(`Hata: ${error.message}`, { id: toastId });
      }
    } else {
      toast.success(editingCoupon ? 'Kupon başarıyla güncellendi!' : 'Kupon başarıyla eklendi!', { id: toastId });
      resetForm();
      fetchCoupons(); // Listeyi yenile
    }

    setActionLoading(false);
  };
  
  // Kuponu sil
  const handleDelete = async (id, code) => {
    if (!confirm(`'${code}' kodlu kuponu silmek istediğinize emin misiniz?`)) return;
    setActionLoading(true); // Silme işlemi için de loading kullanılabilir
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    setActionLoading(false);
    if (error) {
        toast.error('Kupon silinirken hata oluştu: ' + error.message);
    } else {
        toast.success('Kupon silindi!');
        fetchCoupons(); // Listeyi yenile
        if (editingCoupon === id) { // Eğer silinen kupon düzenleniyorsa formu resetle
            resetForm();
        }
    }
  };
  
  // Düzenleme modunu başlat
  const startEditing = (coupon) => {
    setEditingCoupon(coupon.id);
    setFormData({
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_purchase_amount: coupon.min_purchase_amount || '',
        max_discount_amount: coupon.max_discount_amount || '',
        // Tarih formatını input[type=datetime-local] için uygun hale getir
        expires_at: coupon.expires_at ? coupon.expires_at.substring(0, 16) : '', 
        usage_limit: coupon.usage_limit || '',
        is_active: coupon.is_active,
    });
    // Formun olduğu yere scroll yap (opsiyonel)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Kupon aktif/pasif durumunu değiştir
   const toggleActiveStatus = async (coupon) => {
       setActionLoading(true); // Butona özgü loading daha iyi olurdu ama şimdilik genel kullanalım
       const newStatus = !coupon.is_active;
       const { error } = await supabase
           .from('coupons')
           .update({ is_active: newStatus })
           .eq('id', coupon.id);
        setActionLoading(false);
       if (error) {
           toast.error('Durum güncellenirken hata oluştu.');
       } else {
           toast.success(`Kupon ${newStatus ? 'aktif' : 'pasif'} edildi.`);
           fetchCoupons(); // Listeyi yenile
       }
   };


  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-900 border-b pb-4">
        🏷️ Kupon Yönetimi
      </h1>

      {/* Kupon Ekleme/Düzenleme Formu */}
      <form onSubmit={handleSubmit} className="mb-10 p-6 bg-white rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">
          {editingCoupon ? 'Kuponu Düzenle' : 'Yeni Kupon Oluştur'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sol Sütun */}
          <div className="space-y-6">
            <FloatingLabelInput id="code" name="code" label="Kupon Kodu (Örn: INDIRIM20)" value={formData.code} onChange={handleFormChange} required />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">İndirim Türü</label>
              <select name="discount_type" value={formData.discount_type} onChange={handleFormChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-orange-500 focus:border-orange-500 transition h-[44px]">
                <option value="percentage">Yüzdelik (%)</option>
                <option value="fixed_amount">Sabit Tutar ($)</option>
              </select>
            </div>

            <FloatingLabelInput id="discount_value" name="discount_value" type="number" label={formData.discount_type === 'percentage' ? 'İndirim Yüzdesi (%)' : 'İndirim Tutarı ($)'} value={formData.discount_value} onChange={handleFormChange} required step="0.01" min="0" />
            
            {formData.discount_type === 'percentage' && (
                 <FloatingLabelInput id="max_discount_amount" name="max_discount_amount" type="number" label="Maksimum İndirim Tutarı ($) (Opsiyonel)" value={formData.max_discount_amount} onChange={handleFormChange} step="0.01" min="0" />
            )}
           
          </div>

          {/* Sağ Sütun */}
          <div className="space-y-6">
             <FloatingLabelInput id="min_purchase_amount" name="min_purchase_amount" type="number" label="Minimum Sepet Tutarı ($) (Opsiyonel)" value={formData.min_purchase_amount} onChange={handleFormChange} step="0.01" min="0" />
            <FloatingLabelInput id="usage_limit" name="usage_limit" type="number" label="Toplam Kullanım Limiti (Opsiyonel)" value={formData.usage_limit} onChange={handleFormChange} step="1" min="0" />

            <FloatingLabelInput 
                id="expires_at" 
                name="expires_at" 
                type="datetime-local" // Tarayıcı tarih/saat seçici
                label="Son Geçerlilik Tarihi (Opsiyonel)" 
                value={formData.expires_at} 
                onChange={handleFormChange} 
                // Placeholder gibi davranması için, input boşsa label üstte kalır
                className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-orange-500 focus:border-orange-500 transition ${formData.expires_at ? 'pt-4 pb-1' : 'py-2'} peer bg-white`}
            />

             <div className="flex items-center pt-2">
                 <input 
                    type="checkbox" 
                    id="is_active" 
                    name="is_active" 
                    checked={formData.is_active} 
                    onChange={handleFormChange}
                    className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500" 
                 />
                 <label htmlFor="is_active" className="ml-2 block text-sm font-medium text-gray-700">Kupon Aktif Mi?</label>
            </div>
          </div>
        </div>
        
        {/* Butonlar */}
        <div className="mt-8 flex justify-end gap-3">
          {editingCoupon && (
              <button 
                type="button" 
                onClick={resetForm} 
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
              >
                  İptal
              </button>
          )}
          <button type="submit" disabled={actionLoading} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition shadow-md disabled:opacity-50 flex items-center gap-2">
            <FiPlus className="w-5 h-5" />
            {editingCoupon ? 'Güncelle' : 'Kupon Ekle'}
          </button>
        </div>
      </form>

      {/* Mevcut Kuponlar Listesi */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mt-10">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Mevcut Kuponlar</h2>
        {loading ? (
          <Loading />
        ) : coupons.length === 0 ? (
          <p className="text-center text-gray-500 py-6">Henüz oluşturulmuş kupon yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kod</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İndirim</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Limitler</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kullanım</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {coupons.map(coupon => (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">{coupon.code}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {coupon.discount_type === 'percentage' 
                            ? `${coupon.discount_value}%` 
                            : `$${coupon.discount_value.toFixed(2)}`}
                        {coupon.max_discount_amount && coupon.discount_type === 'percentage' && (
                             <span className="text-xs text-gray-500 ml-1">(Max ${coupon.max_discount_amount.toFixed(2)})</span>
                        )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {coupon.min_purchase_amount ? `Min $${coupon.min_purchase_amount.toFixed(2)}` : '-'}
                        <br/>
                        {coupon.expires_at ? `Exp: ${new Date(coupon.expires_at).toLocaleDateString()}` : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {coupon.usage_count} / {coupon.usage_limit || '∞'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                       <button onClick={() => toggleActiveStatus(coupon)} disabled={actionLoading} className={`p-1 rounded-full transition ${actionLoading ? 'opacity-50' : ''}`}>
                          {coupon.is_active ? (
                            <FiToggleRight className="w-6 h-6 text-green-500" />
                           ) : (
                             <FiToggleLeft className="w-6 h-6 text-gray-400" />
                           )}
                       </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button onClick={() => startEditing(coupon)} className="text-indigo-600 hover:text-indigo-900 transition">
                         <FiEdit/>
                      </button>
                      <button onClick={() => handleDelete(coupon.id, coupon.code)} disabled={actionLoading} className="text-red-600 hover:text-red-900 transition disabled:opacity-50">
                         <FiTrash2/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CouponManagementPage;