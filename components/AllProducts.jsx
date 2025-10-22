"use client";
import { useState, useEffect, useMemo } from "react";
import ProductCard2 from "@/components/ProductCard2";
import Footer from "@/components/Footer";
import { useAppContext } from "@/context/AppContext";
import { supabase } from "@/lib/supabaseClient";
import Loading from "@/components/Loading";
import { FiChevronDown } from "react-icons/fi";
import { useSearchParams } from "next/navigation";

export default function AllProducts() {
  const { products, loading: productsLoading } = useAppContext();
  const searchParams = useSearchParams();

  // URL'den category_id parametresi varsa al
  const categoryFromUrl = searchParams.get("category_id");

  // Eğer category_id parametresi varsa onunla başla, yoksa 'all' yap
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl || "all");
  const [categories, setCategories] = useState([]);
  const [availabilityFilter, setAvailabilityFilter] = useState(null);
  const [priceFilter, setPriceFilter] = useState(null);
  const [openSection, setOpenSection] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from("categories").select("id, name");
      if (!error && data) setCategories(data);
    };
    fetchCategories();
  }, []);

  // URL parametresi değiştiğinde filtreyi güncelle
  useEffect(() => {
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    } else {
      setSelectedCategory("all");
    }
  }, [categoryFromUrl]);

  const filteredProducts = useMemo(() => {
    let processed = [...products];

    // Kategori filtresi
    if (selectedCategory && selectedCategory !== "all") {
      processed = processed.filter(
        (p) => String(p.category_id) === String(selectedCategory)
      );
    }

    // Stok filtresi
    if (availabilityFilter === "inStock") {
      processed = processed.filter((p) => p.stock > 0);
    } else if (availabilityFilter === "outOfStock") {
      processed = processed.filter((p) => p.stock <= 0);
    }

    // Fiyat sıralaması
    if (priceFilter === "low") {
      processed.sort((a, b) => a.price - b.price);
    } else if (priceFilter === "high") {
      processed.sort((a, b) => b.price - a.price);
    }

    return processed;
  }, [products, selectedCategory, availabilityFilter, priceFilter]);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

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
      <div className="flex flex-col lg:flex-row items-start px-6 md:px-16 lg:px-32 min-h-[70vh] gap-8 mt-0 sm:mt-4 md:mt-6 lg:mt-10">
        {/* 🧭 Filtre Menüsü */}
        <div className="w-full lg:w-1/4 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          {/* Availability */}
          <div className="border-b border-gray-200 py-2">
            <button
              className="w-full flex justify-between items-center text-left font-medium text-gray-800"
              onClick={() => toggleSection("availability")}
            >
              AVAILABILITY
              <FiChevronDown
                className={`transform transition-transform ${
                  openSection === "availability" ? "rotate-180" : ""
                }`}
              />
            </button>
            {openSection === "availability" && (
              <div className="mt-2 space-y-2 text-sm text-gray-600">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="availability"
                    onChange={() => setAvailabilityFilter("inStock")}
                    checked={availabilityFilter === "inStock"}
                  />
                  In Stock
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="availability"
                    onChange={() => setAvailabilityFilter("outOfStock")}
                    checked={availabilityFilter === "outOfStock"}
                  />
                  Out of Stock
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="availability"
                    onChange={() => setAvailabilityFilter(null)}
                    checked={availabilityFilter === null}
                  />
                  All
                </label>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="border-b border-gray-200 py-2">
            <button
              className="w-full flex justify-between items-center text-left font-medium text-gray-800"
              onClick={() => toggleSection("price")}
            >
              PRICE
              <FiChevronDown
                className={`transform transition-transform ${
                  openSection === "price" ? "rotate-180" : ""
                }`}
              />
            </button>
            {openSection === "price" && (
              <div className="mt-2 space-y-2 text-sm text-gray-600">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="price"
                    onChange={() => setPriceFilter("low")}
                    checked={priceFilter === "low"}
                  />
                  Low to High
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="price"
                    onChange={() => setPriceFilter("high")}
                    checked={priceFilter === "high"}
                  />
                  High to Low
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="price"
                    onChange={() => setPriceFilter(null)}
                    checked={priceFilter === null}
                  />
                  All
                </label>
              </div>
            )}
          </div>

          {/* Category */}
          <div className="py-2">
            <button
              className="w-full flex justify-between items-center text-left font-medium text-gray-800"
              onClick={() => toggleSection("category")}
            >
              PRODUCT TYPE
              <FiChevronDown
                className={`transform transition-transform ${
                  openSection === "category" ? "rotate-180" : ""
                }`}
              />
            </button>
            {openSection === "category" && (
              <div className="mt-2 space-y-2 text-sm text-gray-600 max-h-48 overflow-y-auto">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    onChange={() => setSelectedCategory("all")}
                    checked={selectedCategory === "all"}
                  />
                  All
                </label>
                {categories.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="category"
                      onChange={() => setSelectedCategory(cat.id)}
                      checked={String(selectedCategory) === String(cat.id)}
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 🛍 Ürünler */}
        <div className="w-full lg:w-3/4">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-14">
              {filteredProducts.map((product) => (
                <ProductCard2 key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500">
              <p>No products match your filters.</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
