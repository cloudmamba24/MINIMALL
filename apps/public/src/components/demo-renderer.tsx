'use client';

import { useMemo } from 'react';
import { type SiteConfig, type Category } from '@minimall/core';
import { BrandHeader } from './brand/brand-header';
import { LinkTabs } from './navigation/link-tabs';
import { ContentGrid, GridItem } from './layout/content-grid';
import { ContentItem } from './content/content-item';
import { PostModal } from './modals/post-modal';
import { ProductQuickView } from './modals/product-quick-view';
import { CartDrawer } from './modals/cart-drawer';
import { useModals, useModalActions, useCart } from '@/store/app-store';

interface DemoRendererProps {
  config: SiteConfig;
  className?: string;
}

export function DemoRenderer({ config, className = "" }: DemoRendererProps) {
  const { settings } = config;
  const modals = useModals();
  const { openPostModal, openCartDrawer } = useModalActions();
  const cart = useCart();
  
  // Create tabs from categories with cart button - memoized to prevent infinite loops
  const tabs = useMemo(() => [
    ...config.categories.map(category => ({
      id: category.id,
      label: category.title,
      content: <CategoryContent category={category} openPostModal={openPostModal} />
    })),
    // Add cart tab
    {
      id: 'cart',
      label: cart.totalItems > 0 ? `Cart (${cart.totalItems})` : 'Cart',
      content: null, // Cart opens drawer instead
      onClick: openCartDrawer,
      isAction: true,
    }
  ], [config.categories, cart.totalItems, openPostModal, openCartDrawer]);

  return (
    <div className={`min-h-screen bg-black text-white ${className}`}>
      <div className="container mx-auto px-4 py-8 max-w-lg">
        {/* Brand Header */}
        <BrandHeader
          title={settings.brand?.name || 'DEMO.STORE'}
          {...(settings.brand?.subtitle && { subtitle: settings.brand.subtitle })}
          {...(settings.brand?.logo && { logo: settings.brand.logo })}
          {...(settings.brand?.socialLinks && { socialLinks: settings.brand.socialLinks })}
          {...(settings.brand?.ctaButton && { ctaButton: settings.brand.ctaButton })}
        />
        
        {/* Tab Navigation & Content */}
        <LinkTabs tabs={tabs} />
      </div>

      {/* Modals */}
      <PostModal 
        post={modals.postModal.post}
        {...(settings.animations?.modals && {
          animationSettings: {
            fadeIn: settings.animations.modals.fadeIn,
            backdrop: settings.animations.modals.backdrop
          }
        })}
      />
      
      <ProductQuickView 
        {...(settings.animations?.modals && {
          animationSettings: {
            slideIn: settings.animations.modals.slideIn
          }
        })}
      />
      
      <CartDrawer 
        shopDomain={settings.shopDomain}
        {...(settings.animations?.modals && {
          animationSettings: {
            slideIn: settings.animations.modals.slideIn
          }
        })}
      />
    </div>
  );
}

interface CategoryContentProps {
  category: Category;
  openPostModal: (postId: string, post: Category) => void;
}

function CategoryContent({ category, openPostModal }: CategoryContentProps) {
  const [, categoryTypeDetails] = category.categoryType;
  
  if (!category.children || category.children.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No content available</p>
      </div>
    );
  }

  // For slider display (like lookbook)
  if (categoryTypeDetails.displayType === 'slider') {
    return (
      <div className="space-y-4">
        {category.children.map((child) => {
          const [cardType, cardDetails] = child.card;
          
          return (
            <div key={child.id} className="w-full">
              <ContentItem
                type={cardType === 'product' ? 'product' : cardType === 'video' ? 'video' : 'image'}
                image={cardDetails.image || cardDetails.imageUrl || ''}
                title={child.title}
                {...(cardDetails.price && { price: cardDetails.price })}
                {...(cardDetails.link && { href: cardDetails.link })}
                {...(cardDetails.overlay && { overlay: cardDetails.overlay })}
                className="aspect-[4/3] rounded-lg"
              />
            </div>
          );
        })}
      </div>
    );
  }

  // For grid display (instagram, shop)
  return (
    <ContentGrid>
      {category.children.map((child) => {
        const [cardType, cardDetails] = child.card;
        
        return (
          <GridItem 
            key={child.id}
            onClick={() => {
              // Handle click action from card details or default to modal
              if (cardDetails.clickAction?.type === 'modal') {
                openPostModal(child.id, child);
              } else if (cardDetails.link) {
                window.open(cardDetails.link, '_blank');
              } else {
                openPostModal(child.id, child);
              }
            }}
          >
            <ContentItem
              type={cardType === 'product' ? 'product' : cardType === 'video' ? 'video' : 'image'}
              image={cardDetails.image || cardDetails.imageUrl || ''}
              title={child.title}
              {...(cardDetails.price && { price: cardDetails.price })}
              {...(cardDetails.overlay && { overlay: cardDetails.overlay })}
            />
          </GridItem>
        );
      })}
    </ContentGrid>
  );
}