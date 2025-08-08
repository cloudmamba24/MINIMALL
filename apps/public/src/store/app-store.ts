import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Category, ShopifyProduct } from '@minimall/core';

// Cart item with UI-specific properties
export interface UICartItem extends CartItem {
  addedAt: number;
  isNew?: boolean;
  size?: string;
  color?: string;
}

// Modal state types
export interface ModalState {
  postModal: {
    isOpen: boolean;
    postId: string | null;
    post: Category | null;
  };
  productQuickView: {
    isOpen: boolean;
    productId: string | null;
    product: ShopifyProduct | null;
  };
  cartDrawer: {
    isOpen: boolean;
  };
}

// Cart state
export interface CartState {
  items: UICartItem[];
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
  lastAddedItem: UICartItem | null;
}

// App state combining all features
export interface AppState {
  // Cart functionality
  cart: CartState;
  addToCart: (item: Omit<UICartItem, 'addedAt' | 'isNew'>) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Modal functionality  
  modals: ModalState;
  openPostModal: (postId: string, post: Category) => void;
  closePostModal: () => void;
  openProductQuickView: (productId: string, product?: ShopifyProduct | null) => void;
  closeProductQuickView: () => void;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  closeAllModals: () => void;
}

// Calculate cart totals
const calculateTotals = (items: UICartItem[]) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  return { totalItems, totalPrice };
};

// Create the store
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial cart state
      cart: {
        items: [],
        totalItems: 0,
        totalPrice: 0,
        isLoading: false,
        lastAddedItem: null,
      },
      
      // Initial modal state
      modals: {
        postModal: {
          isOpen: false,
          postId: null,
          post: null,
        },
        productQuickView: {
          isOpen: false,
          productId: null,
          product: null,
        },
        cartDrawer: {
          isOpen: false,
        },
      },

      // Cart actions
      addToCart: (newItem) => {
        set((state) => {
          const existingItemIndex = state.cart.items.findIndex(
            item => item.productId === newItem.productId && item.variantId === newItem.variantId
          );

          let updatedItems: UICartItem[];
          let lastAddedItem: UICartItem | null = null;

          if (existingItemIndex >= 0) {
            // Update existing item quantity
            updatedItems = state.cart.items.map((item, index) => {
              if (index === existingItemIndex) {
                const updatedItem = {
                  ...item,
                  quantity: item.quantity + newItem.quantity,
                  addedAt: Date.now(),
                  isNew: true,
                };
                lastAddedItem = updatedItem;
                return updatedItem;
              }
              return { ...item, isNew: false };
            });
          } else {
            // Add new item
            lastAddedItem = {
              ...newItem,
              addedAt: Date.now(),
              isNew: true,
            };
            updatedItems = [
              ...state.cart.items.map(item => ({ ...item, isNew: false })),
              lastAddedItem,
            ];
          }

          const { totalItems, totalPrice } = calculateTotals(updatedItems);

          return {
            cart: {
              ...state.cart,
              items: updatedItems,
              totalItems,
              totalPrice,
              lastAddedItem,
            },
          };
        });
      },

      removeFromCart: (itemId) => {
        set((state) => {
          const updatedItems = state.cart.items.filter(item => item.id !== itemId);
          const { totalItems, totalPrice } = calculateTotals(updatedItems);

          return {
            cart: {
              ...state.cart,
              items: updatedItems,
              totalItems,
              totalPrice,
              lastAddedItem: null,
            },
          };
        });
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(itemId);
          return;
        }

        set((state) => {
          const updatedItems = state.cart.items.map(item =>
            item.id === itemId ? { ...item, quantity } : item
          );
          const { totalItems, totalPrice } = calculateTotals(updatedItems);

          return {
            cart: {
              ...state.cart,
              items: updatedItems,
              totalItems,
              totalPrice,
            },
          };
        });
      },

      clearCart: () => {
        set((state) => ({
          cart: {
            ...state.cart,
            items: [],
            totalItems: 0,
            totalPrice: 0,
            lastAddedItem: null,
          },
        }));
      },

      // Modal actions
      openPostModal: (postId, post) => {
        set((state) => ({
          modals: {
            ...state.modals,
            postModal: {
              isOpen: true,
              postId,
              post,
            },
          },
        }));
      },

      closePostModal: () => {
        set((state) => ({
          modals: {
            ...state.modals,
            postModal: {
              isOpen: false,
              postId: null,
              post: null,
            },
          },
        }));
      },

      openProductQuickView: (productId, product = null) => {
        set((state) => ({
          modals: {
            ...state.modals,
            productQuickView: {
              isOpen: true,
              productId,
              product,
            },
          },
        }));
      },

      closeProductQuickView: () => {
        set((state) => ({
          modals: {
            ...state.modals,
            productQuickView: {
              isOpen: false,
              productId: null,
              product: null,
            },
          },
        }));
      },

      openCartDrawer: () => {
        set((state) => ({
          modals: {
            ...state.modals,
            cartDrawer: {
              isOpen: true,
            },
          },
        }));
      },

      closeCartDrawer: () => {
        set((state) => ({
          modals: {
            ...state.modals,
            cartDrawer: {
              isOpen: false,
            },
          },
        }));
      },

      closeAllModals: () => {
        set((state) => ({
          modals: {
            postModal: {
              isOpen: false,
              postId: null,
              post: null,
            },
            productQuickView: {
              isOpen: false,
              productId: null,
              product: null,
            },
            cartDrawer: {
              isOpen: false,
            },
          },
        }));
      },
    }),
    {
      name: 'minimall-app-store',
      partialize: (state) => ({
        // Only persist cart state, not modals
        cart: {
          items: state.cart.items,
          totalItems: state.cart.totalItems,
          totalPrice: state.cart.totalPrice,
        },
      }),
    }
  )
);

// Convenience hooks for specific parts of the store
export const useCart = () => useAppStore((state) => state.cart);
// Individual selectors for stable function references  
export const useAddToCart = () => useAppStore((state) => state.addToCart);
export const useRemoveFromCart = () => useAppStore((state) => state.removeFromCart);
export const useUpdateQuantity = () => useAppStore((state) => state.updateQuantity);
export const useClearCart = () => useAppStore((state) => state.clearCart);

// Backward compatibility
export const useCartActions = () => useAppStore((state) => ({
  addToCart: state.addToCart,
  removeFromCart: state.removeFromCart,
  updateQuantity: state.updateQuantity,
  clearCart: state.clearCart,
}));

export const useModals = () => useAppStore((state) => state.modals);
// Individual selectors for stable function references
export const useOpenPostModal = () => useAppStore((state) => state.openPostModal);
export const useClosePostModal = () => useAppStore((state) => state.closePostModal);
export const useOpenProductQuickView = () => useAppStore((state) => state.openProductQuickView);
export const useCloseProductQuickView = () => useAppStore((state) => state.closeProductQuickView);
export const useOpenCartDrawer = () => useAppStore((state) => state.openCartDrawer);
export const useCloseCartDrawer = () => useAppStore((state) => state.closeCartDrawer);
export const useCloseAllModals = () => useAppStore((state) => state.closeAllModals);

// Backward compatibility - but this can cause re-renders
export const useModalActions = () => useAppStore((state) => ({
  openPostModal: state.openPostModal,
  closePostModal: state.closePostModal,
  openProductQuickView: state.openProductQuickView,
  closeProductQuickView: state.closeProductQuickView,
  openCartDrawer: state.openCartDrawer,
  closeCartDrawer: state.closeCartDrawer,
  closeAllModals: state.closeAllModals,
}));