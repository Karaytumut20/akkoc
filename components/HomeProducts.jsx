// components/HomeProducts.jsx

'use client'
import { useState, useEffect, useMemo } from "react";
import ProductCard from "./ProductCard";
import { useAppContext } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";
import Loading from "./Loading";

// Sabit değişkeni tanımla
const ORDER_COLUMN = 'home_display_order'; 

const HomeProducts = () => {
  const { router, loading: productsLoading } = useAppContext();
  const [categories, setCategories] = useState([]); // Kategori listesi (şu an kullanılmıyor)
  const [homeProducts, setHomeProducts] = useState([]); // Anasayfada gösterilecek özel ürün listesi
  const [loading, setLoading] = useState(true);

  // Anasayfada gösterilecek ürün sayısı (limit koymak için)
  const HOME_PRODUCT_LIMIT = 10;

  // Kategorileri veritabanından çekelim (Mevcut koddan alındı)
  useEffect(() => {
    const fetchCategories = async () => {
        const { data, error } = await supabase.from('categories').select('id, name');
        if (!error && data) {
            setCategories(data); // Kategorileri state'e kaydet
        }
    };
    fetchCategories();
  }, []);

  // 💥 YENİ EKLENTİ: Anasayfa için özel seçilmiş ve sıralanmış ürünleri çeker
  const fetchHomeProducts = async () => {
    setLoading(true);
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*') // Tüm ürün detaylarını çekiyoruz
            .not(ORDER_COLUMN, 'is', null) // Boş olmayanları al (NULL olmayanları)
            .gt(ORDER_COLUMN, 0) // Sıfırdan büyük olanları al (Yani yönetici panelinde seçilmiş olanları)
            .order(ORDER_COLUMN, { ascending: true }) // Belirlenen sıraya göre sırala
            .limit(HOME_PRODUCT_LIMIT); // Tanımlanan limit kadar al

        if (error) throw error;
        
        // Gelen ürünleri doğru formatta (image_urls array olacak şekilde) ayarla
        const formattedProducts = (data || []).map(p => ({
            ...p,
            image_urls: Array.isArray(p.image_urls) ? p.image_urls : [],
        }));
        
        setHomeProducts(formattedProducts);
    } catch (error) {
        console.error("Error fetching home products:", error); // Hata durumunda konsola yaz
        setHomeProducts([]); // Hata durumunda boş liste
    } finally {
        setLoading(false);
    }
  };
  
  useEffect(() => {
      // productsLoading bittiğinde bileşen yüklenirken bir kere çalıştır
      if (!productsLoading) { 
        fetchHomeProducts();
      }
  }, [productsLoading]); 

  // Genel yükleme durumu kontrolü
  if (loading || productsLoading) {
      return <Loading />
  }

  return (
    <div className="flex flex-col items-center my-16 w-full">
      <div className="w-full flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
        
        
        {/* Filtreleme ve Sıralama Kontrolleri (Kaldırıldı veya sadeleştirildi) */}
       
      </div>

      {/* homeProducts listesini kullanıyoruz */}
      {homeProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10 w-full justify-items-center">
            {homeProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500 w-full">
            <p>Anasayfada gösterilecek ürün bulunamadı. Lütfen yönetici panelinden ürün ekleyin.</p>
        </div>
      )}

      {/* Tüm Ürünleri Gör butonu */}
      <div className="mt-16 w-full flex justify-center">
         <button
            onClick={() => router.push("/all-products")}
            className="px-10 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
        >
           View All Products
        </button>
      </div>
    </div>
  );
};

export default HomeProducts;