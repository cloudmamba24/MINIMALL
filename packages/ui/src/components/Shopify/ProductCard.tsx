import React from 'react';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: {
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
  };
  onClick?: () => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onClick,
  className = '',
}) => {
  const formatPrice = (amount: string, currencyCode: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    });
    return formatter.format(parseFloat(amount));
  };

  return (
    <div 
      className={`${styles.card} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={styles.imageContainer}>
        {product.image ? (
          <img 
            src={product.image.url} 
            alt={product.image.altText || product.title}
            className={styles.image}
          />
        ) : (
          <div className={styles.placeholder}>
            No Image
          </div>
        )}
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{product.title}</h3>
        {product.description && (
          <p className={styles.description}>{product.description}</p>
        )}
        <p className={styles.price}>
          {formatPrice(product.price.amount, product.price.currencyCode)}
        </p>
      </div>
    </div>
  );
};