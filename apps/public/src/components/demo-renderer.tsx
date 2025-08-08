'use client';

import { useMemo, useCallback } from 'react';
import { type SiteConfig, type Category } from '@minimall/core';
import { BrandHeader } from './brand/brand-header';
import { LinkTabs } from './navigation/link-tabs';
import { ContentGrid, GridItem } from './layout/content-grid';
import { ContentItem } from './content/content-item';
import { PostModal } from './modals/post-modal';
import { ProductQuickView } from './modals/product-quick-view';
import { CartDrawer } from './modals/cart-drawer';
import { useModals, useOpenPostModal, useOpenCartDrawer, useCart } from '@/store/app-store';

interface DemoRendererProps {
  config: SiteConfig;
  className?: string;
}

export function DemoRenderer({ config, className = "" }: DemoRendererProps) {
  const { settings } = config;
  const modals = useModals();
  const openPostModal = useOpenPostModal();
  const openCartDrawer = useOpenCartDrawer();
  const cart = useCart();
  
  // Stable callback to prevent re-renders
  const handlePostModal = useCallback((postId: string, post: Category) => {
    openPostModal(postId, post);
  }, [openPostModal]);
  
  // Stable memoized tabs creation - avoid JSX in dependencies
  const tabs = useMemo(() => {
    const categoryTabs = config.categories.map(category => ({
      id: category.id,
      label: category.title,
      content: category, // Pass category data instead of JSX
    }));
    
    const cartTab = {
      id: 'cart',
      label: cart.totalItems > 0 ? `Cart (${cart.totalItems})` : 'Cart',
      content: null as Category | null,
      onClick: openCartDrawer,
      isAction: true,
    };
    
    return [...categoryTabs, cartTab];
  }, [config.categories, cart.totalItems, openCartDrawer]);

  // Memoize rendered tabs to prevent infinite re-renders
  const renderedTabs = useMemo(() => 
    tabs.map(tab => {
      const renderedTab: any = {
        id: tab.id,
        label: tab.label,
        content: tab.content && typeof tab.content === 'object' && 'children' in tab.content 
          ? <CategoryContent key={tab.id} category={tab.content} openPostModal={handlePostModal} />
          : null,
      };
      
      if ('onClick' in tab) {
        renderedTab.onClick = tab.onClick;
      }
      
      if ('isAction' in tab) {
        renderedTab.isAction = tab.isAction;
      }
      
      return renderedTab;
    }), 
    [tabs, handlePostModal]
  );

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
        <LinkTabs tabs={renderedTabs} />
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