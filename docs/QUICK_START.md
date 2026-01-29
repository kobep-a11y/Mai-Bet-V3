# Design System Quick Start Guide

Get started with the Mai Bets Design System in 5 minutes.

## Step 1: Set Up Theme Provider

Wrap your app with the `ThemeProvider` to enable dark mode support.

**File: `app/layout.tsx`**

```tsx
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

## Step 2: Import Components

Import components from the centralized index file:

```tsx
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Grid,
} from '@/components/ui';
```

## Step 3: Build Your First Component

Create a simple card with a form:

```tsx
'use client';

import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Input,
  Button,
} from '@/components/ui';

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Your submit logic here
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Contact Us</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            placeholder="Your name"
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            required
          />
          <Input
            label="Message"
            placeholder="Your message"
            required
          />
        </form>
      </CardContent>
      <CardFooter>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          className="w-full"
        >
          Send Message
        </Button>
      </CardFooter>
    </Card>
  );
}
```

## Step 4: Add Dark Mode Toggle

Add a theme toggle to your navigation:

```tsx
import { ThemeToggle } from '@/components/ui';

export default function Header() {
  return (
    <header className="flex items-center justify-between p-4">
      <h1 className="text-2xl font-bold">My App</h1>
      <ThemeToggle variant="icon" />
    </header>
  );
}
```

## Common Patterns

### Dashboard Grid Layout

```tsx
import { Container, Grid, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

export default function Dashboard() {
  return (
    <Container size="xl">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <Grid cols={3} gap="md">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-sky-600">1,234</p>
            <p className="text-sm text-gray-500">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">$45,678</p>
            <p className="text-sm text-gray-500">+8% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-indigo-600">89</p>
            <p className="text-sm text-gray-500">Currently online</p>
          </CardContent>
        </Card>
      </Grid>
    </Container>
  );
}
```

### Data Table

```tsx
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
} from '@/components/ui';

export default function UsersTable() {
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
  ];

  return (
    <Table hover>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <Badge variant="default">
                {user.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### Modal Dialog

```tsx
'use client';

import { useState } from 'react';
import {
  Modal,
  ModalBody,
  ModalFooter,
  Button,
} from '@/components/ui';

export default function DeleteButton() {
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = () => {
    // Your delete logic
    setIsOpen(false);
  };

  return (
    <>
      <Button variant="primary" onClick={() => setIsOpen(true)}>
        Delete
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Deletion"
        size="sm"
      >
        <ModalBody>
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete this item? This action cannot be undone.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDelete}>
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
```

### Loading States

```tsx
import { Skeleton, Loading, Card, CardContent } from '@/components/ui';

// Skeleton loader
export function CardSkeleton() {
  return (
    <Card>
      <CardContent>
        <Skeleton variant="text" lines={3} />
        <Skeleton variant="rectangular" height={200} className="mt-4" />
      </CardContent>
    </Card>
  );
}

// Spinner loader
export function PageLoader() {
  return (
    <Loading
      text="Loading data..."
      size="lg"
      fullScreen
    />
  );
}
```

## Tips & Best Practices

### 1. Use TypeScript
All components have full type definitions. Leverage them!

```tsx
import type { ButtonProps } from '@/components/ui';

const myButtonProps: ButtonProps = {
  variant: 'primary',
  size: 'md',
  onClick: handleClick,
};
```

### 2. Compose Components
Build complex UIs by composing simpler components:

```tsx
<Card>
  <CardHeader>
    <Flex justify="between" align="center">
      <CardTitle>Title</CardTitle>
      <Badge>New</Badge>
    </Flex>
  </CardHeader>
  <CardContent>
    <Grid cols={2} gap="sm">
      {/* Grid items */}
    </Grid>
  </CardContent>
</Card>
```

### 3. Customize with className
Every component accepts `className` for custom styling:

```tsx
<Button className="w-full bg-gradient-to-r from-sky-500 to-indigo-500">
  Custom Styled Button
</Button>
```

### 4. Use CSS Variables
For dynamic theming, use CSS custom properties:

```tsx
<div className="bg-[var(--bg-secondary)] text-[var(--text-primary)]">
  Themed content
</div>
```

### 5. Responsive Design
Use Tailwind's responsive prefixes:

```tsx
<Grid cols={1} className="md:grid-cols-2 lg:grid-cols-3">
  {/* Responsive grid */}
</Grid>

<Button size="sm" className="md:size-md lg:size-lg">
  Responsive button
</Button>
```

## Next Steps

- Read the [full design system documentation](./DESIGN_SYSTEM.md)
- Explore [design tokens](./DESIGN_TOKENS.md)
- Check out the [component API reference](./DESIGN_SYSTEM.md#components)
- Review existing pages in `/app` for real-world examples

## Troubleshooting

### Dark mode not working?
Make sure:
1. `ThemeProvider` is wrapping your app in `layout.tsx`
2. Tailwind config has `darkMode: 'class'`
3. CSS variables are defined in `globals.css`

### Components not found?
Ensure imports use the correct path:
```tsx
// ✅ Correct
import { Button } from '@/components/ui';

// ❌ Wrong
import { Button } from 'components/ui';
```

### Styles not applying?
Check that:
1. `globals.css` is imported in your layout
2. Tailwind is processing your component files (check `tailwind.config.ts` content array)
3. You're using valid Tailwind classes
