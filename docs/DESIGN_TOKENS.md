# Design Tokens Reference

Complete reference for all design tokens used in the Mai Bets Design System.

## Color Palette

### Brand Colors

#### Sky (Primary)
Technology and trust - Used for primary actions, links, and brand elements.

```css
sky-50:  #F0F9FF
sky-100: #E0F2FE
sky-200: #BAE6FD
sky-300: #7DD3FC
sky-400: #38BDF8  /* Primary brand color */
sky-500: #0EA5E9  /* Primary interactive */
sky-600: #0284C7  /* Primary hover */
sky-700: #0369A1
sky-800: #075985
sky-900: #0C4A6E
```

#### Indigo (Secondary)
Luxury and depth - Used for secondary actions and accents.

```css
indigo-50:  #EEF2FF
indigo-100: #E0E7FF
indigo-200: #C7D2FE
indigo-300: #A5B4FC
indigo-400: #818CF8  /* Secondary brand color */
indigo-500: #6366F1  /* Secondary interactive */
indigo-600: #4F46E5  /* Secondary hover */
indigo-700: #4338CA
indigo-800: #3730A3
indigo-900: #312E81
```

### Semantic Colors

#### Emerald (Success/Money)
Positive outcomes, success states, money indicators.

```css
emerald-400: #34D399  /* Light success */
emerald-500: #10B981  /* Success default */
emerald-600: #059669  /* Success emphasis */
```

#### Coral (Energy/Attention)
High energy, attention grabbing, live states.

```css
coral-400: #FB923C  /* Light energy */
coral-500: #F97316  /* Energy default */
coral-600: #EA580C  /* Energy emphasis */
```

#### Amber (Warning)
Warnings, caution states.

```css
amber-400: #FBBF24  /* Light warning */
amber-500: #F59E0B  /* Warning default */
amber-600: #D97706  /* Warning emphasis */
```

#### Rose (Danger/Critical)
Errors, destructive actions, critical states.

```css
rose-400: #FB7185  /* Light danger */
rose-500: #F43F5F  /* Danger default */
rose-600: #E11D48  /* Danger emphasis */
```

## CSS Custom Properties

### Background Colors

#### Light Mode
```css
--bg-primary:   #F8FAFB  /* Main page background */
--bg-secondary: #FFFFFF  /* Card/panel background */
--bg-tertiary:  #EDF2F7  /* Subtle backgrounds */
--bg-elevated:  #FFFFFF  /* Elevated surfaces */
```

#### Dark Mode
```css
--bg-primary:   #0F1419  /* Main page background */
--bg-secondary: #1A1F2E  /* Card/panel background */
--bg-tertiary:  #232936  /* Subtle backgrounds */
--bg-elevated:  #2A3142  /* Elevated surfaces */
```

### Text Colors

#### Light Mode
```css
--text-primary:   #1A2332  /* Primary text */
--text-secondary: #4A5568  /* Secondary text */
--text-tertiary:  #718096  /* Muted text */
--text-inverse:   #FFFFFF  /* Inverse text (on dark) */
```

#### Dark Mode
```css
--text-primary:   #F8FAFC  /* Primary text */
--text-secondary: #CBD5E1  /* Secondary text */
--text-tertiary:  #94A3B8  /* Muted text */
--text-inverse:   #1A2332  /* Inverse text (on light) */
```

### Borders & Dividers

#### Light Mode
```css
--border-color: #E2E8F0
```

#### Dark Mode
```css
--border-color: #334155
```

### Glass Morphism

#### Light Mode
```css
--glass-bg:     rgba(255, 255, 255, 0.7)
--glass-border: rgba(255, 255, 255, 0.18)
```

#### Dark Mode
```css
--glass-bg:     rgba(26, 31, 46, 0.7)
--glass-border: rgba(255, 255, 255, 0.1)
```

## Typography

### Font Families

```css
font-sans:    'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
font-display: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
font-mono:    'JetBrains Mono', 'Courier New', monospace
```

**Usage:**
- `font-sans`: Body text, UI elements (default)
- `font-display`: Headlines, hero sections, large text
- `font-mono`: Code, numbers, technical data

### Font Weights

#### Plus Jakarta Sans
- 300 (Light)
- 400 (Regular)
- 500 (Medium)
- 600 (Semibold)
- 700 (Bold)
- 800 (Extrabold)

#### Outfit
- 400 (Regular)
- 500 (Medium)
- 600 (Semibold)
- 700 (Bold)
- 800 (Extrabold)
- 900 (Black)

#### JetBrains Mono
- 400 (Regular)
- 500 (Medium)
- 600 (Semibold)
- 700 (Bold)

### Font Sizes

```css
text-xs:   0.75rem    /* 12px */
text-sm:   0.875rem   /* 14px */
text-base: 1rem       /* 16px */
text-lg:   1.125rem   /* 18px */
text-xl:   1.25rem    /* 20px */
text-2xl:  1.5rem     /* 24px */
text-3xl:  1.875rem   /* 30px - Custom: 28px/1.4 */
text-4xl:  2.25rem    /* 36px */
text-5xl:  3rem       /* 48px */
text-6xl:  3.75rem    /* 60px */
text-7xl:  4.5rem     /* 72px */
text-8xl:  6rem       /* 96px */
text-9xl:  8rem       /* 128px */

text-display: 72px    /* Custom display size */
```

## Spacing Scale

### Standard Tailwind + Custom

```css
0:   0px
px:  1px
0.5: 0.125rem  /* 2px */
1:   0.25rem   /* 4px */
2:   0.5rem    /* 8px */
3:   0.75rem   /* 12px */
4:   1rem      /* 16px */
5:   1.25rem   /* 20px */
6:   1.5rem    /* 24px */
8:   2rem      /* 32px */
10:  2.5rem    /* 40px */
12:  3rem      /* 48px */
16:  4rem      /* 64px */
18:  4.5rem    /* 72px - Custom */
20:  5rem      /* 80px */
24:  6rem      /* 96px */
88:  22rem     /* 352px - Custom */
```

**Common Usage:**
- `p-4, p-6`: Component padding
- `gap-4, gap-6`: Grid/flex gaps
- `mb-4, mt-6`: Vertical spacing
- `space-y-4`: Stack spacing

## Border Radius

```css
rounded-none: 0px
rounded-sm:   0.125rem  /* 2px */
rounded:      0.25rem   /* 4px */
rounded-md:   0.375rem  /* 6px */
rounded-lg:   0.5rem    /* 8px */
rounded-xl:   1rem      /* 16px - Custom */
rounded-2xl:  1.5rem    /* 24px - Custom */
rounded-3xl:  2rem      /* 32px - Custom */
rounded-full: 9999px
```

**Usage:**
- `rounded-lg`: Buttons, inputs
- `rounded-xl`: Cards
- `rounded-2xl`: Modals
- `rounded-3xl`: Hero sections
- `rounded-full`: Pills, circles

## Shadows

### Default Shadows

```css
shadow-sm:   0 1px 2px rgba(0, 0, 0, 0.05)
shadow:      0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)
shadow-md:   0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)
shadow-lg:   0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)
shadow-xl:   0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)
shadow-2xl:  0 25px 50px rgba(0, 0, 0, 0.25)
```

### Custom Brand Shadows

```css
shadow-glow-sky:     0 0 24px rgba(56, 189, 248, 0.3)
shadow-glow-indigo:  0 0 24px rgba(99, 102, 241, 0.3)
shadow-glow-emerald: 0 0 24px rgba(16, 185, 129, 0.3)

shadow-card:       0 4px 12px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0, 0, 0, 0.05)
shadow-card-hover: 0 8px 24px rgba(56, 189, 248, 0.08), 0 4px 12px rgba(99, 102, 241, 0.06)
```

**Usage:**
- `shadow-glow-*`: Focus states, active elements
- `shadow-card`: Default card elevation
- `shadow-card-hover`: Card hover states

## Backdrop Blur

```css
backdrop-blur-sm:   4px
backdrop-blur:      8px
backdrop-blur-md:   12px
backdrop-blur-lg:   16px
backdrop-blur-xl:   24px
backdrop-blur-2xl:  40px
backdrop-blur-3xl:  64px

backdrop-blur-glass: 12px  /* Custom for glass morphism */
```

## Animations

### Durations

```css
duration-75:   75ms
duration-100:  100ms
duration-150:  150ms
duration-200:  200ms
duration-300:  300ms
duration-500:  500ms
duration-700:  700ms
duration-1000: 1000ms
```

### Timing Functions

```css
ease-linear:     cubic-bezier(0, 0, 1, 1)
ease-in:         cubic-bezier(0.4, 0, 1, 1)
ease-out:        cubic-bezier(0, 0, 0.2, 1)
ease-in-out:     cubic-bezier(0.4, 0, 0.2, 1)
```

### Custom Animations

```css
animate-pulse:       pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite
animate-pulse-slow:  pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite
animate-spin:        spin 1s linear infinite
animate-border-flow: borderFlow 3s linear infinite
animate-shimmer:     shimmer 4s linear infinite
animate-slide-in:    slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)
animate-fade-in:     fadeIn 0.4s ease
```

### Keyframes

```css
@keyframes borderFlow {
  0%, 100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
}

@keyframes shimmer {
  0%   { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}

@keyframes slideIn {
  0%   { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}
```

## Breakpoints

```css
sm:  640px   /* Mobile landscape */
md:  768px   /* Tablet portrait */
lg:  1024px  /* Tablet landscape / small desktop */
xl:  1280px  /* Desktop */
2xl: 1536px  /* Large desktop */
```

**Usage:**
```tsx
<div className="text-sm md:text-base lg:text-lg">
  Responsive text
</div>

<Grid cols={1} className="md:grid-cols-2 lg:grid-cols-3">
  Responsive grid
</Grid>
```

## Z-Index Scale

```css
z-0:   0
z-10:  10
z-20:  20
z-30:  30
z-40:  40
z-50:  50   /* Modals, overlays */
z-auto: auto
```

**Standard Usage:**
- Dropdown menus: `z-10`
- Sticky headers: `z-20`
- Modals/overlays: `z-50`

## Opacity Scale

```css
opacity-0:   0
opacity-5:   0.05
opacity-10:  0.1
opacity-20:  0.2
opacity-25:  0.25
opacity-30:  0.3
opacity-40:  0.4
opacity-50:  0.5
opacity-60:  0.6
opacity-70:  0.7
opacity-75:  0.75
opacity-80:  0.8
opacity-90:  0.9
opacity-95:  0.95
opacity-100: 1
```

## Usage Guidelines

### When to Use Each Color

- **Sky**: Primary buttons, links, focus states, brand elements
- **Indigo**: Secondary buttons, accents, highlights
- **Emerald**: Success messages, positive metrics, money gains
- **Coral**: Live indicators, urgent actions, attention
- **Amber**: Warnings, pending states
- **Rose**: Errors, destructive actions, negative metrics

### Accessibility

- Maintain 4.5:1 contrast ratio for body text
- Maintain 3:1 contrast ratio for large text (18px+)
- Test all color combinations in both light and dark modes
- Use semantic colors (success, warning, danger) consistently

### Dark Mode

- All colors automatically adapt via CSS custom properties
- Use `dark:` prefix for dark mode specific classes
- Test interactive states (hover, focus) in dark mode
- Ensure sufficient contrast in both modes
