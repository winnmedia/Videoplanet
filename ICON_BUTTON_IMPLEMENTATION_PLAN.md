# VideoPlanet 아이콘 버튼 시스템 구현 가이드

## 1. 통합 Icon 컴포넌트 구현

### 1.1 Icon 컴포넌트 (src/shared/ui/icons/Icon.tsx)
```typescript
import React from 'react'
import { IconName, IconSize, IconColor } from './icons.types'
import * as icons from './library'
import styles from './Icon.module.scss'

interface IconProps {
  name: IconName
  size?: IconSize
  color?: IconColor
  className?: string
  ariaLabel?: string
  ariaHidden?: boolean
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  color = 'current',
  className = '',
  ariaLabel,
  ariaHidden = !ariaLabel
}) => {
  const IconComponent = icons[name]
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`)
    return null
  }
  
  const iconClasses = [
    styles.icon,
    styles[`icon--${size}`],
    styles[`icon--${color}`],
    className
  ].filter(Boolean).join(' ')
  
  return (
    <span 
      className={iconClasses}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden}
    >
      <IconComponent />
    </span>
  )
}
```

### 1.2 Icon 타입 정의 (src/shared/ui/icons/icons.types.ts)
```typescript
export type IconName = 
  | 'like'
  | 'dislike'
  | 'question'
  | 'reply'
  | 'share'
  | 'play'
  | 'pause'
  | 'upload'
  | 'download'
  | 'edit'
  | 'delete'
  | 'close'
  | 'menu'
  | 'search'
  | 'filter'
  | 'settings'
  | 'notification'
  | 'user'
  | 'calendar'
  | 'clock'
  | 'location'
  | 'info'
  | 'warning'
  | 'error'
  | 'success'
  | 'chevronUp'
  | 'chevronDown'
  | 'chevronLeft'
  | 'chevronRight'
  | 'arrowUp'
  | 'arrowDown'
  | 'arrowLeft'
  | 'arrowRight'
  | 'expand'
  | 'collapse'
  | 'fullscreen'
  | 'exitFullscreen'

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type IconColor = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'current' | 'inherit'
```

### 1.3 Icon 스타일 (src/shared/ui/icons/Icon.module.scss)
```scss
@import '@/app/styles/variables.scss';

.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  flex-shrink: 0;
  
  svg {
    width: 100%;
    height: 100%;
    display: block;
  }
  
  // 크기 변형
  &--xs {
    width: 16px;
    height: 16px;
  }
  
  &--sm {
    width: 20px;
    height: 20px;
  }
  
  &--md {
    width: 24px;
    height: 24px;
  }
  
  &--lg {
    width: 32px;
    height: 32px;
  }
  
  &--xl {
    width: 40px;
    height: 40px;
  }
  
  // 색상 변형
  &--primary {
    color: $color-primary;
  }
  
  &--secondary {
    color: $color-gray-600;
  }
  
  &--success {
    color: $color-success;
  }
  
  &--danger {
    color: $color-danger;
  }
  
  &--warning {
    color: $color-warning;
  }
  
  &--info {
    color: $color-info;
  }
  
  &--current {
    color: currentColor;
  }
  
  &--inherit {
    color: inherit;
  }
}

// 다크모드 지원
@include dark-mode {
  .icon {
    &--primary {
      color: lighten($color-primary, 10%);
    }
    
    &--secondary {
      color: $color-gray-400;
    }
  }
}
```

## 2. IconButton 컴포넌트 구현

### 2.1 IconButton 컴포넌트 (src/shared/ui/icon-button/IconButton.tsx)
```typescript
'use client'

import React, { forwardRef, useState } from 'react'
import { Icon } from '../icons/Icon'
import { IconName } from '../icons/icons.types'
import { Tooltip } from '../tooltip/Tooltip'
import styles from './IconButton.module.scss'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  tooltip?: string
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right'
  ariaLabel: string
  loading?: boolean
  active?: boolean
  badge?: number | string
  ripple?: boolean
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      variant = 'ghost',
      size = 'md',
      tooltip,
      tooltipPosition = 'top',
      ariaLabel,
      loading = false,
      active = false,
      badge,
      ripple = true,
      disabled = false,
      className = '',
      onClick,
      ...props
    },
    ref
  ) => {
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])
    const [isPressed, setIsPressed] = useState(false)
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // 리플 효과
      if (ripple && !disabled && !loading) {
        const button = e.currentTarget
        const rect = button.getBoundingClientRect()
        const x = e.clientX - rect.left - rect.width / 2
        const y = e.clientY - rect.top - rect.height / 2
        const newRipple = { x, y, id: Date.now() }
        
        setRipples(prev => [...prev, newRipple])
        
        setTimeout(() => {
          setRipples(prev => prev.filter(r => r.id !== newRipple.id))
        }, 600)
      }
      
      // 클릭 애니메이션
      setIsPressed(true)
      setTimeout(() => setIsPressed(false), 200)
      
      // 원래 onClick 핸들러
      if (onClick && !disabled && !loading) {
        onClick(e)
      }
    }
    
    const buttonClasses = [
      styles.iconButton,
      styles[`iconButton--${variant}`],
      styles[`iconButton--${size}`],
      active && styles['iconButton--active'],
      loading && styles['iconButton--loading'],
      disabled && styles['iconButton--disabled'],
      isPressed && styles['iconButton--pressed'],
      className
    ].filter(Boolean).join(' ')
    
    const button = (
      <button
        ref={ref}
        className={buttonClasses}
        onClick={handleClick}
        disabled={disabled || loading}
        aria-label={ariaLabel}
        aria-pressed={active}
        aria-busy={loading}
        {...props}
      >
        {/* 리플 효과 */}
        {ripple && (
          <span className={styles.rippleContainer}>
            {ripples.map(ripple => (
              <span
                key={ripple.id}
                className={styles.ripple}
                style={{
                  left: `${ripple.x}px`,
                  top: `${ripple.y}px`
                }}
              />
            ))}
          </span>
        )}
        
        {/* 아이콘 */}
        <span className={styles.iconWrapper}>
          {loading ? (
            <span className={styles.spinner} />
          ) : (
            <Icon 
              name={icon} 
              size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
              color="inherit"
            />
          )}
        </span>
        
        {/* 배지 */}
        {badge !== undefined && (
          <span className={styles.badge}>
            {typeof badge === 'number' && badge > 99 ? '99+' : badge}
          </span>
        )}
      </button>
    )
    
    // 툴팁이 있으면 Tooltip으로 감싸기
    if (tooltip && !disabled) {
      return (
        <Tooltip content={tooltip} position={tooltipPosition}>
          {button}
        </Tooltip>
      )
    }
    
    return button
  }
)

IconButton.displayName = 'IconButton'
```

### 2.2 IconButton 스타일 (src/shared/ui/icon-button/IconButton.module.scss)
```scss
@import '@/app/styles/variables.scss';

.iconButton {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: $border-radius-md;
  cursor: pointer;
  transition: all $transition-cubic;
  overflow: hidden;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  
  // 크기 - 모바일 터치 타겟 최소 44px 보장
  &--sm {
    min-width: 44px;
    min-height: 44px;
    padding: 10px;
  }
  
  &--md {
    min-width: 48px;
    min-height: 48px;
    padding: 12px;
  }
  
  &--lg {
    min-width: 56px;
    min-height: 56px;
    padding: 16px;
  }
  
  // 변형
  &--primary {
    background: $color-primary;
    color: $color-white;
    
    &:hover:not(:disabled) {
      background: $color-primary-hover;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba($color-primary, 0.25);
    }
    
    &:active:not(:disabled) {
      transform: translateY(0);
    }
  }
  
  &--secondary {
    background: $color-gray-100;
    color: $color-gray-700;
    
    &:hover:not(:disabled) {
      background: $color-gray-200;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }
  
  &--ghost {
    background: transparent;
    color: $color-gray-700;
    
    &:hover:not(:disabled) {
      background: rgba($color-primary, 0.05);
      color: $color-primary;
    }
    
    &--active {
      background: rgba($color-primary, 0.1);
      color: $color-primary;
    }
  }
  
  &--danger {
    background: $color-danger;
    color: $color-white;
    
    &:hover:not(:disabled) {
      background: $color-danger-hover;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba($color-danger, 0.25);
    }
  }
  
  &--success {
    background: $color-success;
    color: $color-white;
    
    &:hover:not(:disabled) {
      background: $color-success-hover;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba($color-success, 0.25);
    }
  }
  
  // 상태
  &--active {
    background: rgba($color-primary, 0.1);
    color: $color-primary;
    
    &.iconButton--primary {
      background: $color-primary-active;
    }
  }
  
  &--pressed {
    animation: buttonPress 0.2s ease-out;
  }
  
  &--loading {
    pointer-events: none;
    opacity: 0.7;
  }
  
  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    
    &:hover {
      transform: none;
      box-shadow: none;
    }
  }
  
  // 포커스 스타일
  &:focus-visible {
    outline: 2px solid $color-primary;
    outline-offset: 2px;
  }
}

// 아이콘 래퍼
.iconWrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

// 로딩 스피너
.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

// 배지
.badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $color-danger;
  color: $color-white;
  font-size: 11px;
  font-weight: 600;
  border-radius: 9px;
  z-index: 2;
}

// 리플 효과
.rippleContainer {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  overflow: hidden;
  pointer-events: none;
}

.ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba($color-white, 0.5);
  animation: rippleEffect 0.6s ease-out;
  pointer-events: none;
  
  .iconButton--ghost & {
    background: rgba($color-primary, 0.2);
  }
}

// 애니메이션
@keyframes buttonPress {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

@keyframes rippleEffect {
  0% {
    width: 0;
    height: 0;
    opacity: 1;
  }
  100% {
    width: 200px;
    height: 200px;
    opacity: 0;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// 다크모드
@include dark-mode {
  .iconButton {
    &--ghost {
      color: $color-gray-300;
      
      &:hover:not(:disabled) {
        background: rgba($color-primary, 0.15);
        color: lighten($color-primary, 10%);
      }
    }
    
    &--secondary {
      background: $color-gray-800;
      color: $color-gray-200;
      
      &:hover:not(:disabled) {
        background: $color-gray-700;
      }
    }
  }
}

// 모션 감소
@media (prefers-reduced-motion: reduce) {
  .iconButton {
    transition: opacity $transition-normal;
    
    &:hover,
    &--pressed {
      transform: none;
      animation: none;
    }
  }
  
  .ripple {
    animation: none;
    opacity: 0;
  }
  
  .spinner {
    animation: spin 1.5s linear infinite;
  }
}

// 모바일 터치 최적화
@media (hover: none) {
  .iconButton {
    &:hover {
      transform: none;
      box-shadow: none;
    }
    
    &:active:not(:disabled) {
      transform: scale(0.95);
    }
  }
}
```

## 3. IconButton 테스트

### 3.1 단위 테스트 (src/shared/ui/icon-button/IconButton.test.tsx)
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { IconButton } from './IconButton'

describe('IconButton', () => {
  it('최소 44x44px 크기를 보장해야 함', () => {
    const { container } = render(
      <IconButton icon="like" ariaLabel="좋아요" size="sm" />
    )
    const button = container.querySelector('button')
    const styles = window.getComputedStyle(button!)
    
    expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44)
    expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44)
  })
  
  it('aria-label이 필수여야 함', () => {
    render(<IconButton icon="like" ariaLabel="좋아요" />)
    const button = screen.getByRole('button', { name: '좋아요' })
    expect(button).toBeInTheDocument()
  })
  
  it('키보드 네비게이션을 지원해야 함', () => {
    const handleClick = jest.fn()
    render(
      <IconButton icon="like" ariaLabel="좋아요" onClick={handleClick} />
    )
    
    const button = screen.getByRole('button')
    button.focus()
    expect(document.activeElement).toBe(button)
    
    fireEvent.keyDown(button, { key: 'Enter' })
    expect(handleClick).toHaveBeenCalled()
  })
  
  it('로딩 상태를 표시해야 함', () => {
    render(<IconButton icon="like" ariaLabel="좋아요" loading />)
    const button = screen.getByRole('button')
    
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toBeDisabled()
  })
  
  it('active 상태를 표시해야 함', () => {
    render(<IconButton icon="like" ariaLabel="좋아요" active />)
    const button = screen.getByRole('button')
    
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })
  
  it('배지를 표시해야 함', () => {
    render(<IconButton icon="notification" ariaLabel="알림" badge={5} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })
  
  it('99 이상의 배지는 99+로 표시해야 함', () => {
    render(<IconButton icon="notification" ariaLabel="알림" badge={100} />)
    expect(screen.getByText('99+')).toBeInTheDocument()
  })
  
  it('disabled 상태에서 클릭이 불가해야 함', () => {
    const handleClick = jest.fn()
    render(
      <IconButton 
        icon="like" 
        ariaLabel="좋아요" 
        disabled 
        onClick={handleClick}
      />
    )
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })
})
```

## 4. 마이그레이션 예시

### 4.1 기존 이모지 버튼 교체
```typescript
// Before (이모지 사용)
<button onClick={() => handleReaction('like')}>
  <span>👍</span>
  <span>{count}</span>
</button>

// After (IconButton 사용)
<IconButton
  icon="like"
  variant="ghost"
  size="sm"
  ariaLabel="좋아요"
  active={userReaction === 'like'}
  badge={count > 0 ? count : undefined}
  tooltip="좋아요"
  onClick={() => handleReaction('like')}
/>
```

### 4.2 댓글 시스템 리팩토링
```typescript
// src/features/comment-system/ui/ReactionButtons.tsx
import { IconButton } from '@/shared/ui/icon-button'

interface ReactionButtonsProps {
  reactions: Record<string, number>
  userReaction?: string
  onReaction: (type: string) => void
}

export const ReactionButtons: React.FC<ReactionButtonsProps> = ({
  reactions,
  userReaction,
  onReaction
}) => {
  const reactionTypes = [
    { type: 'like', icon: 'like', label: '좋아요' },
    { type: 'dislike', icon: 'dislike', label: '싫어요' },
    { type: 'question', icon: 'question', label: '질문있어요' }
  ] as const
  
  return (
    <div className={styles.reactions}>
      {reactionTypes.map(({ type, icon, label }) => (
        <IconButton
          key={type}
          icon={icon}
          variant="ghost"
          size="sm"
          ariaLabel={label}
          active={userReaction === type}
          badge={reactions[type] || undefined}
          tooltip={label}
          onClick={() => onReaction(type)}
        />
      ))}
    </div>
  )
}
```

## 5. Storybook 스토리

### 5.1 IconButton 스토리 (src/shared/ui/icon-button/IconButton.stories.tsx)
```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { IconButton } from './IconButton'

const meta: Meta<typeof IconButton> = {
  title: 'UI/IconButton',
  component: IconButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    icon: {
      control: 'select',
      options: ['like', 'dislike', 'share', 'edit', 'delete']
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger', 'success']
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg']
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    icon: 'like',
    ariaLabel: '좋아요',
    variant: 'ghost',
    size: 'md'
  }
}

export const WithTooltip: Story = {
  args: {
    icon: 'share',
    ariaLabel: '공유하기',
    tooltip: '이 콘텐츠를 공유하세요',
    variant: 'secondary'
  }
}

export const WithBadge: Story = {
  args: {
    icon: 'notification',
    ariaLabel: '알림',
    badge: 5,
    variant: 'ghost'
  }
}

export const Active: Story = {
  args: {
    icon: 'like',
    ariaLabel: '좋아요',
    active: true,
    badge: 42,
    variant: 'ghost'
  }
}

export const Loading: Story = {
  args: {
    icon: 'upload',
    ariaLabel: '업로드 중',
    loading: true,
    variant: 'primary'
  }
}

export const Disabled: Story = {
  args: {
    icon: 'delete',
    ariaLabel: '삭제',
    disabled: true,
    variant: 'danger'
  }
}
```

## 6. 체크리스트

### Phase 1 체크리스트
- [ ] Icon 컴포넌트 생성
- [ ] IconButton 컴포넌트 생성
- [ ] 아이콘 라이브러리 구축 (최소 30개)
- [ ] 단위 테스트 작성 (coverage 90%+)
- [ ] Storybook 문서화

### Phase 2 체크리스트
- [ ] 댓글 시스템 이모지 → IconButton 교체
- [ ] 비디오 플레이어 아이콘 통합
- [ ] 대시보드 아이콘 버튼 교체
- [ ] 중복 Button 컴포넌트 제거
- [ ] E2E 테스트 업데이트

### Phase 3 체크리스트
- [ ] 다크모드 테마 변수 추가
- [ ] 마이크로 인터랙션 구현
- [ ] 성능 최적화 (번들 사이즈 체크)
- [ ] 접근성 검증 (axe-core)
- [ ] 시각적 회귀 테스트 설정

---
작성일: 2025-08-24
작성자: Sophia (Frontend UI Lead)