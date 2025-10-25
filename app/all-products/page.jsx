import { Suspense } from "react";
import AllProducts from "@/components/AllProducts";

export default function AllProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <AllProducts />
    </Suspense>
  );
}