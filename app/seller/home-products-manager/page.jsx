// app/seller/home-products-manager/page.jsx

'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
// Yeni ikonlar: FiChevronUp, FiChevronDown eklendi
import { FiTrash2, FiPlusSquare, FiSave, FiChevronUp, FiChevronDown } from 'react-icons/fi'; 
import Loading from '@/components/Loading';
import Image from 'next/image';
import { getSafeImageUrl } from '@/lib/utils';

// Yeni ürünleri eklerken ve mevcut ürünleri sıralarken kullanacağımız sütun
const ORDER_COLUMN = 'home_display_order';
const ALL_PRODUCTS_LIMIT = 50; // Yönetim sayfasında gösterilecek toplam ürün limiti

export default function HomeProductsManager() {
  const [homeProducts, setHomeProducts] = useState([]); // Anasayfada gösterilecek ürünler (sıralı)
  const [availableProducts, setAvailableProducts] = useState([]); // Anasayfaya eklenebilecek tüm ürünler
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Drag & Drop kaldırıldığı için ref'ler temizlendi.

  // --- Veri Çekme Fonksiyonları ---

  // 1. Anasayfa ürünlerini ve sıralama bilgisini çeker
  const fetchHomeProducts = useCallback(async () => {
    // home_display_order > 0 olanları küçükten büyüğe sırala
    const { data, error } = await supabase
      .from('products')
      .select(`id, name, image_urls, ${ORDER_COLUMN}`)
      .not(ORDER_COLUMN, 'is', null) // Boş olmayanları al (NULL olmayanları)
      .gt(ORDER_COLUMN, 0) // Sadece 0'dan büyük olanları al
      .order(ORDER_COLUMN, { ascending: true });

    if (error) {
      toast.error('Anasayfa ürünleri alınamadı.');
      return [];
    }
    return data || [];
  }, []);

  // 2. Anasayfaya eklenmemiş ürünleri çeker
  const fetchAvailableProducts = useCallback(async () => {
    // home_display_order NULL veya 0 olanları al
    const { data, error } = await supabase
      .from('products')
      .select('id, name, image_urls')
      .or(`${ORDER_COLUMN}.is.null,${ORDER_COLUMN}.eq.0`) // NULL veya 0 olanları seç
      .limit(ALL_PRODUCTS_LIMIT); // Performans için limit

    if (error) {
      toast.error('Mevcut ürünler alınamadı.');
      return [];
    }
    return data || [];
  }, []);


  const fetchData = useCallback(async () => {
    setLoading(true);
    const [homeData, availableData] = await Promise.all([
      fetchHomeProducts(),
      fetchAvailableProducts(),
    ]);

    // Ürünlerin doğru sıralanmış olmasını sağlamak için order alanını alıyoruz.
    const sortedHomeData = homeData.sort((a, b) => (a[ORDER_COLUMN] || 0) - (b[ORDER_COLUMN] || 0));

    setHomeProducts(sortedHomeData);
    setAvailableProducts(availableData);
    setLoading(false);
  }, [fetchHomeProducts, fetchAvailableProducts]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- YENİ SIRALAMA MANTIKLARI (UP/DOWN BUTONLARI) ---

  const handleMove = (index, direction) => {
    // Yön (direction) -1: yukarı, 1: aşağı
    const newIndex = index + direction;

    // Sınır kontrolü
    if (newIndex < 0 || newIndex >= homeProducts.length) {
      return;
    }

    // Ürünlerin kopyasını oluştur
    const newProducts = [...homeProducts];
    
    // Öğeleri yer değiştir
    [newProducts[index], newProducts[newIndex]] = [newProducts[newIndex], newProducts[index]];

    // State'i güncelle
    setHomeProducts(newProducts);
    toast.success('Sıralama yerel olarak değiştirildi. Kaydetmeyi unutmayın!', { duration: 1000 });
  };
  
  // --- Aksiyon Fonksiyonları ---

  // Sıralamayı Veritabanına Kaydet
  const handleSaveOrder = async () => {
    setSaving(true);
    const toastId = toast.loading('Sıralama güncelleniyor...');

    const updatePromises = homeProducts.map((product, index) => {
      // Yeni sıralama 1'den başlar (index + 1)
      const newOrder = index + 1;
      return supabase
        .from('products')
        .update({ [ORDER_COLUMN]: newOrder })
        .eq('id', product.id);
    });

    const results = await Promise.all(updatePromises);
    const hasError = results.some((r) => r.error);

    if (hasError) {
      toast.error('Sıralama kaydedilirken hata oluştu!', { id: toastId });
    } else {
      toast.success('Sıralama başarıyla güncellendi!', { id: toastId });
    }
    setSaving(false);
    fetchData(); // Verileri yeniden çek ve sıralamanın doğru olduğunu kontrol et
  };

  // Anasayfa Ürünü Sil (Sıralamadan Çıkar)
  const handleRemoveFromHome = async (productId) => {
    if (!confirm('Bu ürünü anasayfadan kaldırmak istediğinize emin misiniz?')) return;
    
    setSaving(true);
    const toastId = toast.loading('Ürün anasayfadan kaldırılıyor...');

    // home_display_order'ı 0 yapıyoruz 
    const { error } = await supabase
      .from('products')
      .update({ [ORDER_COLUMN]: 0 }) 
      .eq('id', productId);

    if (error) {
      toast.error('Ürün kaldırılamadı: ' + error.message, { id: toastId });
    } else {
      toast.success('Ürün anasayfadan kaldırıldı.', { id: toastId });
      // Yerel state'i güncelle
      await fetchData(); // Verileri yeniden çek
    }
    setSaving(false);
  };
  
  // Mevcut ürünü anasayfaya ekle
  const handleAddToHome = async (product) => {
    setSaving(true);
    const toastId = toast.loading(`${product.name} anasayfaya ekleniyor...`);
    
    // Mevcut en yüksek sırayı bul ve bir fazlasını kullan
    const maxOrder = homeProducts.reduce((max, p) => Math.max(max, p[ORDER_COLUMN] || 0), 0);
    const newOrder = maxOrder + 1;
    
    const { error } = await supabase
      .from('products')
      .update({ [ORDER_COLUMN]: newOrder })
      .eq('id', product.id);

    if (error) {
      toast.error('Ürün eklenemedi: ' + error.message, { id: toastId });
    } else {
      toast.success(`${product.name} anasayfaya eklendi.`, { id: toastId });
      fetchData(); // Listeleri yenile
    }
    setSaving(false);
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-extrabold mb-8 text-center text-gray-900 border-b pb-4">
        🏡 Anasayfa Ürünleri Yönetimi
      </h1>
      
      {/* --- Kaydet Butonu --- */}
      <div className="flex justify-end mb-6 sticky top-20 z-10">
        <button
          onClick={handleSaveOrder}
          disabled={saving || homeProducts.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition shadow-lg text-lg disabled:opacity-50"
        >
          <FiSave className="w-5 h-5" />
          {saving ? 'Kaydediliyor...' : 'Sıralamayı Kaydet'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* --- 1. Anasayfa Ürünleri ve Sıralama (BUTONLU TASARIM) --- */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-fit">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
            Anasayfa Ürün Sıralaması ({homeProducts.length} adet)
          </h2>
          {homeProducts.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              Anasayfada gösterilecek ürün seçilmemiş.
            </p>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 home-products-sort-container"> 
              {homeProducts.map((product, index) => (
                <div
                  key={product.id}
                  data-index={index}
                  // Mobilde dikey yerleşim ve butonların genişlemesi için sınıflar ayarlandı.
                  className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-orange-50 transition-all group"
                >
                  
                  {/* Sol Kısım: Sıra, Görsel ve İsim */}
                  <div className="flex items-center gap-3 w-full sm:w-auto pb-3 sm:pb-0">
                    <span className="font-bold text-lg text-orange-600">{index + 1}.</span>
                    <Image
                      src={getSafeImageUrl(product.image_urls)}
                      alt={product.name}
                      width={50}
                      height={50}
                      className="rounded-md object-cover flex-shrink-0"
                    />
                    <p className="font-medium text-gray-800 truncate">{product.name}</p>
                  </div>
                  
                  {/* Sağ Kısım: Butonlar */}
                  <div className="flex items-center gap-2 pt-3 sm:pt-0 border-t border-gray-200 sm:border-t-0 w-full sm:w-auto justify-end">
                    
                    {/* Yukarı Taşı Butonu */}
                    <button
                      onClick={() => handleMove(index, -1)}
                      disabled={index === 0 || saving}
                      className="flex-1 sm:flex-none p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed border border-indigo-200"
                      title="Yukarı Taşı"
                    >
                      <FiChevronUp className="w-5 h-5 mx-auto" />
                    </button>
                    
                    {/* Aşağı Taşı Butonu */}
                    <button
                      onClick={() => handleMove(index, 1)}
                      disabled={index === homeProducts.length - 1 || saving}
                      className="flex-1 sm:flex-none p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed border border-indigo-200"
                      title="Aşağı Taşı"
                    >
                      <FiChevronDown className="w-5 h-5 mx-auto" />
                    </button>
                    
                    {/* Kaldır Butonu (Mobilde Görünür) */}
                    <button
                      onClick={() => handleRemoveFromHome(product.id)}
                      disabled={saving}
                      className="flex-1 sm:flex-none p-2 text-red-600 hover:bg-red-100 rounded-lg transition disabled:opacity-50 border border-red-200"
                      title="Anasayfadan Kaldır"
                    >
                      <FiTrash2 className="w-5 h-5 mx-auto" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- 2. Mevcut Ürünler (Ekleme Listesi) --- */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-fit">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
            Anasayfaya Eklenebilecek Diğer Ürünler ({availableProducts.length} adet)
          </h2>
          {availableProducts.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              Eklenebilecek başka ürün bulunmuyor.
            </p>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2"> 
              {availableProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-indigo-50 transition"
                >
                  <div className="flex items-center gap-3 truncate">
                    <Image
                      src={getSafeImageUrl(product.image_urls)}
                      alt={product.name}
                      width={50}
                      height={50}
                      className="rounded-md object-cover flex-shrink-0"
                    />
                    <p className="font-medium text-gray-800 truncate">{product.name}</p>
                  </div>
                  <button
                    onClick={() => handleAddToHome(product)}
                    disabled={saving}
                    className="flex-shrink-0 flex items-center gap-1 text-sm px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    <FiPlusSquare className="w-4 h-4" /> Ekle
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}