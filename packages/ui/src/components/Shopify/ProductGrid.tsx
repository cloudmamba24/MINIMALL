import type React from "react";
import { ProductCard } from "./ProductCard";
import styles from "./ProductGrid.module.css";

interface ProductGridProps {
  products: Array<{
    id: string;
    title: string;
    handle: string;
    description?: string;
    image?: {
      url: string;
      altText?: string;
    };
    price: {
      amount: string;
      currencyCode: string;
    };
  }>;
  columns?: 2 | 3 | 4;
  onProductClick?: (product: any) => void;
  loading?: boolean;
  className?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  columns = 3,
  onProductClick,
  loading = false,
  className = "",
}) => {
  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Loading products...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No products found</p>
      </div>
    );
  }

  return (
    <div className={`${styles.grid} ${styles[`cols-${columns}`]} ${className}`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onClick={() => onProductClick?.(product)} />
      ))}
    </div>
  );
};
