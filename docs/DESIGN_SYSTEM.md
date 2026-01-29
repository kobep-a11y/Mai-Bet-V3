# Mai Bets Design System

A comprehensive design system built with React, TypeScript, and Tailwind CSS featuring dark mode support, accessible components, and a modern UI.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Design Principles](#design-principles)
- [Components](#components)
- [Theme System](#theme-system)
- [Design Tokens](#design-tokens)
- [Usage Examples](#usage-examples)

## Overview

The Mai Bets Design System provides a complete set of reusable UI components built on top of Tailwind CSS with:

- **17+ React Components** - Buttons, Cards, Forms, Tables, Modals, and more
- **Dark Mode Support** - Built-in theme provider with light, dark, and system modes
- **TypeScript First** - Full type safety with comprehensive interfaces
- **Accessible** - ARIA attributes and keyboard navigation support
- **Customizable** - Props-based API with variant support
- **Modern Design** - Glass morphism, gradients, and smooth animations

## Installation

All components are located in `/components/ui/` and can be imported individually:

```typescript
// Individual imports
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

// Or use the index file for convenience
import { Button, Card, CardHeader } from '@/components/ui';
```

## Design Principles

### 1. Consistency
- Unified color palette across all components
- Consistent spacing and sizing scales
- Shared animation and transition patterns

### 2. Flexibility
- Variant-based component APIs
- Composable components (Card + CardHeader + CardContent)
- Easy to override with className prop

### 3. Accessibility
- Semantic HTML elements
- ARIA attributes where needed
- Keyboard navigation support
- Focus state management

### 4. Performance
- Lightweight components
- Minimal re-renders
- CSS-based animations
- Tree-shakeable imports

## Components

### Layout Components

#### Container
Responsive container with max-width constraints.

```tsx
<Container size="xl">
  <h1>Content goes here</h1>
</Container>
```

**Props:**
- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full' (default: 'xl')

#### Grid
Responsive grid layout system.

```tsx
<Grid cols={3} gap="md" responsive>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Grid>
```

**Props:**
- `cols`: 1 | 2 | 3 | 4 | 5 | 6 | 12 (default: 1)
- `gap`: 'xs' | 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
- `responsive`: boolean (default: true)

#### Flex
Flexible flexbox container.

```tsx
<Flex direction="row" justify="between" align="center" gap="md">
  <div>Left</div>
  <div>Right</div>
</Flex>
```

**Props:**
- `direction`: 'row' | 'col' | 'row-reverse' | 'col-reverse'
- `align`: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
- `justify`: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
- `wrap`: 'wrap' | 'nowrap' | 'wrap-reverse'
- `gap`: 'xs' | 'sm' | 'md' | 'lg' | 'xl'

### Core Components

#### Button
Action button with multiple variants.

```tsx
<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>

<Button variant="secondary" isLoading>
  Loading...
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'icon' (default: 'primary')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `isLoading`: boolean
- `disabled`: boolean

#### Card
Flexible card container with sub-components.

```tsx
<Card variant="glass" hover>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

**Props:**
- `variant`: 'default' | 'glass' | 'glass-dark' (default: 'default')
- `hover`: boolean (default: true)

#### Badge
Status and label indicators.

```tsx
<Badge variant="status" status="live">Live</Badge>
<StatusBadge status="final" />
<OddsBadge value={150} showSign />
<QuarterBadge quarter={3} />
```

**Props:**
- `variant`: 'default' | 'status' | 'odds' | 'quarter'
- `status`: 'live' | 'halftime' | 'scheduled' | 'final'
- `positive`: boolean

### Form Components

#### Input
Text input with label and helper text support.

```tsx
<Input
  label="Email"
  placeholder="Enter your email"
  helperText="We'll never share your email"
  error={false}
/>
```

**Props:**
- `variant`: 'default' | 'filled' | 'ghost' (default: 'default')
- `inputSize`: 'sm' | 'md' | 'lg' (default: 'md')
- `label`: string
- `helperText`: string
- `error`: boolean

#### Textarea
Multi-line text input.

```tsx
<Textarea
  label="Description"
  rows={4}
  helperText="Max 500 characters"
/>
```

#### Select
Dropdown select component.

```tsx
<Select
  label="Choose an option"
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
  ]}
/>
```

#### Checkbox
Single checkbox with label.

```tsx
<Checkbox
  label="I agree to the terms"
  helperText="You must agree to continue"
/>
```

#### Radio & RadioGroup
Radio button inputs.

```tsx
<RadioGroup label="Select an option">
  <Radio name="option" value="1" label="Option 1" />
  <Radio name="option" value="2" label="Option 2" />
</RadioGroup>
```

### Data Display

#### Table
Data table with sortable headers.

```tsx
<Table hover striped>
  <TableHeader>
    <TableRow>
      <TableHead sortable sorted="asc" onSort={handleSort}>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>John Doe</TableCell>
      <TableCell>Active</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

**Props:**
- `hover`: boolean (default: true)
- `striped`: boolean (default: false)

### Overlay Components

#### Modal
Dialog modal with overlay.

```tsx
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Modal Title"
  size="md"
>
  <ModalBody>
    <p>Modal content</p>
  </ModalBody>
  <ModalFooter>
    <Button variant="secondary" onClick={handleClose}>Cancel</Button>
    <Button onClick={handleSubmit}>Confirm</Button>
  </ModalFooter>
</Modal>
```

**Props:**
- `isOpen`: boolean
- `onClose`: () => void
- `title`: string
- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full'
- `closeOnOverlay`: boolean (default: true)
- `closeOnEscape`: boolean (default: true)
- `showCloseButton`: boolean (default: true)

### Feedback Components

#### Spinner
Loading spinner indicator.

```tsx
<Spinner size="md" color="primary" />
<Loading text="Loading data..." fullScreen />
```

**Props:**
- `size`: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
- `color`: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'white'

#### Skeleton
Placeholder loading state.

```tsx
<Skeleton variant="text" lines={3} />
<Skeleton variant="circular" width={40} height={40} />
<Skeleton variant="rectangular" height={200} />
```

**Props:**
- `variant`: 'text' | 'circular' | 'rectangular'
- `width`: string | number
- `height`: string | number
- `lines`: number (for text variant)

### Utility Components

#### Icon
Standardized icon wrapper for Lucide icons.

```tsx
import { Heart } from 'lucide-react';

<Icon icon={Heart} size="md" color="danger" />
```

**Props:**
- `icon`: LucideIcon (required)
- `size`: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
- `color`: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'muted'

## Theme System

### ThemeProvider

Wrap your application with the `ThemeProvider` to enable dark mode support:

```tsx
// app/layout.tsx
import { ThemeProvider } from '@/components/ui/ThemeProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### useTheme Hook

Access and control the theme from any component:

```tsx
import { useTheme } from '@/components/ui/ThemeProvider';

function MyComponent() {
  const { theme, setTheme, actualTheme } = useTheme();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme('dark')}>Dark Mode</button>
      <button onClick={() => setTheme('light')}>Light Mode</button>
      <button onClick={() => setTheme('system')}>System</button>
    </div>
  );
}
```

### ThemeToggle Component

Pre-built theme toggle button:

```tsx
import ThemeToggle from '@/components/ui/ThemeToggle';

// Icon variant (single button)
<ThemeToggle variant="icon" />

// Full variant (segmented control)
<ThemeToggle variant="full" />
```

## Design Tokens

### Colors

#### Brand Colors
- **Sky** (Primary): #38BDF8 to #0C4A6E
- **Indigo** (Secondary): #818CF8 to #312E81

#### Semantic Colors
- **Emerald** (Success): #34D399 to #059669
- **Coral** (Energy): #FB923C to #EA580C
- **Amber** (Warning): #FBBF24 to #D97706
- **Rose** (Danger): #FB7185 to #E11D48

#### Background Colors (CSS Variables)
```css
--bg-primary: #F8FAFB (light) / #0F1419 (dark)
--bg-secondary: #FFFFFF (light) / #1A1F2E (dark)
--bg-tertiary: #EDF2F7 (light) / #232936 (dark)
--bg-elevated: #FFFFFF (light) / #2A3142 (dark)
```

#### Text Colors (CSS Variables)
```css
--text-primary: #1A2332 (light) / #F8FAFC (dark)
--text-secondary: #4A5568 (light) / #CBD5E1 (dark)
--text-tertiary: #718096 (light) / #94A3B8 (dark)
```

### Typography

#### Font Families
- **Sans**: Plus Jakarta Sans (300-800)
- **Display**: Outfit (400-900)
- **Mono**: JetBrains Mono (400-700)

#### Font Sizes
- **display**: 72px / 1.1 line-height
- **3xl**: 28px / 1.4 line-height
- Standard Tailwind scale: text-xs to text-9xl

### Spacing

Standard Tailwind spacing + custom values:
- **18**: 4.5rem (72px)
- **88**: 22rem (352px)

### Animations

- **pulse-slow**: 3s pulse
- **border-flow**: 3s gradient flow
- **shimmer**: 4s rotate shimmer
- **slide-in**: 0.5s slide up entrance
- **fade-in**: 0.4s fade entrance

### Shadows

- **glow-sky**: 0 0 24px rgba(56, 189, 248, 0.3)
- **glow-indigo**: 0 0 24px rgba(99, 102, 241, 0.3)
- **glow-emerald**: 0 0 24px rgba(16, 185, 129, 0.3)
- **card**: Subtle multi-layer shadow
- **card-hover**: Elevated shadow with brand colors

## Usage Examples

### Complete Form Example

```tsx
import { Input, Select, Checkbox, Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

function SignupForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            required
          />

          <Select
            label="Account Type"
            options={[
              { value: 'personal', label: 'Personal' },
              { value: 'business', label: 'Business' },
            ]}
          />

          <Checkbox
            label="I agree to the terms and conditions"
            required
          />

          <Button type="submit" variant="primary" className="w-full">
            Sign Up
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### Dashboard Layout Example

```tsx
import { Container, Grid, Card, CardHeader, CardTitle, CardContent, Flex, Badge } from '@/components/ui';

function Dashboard() {
  return (
    <Container size="xl">
      <Flex direction="col" gap="lg">
        <Flex justify="between" align="center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Badge variant="status" status="live">Live</Badge>
        </Flex>

        <Grid cols={3} gap="md">
          <Card>
            <CardHeader>
              <CardTitle>Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">$12,345</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">1,234</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversion</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">23.4%</p>
            </CardContent>
          </Card>
        </Grid>
      </Flex>
    </Container>
  );
}
```

### Modal with Loading State

```tsx
import { Modal, ModalBody, ModalFooter, Button, Loading } from '@/components/ui';
import { useState } from 'react';

function DeleteConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    await deleteItem();
    setIsLoading(false);
    setIsOpen(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Confirm Deletion"
      size="sm"
    >
      <ModalBody>
        {isLoading ? (
          <Loading text="Deleting..." />
        ) : (
          <p>Are you sure you want to delete this item? This action cannot be undone.</p>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={() => setIsOpen(false)} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleDelete} isLoading={isLoading}>
          Delete
        </Button>
      </ModalFooter>
    </Modal>
  );
}
```

## Best Practices

1. **Use TypeScript**: All components have full type definitions - leverage them for better DX
2. **Compose Components**: Use sub-components (CardHeader, CardContent) instead of props when possible
3. **Override with className**: All components accept className for customization
4. **Use Theme Variables**: Leverage CSS custom properties for consistent theming
5. **Prefer Semantic HTML**: Components use proper HTML elements for accessibility
6. **Test Dark Mode**: Always test your UI in both light and dark modes

## Contributing

When adding new components to the design system:

1. Create the component in `/components/ui/`
2. Add TypeScript types and interfaces
3. Support dark mode with CSS variables
4. Add proper ARIA attributes
5. Export from `/components/ui/index.ts`
6. Update this documentation

## Support

For issues or questions about the design system, please file an issue in the repository.
