import { Meta, StoryObj } from '@storybook/react';

import { Button } from './button';

const Dot = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden>
    <circle cx="12" cy="12" r="8" />
  </svg>
);

const meta: Meta<typeof Button> = {
  component: Button,
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { children: 'Button', variant: 'default' },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Icône">
        <Dot />
      </Button>
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button icon={<Dot />}>Icône à gauche</Button>
      <Button icon={<Dot />} iconPosition="right">
        Icône à droite
      </Button>
      <Button isLoading>Chargement</Button>
    </div>
  ),
};

export const FullWidth: Story = {
  render: () => (
    <div className="w-80">
      <Button fullWidth size="lg">
        CTA pleine largeur
      </Button>
    </div>
  ),
};
