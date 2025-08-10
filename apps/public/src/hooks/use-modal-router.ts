'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect } from 'react';

/**
 * URL-Aware Modal Router
 * 
 * Enables modal state to be synced with URL for shareability and browser history.
 * Never breaks the flow - modals are part of the navigation experience.
 */

export interface ModalState {
  isOpen: boolean;
  data: Record<string, string>;
}

export function useModalRouter(modalKey: string) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract modal data from URL params
  const getModalState = useCallback((): ModalState => {
    const modalData: Record<string, string> = {};
    
    for (const [key, value] of searchParams.entries()) {
      if (key.startsWith(`${modalKey}:`)) {
        const cleanKey = key.replace(`${modalKey}:`, '');
        modalData[cleanKey] = value;
      }
    }
    
    return {
      isOpen: Object.keys(modalData).length > 0,
      data: modalData,
    };
  }, [searchParams, modalKey]);

  // Update URL with modal state
  const openModal = useCallback((data: Record<string, string>) => {
    const newSearchParams = new URLSearchParams(searchParams);
    
    // Add modal data to URL params
    Object.entries(data).forEach(([key, value]) => {
      newSearchParams.set(`${modalKey}:${key}`, value);
    });

    // Update URL without page refresh
    router.push(`?${newSearchParams.toString()}`, { scroll: false });
  }, [searchParams, modalKey, router]);

  // Remove modal from URL
  const closeModal = useCallback(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    
    // Remove all modal-related params
    Array.from(newSearchParams.keys()).forEach(key => {
      if (key.startsWith(`${modalKey}:`)) {
        newSearchParams.delete(key);
      }
    });

    const newUrl = newSearchParams.toString() 
      ? `?${newSearchParams.toString()}` 
      : (typeof window !== 'undefined' ? window.location.pathname : '/');
    
    router.push(newUrl, { scroll: false });
  }, [searchParams, modalKey, router]);

  // Navigate within modal (for carousel functionality)
  const navigateModal = useCallback((newData: Record<string, string>) => {
    openModal(newData);
  }, [openModal]);

  return {
    modalState: getModalState(),
    openModal,
    closeModal,
    navigateModal,
  };
}

/**
 * Hook for managing modal carousel navigation
 */
export function useModalCarousel<T>(
  items: T[],
  getCurrentId: (item: T) => string,
  modalKey: string,
  activeIdKey: string = 'id'
) {
  const { modalState, navigateModal, closeModal } = useModalRouter(modalKey);
  
  const currentId = modalState.data[activeIdKey];
  const currentIndex = items.findIndex(item => getCurrentId(item) === currentId);
  const currentItem = currentIndex >= 0 ? items[currentIndex] : null;
  
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < items.length - 1;
  
  const goToPrev = useCallback(() => {
    if (canGoPrev && currentIndex > 0) {
      const prevItem = items[currentIndex - 1];
      if (prevItem) {
        navigateModal({ 
          ...modalState.data, 
          [activeIdKey]: getCurrentId(prevItem) 
        });
      }
    }
  }, [canGoPrev, items, currentIndex, navigateModal, modalState.data, activeIdKey, getCurrentId]);
  
  const goToNext = useCallback(() => {
    if (canGoNext && currentIndex < items.length - 1) {
      const nextItem = items[currentIndex + 1];
      if (nextItem) {
        navigateModal({ 
          ...modalState.data, 
          [activeIdKey]: getCurrentId(nextItem) 
        });
      }
    }
  }, [canGoNext, items, currentIndex, navigateModal, modalState.data, activeIdKey, getCurrentId]);
  
  const goToItem = useCallback((item: T) => {
    navigateModal({ 
      ...modalState.data, 
      [activeIdKey]: getCurrentId(item) 
    });
  }, [navigateModal, modalState.data, activeIdKey, getCurrentId]);
  
  return {
    modalState,
    currentItem,
    currentIndex,
    canGoPrev,
    canGoNext,
    goToPrev,
    goToNext,
    goToItem,
    closeModal,
  };
}