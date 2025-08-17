import React, { createContext, useContext, useState, useEffect } from 'react';

interface ShopifyContextValue {
  shop: string;
  storefrontAccessToken: string;
  cart: any[];
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const ShopifyContext = createContext<ShopifyContextValue | null>(null);

interface ShopifyProviderProps {
  children: React.ReactNode;
  shop: string;
  storefrontAccessToken: string;
}

export const ShopifyProvider: React.FC<ShopifyProviderProps> = ({
  children,
  shop,
  storefrontAccessToken,
}) => {
  const [cart, setCart] = useState<any[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('shopify_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to load cart from localStorage');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('shopify_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: any) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  
  const cartTotal = cart.reduce((total, item) => {
    const price = parseFloat(item.price?.amount || 0);
    return total + (price * item.quantity);
  }, 0);

  const value: ShopifyContextValue = {
    shop,
    storefrontAccessToken,
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    cartCount,
    cartTotal,
  };

  return (
    <ShopifyContext.Provider value={value}>
      {children}
    </ShopifyContext.Provider>
  );
};

export const useShopify = () => {
  const context = useContext(ShopifyContext);
  if (!context) {
    throw new Error('useShopify must be used within a ShopifyProvider');
  }
  return context;
};