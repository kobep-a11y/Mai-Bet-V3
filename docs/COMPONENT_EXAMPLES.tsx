/**
 * Design System Component Examples
 *
 * This file contains comprehensive examples of all design system components.
 * Copy and paste these examples into your pages to get started quickly.
 */

'use client';

import { useState } from 'react';
import {
  // Layout
  Container,
  Grid,
  Flex,

  // Core
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Badge,
  StatusBadge,
  OddsBadge,
  QuarterBadge,

  // Forms
  Input,
  Textarea,
  Select,
  Checkbox,
  Radio,
  RadioGroup,

  // Data Display
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,

  // Overlay
  Modal,
  ModalBody,
  ModalFooter,

  // Feedback
  Spinner,
  Loading,
  Skeleton,

  // Utility
  Icon,

  // Theme
  ThemeToggle,
} from '@/components/ui';

import { Heart, Star, TrendingUp } from 'lucide-react';

export default function ComponentExamples() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Container size="xl">
      <Flex direction="col" gap="xl" className="py-8">

        {/* Header */}
        <Flex justify="between" align="center">
          <h1 className="text-4xl font-bold">Design System Components</h1>
          <ThemeToggle variant="full" />
        </Flex>

        {/* Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
          </CardHeader>
          <CardContent>
            <Flex gap="sm" wrap="wrap">
              <Button variant="primary" size="sm">Small Primary</Button>
              <Button variant="primary" size="md">Medium Primary</Button>
              <Button variant="primary" size="lg">Large Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="primary" isLoading>Loading...</Button>
              <Button variant="primary" disabled>Disabled</Button>
              <Button variant="icon">
                <Heart className="w-5 h-5" />
              </Button>
            </Flex>
          </CardContent>
        </Card>

        {/* Cards */}
        <Grid cols={3} gap="md">
          <Card variant="default">
            <CardHeader>
              <CardTitle>Default Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Standard card with white background
              </p>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <CardTitle>Glass Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Frosted glass effect with blur
              </p>
            </CardContent>
          </Card>

          <Card variant="glass-dark">
            <CardHeader>
              <CardTitle>Glass Dark</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Dark glass variant
              </p>
            </CardContent>
          </Card>
        </Grid>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <Flex gap="sm" wrap="wrap">
              <Badge>Default</Badge>
              <StatusBadge status="live" />
              <StatusBadge status="halftime" />
              <StatusBadge status="scheduled" />
              <StatusBadge status="final" />
              <OddsBadge value={150} />
              <OddsBadge value={-110} />
              <QuarterBadge quarter={1} />
              <QuarterBadge quarter={4} />
            </Flex>
          </CardContent>
        </Card>

        {/* Forms */}
        <Card>
          <CardHeader>
            <CardTitle>Form Components</CardTitle>
          </CardHeader>
          <CardContent>
            <Grid cols={2} gap="md">
              <Input
                label="Text Input"
                placeholder="Enter text..."
                helperText="This is helper text"
              />

              <Input
                label="Error State"
                placeholder="Invalid input"
                error
                helperText="This field has an error"
              />

              <Select
                label="Select Input"
                options={[
                  { value: '', label: 'Choose an option' },
                  { value: 'option1', label: 'Option 1' },
                  { value: 'option2', label: 'Option 2' },
                  { value: 'option3', label: 'Option 3' },
                ]}
              />

              <div className="space-y-3">
                <Checkbox label="Checkbox option 1" />
                <Checkbox label="Checkbox option 2" checked />
                <Checkbox label="Disabled option" disabled />
              </div>

              <RadioGroup label="Radio Group">
                <Radio name="radio-example" value="1" label="Option 1" />
                <Radio name="radio-example" value="2" label="Option 2" />
                <Radio name="radio-example" value="3" label="Option 3" />
              </RadioGroup>

              <Textarea
                label="Textarea"
                placeholder="Enter long text..."
                rows={4}
              />
            </Grid>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Data Table</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table hover>
              <TableHeader>
                <TableRow>
                  <TableHead sortable sorted="asc">Player</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">LeBron James</TableCell>
                  <TableCell>Lakers</TableCell>
                  <TableCell><StatusBadge status="live" /></TableCell>
                  <TableCell>28</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Stephen Curry</TableCell>
                  <TableCell>Warriors</TableCell>
                  <TableCell><StatusBadge status="final" /></TableCell>
                  <TableCell>34</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Kevin Durant</TableCell>
                  <TableCell>Suns</TableCell>
                  <TableCell><StatusBadge status="halftime" /></TableCell>
                  <TableCell>15</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Modal Example */}
        <Card>
          <CardHeader>
            <CardTitle>Modal Dialog</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsModalOpen(true)}>
              Open Modal
            </Button>

            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="Example Modal"
              size="md"
            >
              <ModalBody>
                <p className="text-gray-600 dark:text-gray-300">
                  This is a modal dialog with an overlay. You can close it by clicking the X button,
                  pressing Escape, or clicking outside the modal.
                </p>
                <div className="mt-4 space-y-3">
                  <Input label="Name" placeholder="Enter your name" />
                  <Input label="Email" type="email" placeholder="Enter your email" />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                  Submit
                </Button>
              </ModalFooter>
            </Modal>
          </CardContent>
        </Card>

        {/* Loading States */}
        <Grid cols={3} gap="md">
          <Card>
            <CardHeader>
              <CardTitle>Spinners</CardTitle>
            </CardHeader>
            <CardContent>
              <Flex gap="md" align="center" wrap="wrap">
                <Spinner size="xs" />
                <Spinner size="sm" />
                <Spinner size="md" />
                <Spinner size="lg" />
                <Spinner size="xl" />
              </Flex>
              <div className="mt-4">
                <Loading text="Loading data..." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Skeleton Loaders</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton variant="text" lines={3} />
              <Skeleton variant="rectangular" height={100} className="mt-4" />
              <Flex gap="sm" className="mt-4">
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton variant="text" lines={2} className="flex-1" />
              </Flex>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Icons</CardTitle>
            </CardHeader>
            <CardContent>
              <Flex gap="md" wrap="wrap">
                <Icon icon={Heart} size="xs" color="danger" />
                <Icon icon={Star} size="sm" color="warning" />
                <Icon icon={TrendingUp} size="md" color="success" />
                <Icon icon={Heart} size="lg" color="primary" />
                <Icon icon={Star} size="xl" color="secondary" />
              </Flex>
            </CardContent>
          </Card>
        </Grid>

        {/* Layout Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Layout Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Flex */}
              <div>
                <h3 className="text-sm font-medium mb-2">Flex Layout</h3>
                <Flex justify="between" align="center" className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="bg-sky-500 text-white px-4 py-2 rounded">Left</div>
                  <div className="bg-indigo-500 text-white px-4 py-2 rounded">Center</div>
                  <div className="bg-emerald-500 text-white px-4 py-2 rounded">Right</div>
                </Flex>
              </div>

              {/* Grid */}
              <div>
                <h3 className="text-sm font-medium mb-2">Grid Layout</h3>
                <Grid cols={4} gap="sm">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="bg-coral-500 text-white px-4 py-8 rounded text-center">
                      {n}
                    </div>
                  ))}
                </Grid>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Sky */}
              <div>
                <h4 className="text-sm font-medium mb-2">Sky (Primary)</h4>
                <Flex gap="xs">
                  <div className="w-12 h-12 bg-sky-400 rounded"></div>
                  <div className="w-12 h-12 bg-sky-500 rounded"></div>
                  <div className="w-12 h-12 bg-sky-600 rounded"></div>
                </Flex>
              </div>

              {/* Indigo */}
              <div>
                <h4 className="text-sm font-medium mb-2">Indigo (Secondary)</h4>
                <Flex gap="xs">
                  <div className="w-12 h-12 bg-indigo-400 rounded"></div>
                  <div className="w-12 h-12 bg-indigo-500 rounded"></div>
                  <div className="w-12 h-12 bg-indigo-600 rounded"></div>
                </Flex>
              </div>

              {/* Semantic Colors */}
              <div>
                <h4 className="text-sm font-medium mb-2">Semantic Colors</h4>
                <Flex gap="xs">
                  <div className="w-12 h-12 bg-emerald-500 rounded" title="Success"></div>
                  <div className="w-12 h-12 bg-coral-500 rounded" title="Energy"></div>
                  <div className="w-12 h-12 bg-amber-500 rounded" title="Warning"></div>
                  <div className="w-12 h-12 bg-rose-500 rounded" title="Danger"></div>
                </Flex>
              </div>
            </div>
          </CardContent>
        </Card>

      </Flex>
    </Container>
  );
}

/**
 * Usage Instructions:
 *
 * 1. Create a new page: app/design-system/page.tsx
 * 2. Copy this entire file content
 * 3. Visit /design-system to see all components
 * 4. Use this as a reference for component usage
 */
