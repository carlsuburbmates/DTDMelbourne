# Design System Implementation Plan

## Chain-of-Density (CoD) Synthesis

### Initial Sparse Draft
The design system JSON exists at [`src/design-system.json`](src/design-system.json). Need to implement it in React/Tailwind codebase.

### Iterative Depth Injection - Layer 1: Configuration Layer
- Need to create Tailwind config that maps design system tokens to Tailwind utilities
- Design system has specific colors, spacing, typography, shadows - these need to be Tailwind theme extensions
- Custom breakpoints need to be defined in Tailwind config
- Font family needs to be configured in Tailwind

### Iterative Depth Injection - Layer 2: Component Architecture
- Need atomic components that follow design system specs
- Button component with variants (primary, secondary, ghost, tertiary)
- Card component with hover states
- Input component with underline/filled variants
- Badge component for featured/verified/new
- Rating component with star display
- Each component needs TypeScript types matching design system

### Iterative Depth Injection - Layer 3: State Management
- Need theme provider for color palette switching (future dark mode)
- Need responsive context for breakpoint awareness
- Need loading state components (skeleton, spinner)
- Need empty state components for search, reviews, queue

### Iterative Depth Injection - Layer 4: Accessibility Layer
- Skip link component for keyboard navigation
- Focus ring utilities for all interactive elements
- ARIA labels for all components
- Live regions for dynamic content updates

### Iterative Depth Injection - Layer 5: Mobile Responsiveness
- Mobile-first CSS approach
- Hamburger menu component for mobile
- Bottom navigation for mobile
- Horizontal nav for desktop
- Touch target sizing (minimum 48px)

### Iterative Depth Injection - Layer 6: Edge Cases
- Error boundary components
- Error page components (404, 500, 429)
- Form validation states
- Loading states for async operations
- Empty states for all data views

## Dense Execution Plan

### 1. Tailwind Configuration with Design System Tokens
**File:** `tailwind.config.ts`

Map design system JSON to Tailwind theme:
- Colors: surface, primary, neutral, semantic
- Spacing: 4pt scale (4, 8, 16, 24, 32, 64, 128)
- Typography: font families, sizes, weights, line heights, letter spacing
- Border radius: none, sm, md, lg, xl, full
- Shadows: none, subtle, medium, elevated, hover
- Breakpoints: mobile (0), tablet (768), desktop (1024), wide (1280)

### 2. TypeScript Types for Design System
**File:** `src/types/design-system.ts`

Export types matching design system:
- Color palette types
- Typography types
- Spacing types
- Component variant types
- Responsive breakpoint types

### 3. Atomic Component Library
**Directory:** `src/components/ui/`

#### Button Component (`src/components/ui/Button.tsx`)
- Variants: primary, secondary, ghost, tertiary
- States: default, hover, active, disabled, loading
- Height: 48px (touch target compliant)
- Border radius: 8px
- Micro-interactions: translateY(-1px) on hover, scale(0.95) on click
- Accessibility: focus ring, ARIA labels

#### Card Component (`src/components/ui/Card.tsx`)
- Background: #FFFFFF
- Border: 1px solid rgba(0, 0, 0, 0.1)
- Border radius: 12px
- Padding: 24px
- Hover: translateY(-2px), elevated shadow
- Accessibility: focus management

#### Input Component (`src/components/ui/Input.tsx`)
- Variants: underline, filled
- Height: 48px (touch target compliant)
- Focus: high-contrast border or ring
- Accessibility: ARIA labels, error states

#### Badge Component (`src/components/ui/Badge.tsx`)
- Variants: featured, verified, new
- Colors: orange, green, purple
- Border radius: 4px
- Font size: 12px

#### Rating Component (`src/components/ui/Rating.tsx`)
- Star size: 16px
- Colors: filled (orange), empty (slate-200), half (amber)
- Display: inline with 2px spacing

### 4. Layout Components
**Directory:** `src/components/layout/`

#### Navigation Component (`src/components/layout/Navigation.tsx`)
- Mobile: Hamburger menu, fixed bottom position
- Desktop: Horizontal nav, sticky top position
- Responsive breakpoint: 768px
- Accessibility: Skip link, keyboard navigation

#### Container Component (`src/components/layout/Container.tsx`)
- Max width: 1200px desktop, 768px tablet, 100% mobile
- Padding: 80px desktop, 48px tablet, 24px mobile
- Centered layout

#### Grid Component (`src/components/layout/Grid.tsx`)
- 12-column bento grid
- Gutter: 16px
- Responsive: 1 col mobile, 2 col tablet, 3-4 col desktop

### 5. State Components
**Directory:** `src/components/states/`

#### Loading States (`src/components/states/Loading.tsx`)
- Skeleton: pulse animation, slate-200 background
- Spinner: 32px, 3px border, brand color

#### Empty States (`src/components/states/Empty.tsx`)
- Search: No trainers found, clear filters action
- Reviews: No reviews yet, write review action
- Queue: Queue empty, join queue action

#### Error States (`src/components/states/Error.tsx`)
- 404: Page not found, homepage action
- 500: Something went wrong, retry action
- 429: Too many requests, go back action

### 6. Accessibility Utilities and Hooks
**Directory:** `src/lib/accessibility/`

#### Skip Link (`src/lib/accessibility/skip-link.tsx`)
- Background: #2563EB
- Color: #FFFFFF
- Padding: 8px 16px
- Border radius: 4px
- Focus: visible on first tab

#### Focus Ring Utility (`src/lib/accessibility/focus-ring.ts`)
- Width: 2px
- Offset: 2px
- Color: #2563EB
- Radius: 4px

#### useFocusTrap Hook (`src/hooks/useFocusTrap.ts`)
- Trap focus within modals
- Handle escape key
- Return focus to trigger element

### 7. Responsive Utilities and Hooks
**Directory:** `src/hooks/`

#### useBreakpoint Hook (`src/hooks/useBreakpoint.ts`)
- Detect current breakpoint
- Return: mobile, tablet, desktop, wide
- Listen to resize events

#### useMediaQuery Hook (`src/hooks/useMediaQuery.ts`)
- Generic media query listener
- Debounce resize events
- Return match status

### 8. Theme Provider and Context
**File:** `src/contexts/ThemeContext.tsx`

- Provide color palette to app
- Support future dark mode
- Provide spacing tokens
- Provide typography tokens
- Provide breakpoint context

## Recursive Introspection (RISE) - Self-Critique

### Against Human-Centric Design System
✅ **PASS:** Design system uses strict mathematical scales (4pt spacing, defined font sizes)
✅ **PASS:** One primary action per screen principle defined
✅ **PASS:** Generous spacing (80px-120px section padding)
✅ **PASS:** Motion confirms user intent (200ms cubic-bezier)
✅ **PASS:** No "vibes" - specific values defined
✅ **PASS:** Off-white (#FAFAFA) and rich black (#0A0A0A) - no pure black/white
✅ **PASS:** Touch targets 48px minimum
✅ **PASS:** Focus rings defined for accessibility
✅ **PASS:** Empty states with clear actions
✅ **PASS:** Error pages with recovery actions

### Against Lean Stack Manifest
✅ **PASS:** Next.js 15 App Router compatible
✅ **PASS:** TypeScript for type safety
✅ **PASS:** Tailwind CSS for styling
✅ **PASS:** Component-based architecture
✅ **PASS:** Mobile-first responsive design
✅ **PASS:** Accessibility (WCAG AA/AAA)
✅ **PASS:** State management with React Context

### Internal Rewrites for Violations
**NONE DETECTED** - Design system JSON follows all principles correctly.

## Deep Reasoning - System 2 Thinking

### Downstream Consequences

**Decision 1: Use Tailwind theme extensions**
- **Consequence:** Design system tokens become Tailwind utilities (e.g., `bg-surface-off-white`, `text-primary-brand`)
- **Benefit:** Consistent styling across app, no magic numbers
- **Trade-off:** Larger Tailwind config file, but worth it for maintainability

**Decision 2: Atomic components with variants**
- **Consequence:** Reusable components with consistent behavior
- **Benefit:** DRY principle, easy to update design system
- **Trade-off:** More files initially, but faster development long-term

**Decision 3: Mobile-first navigation**
- **Consequence:** Hamburger menu on mobile, horizontal on desktop
- **Benefit:** Better UX on mobile devices (majority of users)
- **Trade-off:** Two navigation components to maintain

**Decision 4: Accessibility-first approach**
- **Consequence:** Skip links, focus rings, ARIA labels
- **Benefit:** WCAG AA/AAA compliance, keyboard navigation
- **Trade-off:** More markup, but inclusive design

**Decision 5: Generous spacing**
- **Consequence:** 80px-120px section padding
- **Benefit:** Premium feel, better readability
- **Trade-off:** More vertical scrolling, but worth it for UX

### Trade-off Evaluations

| Decision | SEO | Interactivity | Performance | Visual Fidelity | Overall |
|----------|------|--------------|-------------|------------------|----------|
| Tailwind theme | Neutral | Positive | Positive | Positive | ✅ |
| Atomic components | Neutral | Positive | Positive | Positive | ✅ |
| Mobile-first nav | Neutral | Positive | Neutral | Positive | ✅ |
| Accessibility-first | Neutral | Positive | Neutral | Positive | ✅ |
| Generous spacing | Neutral | Positive | Neutral | Positive | ✅ |

All decisions optimize for foresightful, maintainable implementation.

## Implementation Priority

### P0 (Critical) - Must Implement First
1. Tailwind configuration with design system tokens
2. TypeScript types for design system
3. Button component (primary, secondary, ghost, tertiary)
4. Input component (underline, filled)
5. Card component with hover states
6. Navigation component (mobile hamburger, desktop horizontal)
7. Skip link for accessibility
8. Focus ring utilities

### P1 (High) - Implement Second
9. Badge component (featured, verified, new)
10. Rating component with stars
11. Container component with responsive padding
12. Grid component (12-column bento)
13. Loading states (skeleton, spinner)
14. Empty states (search, reviews, queue)
15. Error pages (404, 500, 429)
16. Theme provider and context

### P2 (Medium) - Implement Third
17. useBreakpoint hook
18. useMediaQuery hook
19. useFocusTrap hook
20. Dark mode support (future)

## Success Criteria

- [ ] All P0 components implemented and tested
- [ ] All P1 components implemented and tested
- [ ] Tailwind config maps all design system tokens
- [ ] TypeScript types cover all design system values
- [ ] All components follow "one primary action" rule
- [ ] All touch targets are 48px minimum
- [ ] All interactive elements have focus rings
- [ ] All components have ARIA labels
- [ ] Mobile navigation works correctly
- [ ] Desktop navigation works correctly
- [ ] Empty states display correctly
- [ ] Error pages display correctly
- [ ] Loading states display correctly
- [ ] WCAG AA contrast ratios met
- [ ] Skip link works for keyboard users
