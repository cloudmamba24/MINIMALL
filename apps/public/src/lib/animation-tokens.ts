/**
 * Animation Design Tokens
 * 
 * Centralized animation constants for consistent, purposeful motion.
 * Every transition tells a story - these tokens ensure the story is coherent.
 */

export const animationTokens = {
  // Durations (in milliseconds)
  duration: {
    instant: 150,
    fast: 250,
    normal: 350,
    slow: 500,
    backdrop: 300,
    stagger: 50, // Base delay for staggered animations
  },

  // Easing curves - the soul of great animation
  easing: {
    // Gentle, organic feeling - perfect for modals and overlays
    gentle: [0.3, 1, 0.3, 1] as [number, number, number, number],
    
    // Snappy but soft - for UI elements coming into view
    entrance: [0.4, 0, 0.2, 1] as [number, number, number, number],
    
    // Quick exit - elements leaving the stage
    exit: [0.4, 0, 1, 1] as [number, number, number, number],
    
    // Smooth, continuous motion - for carousels and sliding panels
    slide: [0.25, 0.8, 0.25, 1] as [number, number, number, number],
    
    // Bouncy, delightful - for success states and add-to-cart
    bounce: [0.68, -0.55, 0.265, 1.55] as [number, number, number, number],
  },

  // CSS easing strings for non-Framer Motion usage
  easingCSS: {
    gentle: 'cubic-bezier(0.3, 1, 0.3, 1)',
    entrance: 'cubic-bezier(0.4, 0, 0.2, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
    slide: 'cubic-bezier(0.25, 0.8, 0.25, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Transform values for consistent spacing
  transform: {
    slideDistance: 80, // Subtle push distance for connected UI elements
    slideInDistance: 100, // Distance for panels sliding in
    scaleDown: 0.95, // Gentle scale for modal entrance
    scaleUp: 1,
    tagSlide: 20, // Small slide for directional hints
  },

  // Opacity values
  opacity: {
    hidden: 0,
    backdrop: 0.5,
    visible: 1,
  },
} as const;

/**
 * Pre-built animation presets for common UI patterns
 */
export const animationPresets = {
  // Modal entrance: gentle fade + scale up
  modalEntrance: {
    initial: { 
      opacity: animationTokens.opacity.hidden, 
      scale: animationTokens.transform.scaleDown 
    },
    animate: { 
      opacity: animationTokens.opacity.visible, 
      scale: animationTokens.transform.scaleUp 
    },
    exit: { 
      opacity: animationTokens.opacity.hidden, 
      scale: animationTokens.transform.scaleDown 
    },
    transition: {
      duration: animationTokens.duration.normal / 1000,
      ease: animationTokens.easing.gentle,
    },
  },

  // Backdrop fade
  backdropFade: {
    initial: { opacity: animationTokens.opacity.hidden },
    animate: { opacity: animationTokens.opacity.backdrop },
    exit: { opacity: animationTokens.opacity.hidden },
    transition: {
      duration: animationTokens.duration.backdrop / 1000,
      ease: animationTokens.easing.entrance,
    },
  },

  // Panel slide in from right
  panelSlideIn: {
    initial: { 
      x: '100%',
      opacity: animationTokens.opacity.hidden,
    },
    animate: { 
      x: 0,
      opacity: animationTokens.opacity.visible,
    },
    exit: { 
      x: '100%',
      opacity: animationTokens.opacity.hidden,
    },
    transition: {
      duration: animationTokens.duration.slow / 1000,
      ease: animationTokens.easing.slide,
    },
  },

  // Content cross-fade
  crossFade: {
    initial: { opacity: animationTokens.opacity.hidden },
    animate: { opacity: animationTokens.opacity.visible },
    exit: { opacity: animationTokens.opacity.hidden },
    transition: {
      duration: animationTokens.duration.fast / 1000,
      ease: animationTokens.easing.entrance,
    },
  },

  // Staggered product tags
  productTag: {
    initial: { opacity: animationTokens.opacity.hidden, scale: 0.8 },
    animate: { opacity: animationTokens.opacity.visible, scale: 1 },
    exit: { opacity: animationTokens.opacity.hidden, scale: 0.8 },
    transition: {
      duration: animationTokens.duration.fast / 1000,
      ease: animationTokens.easing.bounce,
    },
  },

  // Add to cart success
  addToCart: {
    initial: { scale: 1 },
    animate: { scale: [1, 1.1, 1] as number[] },
    transition: {
      duration: animationTokens.duration.normal / 1000,
      ease: animationTokens.easing.bounce,
    },
  },
} as const;

/**
 * CSS-in-JS helper for creating transition styles
 */
export const createTransition = (
  property: string | string[],
  duration: keyof typeof animationTokens.duration = 'normal',
  easing: keyof typeof animationTokens.easingCSS = 'entrance'
) => {
  const properties = Array.isArray(property) ? property : [property];
  const durationMs = animationTokens.duration[duration];
  const easingCurve = animationTokens.easingCSS[easing];
  
  return properties
    .map(prop => `${prop} ${durationMs}ms ${easingCurve}`)
    .join(', ');
};