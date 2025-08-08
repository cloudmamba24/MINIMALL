'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Minus, Plus, Heart, Star, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { SidePanel } from '@/components/ui/enhanced-modal';
import { useModalRouter } from '@/hooks/use-modal-router';
import { animationPresets, animationTokens } from '@/lib/animation-tokens';
import { useAddToCart } from '@/store/app-store';

// Mock product data - enhanced version
const mockProducts = {
  'prod_abc': {
    id: 'prod_abc',
    title: 'Essential Tee',
    price: 29.00,
    compareAtPrice: 39.00,
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop&sat=-100',
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop&hue=30',
    ],
    description: 'A comfortable and stylish essential tee made from 100% organic cotton. Perfect for everyday wear with a relaxed fit that works for any occasion.',
    variants: {
      size: ['XS', 'S', 'M', 'L', 'XL'],
      color: ['Black', 'White', 'Gray', 'Navy']
    },
    inStock: true,
    rating: 4.5,
    reviewCount: 124,
    features: [
      '100% Organic Cotton',
      'Pre-shrunk',
      'Sustainable Production',
      'Machine Washable'
    ]
  },
} as const;

/**
 * Enhanced Product Quick View
 * 
 * Slides in gracefully from the right, never disrupting the user's context.
 * Every interaction is optimized for speed and delight.
 */
export function EnhancedProductQuickView() {
  const { modalState, closeModal } = useModalRouter('product');
  const addToCart = useAddToCart();
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('Black');
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const productId = modalState.data.id;
  const product = productId ? mockProducts[productId as keyof typeof mockProducts] : null;

  const handleAddToCart = async () => {
    if (!product) return;
    
    setIsAddingToCart(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    addToCart({
      id: `${product.id}-${selectedSize}-${selectedColor}`,
      productId: product.id,
      variantId: `${selectedSize}-${selectedColor}`,
      title: product.title,
      price: product.price * 100, // Convert to cents
      quantity,
      image: product.images[0],
      variant: {
        title: `${selectedColor} / ${selectedSize}`,
        selectedOptions: [
          { name: 'Color', value: selectedColor },
          { name: 'Size', value: selectedSize },
        ],
      },
      size: selectedSize,
      color: selectedColor,
    });
    
    setIsAddingToCart(false);
  };

  if (!product) return null;

  const discount = product.compareAtPrice ? 
    Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) : 0;

  return (
    <SidePanel
      isOpen={modalState.isOpen}
      onClose={closeModal}
      width="lg"
      pushContent={true}
    >
      <div className="space-y-6">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <motion.div 
            className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden"
            layout
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedImage}
                className="relative w-full h-full"
                {...animationPresets.crossFade}
              >
                <Image
                  src={product.images[selectedImage] || product.images[0] || '/placeholder.jpg'}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              </motion.div>
            </AnimatePresence>
            
            {/* Like button */}
            <motion.button
              onClick={() => setIsLiked(!isLiked)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Heart 
                size={18} 
                className={isLiked ? 'text-red-500 fill-red-500' : 'text-gray-600'} 
              />
            </motion.button>
          </motion.div>
          
          {/* Thumbnail Images */}
          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((image, index) => (
                <motion.button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`
                    relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors
                    ${selectedImage === index ? 'border-black' : 'border-transparent'}
                  `}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Image
                    src={image}
                    alt={`${product.title} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {/* Title and Rating */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {product.title}
            </h2>
            
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={
                      i < Math.floor(product.rating) 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-300'
                    }
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {product.rating} ({product.reviewCount} reviews)
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            {product.compareAtPrice && (
              <>
                <span className="text-xl text-gray-500 line-through">
                  ${product.compareAtPrice.toFixed(2)}
                </span>
                <span className="px-2 py-1 bg-red-100 text-red-700 text-sm font-medium rounded">
                  {discount}% OFF
                </span>
              </>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 leading-relaxed">
            {product.description}
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-2">
            {product.features.map((feature, index) => (
              <motion.div
                key={feature}
                className="flex items-center text-sm text-gray-600"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + (index * 0.1) }}
              >
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2" />
                {feature}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Variant Selection */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          {/* Size Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Size: {selectedSize}
            </label>
            <div className="flex gap-2">
              {product.variants.size.map((size) => (
                <motion.button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`
                    px-4 py-2 border rounded-lg font-medium transition-colors
                    ${selectedSize === size
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 text-gray-900 hover:border-gray-400'
                    }
                  `}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {size}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Color: {selectedColor}
            </label>
            <div className="flex gap-2">
              {product.variants.color.map((color) => (
                <motion.button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`
                    px-4 py-2 border rounded-lg font-medium transition-colors
                    ${selectedColor === color
                      ? 'border-black bg-black text-white'
                      : 'border-gray-300 text-gray-900 hover:border-gray-400'
                    }
                  `}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {color}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Quantity Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <motion.button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Minus size={16} />
              </motion.button>
              
              <span className="w-12 text-center font-medium text-lg">
                {quantity}
              </span>
              
              <motion.button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Plus size={16} />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Add to Cart Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <motion.button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className={`
              w-full py-4 px-6 rounded-xl font-semibold text-white transition-colors
              ${isAddingToCart 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-black hover:bg-gray-800'
              }
            `}
            whileHover={!isAddingToCart ? { scale: 1.02 } : {}}
            whileTap={!isAddingToCart ? { scale: 0.98 } : {}}
            animate={isAddingToCart ? animationPresets.addToCart.animate : {}}
          >
            {isAddingToCart ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Adding to Cart...
              </div>
            ) : (
              `Add to Cart • $${(product.price * quantity).toFixed(2)}`
            )}
          </motion.button>
        </motion.div>
      </div>
    </SidePanel>
  );
}