"use client";

import {
  useCart,
  useCloseCartDrawer,
  useModals,
  useRemoveFromCart,
  useUpdateQuantity,
} from "@/store/app-store";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect } from "react";

interface CartDrawerProps {
  shopDomain: string;
  animationSettings?: {
    slideIn: number;
  };
}

export function CartDrawer({ shopDomain, animationSettings }: CartDrawerProps) {
  const modals = useModals();
  const closeCartDrawer = useCloseCartDrawer();
  const cart = useCart();
  const updateQuantity = useUpdateQuantity();
  const removeFromCart = useRemoveFromCart();

  const slideInDuration = (animationSettings?.slideIn ?? 400) / 1000;

  // Close modal on escape key
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeCartDrawer();
      }
    };

    if (modals.cartDrawer.isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [modals.cartDrawer.isOpen, closeCartDrawer]);

  // Build Shopify checkout URL
  const buildCheckoutUrl = () => {
    if (cart.items.length === 0) return `https://${shopDomain}/cart`;

    // Build variant query string for Shopify
    const variantParams = cart.items.map((item) => `${item.variantId}:${item.quantity}`).join(",");

    return `https://${shopDomain}/cart/${variantParams}`;
  };

  const handleCheckout = () => {
    if (typeof window !== "undefined") {
      window.location.href = buildCheckoutUrl();
    }
  };

  if (!modals.cartDrawer.isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          duration: slideInDuration,
        }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-black text-white z-50 overflow-y-auto border-l border-gray-800 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="font-medium flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Cart ({cart.totalItems})
          </h2>
          <button
            onClick={closeCartDrawer}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {cart.items.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-400 mb-2">Your cart is empty</p>
              <p className="text-sm text-gray-500">Add some products to get started</p>
              <button
                onClick={closeCartDrawer}
                className="mt-4 px-6 py-2 bg-white text-black rounded hover:bg-gray-100 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {cart.items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex gap-4 p-4 rounded-lg border border-gray-800 ${
                    item.isNew ? "bg-gray-900 border-gray-700" : "bg-gray-950"
                  }`}
                >
                  {/* Product Image */}
                  <div className="w-16 h-16 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm mb-1 truncate">{item.title}</h3>
                    {item.variant && (
                      <p className="text-xs text-gray-400 mb-2">{item.variant.title}</p>
                    )}

                    <div className="flex items-center justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-6 h-6 border border-gray-600 rounded flex items-center justify-center hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 border border-gray-600 rounded flex items-center justify-center hover:border-gray-400 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Price and Remove */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          ${((item.price * item.quantity) / 100).toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-600 transition-colors text-gray-400 hover:text-white"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="border-t border-gray-800 p-4 space-y-4">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="font-medium">Subtotal</span>
              <span className="text-xl font-bold">${(cart.totalPrice / 100).toFixed(2)}</span>
            </div>

            <p className="text-xs text-gray-400">Shipping and taxes calculated at checkout</p>

            {/* Action Buttons */}
            <div className="space-y-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleCheckout}
                className="w-full py-3 bg-white text-black rounded font-medium hover:bg-gray-100 transition-colors"
              >
                Checkout
              </motion.button>

              <button
                onClick={closeCartDrawer}
                className="w-full py-3 border border-gray-600 rounded font-medium hover:border-gray-400 transition-colors"
              >
                Continue Shopping
              </button>
            </div>

            {/* Recently Added Indicator */}
            {cart.lastAddedItem && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xs text-green-400 text-center"
              >
                ✓ {cart.lastAddedItem.title} added to cart
              </motion.div>
            )}
          </div>
        )}
      </motion.div>

      {/* Backdrop for mobile */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeCartDrawer}
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
      />
    </AnimatePresence>
  );
}
