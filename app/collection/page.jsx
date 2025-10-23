// app/collection/page.jsx

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useAppContext } from '@/context/AppContext';
import Loading from '@/components/Loading';
import { getSafeImageUrl } from '@/lib/utils'; // Güvenli resim URL'si almak için

// Ürün kartı için basit bir component (Mevcut ProductCard'ı kullanmak yerine)
// Asimetrik grid için farklı boyutlandırma seçenekleri ekleyebiliriz.
const CollectionProductCard = ({ product, size = 'normal' }) => {
  const { router } = useAppContext();
  const imageUrl = getSafeImageUrl(product.image_urls);

  // Farklı boyutlar için Tailwind sınıfları
  const sizeClasses = {
    normal: 'aspect-[3/4]', // Normal boyut
    large_vertical: 'aspect-[3/5] md:col-span-1 md:row-span-2', // Büyük dikey
    large_horizontal: 'aspect-[5/3] md:col-span-2', // Büyük yatay
  };

  return (
    <div
      onClick={() => router.push(`/product/${product.id}`)}
      className={`relative group overflow-hidden rounded-lg cursor-pointer bg-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300 ${sizeClasses[size] || sizeClasses['normal']}`}
    >
      <Image
        src={imageUrl}
        alt={product.name}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-cover object-center w-full h-full group-hover:scale-105 transition-transform duration-500 ease-in-out"
        loading="lazy" // Lazy loading
      />
      {/* Ürün Adı (isteğe bağlı olarak hover'da gösterilebilir) */}
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-300 flex items-end p-4">
        <p className="text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 truncate">
          {product.name}
        </p>
      </div>
    </div>
  );
};


export default function CollectionPage() {
  const { products: allProducts, loading: contextLoading, getSafeImageUrl } = useAppContext(); // AppContext'ten ürünleri al
  const [categories, setCategories] = useState([]);
  const [groupedProducts, setGroupedProducts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 1. Kategorileri Çek
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true }); // Alfabetik sırala

      if (categoriesError) {
        console.error('Kategoriler alınamadı:', categoriesError.message);
        setLoading(false);
        return;
      }
      setCategories(categoriesData || []);

      // 2. Ürünleri Kategorilere Göre Grupla (AppContext'ten gelen ürünleri kullan)
      if (!contextLoading && allProducts.length > 0 && categoriesData) {
        const grouped = (categoriesData || []).reduce((acc, category) => {
          acc[category.id] = {
            name: category.name,
            products: allProducts.filter(p => p.category_id === category.id)
          };
          return acc;
        }, {});

        // Kategorisi olmayan ürünleri veya boş kategorileri filtrele (isteğe bağlı)
        const finalGrouped = Object.entries(grouped)
                                  .filter(([_, value]) => value.products.length > 0)
                                  .reduce((acc, [key, value]) => {
                                      acc[key] = value;
                                      return acc;
                                  }, {});

        setGroupedProducts(finalGrouped);
      }
      setLoading(false);
    };

    // Eğer context yükleniyorsa bekle, yüklendiyse veriyi işle
    if (!contextLoading) {
        fetchData();
    } else {
        setLoading(true); // Context yüklenirken de loading göster
    }

  }, [contextLoading, allProducts]); // Context yüklemesi ve ürünler değiştiğinde tekrar çalıştır


  // Asimetrik grid için ürünlere boyut atama mantığı (Örnek)
  // Bu fonksiyonu her kategori için çağırıp, ürünlere farklı size değerleri atayabiliriz.
  const assignSizes = (productsInCategory) => {
    // Basit bir örnek: İlk ürünü büyük dikey, ikinciyi büyük yatay yapalım
    return productsInCategory.map((product, index) => {
      let size = 'normal';
      if (index === 0) size = 'large_vertical';
      if (index === 1) size = 'large_horizontal';
      // Daha karmaşık mantıklar eklenebilir (örneğin index % 5 == 0 ise büyük vs.)
      return { ...product, displaySize: size };
    });
  };

  if (loading || contextLoading) {
    return <Loading />;
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Sayfa Başlığı - Opsiyonel */}
      {/* <div className="py-16 text-center border-b border-gray-200">
        <h1 className="text-4xl font-serif text-gray-800 tracking-wider">Koleksiyon</h1>
      </div> */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24">
        {Object.entries(groupedProducts).map(([categoryId, categoryData]) => {
          if (categoryData.products.length === 0) return null; // Ürünü olmayan kategoriyi atla

          const sizedProducts = assignSizes(categoryData.products); // Boyutları ata

          return (
            <section key={categoryId}>
              {/* Kategori Başlığı */}
              <h2 className="text-3xl sm:text-4xl font-serif text-gray-800 mb-12 text-center tracking-wide">
                {categoryData.name}
              </h2>

              {/* Ürün Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-auto">
                {sizedProducts.map((product) => (
                  <CollectionProductCard
                    key={product.id}
                    product={product}
                    size={product.displaySize} // Atanan boyutu kullan
                  />
                ))}
              </div>
            </section>
          );
        })}

        {Object.keys(groupedProducts).length === 0 && !loading && (
          <div className="text-center py-20 text-gray-500">
            <p>Gösterilecek ürün bulunamadı.</p>
          </div>
        )}
      </div>
    </div>
  );
}