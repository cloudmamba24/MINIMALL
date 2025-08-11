"use client";

import { type Category } from "@minimall/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createAnalytics } from "@/lib/enhanced-analytics";
import { CategoryChips, type CategoryChipItem } from "../navigation/category-chips";
import { CollectionChips, type CollectionChipItem } from "../navigation/collection-chips";
import { ProductCarousel } from "./product-carousel";
import { ImageGrid } from "./image-grid";

interface ShopTabProps {
  category: Category;
  onProductClick: (productId: string) => void;
}

export function ShopTab({ category, onProductClick }: ShopTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Default taxonomy (can be overridden later via config)
  const categoryItems: CategoryChipItem[] = useMemo(
    () => [
      { id: "new", label: "New" },
      { id: "bestsellers", label: "Bestsellers" },
      { id: "tops", label: "Tops" },
      { id: "bottoms", label: "Bottoms" },
      { id: "accessories", label: "Accessories" },
      { id: "sale", label: "Sale" },
    ],
    []
  );

  const collectionItems: CollectionChipItem[] = useMemo(
    () => [
      { id: "new-in", label: "New In" },
      { id: "essentials", label: "Essentials" },
      { id: "beach", label: "Beach" },
      { id: "urban", label: "Urban" },
      { id: "holiday", label: "Holiday" },
      { id: "iconic", label: "Iconic" },
    ],
    []
  );

  // Read active from URL
  const initialCategory = (searchParams?.get("shop:category") as string | null) || categoryItems[0]?.id || "new";
  const initialCollection = (searchParams?.get("shop:collection") as string | null) || collectionItems[0]?.id || "new-in";

  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [activeCollection, setActiveCollection] = useState<string>(initialCollection);
  const analytics = useMemo(() => createAnalytics("shop"), []);

  // Keep URL in sync
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("shop:category", activeCategory);
    params.set("shop:collection", activeCollection);
    router.replace(`?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, activeCollection]);

  const handleCategorySelect = useCallback((id: string) => {
    setActiveCategory(id);
    analytics.trackCustomEvent("filter_category", { configId: "shop", properties: { id } });
  }, [analytics]);
  const handleCollectionSelect = useCallback((id: string) => {
    setActiveCollection(id);
    analytics.trackCustomEvent("filter_collection", { configId: "shop", properties: { id } });
  }, [analytics]);

  // TODO: If needed, add actual filtering by mapping IDs to Shopify collection handles.

  // Basic filtering model: filter category children by title/price tag match
  const productsCategory: Category = useMemo(() => category, [category]);
  const collectionCategory: Category = useMemo(() => category, [category]);

  return (
    <div className="space-y-6">
      {/* Category chips controlling product carousel */}
      <CategoryChips items={categoryItems} activeId={activeCategory} onSelect={handleCategorySelect} />
      <ProductCarousel category={productsCategory} onProductClick={onProductClick} />

      {/* Collections row controlling image grid */}
      <CollectionChips
        items={collectionItems}
        activeId={activeCollection}
        onSelect={handleCollectionSelect}
        className="mt-2"
      />
      <ImageGrid category={collectionCategory} />
    </div>
  );
}


