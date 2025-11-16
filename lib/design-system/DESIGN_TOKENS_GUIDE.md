# Guide des Design Tokens SOTA 2025

Ce guide explique comment utiliser les tokens de design modernes pour créer une expérience utilisateur fluide et accessible.

## 📚 Table des matières

1. [Tokens de base](#tokens-de-base)
2. [Tokens étendus](#tokens-étendus)
3. [Accessibilité](#accessibilité)
4. [Micro-interactions](#micro-interactions)
5. [Dark mode](#dark-mode)
6. [Exemples d'utilisation](#exemples-dutilisation)

## Tokens de base

### Espacements

```typescript
import { SPACING } from "@/lib/design-system/design-tokens";

// Utilisation
<div className={`p-${SPACING.md}`}> // ❌ Ne fonctionne pas avec Tailwind
<div style={{ padding: SPACING.md }}> // ✅ Utilisation directe
<div className="p-4"> // ✅ Utilisation Tailwind standard
```

### Typographie

```typescript
import { TYPOGRAPHY, LINE_HEIGHT, LETTER_SPACING } from "@/lib/design-system/design-tokens";

<h1 style={{ 
  fontSize: TYPOGRAPHY["4xl"],
  lineHeight: LINE_HEIGHT.tight,
  letterSpacing: LETTER_SPACING.tight
}}>
  Titre
</h1>
```

### Ombres

```typescript
import { SHADOWS, SHADOWS_DARK } from "@/lib/design-system/design-tokens";

// Light mode
<div style={{ boxShadow: SHADOWS.lg }}>

// Dark mode
<div className="dark" style={{ boxShadow: SHADOWS_DARK.lg }}>
```

## Tokens étendus

### Classes pré-configurées

```typescript
import { CLASSES_EXTENDED } from "@/lib/design-system/design-tokens";

// Card avec dark mode
<div className={CLASSES_EXTENDED.card + " " + CLASSES_EXTENDED.cardDark}>

// Button avec interactions tactiles
<button className={CLASSES_EXTENDED.button + " " + CLASSES_EXTENDED.touchTarget}>

// Input avec focus accessible
<input className={CLASSES_EXTENDED.input + " " + CLASSES_EXTENDED.focusVisible} />
```

## Accessibilité

### Focus rings

```typescript
import { FOCUS_RINGS, FOCUS_STATES } from "@/lib/design-system/design-tokens";

// Focus ring par défaut
<button className={FOCUS_RINGS.default}>

// Focus ring pour erreur
<input className={FOCUS_RINGS.error} />

// Focus visible uniquement au clavier
<button className={FOCUS_STATES.visible}>
```

### Contraste WCAG

```typescript
import { CONTRAST_RATIOS } from "@/lib/design-system/design-tokens";

// Vérifier le contraste (à utiliser avec des outils de test)
const minContrast = CONTRAST_RATIOS.normal; // 4.5 pour WCAG AA
```

### Skip links

```typescript
import { ACCESSIBILITY_TOKENS } from "@/lib/design-system/design-tokens";

<a href="#main-content" className={ACCESSIBILITY_TOKENS.skipLink}>
  Aller au contenu principal
</a>
```

## Micro-interactions

### Durées d'animation

```typescript
import { ANIMATION_DURATIONS, EASING_FUNCTIONS } from "@/lib/design-system/design-tokens";

<div style={{
  transition: `all ${ANIMATION_DURATIONS.normal} ${EASING_FUNCTIONS.smooth}`
}}>
```

### États de chargement

```typescript
import { LOADING_STATES, SKELETON_VARIANTS } from "@/lib/design-system/design-tokens";

// Skeleton pour une card
<div className={LOADING_STATES.skeleton + " " + SKELETON_VARIANTS.card}>

// Shimmer effect
<div className={LOADING_STATES.shimmer + " " + SKELETON_VARIANTS.text}>
```

### Feedback animations

```typescript
import { FEEDBACK_ANIMATIONS } from "@/lib/design-system/design-tokens";

// Animation de succès
<div className={FEEDBACK_ANIMATIONS.success}>

// Animation d'erreur
<div className={FEEDBACK_ANIMATIONS.error}>
```

## Dark mode

### Support automatique

Les tokens utilisent les variables CSS `hsl(var(--primary))` qui s'adaptent automatiquement au dark mode défini dans `globals.css`.

### Classes dark mode explicites

```typescript
import { CLASSES_EXTENDED } from "@/lib/design-system/design-tokens";

<div className={CLASSES_EXTENDED.card + " " + CLASSES_EXTENDED.cardDark}>
```

## Exemples d'utilisation

### Card interactive

```tsx
import { CLASSES_EXTENDED, INTERACTION_STATES, SHADOWS } from "@/lib/design-system/design-tokens";

function InteractiveCard() {
  return (
    <div 
      className={`
        ${CLASSES_EXTENDED.card}
        ${INTERACTION_STATES.hover}
        ${INTERACTION_STATES.active}
        ${CLASSES_EXTENDED.focusVisible}
      `}
      style={{ boxShadow: SHADOWS.md }}
    >
      Contenu de la card
    </div>
  );
}
```

### Button avec haptic feedback

```tsx
import { CLASSES_EXTENDED, triggerHaptic, INTERACTION_STATES } from "@/lib/design-system/design-tokens";

function HapticButton() {
  const handleClick = () => {
    triggerHaptic("medium");
    // Action du bouton
  };

  return (
    <button
      className={`
        ${CLASSES_EXTENDED.button}
        ${CLASSES_EXTENDED.touchTarget}
        ${INTERACTION_STATES.hover}
        ${INTERACTION_STATES.active}
        ${CLASSES_EXTENDED.focusVisible}
      `}
      onClick={handleClick}
    >
      Cliquer
    </button>
  );
}
```

### Empty state

```tsx
import { EMPTY_STATES, CLASSES_EXTENDED } from "@/lib/design-system/design-tokens";

function EmptyState() {
  return (
    <div className={CLASSES_EXTENDED.emptyState}>
      <div className={CLASSES_EXTENDED.emptyIcon}>
        <Icon />
      </div>
      <h2 className={CLASSES_EXTENDED.emptyTitle}>
        Aucun élément
      </h2>
      <p className={CLASSES_EXTENDED.emptyDescription}>
        Commencez par ajouter votre premier élément.
      </p>
    </div>
  );
}
```

### Toast avec variants

```tsx
import { TOAST_VARIANTS, CLASSES_EXTENDED } from "@/lib/design-system/design-tokens";

function Toast({ variant = "success", message }) {
  return (
    <div className={`
      ${CLASSES_EXTENDED.toast}
      ${TOAST_VARIANTS[variant]}
    `}>
      {message}
    </div>
  );
}
```

### Badge avec variants

```tsx
import { BADGE_VARIANTS, CLASSES_EXTENDED } from "@/lib/design-system/design-tokens";

function Badge({ variant = "default", children }) {
  return (
    <span className={`
      ${CLASSES_EXTENDED.badge}
      ${BADGE_VARIANTS[variant]}
    `}>
      {children}
    </span>
  );
}
```

### Skeleton loader

```tsx
import { LOADING_STATES, SKELETON_VARIANTS } from "@/lib/design-system/design-tokens";

function SkeletonCard() {
  return (
    <div className={LOADING_STATES.skeleton + " " + SKELETON_VARIANTS.card}>
      <div className={LOADING_STATES.skeleton + " " + SKELETON_VARIANTS.heading} />
      <div className={LOADING_STATES.skeleton + " " + SKELETON_VARIANTS.text} />
      <div className={LOADING_STATES.skeleton + " " + SKELETON_VARIANTS.text} />
    </div>
  );
}
```

### Page transition

```tsx
import { PAGE_TRANSITIONS } from "@/lib/design-system/design-tokens";

function PageTransition({ children, type = "fade" }) {
  const transition = PAGE_TRANSITIONS[type];
  
  return (
    <div className={transition.enterActive}>
      {children}
    </div>
  );
}
```

### Gestures tactiles

```tsx
import { GESTURE_THRESHOLDS } from "@/lib/design-system/design-tokens";

function SwipeableCard() {
  const handleSwipe = (deltaX: number) => {
    if (Math.abs(deltaX) >= GESTURE_THRESHOLDS.swipe.min) {
      // Action de swipe
    }
  };

  return (
    <div onTouchMove={(e) => handleSwipe(e.touches[0].clientX)}>
      Contenu swipeable
    </div>
  );
}
```

## Préférences système

```typescript
import { SYSTEM_PREFERENCES } from "@/lib/design-system/design-tokens";

// Vérifier les préférences utilisateur
if (SYSTEM_PREFERENCES.prefersReducedMotion) {
  // Désactiver les animations
}

if (SYSTEM_PREFERENCES.isTouchDevice) {
  // Adapter l'UI pour tactile
}
```

## Media queries

```typescript
import { MEDIA_QUERIES } from "@/lib/design-system/design-tokens";

// Utilisation avec window.matchMedia
const isMobile = window.matchMedia(MEDIA_QUERIES.md).matches;
const prefersDark = window.matchMedia(MEDIA_QUERIES.dark).matches;
const prefersReducedMotion = window.matchMedia(MEDIA_QUERIES.reducedMotion).matches;
```

## Bonnes pratiques

1. **Utiliser les classes Tailwind quand possible** : Les tokens sont principalement pour la logique JS/TS
2. **Respecter l'accessibilité** : Toujours utiliser `FOCUS_STATES.visible` pour les éléments interactifs
3. **Taille minimale tactile** : Utiliser `CLASSES_EXTENDED.touchTarget` pour les boutons tactiles
4. **Respecter les préférences** : Vérifier `SYSTEM_PREFERENCES.prefersReducedMotion` avant d'animer
5. **Dark mode automatique** : Les variables CSS s'adaptent automatiquement, pas besoin de classes conditionnelles

## Migration depuis l'ancien système

Si vous avez du code utilisant directement des valeurs hardcodées :

```tsx
// ❌ Ancien
<div className="p-4 shadow-lg">

// ✅ Nouveau (si besoin de logique JS)
<div style={{ padding: SPACING.md, boxShadow: SHADOWS.lg }}>

// ✅ Encore mieux (Tailwind)
<div className="p-4 shadow-lg">
```

Les tokens sont principalement utiles pour :
- La logique JavaScript/TypeScript
- Les animations dynamiques
- Les calculs de layout
- Les media queries
- Les préférences utilisateur

