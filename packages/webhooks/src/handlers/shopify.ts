// Shopify-specific types that were referenced
export interface StorefrontVariant {
  id: string;
  title: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  availableForSale: boolean;
}