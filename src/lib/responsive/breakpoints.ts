/**
 * Responsive Design Utilities & Breakpoints
 * Mobile-first responsive design system
 */

import React from 'react'

/**
 * Tailwind CSS Breakpoints
 * Mobile-first approach: start with mobile styles, then enhance for larger screens
 */
export const breakpoints = {
  xs: 320,   // Mobile (iPhone SE, small phones)
  sm: 640,   // Mobile (landscape, larger phones)
  md: 768,   // Tablet
  lg: 1024,  // Laptop
  xl: 1280,  // Desktop
  '2xl': 1536, // Large desktop
}

/**
 * Common responsive grid patterns
 */
export const gridPatterns = {
  // Auto-responsive - adapts number of columns based on viewport
  auto: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',

  // 2-column responsive
  twoColumn: 'grid-cols-1 md:grid-cols-2',

  // 3-column responsive
  threeColumn: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',

  // 4-column responsive
  fourColumn: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',

  // Sidebar + main content
  sidebar: 'flex flex-col lg:flex-row gap-6',
}

/**
 * Common responsive spacing patterns
 */
export const spacingPatterns = {
  // Responsive padding for containers
  containerPadding: 'px-4 sm:px-6 md:px-8 lg:px-12',

  // Responsive gap between items
  gap: 'gap-4 sm:gap-6 md:gap-8',

  // Responsive margin
  margin: 'my-4 sm:my-6 md:my-8 lg:my-12',
}

/**
 * Common responsive typography patterns
 */
export const typographyPatterns = {
  // Responsive heading
  heading: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl',

  // Responsive subheading
  subheading: 'text-lg sm:text-xl md:text-2xl',

  // Responsive body
  body: 'text-sm sm:text-base md:text-lg',
}

/**
 * Hook for detecting screen size (client-side only)
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false)

  React.useEffect(() => {
    const media = window.matchMedia(query)
    if (media.matches !== matches) {
      setMatches(media.matches)
    }

    const listener = () => setMatches(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [matches, query])

  return matches
}

/**
 * Responsive component helpers
 */
export const responsiveUtils = {
  // Hide on mobile
  hideOnMobile: 'hidden sm:block',

  // Show only on mobile
  showOnMobile: 'sm:hidden',

  // Full width on mobile, constrained on desktop
  fullWidthMobile: 'w-full lg:w-auto',

  // Stack on mobile, side-by-side on desktop
  stackMobile: 'flex flex-col gap-4 sm:flex-row sm:gap-6',

  // Single column mobile, multi-column desktop
  multiColumnMobile: 'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6',
}
