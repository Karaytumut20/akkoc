// app/seller/settings/page.jsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import Loading from '@/components/Loading'; // Loading component'ını import etmeyi unutma
import { FiSave, FiCheckCircle, FiCircle } from 'react-icons/fi';

const SETTING_KEY = 'review_permission';

const SettingsPage = () => {
  const [reviewPermission, setReviewPermission] = useState('purchasers_only'); // Default
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Mevcut ayarı çek
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('store_settings')
      .select('setting_value')
      .eq('setting_key', SETTING_KEY)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: No rows found hatasını görmezden gel
      toast.error('Ayarlar alınamadı: ' + error.message);
    } else if (data) {
      setReviewPermission(data.setting_value);
    } else {
      // Eğer ayar hiç yoksa, varsayılanı (purchasers_only) ekleyelim
      await supabase.from('store_settings').insert({ setting_key: SETTING_KEY, setting_value: 'purchasers_only' });
      setReviewPermission('purchasers_only');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Ayarı güncelle
  const handleSaveSettings = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('store_settings')
      .update({ setting_value: reviewPermission })
      .eq('setting_key', SETTING_KEY);

    if (error) {
      toast.error('Ayarlar kaydedilemedi: ' + error.message);
    } else {
      toast.success('Yorum ayarları başarıyla güncellendi!');
    }
    setSaving(false);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-900 border-b pb-4">
        Mağaza Ayarları
      </h1>

      <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Yorum Yapma İzinleri</h2>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Ürünlere kimlerin yorum yapabileceğini buradan ayarlayabilirsiniz.
          </p>

          {/* Seçenek 1: Sadece Satın Alanlar */}
          <label
            className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition ${
              reviewPermission === 'purchasers_only' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name="reviewPermission"
              value="purchasers_only"
              checked={reviewPermission === 'purchasers_only'}
              onChange={(e) => setReviewPermission(e.target.value)}
              className="hidden" // Radio butonunu gizleyip kendi ikonumuzu kullanacağız
            />
            {reviewPermission === 'purchasers_only' ? (
              <FiCheckCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
            ) : (
              <FiCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
            )}
            <div>
              <span className="font-medium text-gray-800">Sadece Satın Alanlar</span>
              <p className="text-xs text-gray-500">Yalnızca ürünü satın almış kullanıcılar yorum yapabilir.</p>
            </div>
          </label>

          {/* Seçenek 2: Tüm Giriş Yapmış Kullanıcılar */}
          <label
            className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition ${
              reviewPermission === 'all_users' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name="reviewPermission"
              value="all_users"
              checked={reviewPermission === 'all_users'}
              onChange={(e) => setReviewPermission(e.target.value)}
              className="hidden"
            />
             {reviewPermission === 'all_users' ? (
              <FiCheckCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
            ) : (
              <FiCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
            )}
            <div>
              <span className="font-medium text-gray-800">Tüm Giriş Yapmış Kullanıcılar</span>
              <p className="text-xs text-gray-500">Giriş yapmış olan herhangi bir kullanıcı yorum yapabilir.</p>
            </div>
          </label>
        </div>

        {/* Kaydet Butonu */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiSave className="w-4 h-4" />
            {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;