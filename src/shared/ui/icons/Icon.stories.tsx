/**
 * Icon 컴포넌트 스토리북
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Icon, SpriteIcon, LoadingIcon } from './Icon';
import { IconType, IconSize, IconVariant } from './types';
import * as Icons from './components';
import styles from './Icon.module.scss';

const meta: Meta<typeof Icon> = {
  title: 'Shared/Icons/Icon',
  component: Icon,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '통합 아이콘 시스템. SVG 기반의 접근성과 성능을 고려한 아이콘 컴포넌트입니다.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: Object.values(IconType),
      description: '아이콘 타입',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', 16, 20, 24, 32, 40, 48],
      description: '아이콘 크기',
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'neutral'],
      description: '아이콘 색상 변형',
    },
    color: {
      control: 'color',
      description: '커스텀 색상',
    },
    rotate: {
      control: 'select',
      options: [0, 90, 180, 270],
      description: '회전 각도',
    },
    flip: {
      control: 'boolean',
      description: '좌우 반전',
    },
    animate: {
      control: 'boolean',
      description: '애니메이션 활성화',
    },
    animationType: {
      control: 'select',
      options: ['spin', 'pulse', 'bounce'],
      description: '애니메이션 타입',
    },
    darkMode: {
      control: 'boolean',
      description: '다크모드',
    },
    ariaLabel: {
      control: 'text',
      description: '접근성 라벨',
    },
    title: {
      control: 'text',
      description: '툴팁 제목',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

// 기본 아이콘
export const Default: Story = {
  args: {
    type: IconType.HOME,
    size: 'md',
  },
};

// 크기 변형
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Icon type={IconType.HOME} size="xs" title="Extra Small (16px)" />
      <Icon type={IconType.HOME} size="sm" title="Small (20px)" />
      <Icon type={IconType.HOME} size="md" title="Medium (24px)" />
      <Icon type={IconType.HOME} size="lg" title="Large (32px)" />
      <Icon type={IconType.HOME} size="xl" title="Extra Large (40px)" />
      <Icon type={IconType.HOME} size={48} title="Custom (48px)" />
    </div>
  ),
};

// 색상 변형
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Icon type={IconType.CHECK_CIRCLE} variant="primary" size="lg" />
      <Icon type={IconType.INFO} variant="info" size="lg" />
      <Icon type={IconType.CHECK_CIRCLE} variant="success" size="lg" />
      <Icon type={IconType.WARNING} variant="warning" size="lg" />
      <Icon type={IconType.ERROR_CIRCLE} variant="error" size="lg" />
      <Icon type={IconType.HELP} variant="secondary" size="lg" />
      <Icon type={IconType.STAR} variant="neutral" size="lg" />
    </div>
  ),
};

// 애니메이션
export const Animations: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
      <Icon type={IconType.SPINNER} animate animationType="spin" size="lg" />
      <Icon type={IconType.HEART} animate animationType="pulse" size="lg" variant="error" />
      <Icon type={IconType.BELL} animate animationType="bounce" size="lg" variant="warning" />
    </div>
  ),
};

// 변환 효과
export const Transformations: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Icon type={IconType.ARROW_RIGHT} size="lg" title="Normal" />
      <Icon type={IconType.ARROW_RIGHT} rotate={90} size="lg" title="Rotate 90°" />
      <Icon type={IconType.ARROW_RIGHT} rotate={180} size="lg" title="Rotate 180°" />
      <Icon type={IconType.ARROW_RIGHT} rotate={270} size="lg" title="Rotate 270°" />
      <Icon type={IconType.ARROW_RIGHT} flip size="lg" title="Flipped" />
      <Icon type={IconType.ARROW_RIGHT} flip rotate={180} size="lg" title="Flipped + Rotated" />
    </div>
  ),
};

// 클릭 가능한 아이콘
export const Clickable: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Icon
        type={IconType.EDIT}
        size="lg"
        onClick={() => alert('Edit clicked')}
        ariaLabel="Edit"
      />
      <Icon
        type={IconType.DELETE}
        size="lg"
        variant="error"
        onClick={() => alert('Delete clicked')}
        ariaLabel="Delete"
      />
      <Icon
        type={IconType.SAVE}
        size="lg"
        variant="success"
        onClick={() => alert('Save clicked')}
        ariaLabel="Save"
      />
    </div>
  ),
};

// 아이콘 갤러리 - Navigation
export const NavigationIcons: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '24px', padding: '20px' }}>
      {[
        { icon: Icons.ArrowUpIcon, name: 'ArrowUp' },
        { icon: Icons.ArrowDownIcon, name: 'ArrowDown' },
        { icon: Icons.ArrowLeftIcon, name: 'ArrowLeft' },
        { icon: Icons.ArrowRightIcon, name: 'ArrowRight' },
        { icon: Icons.ChevronUpIcon, name: 'ChevronUp' },
        { icon: Icons.ChevronDownIcon, name: 'ChevronDown' },
        { icon: Icons.ChevronLeftIcon, name: 'ChevronLeft' },
        { icon: Icons.ChevronRightIcon, name: 'ChevronRight' },
        { icon: Icons.MenuIcon, name: 'Menu' },
        { icon: Icons.CloseIcon, name: 'Close' },
        { icon: Icons.HomeIcon, name: 'Home' },
        { icon: Icons.BackIcon, name: 'Back' },
      ].map(({ icon: IconComponent, name }) => (
        <div key={name} style={{ textAlign: 'center' }}>
          <IconComponent size="lg" />
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>{name}</div>
        </div>
      ))}
    </div>
  ),
};

// 아이콘 갤러리 - Actions
export const ActionIcons: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '24px', padding: '20px' }}>
      {[
        { icon: Icons.AddIcon, name: 'Add' },
        { icon: Icons.EditIcon, name: 'Edit' },
        { icon: Icons.DeleteIcon, name: 'Delete' },
        { icon: Icons.SaveIcon, name: 'Save' },
        { icon: Icons.CopyIcon, name: 'Copy' },
        { icon: Icons.SearchIcon, name: 'Search' },
        { icon: Icons.FilterIcon, name: 'Filter' },
        { icon: Icons.DownloadIcon, name: 'Download' },
        { icon: Icons.UploadIcon, name: 'Upload' },
        { icon: Icons.ShareIcon, name: 'Share' },
      ].map(({ icon: IconComponent, name }) => (
        <div key={name} style={{ textAlign: 'center' }}>
          <IconComponent size="lg" />
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>{name}</div>
        </div>
      ))}
    </div>
  ),
};

// 아이콘 갤러리 - Status
export const StatusIcons: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '24px', padding: '20px' }}>
      {[
        { icon: Icons.CheckIcon, name: 'Check', variant: 'success' },
        { icon: Icons.CheckCircleIcon, name: 'CheckCircle', variant: 'success' },
        { icon: Icons.ErrorCircleIcon, name: 'ErrorCircle', variant: 'error' },
        { icon: Icons.WarningIcon, name: 'Warning', variant: 'warning' },
        { icon: Icons.InfoIcon, name: 'Info', variant: 'info' },
        { icon: Icons.HelpIcon, name: 'Help', variant: 'secondary' },
        { icon: Icons.StarIcon, name: 'Star', variant: 'warning' },
        { icon: Icons.StarFilledIcon, name: 'StarFilled', variant: 'warning' },
        { icon: Icons.HeartIcon, name: 'Heart', variant: 'error' },
        { icon: Icons.HeartFilledIcon, name: 'HeartFilled', variant: 'error' },
        { icon: Icons.ThumbUpIcon, name: 'ThumbUp', variant: 'primary' },
        { icon: Icons.ThumbDownIcon, name: 'ThumbDown', variant: 'secondary' },
      ].map(({ icon: IconComponent, name, variant }) => (
        <div key={name} style={{ textAlign: 'center' }}>
          <IconComponent size="lg" variant={variant as IconVariant} />
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>{name}</div>
        </div>
      ))}
    </div>
  ),
};

// 로딩 아이콘
export const Loading: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
      <LoadingIcon size="sm" />
      <LoadingIcon size="md" />
      <LoadingIcon size="lg" />
      <LoadingIcon size="xl" variant="primary" />
    </div>
  ),
};

// 스프라이트 아이콘
export const Sprite: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <SpriteIcon type="home" size="lg" />
      <SpriteIcon type="user" size="lg" />
      <SpriteIcon type="settings" size="lg" />
      <SpriteIcon type="bell" size="lg" />
    </div>
  ),
};

// 다크모드
export const DarkMode: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '32px' }}>
      <div style={{ padding: '20px', background: '#fff' }}>
        <div style={{ marginBottom: '8px', fontSize: '14px' }}>Light Mode</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Icon type={IconType.HOME} size="lg" />
          <Icon type={IconType.USER} size="lg" />
          <Icon type={IconType.SETTINGS} size="lg" />
        </div>
      </div>
      <div style={{ padding: '20px', background: '#1a1a1a' }}>
        <div style={{ marginBottom: '8px', fontSize: '14px', color: '#fff' }}>Dark Mode</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Icon type={IconType.HOME} size="lg" darkMode />
          <Icon type={IconType.USER} size="lg" darkMode />
          <Icon type={IconType.SETTINGS} size="lg" darkMode />
        </div>
      </div>
    </div>
  ),
};

// 접근성 예시
export const Accessibility: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Icon
        type={IconType.BELL}
        size="lg"
        ariaLabel="Notifications"
        title="Click to view notifications"
        onClick={() => console.log('Notifications clicked')}
      />
      <Icon
        type={IconType.MAIL}
        size="lg"
        ariaLabel="Messages"
        title="You have 3 unread messages"
        onClick={() => console.log('Messages clicked')}
      />
      <Icon
        type={IconType.USER}
        size="lg"
        ariaLabel="User profile"
        title="View your profile"
        onClick={() => console.log('Profile clicked')}
      />
    </div>
  ),
};

// 프로젝트 특화 아이콘
export const ProjectSpecificIcons: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '24px', padding: '20px' }}>
      {[
        { icon: Icons.ProjectIcon, name: 'Project' },
        { icon: Icons.PlanningIcon, name: 'Planning' },
        { icon: Icons.FeedbackIcon, name: 'Feedback' },
        { icon: Icons.StoryboardIcon, name: 'Storyboard' },
        { icon: Icons.TimelineIcon, name: 'Timeline' },
        { icon: Icons.DashboardIcon, name: 'Dashboard' },
      ].map(({ icon: IconComponent, name }) => (
        <div key={name} style={{ textAlign: 'center' }}>
          <IconComponent size="lg" variant="primary" />
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>{name}</div>
        </div>
      ))}
    </div>
  ),
};