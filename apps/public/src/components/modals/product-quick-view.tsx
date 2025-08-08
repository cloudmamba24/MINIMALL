'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { X, Minus, Plus, Star, Heart } from 'lucide-react';
import { useModals, useModalActions, useCartActions } from '@/store/app-store';

// Mock product data - this would come from Shopify API in production
const mockProducts = {
  'prod_abc': {
    id: 'prod_abc',
    title: 'Essential Tee',
    price: 29.00,
    compareAtPrice: 39.00,
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop&sat=-100',
    ],
    description: 'A comfortable and stylish essential tee made from 100% organic cotton. Perfect for everyday wear.',
    variants: {
      size: ['XS', 'S', 'M', 'L', 'XL'],
      color: ['Black', 'White', 'Gray', 'Navy']
    },
    inStock: true,
    rating: 4.5,
    reviews: 127
  }
};

interface ProductQuickViewProps {
  animationSettings?: {
    slideIn: number;
  };
}

export function ProductQuickView({ animationSettings }: ProductQuickViewProps) {
  const modals = useModals();
  const { closeProductQuickView } = useModalActions();
  const { addToCart } = useCartActions();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('Black');
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Get product data (mock for now)
  const product = modals.productQuickView.productId 
    ? mockProducts[modals.productQuickView.productId as keyof typeof mockProducts]
    : null;

  const slideInDuration = (animationSettings?.slideIn ?? 400) / 1000;

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeProductQuickView();
      }
    };

    if (modals.productQuickView.isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [modals.productQuickView.isOpen, closeProductQuickView]);

  const handleAddToCart = async () => {
    if (!product) return;

    setIsAddingToCart(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // Add to cart
    addToCart({
      id: `${product.id}_${selectedSize}_${selectedColor}`,
      productId: product.id,
      variantId: `${product.id}_${selectedSize}_${selectedColor}`,
      title: product.title,
      price: Math.round(product.price * 100), // Convert to cents
      quantity,
      ...(product.images[selectedImage] && { image: product.images[selectedImage] }),
      variant: {
        title: `${selectedSize} / ${selectedColor}`,
        selectedOptions: [
          { name: 'Size', value: selectedSize },
          { name: 'Color', value: selectedColor }
        ]
      }
    });

    setIsAddingToCart(false);
    
    // Auto-close after adding to cart
    setTimeout(() => {
      closeProductQuickView();
    }, 1000);
  };

  if (!modals.productQuickView.isOpen || !product) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ 
          type: 'spring',
          stiffness: 300,
          damping: 30,
          duration: slideInDuration 
        }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-black text-white z-50 overflow-y-auto border-l border-gray-800"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="font-medium">Quick View</h2>
          <button
            onClick={closeProductQuickView}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product Images */}
        <div className="relative">
          <img
            src={product.images[selectedImage]}
            alt={product.title}
            className="w-full h-80 object-cover"
          />
          
          {/* Image thumbnails */}
          {product.images.length > 1 && (
            <div className="absolute bottom-4 left-4 flex gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-12 h-12 rounded border-2 overflow-hidden ${
                    selectedImage === index ? 'border-white' : 'border-gray-600'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.title} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Wishlist button */}
          <button className="absolute top-4 right-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors">
            <Heart className="w-5 h-5" />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-6 space-y-6">
          {/* Title and Price */}
          <div>
            <h1 className="text-xl font-semibold mb-2">{product.title}</h1>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold">${product.price.toFixed(2)}</span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-lg text-gray-400 line-through">
                  ${product.compareAtPrice.toFixed(2)}
                </span>
              )}
            </div>
            
            {/* Rating */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating) 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-400">
                {product.rating} ({product.reviews} reviews)
              </span>
            </div>
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${product.inStock ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-sm text-gray-300">
              {product.inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          {/* Size Selection */}
          <div>
            <h3 className="font-medium mb-3">Size: {selectedSize}</h3>
            <div className="flex flex-wrap gap-2">
              {product.variants.size.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 border rounded transition-colors ${
                    selectedSize === size
                      ? 'border-white bg-white text-black'
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <h3 className="font-medium mb-3">Color: {selectedColor}</h3>
            <div className="flex flex-wrap gap-2">
              {product.variants.color.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`px-4 py-2 border rounded transition-colors ${
                    selectedColor === color
                      ? 'border-white bg-white text-black'
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <h3 className="font-medium mb-3">Quantity</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-10 h-10 border border-gray-600 rounded flex items-center justify-center hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 border border-gray-600 rounded flex items-center justify-center hover:border-gray-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleAddToCart}
            disabled={!product.inStock || isAddingToCart}
            className={`w-full py-4 rounded font-medium transition-all ${
              isAddingToCart
                ? 'bg-green-600 text-white'
                : product.inStock
                ? 'bg-white text-black hover:bg-gray-100'
                : 'bg-gray-800 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isAddingToCart ? 'Added to Cart ✓' : 
             !product.inStock ? 'Out of Stock' : 
             `Add to Cart - $${(product.price * quantity).toFixed(2)}`}
          </motion.button>

          {/* Description */}
          <div className="pt-4 border-t border-gray-800">
            <h3 className="font-medium mb-2">Description</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {product.description}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Backdrop for mobile */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeProductQuickView}
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
      />
    </AnimatePresence>
  );
}