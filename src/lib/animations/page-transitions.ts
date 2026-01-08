/**
 * Page Transitions & Animation Configuration
 * Smooth transitions and animations for better UX
 */

// Page transition variants for Framer Motion or similar
export const pageTransitionVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -10,
  },
}

export const pageTransitionConfig = {
  duration: 0.2,
  ease: 'easeInOut',
}

// Modal/Dialog animations
export const modalVariants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
  },
}

// Sidebar animations
export const sidebarVariants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: -20,
  },
}

// List item animations
export const listItemVariants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
}

export const listContainerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

// Fade animations
export const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

// Slide animations
export const slideUpVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: 20,
  },
}

export const slideDownVariants = {
  initial: {
    opacity: 0,
    y: -20,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -20,
  },
}

// Hover animation utilities
export const hoverScale = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
}

// CSS animation classes (can be used with Tailwind)
export const animationClasses = {
  fadeIn: 'animate-in fade-in duration-200',
  fadeOut: 'animate-out fade-out duration-200',
  slideIn: 'animate-in slide-in-from-bottom duration-300',
  slideOut: 'animate-out slide-out-to-bottom duration-300',
  scaleIn: 'animate-in zoom-in-95 duration-200',
  scaleOut: 'animate-out zoom-out-95 duration-200',
}

// Transition timings
export const transitionTimings = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
}

// Easing functions
export const easing = {
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  linear: 'linear',
  easeInQuad: 'cubic-bezier(0.11, 0, 0.5, 0)',
  easeOutQuad: 'cubic-bezier(0.5, 1, 0.89, 1)',
}

// Micro-interactions
export const microInteractions = {
  buttonHover: {
    scale: 1.05,
    transition: { duration: 0.15 },
  },
  buttonTap: {
    scale: 0.95,
    transition: { duration: 0.1 },
  },
  cardHover: {
    y: -2,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    transition: { duration: 0.2 },
  },
  spinnerRotate: {
    rotate: 360,
    transition: { duration: 0.8, repeat: Infinity, linear: true },
  },
}
