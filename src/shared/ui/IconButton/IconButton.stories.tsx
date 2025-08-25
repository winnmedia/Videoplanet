import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { IconButton } from './IconButton';

// Example icons
const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
  </svg>
);

const EditIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>
);

const DeleteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
  </svg>
);

const meta: Meta<typeof IconButton> = {
  title: 'Shared/UI/IconButton',
  component: IconButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
    },
    tooltipPosition: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
    },
    loading: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    active: {
      control: 'boolean',
    },
    ripple: {
      control: 'boolean',
    },
    darkMode: {
      control: 'boolean',
    },
    minTouchSize: {
      control: 'number',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic variants
export const Primary: Story = {
  args: {
    icon: <HeartIcon />,
    variant: 'primary',
    'aria-label': 'Like',
    tooltip: 'Like this item',
  },
};

export const Secondary: Story = {
  args: {
    icon: <ShareIcon />,
    variant: 'secondary',
    'aria-label': 'Share',
    tooltip: 'Share this item',
  },
};

export const Ghost: Story = {
  args: {
    icon: <EditIcon />,
    variant: 'ghost',
    'aria-label': 'Edit',
    tooltip: 'Edit this item',
  },
};

export const Danger: Story = {
  args: {
    icon: <DeleteIcon />,
    variant: 'danger',
    'aria-label': 'Delete',
    tooltip: 'Delete this item',
  },
};

// Size variations
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <IconButton
        icon={<HeartIcon />}
        size="small"
        variant="primary"
        aria-label="Small button"
        tooltip="Small (32px)"
      />
      <IconButton
        icon={<HeartIcon />}
        size="medium"
        variant="primary"
        aria-label="Medium button"
        tooltip="Medium (40px)"
      />
      <IconButton
        icon={<HeartIcon />}
        size="large"
        variant="primary"
        aria-label="Large button"
        tooltip="Large (48px)"
      />
    </div>
  ),
};

// States
export const Loading: Story = {
  args: {
    icon: <HeartIcon />,
    loading: true,
    variant: 'primary',
    'aria-label': 'Loading',
  },
};

export const Disabled: Story = {
  args: {
    icon: <HeartIcon />,
    disabled: true,
    variant: 'primary',
    'aria-label': 'Disabled',
    tooltip: 'This button is disabled',
  },
};

export const Active: Story = {
  args: {
    icon: <HeartIcon />,
    active: true,
    variant: 'primary',
    'aria-label': 'Active',
    tooltip: 'This button is active',
  },
};

// Tooltip positions
export const TooltipPositions: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '32px', padding: '40px' }}>
      <IconButton
        icon={<HeartIcon />}
        variant="primary"
        tooltip="Top tooltip"
        tooltipPosition="top"
        aria-label="Top"
      />
      <IconButton
        icon={<ShareIcon />}
        variant="primary"
        tooltip="Bottom tooltip"
        tooltipPosition="bottom"
        aria-label="Bottom"
      />
      <IconButton
        icon={<EditIcon />}
        variant="primary"
        tooltip="Left tooltip"
        tooltipPosition="left"
        aria-label="Left"
      />
      <IconButton
        icon={<SettingsIcon />}
        variant="primary"
        tooltip="Right tooltip"
        tooltipPosition="right"
        aria-label="Right"
      />
    </div>
  ),
};

// Dark mode
export const DarkMode: Story = {
  render: () => (
    <div style={{ 
      background: '#1e293b', 
      padding: '32px',
      borderRadius: '8px',
      display: 'flex',
      gap: '16px'
    }}>
      <IconButton
        icon={<HeartIcon />}
        variant="primary"
        darkMode={true}
        aria-label="Primary dark"
        tooltip="Primary button"
      />
      <IconButton
        icon={<ShareIcon />}
        variant="secondary"
        darkMode={true}
        aria-label="Secondary dark"
        tooltip="Secondary button"
      />
      <IconButton
        icon={<EditIcon />}
        variant="ghost"
        darkMode={true}
        aria-label="Ghost dark"
        tooltip="Ghost button"
      />
      <IconButton
        icon={<DeleteIcon />}
        variant="danger"
        darkMode={true}
        aria-label="Danger dark"
        tooltip="Danger button"
      />
    </div>
  ),
};

// Custom touch target size
export const CustomTouchTarget: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <IconButton
          icon={<HeartIcon />}
          size="small"
          minTouchSize={44}
          variant="primary"
          aria-label="44px touch target"
          tooltip="44px minimum (default)"
        />
        <p style={{ margin: '8px 0', fontSize: '12px' }}>44px min</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <IconButton
          icon={<HeartIcon />}
          size="small"
          minTouchSize={48}
          variant="primary"
          aria-label="48px touch target"
          tooltip="48px minimum"
        />
        <p style={{ margin: '8px 0', fontSize: '12px' }}>48px min</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <IconButton
          icon={<HeartIcon />}
          size="small"
          minTouchSize={56}
          variant="primary"
          aria-label="56px touch target"
          tooltip="56px minimum"
        />
        <p style={{ margin: '8px 0', fontSize: '12px' }}>56px min</p>
      </div>
    </div>
  ),
};

// Interactive demo
export const InteractiveDemo: Story = {
  render: () => {
    const [liked, setLiked] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const handleLike = () => {
      setLoading(true);
      setTimeout(() => {
        setLiked(!liked);
        setLoading(false);
      }, 1000);
    };

    return (
      <div style={{ textAlign: 'center' }}>
        <IconButton
          icon={<HeartIcon />}
          variant={liked ? 'danger' : 'secondary'}
          active={liked}
          loading={loading}
          onClick={handleLike}
          aria-label={liked ? 'Unlike' : 'Like'}
          aria-pressed={liked}
          tooltip={liked ? 'Unlike this item' : 'Like this item'}
        />
        <p style={{ marginTop: '16px', fontSize: '14px' }}>
          {loading ? 'Processing...' : liked ? 'Liked!' : 'Click to like'}
        </p>
      </div>
    );
  },
};

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '24px', maxWidth: '400px' }}>
      {(['primary', 'secondary', 'ghost', 'danger'] as const).map(variant => (
        <div key={variant}>
          <h4 style={{ margin: '0 0 12px 0', textTransform: 'capitalize' }}>{variant}</h4>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <IconButton
              icon={<HeartIcon />}
              variant={variant}
              size="small"
              aria-label={`${variant} small`}
              tooltip="Small"
            />
            <IconButton
              icon={<HeartIcon />}
              variant={variant}
              size="medium"
              aria-label={`${variant} medium`}
              tooltip="Medium"
            />
            <IconButton
              icon={<HeartIcon />}
              variant={variant}
              size="large"
              aria-label={`${variant} large`}
              tooltip="Large"
            />
            <div style={{ width: '1px', height: '24px', background: '#e2e8f0' }} />
            <IconButton
              icon={<HeartIcon />}
              variant={variant}
              active={true}
              aria-label={`${variant} active`}
              tooltip="Active"
            />
            <IconButton
              icon={<HeartIcon />}
              variant={variant}
              loading={true}
              aria-label={`${variant} loading`}
            />
            <IconButton
              icon={<HeartIcon />}
              variant={variant}
              disabled={true}
              aria-label={`${variant} disabled`}
            />
          </div>
        </div>
      ))}
    </div>
  ),
};