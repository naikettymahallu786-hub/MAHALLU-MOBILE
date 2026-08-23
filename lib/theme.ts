/**
 * Mahallu Mobile — Centralized Design Tokens
 *
 * Single source of truth for the entire app's visual language.
 * Import `theme` anywhere instead of redeclaring inline constants.
 */

export const colors = {
  // ── Primary: Deep Teal (evokes mosque domes & Islamic architecture)
  teal: {
    darkest: '#062E28',
    dark: '#0B4A42',
    base: '#0F6B5C',
    light: '#1A8F7D',
    lighter: '#E8F3F0',
    ghost: '#F0FAF7',
  },

  // ── Accent: Warm Gold (evokes mosque minarets & calligraphy)
  gold: {
    dark: '#A67B1E',
    base: '#C9972E',
    light: '#E8D9B5',
    lighter: '#F5EED9',
    ghost: '#FBF6EA',
  },

  // ── Neutral: Warm Cream & Slate
  cream: '#FBF8F2',
  white: '#FFFFFF',
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },

  // ── Semantic
  success: '#16A34A',
  successBg: '#DCFCE7',
  error: '#DC2626',
  errorBg: '#FEE2E2',
  warning: '#D97706',
  warningBg: '#FEF3C7',
  info: '#2563EB',
  infoBg: '#DBEAFE',

  // ── Category Accents (for quick actions, stats, service cards)
  purple: { base: '#A855F7', bg: '#FAF5FF' },
  blue: { base: '#3B82F6', bg: '#EFF6FF' },
  rose: { base: '#F43F5E', bg: '#FFF1F2' },
  amber: { base: '#F59E0B', bg: '#FFFBEB' },
  emerald: { base: '#10B981', bg: '#ECFDF5' },
  cyan: { base: '#06B6D4', bg: '#ECFEFF' },
} as const;

export const gradients = {
  /** Main header gradient — deep teal sweep */
  header: ['#062E28', '#0B4A42', '#0F6B5C'] as const,
  /** Compact header gradient */
  headerCompact: ['#0B4A42', '#0F6B5C'] as const,
  /** Gold accent gradient */
  gold: ['#C9972E', '#E8D9B5'] as const,
  /** Card glass overlay */
  glassOverlay: ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.04)'] as const,
  /** Dark image overlay for text readability */
  imageOverlay: ['transparent', 'rgba(6,46,40,0.85)'] as const,
  /** Auth screen background */
  authBg: ['#062E28', '#0B4A42', '#0F6B5C', '#1A8F7D'] as const,
  /** Success gradient */
  success: ['#059669', '#10B981'] as const,
  /** Danger gradient */
  danger: ['#DC2626', '#F43F5E'] as const,
} as const;

export const shadows = {
  /** Subtle card shadow */
  card: {
    shadowColor: '#0B4A42',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  /** Elevated floating element */
  elevated: {
    shadowColor: '#062E28',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  /** Soft glow for active/highlighted elements */
  glow: {
    shadowColor: '#0F6B5C',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  /** Tab bar shadow */
  tabBar: {
    shadowColor: '#0B4A42',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 16,
  },
  /** Gold accent shadow for CTA buttons */
  goldButton: {
    shadowColor: '#C9972E',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  /** Soft inner shadow for inputs */
  input: {
    shadowColor: '#0B4A42',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
} as const;

export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 32,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

/** Animation duration presets (ms) */
export const timing = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: { damping: 15, stiffness: 150 },
} as const;

const theme = {
  colors,
  gradients,
  shadows,
  radius,
  spacing,
  timing,
} as const;

export default theme;
