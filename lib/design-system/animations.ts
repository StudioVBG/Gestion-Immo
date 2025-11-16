/**
 * Système d'animations unifié pour une UX/UI fluide et impeccable
 * 
 * Toutes les animations utilisent Framer Motion avec des durées et courbes optimisées
 * pour une expérience utilisateur premium.
 */

import { Variants } from "framer-motion";

// Durées standardisées (en secondes)
export const ANIMATION_DURATION = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  slower: 0.8,
} as const;

// Courbes d'animation (easing)
export const EASING = {
  smooth: [0.4, 0, 0.2, 1], // ease-in-out
  bounce: [0.68, -0.55, 0.265, 1.55],
  spring: { type: "spring", stiffness: 300, damping: 30 },
  springSmooth: { type: "spring", stiffness: 200, damping: 25 },
  springBouncy: { type: "spring", stiffness: 400, damping: 25 },
} as const;

// Variants pour les conteneurs
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
      duration: ANIMATION_DURATION.normal,
      ease: EASING.smooth,
    },
  },
};

// Variants pour les éléments enfants
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: EASING.springSmooth,
  },
};

// Variants pour les cartes avec hover
export const cardVariants: Variants = {
  initial: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -4,
    transition: EASING.springSmooth,
  },
  tap: { scale: 0.98 },
  selected: {
    scale: 1.05,
    y: -6,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: EASING.springSmooth,
  },
};

// Variants pour les transitions entre étapes
export const stepTransitionVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 50,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      ...EASING.springSmooth,
      duration: ANIMATION_DURATION.normal,
    },
  },
  exit: {
    opacity: 0,
    x: -50,
    scale: 0.95,
    transition: {
      duration: ANIMATION_DURATION.fast,
      ease: EASING.smooth,
    },
  },
};

// Variants pour les modals/dialogs
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: EASING.springSmooth,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: ANIMATION_DURATION.fast,
    },
  },
};

// Variants pour les listes avec stagger
export const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

// Variants pour les éléments de liste
export const listItemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: EASING.springSmooth,
  },
};

// Variants pour les icônes avec rotation
export const iconVariants: Variants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: EASING.springBouncy,
  },
};

// Variants pour les badges/notifications
export const badgeVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: EASING.springBouncy,
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: {
      duration: ANIMATION_DURATION.fast,
    },
  },
};

// Variants pour les progress bars
export const progressVariants: Variants = {
  initial: { width: 0 },
  animate: {
    width: "100%",
    transition: {
      duration: ANIMATION_DURATION.slow,
      ease: EASING.smooth,
    },
  },
};

// Variants pour les tooltips
export const tooltipVariants: Variants = {
  hidden: { opacity: 0, y: 5, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: EASING.springSmooth,
  },
};

// Variants pour les inputs avec focus
export const inputFocusVariants: Variants = {
  unfocused: {
    scale: 1,
  },
  focused: {
    scale: 1.01,
    boxShadow: "0 0 0 3px hsl(var(--primary) / 0.1)",
    transition: EASING.springSmooth,
  },
};

// Variants pour les boutons avec loading
export const buttonLoadingVariants: Variants = {
  idle: { scale: 1 },
  loading: {
    scale: 0.95,
    transition: {
      repeat: Infinity,
      repeatType: "reverse",
      duration: 0.6,
    },
  },
};

// Variants pour les drag & drop
export const dragVariants: Variants = {
  idle: { scale: 1, zIndex: 1 },
  dragging: {
    scale: 1.05,
    zIndex: 50,
    rotate: 2,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
    transition: {
      duration: ANIMATION_DURATION.fast,
    },
  },
};

// Variants pour les images avec lazy load
export const imageVariants: Variants = {
  hidden: { opacity: 0, scale: 1.1 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: ANIMATION_DURATION.slow,
      ease: EASING.smooth,
    },
  },
};

// Variants pour les skeletons/loaders
export const skeletonVariants: Variants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Variants pour les notifications toast
export const toastVariants: Variants = {
  hidden: { opacity: 0, y: -20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: EASING.springBouncy,
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: {
      duration: ANIMATION_DURATION.fast,
    },
  },
};

// Variants pour les accordéons
export const accordionVariants: Variants = {
  closed: { height: 0, opacity: 0 },
  open: {
    height: "auto",
    opacity: 1,
    transition: {
      height: {
        duration: ANIMATION_DURATION.normal,
        ease: EASING.smooth,
      },
      opacity: {
        duration: ANIMATION_DURATION.fast,
        delay: 0.1,
      },
    },
  },
};

// Variants pour les onglets (tabs)
export const tabVariants: Variants = {
  inactive: { scale: 1, opacity: 0.7 },
  active: {
    scale: 1.05,
    opacity: 1,
    transition: EASING.springSmooth,
  },
};

// Variants pour les dropdowns/selects
export const dropdownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -10,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: EASING.springSmooth,
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: ANIMATION_DURATION.fast,
    },
  },
};

// Variants pour les pages avec transition
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: EASING.smooth,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: ANIMATION_DURATION.fast,
    },
  },
};

