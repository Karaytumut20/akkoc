"use client";
import { useState, useMemo } from "react";
import ProductCard2 from "@/components/ProductCard2";
import Footer from "@/components/Footer";
import { useAppContext } from "@/context/AppContext";
import Loading from "@/components/Loading";

export default function AllProducts() {
  const { products, loading: productsLoading } = useAppContext();

  // 📌 Sabit kategori ID
  const FIXED_CATEGORY_ID = "862327f7-4aad-4e2a-91cb-da0a12d29126";
  const CATEGORY_TITLE = "Set of Stone Age"; // 📢 Başlık

  const [availabilityFilter, setAvailabilityFilter] = useState(null);
  const [priceFilter, setPriceFilter] = useState(null);

  // Ürünleri filtrele
  const filteredProducts = useMemo(() => {
    let processed = [...products];

    // 📌 Sabit kategoriye göre filtrele
    processed = processed.filter(
      (p) => String(p.category_id) === String(FIXED_CATEGORY_ID)
    );

    if (availabilityFilter === "inStock") {
      processed = processed.filter((p) => p.stock > 0);
    } else if (availabilityFilter === "outOfStock") {
      processed = processed.filter((p) => p.stock <= 0);
    }

    if (priceFilter === "low") {
      processed.sort((a, b) => a.price - b.price);
    } else if (priceFilter === "high") {
      processed.sort((a, b) => b.price - a.price);
    }

    return processed;
  }, [products, availabilityFilter, priceFilter]);

  if (productsLoading) {
    return (
      <>
        <Loading />
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center px-6 md:px-16 lg:px-32 min-h-[70vh] gap-8 mt-0 sm:mt-4 md:mt-6 lg:mt-16">
        {/* 📢 Kategori Başlığı */}
        <h1 className="text-2xl md:text-3xl font-semibold text-center mb-4">
          {CATEGORY_TITLE}
        </h1>

        {/* 🛍 Ürünler */}
        <div className="w-full">
          {filteredProducts.length > 0 ? (
            <div
              className="
                grid 
                grid-cols-2 
                md:grid-cols-3 
                lg:grid-cols-4 
                xl:grid-cols-5 
                gap-6 
                pb-14 
                justify-center
              "
            >
              {filteredProducts.map((product) => (
                <ProductCard2 key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500 flex justify-center items-center">
              <p>No products found in {CATEGORY_TITLE}.</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
