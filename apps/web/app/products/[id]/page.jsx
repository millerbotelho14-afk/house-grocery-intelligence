import { ProductPageClient } from "@/components/ProductPageClient";

export default async function ProductPage({ params }) {
  return <ProductPageClient id={params.id} />;
}
