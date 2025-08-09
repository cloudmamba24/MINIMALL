'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { SidePanel } from '@/components/ui/enhanced-modal';
import { useModalRouter } from '@/hooks/use-modal-router';
import { animationPresets, animationTokens } from '@/lib/animation-tokens';
import { 
  useCart, 
  useUpdateQuantity, 
  useRemoveFromCart,
  useClearCart,
  type UICartItem 
} from '@/store/app-store';
import { useShopifyCartIntegration } from '@/lib/shopify-cart-integration';
import { formatPrice } from '@minimall/core/client';

interface EnhancedCartDrawerProps {
  shopDomain: string;
}

/**
 * Enhanced Cart Drawer
 * 
 * The final checkpoint before purchase. Smooth, delightful, and optimized
 * for conversion without disrupting the shopping flow.
 */
export function EnhancedCartDrawer({ shopDomain }: EnhancedCartDrawerProps) {
  const { modalState, closeModal } = useModalRouter('cart');
  const cart = useCart();
  const updateQuantity = useUpdateQuantity();
  const removeFromCart = useRemoveFromCart();
  const clearCart = useClearCart();
  const shopifyCart = useShopifyCartIntegration(shopDomain);
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleQuantityUpdate = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleCheckout = async () => {
    if (cart.items.length === 0) return;

    setIsCheckingOut(true);
    
    try {
      // Get optimized checkout URL from Shopify integration
      const checkoutUrl = await shopifyCart.getCheckoutUrl(cart.items);
      
      if (checkoutUrl) {
        console.log('Redirecting to checkout:', checkoutUrl);
        window.open(checkoutUrl, '_blank');
      } else {
        console.error('Failed to get checkout URL');
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleClearCart = async () => {
    clearCart();
    await shopifyCart.clearCart();
  };

  const handleSyncWithShopify = async () => {
    if (cart.items.length === 0) return;

    setIsSyncing(true);
    try {
      const success = await shopifyCart.syncCart(cart.items);
      if (success) {
        console.log('Cart synced with Shopify');
      } else {
        console.warn('Failed to sync cart with Shopify');
      }
    } catch (error) {
      console.error('Cart sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatCartPrice = (priceInCents: number) => formatPrice(priceInCents / 100);

  return (
    <SidePanel
      isOpen={modalState.isOpen}
      onClose={closeModal}
      width="md"
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <motion.div
          className="pb-4 border-b border-gray-200"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <ShoppingBag size={24} className="text-gray-900" />
            <h2 className="text-2xl font-bold text-gray-900">Shopping Cart</h2>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'}</span>
            <div className="flex items-center gap-3">
              {cart.totalItems > 0 && (
                <button 
                  onClick={handleSyncWithShopify}
                  disabled={isSyncing}
                  className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 flex items-center gap-1"
                >
                  {isSyncing ? (
                    <>
                      <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    'Sync with Shopify'
                  )}
                </button>
              )}
              {cart.totalItems > 0 && (
                <button 
                  onClick={handleClearCart}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto py-4">
          <AnimatePresence mode="popLayout">
            {cart.items.length === 0 ? (
              // Empty Cart State
              <motion.div
                className="flex flex-col items-center justify-center h-full text-center py-12"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag size={32} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Your cart is empty
                </h3>
                <p className="text-gray-600 mb-6">
                  Add some products to get started
                </p>
                <motion.button
                  onClick={closeModal}
                  className="px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Continue Shopping
                </motion.button>
              </motion.div>
            ) : (
              // Cart Items
              <div className="space-y-4">
                {cart.items.map((item, index) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    index={index}
                    onQuantityUpdate={handleQuantityUpdate}
                    onRemove={removeFromCart}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer - Order Summary & Checkout */}
        {cart.items.length > 0 && (
          <motion.div
            className="pt-4 border-t border-gray-200 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Order Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCartPrice(cart.totalPrice)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>{formatCartPrice(cart.totalPrice)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <motion.button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className={`
                w-full py-4 px-6 rounded-xl font-semibold text-white transition-colors
                flex items-center justify-center gap-2
                ${isCheckingOut 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-black hover:bg-gray-800'
                }
              `}
              whileHover={!isCheckingOut ? { scale: 1.02 } : {}}
              whileTap={!isCheckingOut ? { scale: 0.98 } : {}}
              animate={isCheckingOut ? animationPresets.addToCart.animate : {}}
            >
              {isCheckingOut ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Preparing Checkout...
                </>
              ) : (
                <>
                  Checkout {formatCartPrice(cart.totalPrice)}
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>

            {/* Continue Shopping */}
            <motion.button
              onClick={closeModal}
              className="w-full py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Continue Shopping
            </motion.button>
          </motion.div>
        )}
      </div>
    </SidePanel>
  );
}

/**
 * Individual Cart Item Component
 */
interface CartItemProps {
  item: UICartItem;
  index: number;
  onQuantityUpdate: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

function CartItem({ item, index, onQuantityUpdate, onRemove }: CartItemProps) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    // Small delay for animation
    setTimeout(() => {
      onRemove(item.id);
    }, 200);
  };

  return (
    <motion.div
      className="flex gap-4 p-4 bg-gray-50 rounded-xl"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ 
        opacity: isRemoving ? 0.5 : 1, 
        y: 0, 
        scale: isRemoving ? 0.95 : 1 
      }}
      exit={{ opacity: 0, x: -100, scale: 0.8 }}
      transition={{ 
        delay: index * 0.05,
        duration: animationTokens.duration.normal / 1000,
        ease: animationTokens.easing.entrance,
      }}
      layout
    >
      {/* Product Image */}
      <div className="relative w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
        {item.image && (
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover"
          />
        )}
        
        {/* New item indicator */}
        {item.isNew && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
          />
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">{item.title}</h4>
        
        {/* Variants */}
        <div className="flex gap-2 mt-1 text-sm text-gray-600">
          {item.size && <span>Size: {item.size}</span>}
          {item.color && <span>Color: {item.color}</span>}
        </div>
        
        {/* Price */}
        <div className="mt-2 font-semibold text-gray-900">
          {formatPrice(item.price * item.quantity)}
        </div>
      </div>

      {/* Quantity & Remove */}
      <div className="flex flex-col items-end justify-between">
        {/* Remove Button */}
        <motion.button
          onClick={handleRemove}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Trash2 size={16} />
        </motion.button>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2">
          <motion.button
            onClick={() => onQuantityUpdate(item.id, item.quantity - 1)}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Minus size={12} />
          </motion.button>
          
          <span className="w-8 text-center font-medium">{item.quantity}</span>
          
          <motion.button
            onClick={() => onQuantityUpdate(item.id, item.quantity + 1)}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Plus size={12} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}