// components/CollectionPage.jsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import Loading from './Loading'; // Mevcut Loading component'ını import ediyoruz
import { getSafeImageUrl } from '@/lib/utils'; // Güvenli resim URL'si almak için

// Ürün kartı için basit bir alt bileşen
const CollectionProductItem = ({ product, layoutStyle }) => {
  const imageUrl = getSafeImageUrl(product.image_urls); // İlk resmi al

  // Tailwind sınıflarını layout stiline göre belirle
  const classMap = {
    large: 'col-span-2 row-span-2',
    tall: 'row-span-2',
    wide: 'col-span-2',
    normal: '',
  };

  return (
    <Link href={`/product/${product.id}`} passHref>
      <div
        className={`relative aspect-square rounded-lg overflow-hidden group cursor-pointer shadow-md hover:shadow-xl transition-shadow duration-300 ${classMap[layoutStyle] || ''}`}
      >
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" // Optimize edilmiş boyutlar
          className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
        />
        {/* Ürün adını göstermek için overlay (isteğe bağlı) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <p className="text-white text-sm font-semibold truncate">{product.name}</p>
        </div>
      </div>
    </Link>
  );
};

// Ana Koleksiyon Sayfası Bileşeni
export default function CollectionPage() {
  const [categories, setCategories] = useState([]);
  const [productsByCategory, setProductsByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Kategorileri çek
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name')
          .order('name', { ascending: true }); // Alfabetik sıralama

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // 2. Tüm ürünleri çek (kategori bilgisiyle birlikte)
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name, image_urls, category_id')
          .order('created_at', { ascending: false }); // Yeni ürünler üste gelsin

        if (productsError) throw productsError;

        // 3. Ürünleri kategori ID'sine göre grupla
        const groupedProducts = (productsData || []).reduce((acc, product) => {
          const categoryId = product.category_id;
          if (!acc[categoryId]) {
            acc[categoryId] = [];
          }
          // Görsel URL'lerini dizi formatına getir
          acc[categoryId].push({
            ...product,
            image_urls: Array.isArray(product.image_urls)
              ? product.image_urls
              : [],
          });
          return acc;
        }, {});

        setProductsByCategory(groupedProducts);

      } catch (err) {
        console.error('Koleksiyon verisi alınırken hata:', err);
        setError('Veriler yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Her kategori için farklı grid düzenleri belirle (örnek)
  // Bu fonksiyonu daha karmaşık hale getirerek ürün sayısına veya index'e göre farklı stiller atayabilirsiniz.
  const getLayoutStyle = (categoryIndex, productIndex, totalProductsInCategory) => {
    // Örnek: İlk ürünü büyük, sonraki ikisini dikey, sonrakini geniş yapalım
    if (productIndex === 0 && totalProductsInCategory > 3) return 'large';
    if (productIndex === 1 && totalProductsInCategory > 3) return 'tall';
    if (productIndex === 2 && totalProductsInCategory > 3) return 'tall';
    if (productIndex === 3 && totalProductsInCategory > 4) return 'wide';
    // Basit bir döngü veya rastgelelik de eklenebilir
    // const styles = ['normal', 'tall', 'wide', 'large'];
    // return styles[(categoryIndex + productIndex) % styles.length];
    return 'normal'; // Varsayılan stil
  };


  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <div className="text-center py-20 text-red-600">{error}</div>;
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-serif text-center text-gray-900 mb-16 border-b pb-4">
          Koleksiyonlar
        </h1>

        {categories.length === 0 ? (
          <p className="text-center text-gray-500">Gösterilecek koleksiyon bulunamadı.</p>
        ) : (
          <div className="space-y-20">
            {categories.map((category, categoryIndex) => {
              const products = productsByCategory[category.id] || [];
              if (products.length === 0) return null; // Ürünü olmayan kategoriyi atla

              return (
                <section key={category.id}>
                  <h2 className="text-3xl font-serif text-gray-800 mb-8 text-center sm:text-left">
                    {category.name}
                  </h2>
                  {/*
                    'ırılı ufaklı' görünüm için grid yapısı.
                    Buradaki `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` temel sütun sayısını belirler.
                    `CollectionProductItem` içindeki `col-span` ve `row-span` ile öğeler bu grid üzerinde yayılır.
                    Daha dinamik ve sanatsal düzenler için `grid-auto-flow: dense` ve farklı `aspect-ratio` değerleri de kullanılabilir.
                  */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
                    {products.map((product, productIndex) => (
                      <CollectionProductItem
                        key={product.id}
                        product={product}
                        layoutStyle={getLayoutStyle(categoryIndex, productIndex, products.length)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}