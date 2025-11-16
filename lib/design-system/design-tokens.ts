/**
 * Design Tokens - Système de design unifié
 * 
 * Tokens de design pour assurer la cohérence visuelle à travers toute l'application
 */

// Espacements (spacing scale)
export const SPACING = {
  xs: "0.5rem", // 8px
  sm: "0.75rem", // 12px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px
  "2xl": "3rem", // 48px
  "3xl": "4rem", // 64px
} as const;

// Tailles de police
export const TYPOGRAPHY = {
  xs: "0.75rem", // 12px
  sm: "0.875rem", // 14px
  base: "1rem", // 16px
  lg: "1.125rem", // 18px
  xl: "1.25rem", // 20px
  "2xl": "1.5rem", // 24px
  "3xl": "1.875rem", // 30px
  "4xl": "2.25rem", // 36px
  "5xl": "3rem", // 48px
} as const;

// Poids de police
export const FONT_WEIGHT = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

// Rayons de bordure
export const BORDER_RADIUS = {
  none: "0",
  sm: "0.25rem", // 4px
  md: "0.5rem", // 8px
  lg: "0.75rem", // 12px
  xl: "1rem", // 16px
  "2xl": "1.5rem", // 24px
  full: "9999px",
} as const;

// Ombres (box-shadow)
export const SHADOWS = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
  glow: "0 0 20px rgba(59, 130, 246, 0.3)",
  "glow-lg": "0 0 40px rgba(59, 130, 246, 0.4)",
} as const;

// Z-index scale
export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

// Transitions standardisées
export const TRANSITIONS = {
  fast: "150ms ease-in-out",
  normal: "200ms ease-in-out",
  slow: "300ms ease-in-out",
  slower: "500ms ease-in-out",
} as const;

// Breakpoints (alignés avec Tailwind)
export const BREAKPOINTS = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// Gradients prédéfinis
export const GRADIENTS = {
  primary: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 100%)",
  secondary: "linear-gradient(135deg, hsl(var(--secondary)) 0%, hsl(var(--secondary) / 0.8) 100%)",
  background: "linear-gradient(to bottom, hsl(var(--background)), hsl(var(--muted) / 0.3))",
  card: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.95) 100%)",
  glow: "radial-gradient(circle, hsl(var(--primary) / 0.2) 0%, transparent 70%)",
} as const;

// Effets de blur
export const BLUR = {
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  "2xl": "24px",
  "3xl": "40px",
} as const;

// Classes Tailwind réutilisables
export const CLASSES = {
  // Cards
  card: "rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-md transition-all duration-300",
  cardHover: "hover:shadow-lg hover:border-primary/20 hover:scale-[1.01]",
  cardSelected: "border-primary shadow-lg ring-2 ring-primary/20 scale-[1.02]",
  
  // Buttons
  button: "transition-all duration-200 font-semibold",
  buttonHover: "hover:scale-105 hover:shadow-md",
  buttonActive: "active:scale-95",
  
  // Inputs
  input: "transition-all duration-200 border-border focus:border-primary focus:ring-2 focus:ring-primary/20",
  inputError: "border-destructive focus:border-destructive focus:ring-destructive/20",
  
  // Text
  heading1: "text-4xl font-bold tracking-tight text-foreground",
  heading2: "text-3xl font-bold tracking-tight text-foreground",
  heading3: "text-2xl font-semibold tracking-tight text-foreground",
  body: "text-base leading-relaxed text-foreground",
  bodyMuted: "text-base leading-relaxed text-muted-foreground",
  
  // Layout
  container: "mx-auto max-w-5xl px-4 md:px-6 lg:px-8",
  section: "space-y-6 md:space-y-8",
  
  // Glassmorphism
  glass: "bg-background/80 backdrop-blur-md border border-border/50",
  glassStrong: "bg-background/90 backdrop-blur-lg border border-border/60",
} as const;

// Couleurs sémantiques (pour usage dans les composants)
export const SEMANTIC_COLORS = {
  success: "hsl(142, 76%, 36%)",
  warning: "hsl(38, 92%, 50%)",
  error: "hsl(0, 84%, 60%)",
  info: "hsl(217, 91%, 60%)",
} as const;

// ============================================
// TOKENS SOTA 2025 - AMÉLIORATIONS
// ============================================

// Espacements étendus (pour micro-interactions)
export const SPACING_EXTENDED = {
  ...SPACING,
  "4xl": "5rem", // 80px
  "5xl": "6rem", // 96px
  "6xl": "8rem", // 128px
} as const;

// Tailles de police étendues (pour hero sections)
export const TYPOGRAPHY_EXTENDED = {
  ...TYPOGRAPHY,
  "6xl": "3.75rem", // 60px
  "7xl": "4.5rem", // 72px
  "8xl": "6rem", // 96px
  "9xl": "8rem", // 128px
} as const;

// Line heights standardisés
export const LINE_HEIGHT = {
  none: "1",
  tight: "1.25",
  snug: "1.375",
  normal: "1.5",
  relaxed: "1.625",
  loose: "2",
} as const;

// Letter spacing
export const LETTER_SPACING = {
  tighter: "-0.05em",
  tight: "-0.025em",
  normal: "0em",
  wide: "0.025em",
  wider: "0.05em",
  widest: "0.1em",
} as const;

// Ombres avec support dark mode
export const SHADOWS_DARK = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.4)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.5)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
  glow: "0 0 20px rgba(59, 130, 246, 0.5)",
  "glow-lg": "0 0 40px rgba(59, 130, 246, 0.6)",
} as const;

// Focus rings accessibles (WCAG AA compliant)
export const FOCUS_RINGS = {
  default: "outline-none ring-2 ring-primary ring-offset-2 ring-offset-background",
  error: "outline-none ring-2 ring-destructive ring-offset-2 ring-offset-background",
  subtle: "outline-none ring-1 ring-primary/50 ring-offset-1 ring-offset-background",
  thick: "outline-none ring-4 ring-primary ring-offset-2 ring-offset-background",
} as const;

// États de focus pour accessibilité
export const FOCUS_STATES = {
  visible: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
  always: "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
  keyboard: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
} as const;

// Contraste de couleurs (WCAG AA)
export const CONTRAST_RATIOS = {
  normal: 4.5, // WCAG AA pour texte normal
  large: 3.0, // WCAG AA pour texte large (18pt+)
  enhanced: 7.0, // WCAG AAA pour texte normal
} as const;

// Micro-interactions (timing functions)
export const EASING_FUNCTIONS = {
  // Standard
  linear: "linear",
  ease: "ease",
  "ease-in": "ease-in",
  "ease-out": "ease-out",
  "ease-in-out": "ease-in-out",
  
  // Custom (SOTA 2025)
  spring: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
  snappy: "cubic-bezier(0.16, 1, 0.3, 1)",
  gentle: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
} as const;

// Durées d'animation pour micro-interactions
export const ANIMATION_DURATIONS = {
  instant: "0ms",
  fast: "100ms",
  quick: "150ms",
  normal: "200ms",
  moderate: "300ms",
  slow: "500ms",
  slower: "700ms",
  slowest: "1000ms",
} as const;

// Délais d'animation (stagger, delays)
export const ANIMATION_DELAYS = {
  none: "0ms",
  short: "50ms",
  medium: "100ms",
  long: "200ms",
  longer: "300ms",
} as const;

// États de chargement (skeletons)
export const LOADING_STATES = {
  skeleton: "animate-pulse bg-muted",
  shimmer: "animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted",
  spinner: "animate-spin",
  pulse: "animate-pulse",
} as const;

// Variants de skeletons par type de contenu
export const SKELETON_VARIANTS = {
  card: "h-64 rounded-xl",
  text: "h-4 rounded",
  heading: "h-6 rounded",
  avatar: "h-12 w-12 rounded-full",
  button: "h-10 w-24 rounded-md",
  input: "h-12 w-full rounded-md",
  list: "h-16 rounded-lg",
} as const;

// États de hover/tap pour interactions tactiles
export const INTERACTION_STATES = {
  hover: "hover:scale-105 hover:shadow-md transition-all duration-200",
  active: "active:scale-95 transition-all duration-100",
  focus: "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
  disabled: "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
  loading: "opacity-75 cursor-wait pointer-events-none",
} as const;

// Gestures tactiles (swipe, pinch, etc.)
export const GESTURE_THRESHOLDS = {
  swipe: {
    min: 50, // pixels minimum pour détecter un swipe
    max: 300, // pixels maximum pour un swipe naturel
    velocity: 0.3, // vitesse minimale (px/ms)
  },
  pinch: {
    min: 0.8, // scale minimum
    max: 3.0, // scale maximum
  },
  longPress: 500, // ms pour long press
  doubleTap: 300, // ms entre deux taps
} as const;

// Transitions de page
export const PAGE_TRANSITIONS = {
  fade: {
    enter: "opacity-0",
    enterActive: "opacity-100 transition-opacity duration-300",
    exit: "opacity-100",
    exitActive: "opacity-0 transition-opacity duration-200",
  },
  slide: {
    enter: "opacity-0 translate-x-4",
    enterActive: "opacity-100 translate-x-0 transition-all duration-300",
    exit: "opacity-100 translate-x-0",
    exitActive: "opacity-0 -translate-x-4 transition-all duration-200",
  },
  scale: {
    enter: "opacity-0 scale-95",
    enterActive: "opacity-100 scale-100 transition-all duration-300",
    exit: "opacity-100 scale-100",
    exitActive: "opacity-0 scale-95 transition-all duration-200",
  },
} as const;

// Empty states
export const EMPTY_STATES = {
  icon: "h-12 w-12 text-muted-foreground/50",
  title: "text-xl font-semibold text-foreground",
  description: "text-sm text-muted-foreground",
  cta: "mt-4",
} as const;

// Toast/Notification variants
export const TOAST_VARIANTS = {
  success: "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400",
  error: "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400",
  warning: "bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  info: "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400",
} as const;

// Badge variants
export const BADGE_VARIANTS = {
  default: "bg-primary/10 text-primary border-primary/20",
  success: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  error: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  warning: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  info: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  muted: "bg-muted text-muted-foreground border-border",
} as const;

// Classes étendues avec support dark mode
export const CLASSES_EXTENDED = {
  ...CLASSES,
  
  // Dark mode support explicite
  cardDark: "dark:bg-card dark:border-border dark:text-card-foreground",
  buttonDark: "dark:bg-primary dark:text-primary-foreground",
  inputDark: "dark:bg-background dark:border-border dark:text-foreground",
  
  // États de focus accessibles
  focusVisible: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
  focusRing: FOCUS_RINGS.default,
  
  // États de chargement
  skeleton: LOADING_STATES.skeleton,
  shimmer: LOADING_STATES.shimmer,
  
  // Interactions tactiles
  touchTarget: "min-h-[44px] min-w-[44px]", // Taille minimale pour touch (Apple HIG)
  tapHighlight: "active:bg-primary/10 active:scale-95",
  
  // Empty states
  emptyState: "flex flex-col items-center justify-center p-12 text-center",
  emptyIcon: EMPTY_STATES.icon,
  emptyTitle: EMPTY_STATES.title,
  emptyDescription: EMPTY_STATES.description,
  
  // Toast/Notification
  toast: "rounded-lg border p-4 shadow-lg backdrop-blur-sm",
  toastSuccess: TOAST_VARIANTS.success,
  toastError: TOAST_VARIANTS.error,
  toastWarning: TOAST_VARIANTS.warning,
  toastInfo: TOAST_VARIANTS.info,
  
  // Badge
  badge: "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
  badgeSuccess: BADGE_VARIANTS.success,
  badgeError: BADGE_VARIANTS.error,
  badgeWarning: BADGE_VARIANTS.warning,
  badgeInfo: BADGE_VARIANTS.info,
  
  // Progress indicators
  progressBar: "h-2 w-full overflow-hidden rounded-full bg-muted",
  progressFill: "h-full bg-primary transition-all duration-300",
  spinner: "animate-spin rounded-full border-2 border-primary border-t-transparent",
  
  // Drag & drop
  dragHandle: "cursor-grab active:cursor-grabbing",
  dragOver: "ring-2 ring-primary ring-offset-2",
  dragActive: "opacity-50 scale-95",
} as const;

// Media queries pour breakpoints (usage dans JS)
export const MEDIA_QUERIES = {
  sm: `(min-width: ${BREAKPOINTS.sm})`,
  md: `(min-width: ${BREAKPOINTS.md})`,
  lg: `(min-width: ${BREAKPOINTS.lg})`,
  xl: `(min-width: ${BREAKPOINTS.xl})`,
  "2xl": `(min-width: ${BREAKPOINTS["2xl"]})`,
  dark: "(prefers-color-scheme: dark)",
  light: "(prefers-color-scheme: light)",
  reducedMotion: "(prefers-reduced-motion: reduce)",
  hover: "(hover: hover)", // Support hover (pas touch)
  touch: "(hover: none)", // Device tactile
} as const;

// Tokens pour préférences utilisateur (accessibilité)
export const ACCESSIBILITY_TOKENS = {
  reducedMotion: "@media (prefers-reduced-motion: reduce) { animation: none; transition: none; }",
  highContrast: "@media (prefers-contrast: high) { border-width: 2px; }",
  focusVisible: "&:focus-visible { outline: 2px solid hsl(var(--primary)); outline-offset: 2px; }",
  skipLink: "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md",
} as const;

// Tokens pour animations de feedback
export const FEEDBACK_ANIMATIONS = {
  success: "animate-bounce-in",
  error: "animate-shake",
  loading: "animate-pulse",
  highlight: "animate-highlight",
} as const;

// Tokens pour transitions de layout (AnimateSharedLayout)
export const LAYOUT_TRANSITIONS = {
  spring: {
    type: "spring",
    stiffness: 300,
    damping: 30,
  },
  smooth: {
    type: "tween",
    duration: 0.3,
    ease: EASING_FUNCTIONS.smooth,
  },
} as const;

// Tokens pour haptic feedback (vibration API)
export const HAPTIC_PATTERNS = {
  light: [10], // 10ms
  medium: [20], // 20ms
  heavy: [30], // 30ms
  success: [10, 50, 10], // Success pattern
  error: [20, 50, 20, 50, 20], // Error pattern
  warning: [15, 30, 15], // Warning pattern
} as const;

// Helper pour haptic feedback
export const triggerHaptic = (pattern: keyof typeof HAPTIC_PATTERNS = "light") => {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(HAPTIC_PATTERNS[pattern]);
  }
};

// Tokens pour préférences système
export const SYSTEM_PREFERENCES = {
  prefersReducedMotion: typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  prefersDarkMode: typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches,
  prefersHighContrast: typeof window !== "undefined" && window.matchMedia("(prefers-contrast: high)").matches,
  isTouchDevice: typeof window !== "undefined" && "ontouchstart" in window,
} as const;

