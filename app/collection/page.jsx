'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { useAppContext } from '@/context/AppContext';
import Loading from '@/components/Loading';
import { getSafeImageUrl } from '@/lib/utils';

const CollectionProductCard = ({ product, size = 'normal' }) => {
  const { router } = useAppContext();
  const imageUrl = getSafeImageUrl(product.image_urls);

  const sizeClasses = {
    normal: 'aspect-[3/4]',
    large_vertical: 'aspect-[3/5] md:col-span-1 md:row-span-2',
    large_horizontal: 'aspect-[5/3] md:col-span-2',
  };

  return (
    <div
      onClick={() => router.push(`/product/${product.id}`)}
      className={`relative group overflow-hidden rounded-lg cursor-pointer bg-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300 ${sizeClasses[size] || sizeClasses.normal}`}
    >
      <Image
        src={imageUrl}
        alt={product.name}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-cover object-center w-full h-full group-hover:scale-105 transition-transform duration-500 ease-in-out"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-300 flex items-end p-3">
        <p className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 truncate">
          {product.name}
        </p>
      </div>
    </div>
  );
};

export default function CollectionPage() {
  const { products: allProducts, loading: contextLoading } = useAppContext();
  const [groupedProducts, setGroupedProducts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });

      if (categoriesError) {
        console.error('Kategoriler alınamadı:', categoriesError.message);
        setLoading(false);
        return;
      }

      if (!contextLoading && allProducts.length > 0 && categoriesData) {
        const grouped = categoriesData.reduce((acc, category) => {
          const products = allProducts.filter(
            (p) => p.category_id === category.id
          );
          if (products.length > 0) {
            acc[category.id] = { name: category.name, products };
          }
          return acc;
        }, {});
        setGroupedProducts(grouped);
      }
      setLoading(false);
    };

    if (!contextLoading) fetchData();
    else setLoading(true);
  }, [contextLoading, allProducts]);

  const assignSizes = (productsInCategory) => {
    return productsInCategory.map((product, index) => {
      let size = 'normal';
      if (index === 0) size = 'large_vertical';
      if (index === 1) size = 'large_horizontal';
      return { ...product, displaySize: size };
    });
  };

  if (loading || contextLoading) return <Loading />;

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-14 space-y-16">
        {Object.entries(groupedProducts).map(([categoryId, categoryData]) => {
          const sizedProducts = assignSizes(categoryData.products);

          return (
            <section key={categoryId}>
              <h2 className="text-2xl sm:text-3xl font-serif text-gray-800 mb-8 text-center tracking-wide">
                {categoryData.name}
              </h2>

              {/* 📱 Mobilde yatay scroll - 💻 Masaüstünde grid */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory sm:hidden px-1">
                {categoryData.products.map((product) => (
                  <div
                    key={product.id}
                    className="snap-center flex-shrink-0 w-[45vw]"
                  >
                    {/* Mobilde tek boyutlu kart */}
                    <CollectionProductCard product={product} size="normal" />
                  </div>
                ))}
              </div>

              {/* Masaüstü orijinal görünüm korunuyor */}
              <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-6 auto-rows-auto">
                {sizedProducts.map((product) => (
                  <CollectionProductCard
                    key={product.id}
                    product={product}
                    size={product.displaySize}
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
