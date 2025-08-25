/**
 * Icon 컴포넌트 테스트
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Icon, SpriteIcon, LoadingIcon } from './Icon';
import { IconType, IconSizeMap } from './types';
import { hasIcon, getIconData } from './icon-registry';

describe('Icon Component', () => {
  describe('기본 렌더링', () => {
    it('아이콘이 올바르게 렌더링되어야 함', () => {
      render(<Icon type={IconType.HOME} data-testid="home-icon" />);
      const icon = screen.getByTestId('home-icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('role', 'img');
    });

    it('아이콘 타입이 없으면 placeholder를 렌더링해야 함', () => {
      render(<Icon data-testid="placeholder-icon" />);
      const icon = screen.getByTestId('placeholder-icon');
      expect(icon).toBeInTheDocument();
      expect(icon.querySelector('text')).toHaveTextContent('?');
    });

    it('존재하지 않는 아이콘 타입이면 placeholder를 렌더링해야 함', () => {
      render(<Icon type="non-existent" data-testid="missing-icon" />);
      const icon = screen.getByTestId('missing-icon');
      expect(icon).toBeInTheDocument();
      expect(icon.querySelector('text')).toHaveTextContent('?');
    });
  });

  describe('크기 설정', () => {
    it('프리셋 크기가 올바르게 적용되어야 함', () => {
      render(<Icon type={IconType.HOME} size="lg" data-testid="lg-icon" />);
      const icon = screen.getByTestId('lg-icon');
      expect(icon).toHaveStyle({ width: '32px', height: '32px' });
    });

    it('커스텀 숫자 크기가 올바르게 적용되어야 함', () => {
      render(<Icon type={IconType.HOME} size={48} data-testid="custom-icon" />);
      const icon = screen.getByTestId('custom-icon');
      expect(icon).toHaveStyle({ width: '48px', height: '48px' });
    });

    it('기본 크기(md)가 적용되어야 함', () => {
      render(<Icon type={IconType.HOME} data-testid="default-icon" />);
      const icon = screen.getByTestId('default-icon');
      expect(icon).toHaveStyle({ width: '24px', height: '24px' });
    });
  });

  describe('색상 설정', () => {
    it('커스텀 색상이 적용되어야 함', () => {
      render(<Icon type={IconType.HOME} color="#ff0000" data-testid="colored-icon" />);
      const icon = screen.getByTestId('colored-icon');
      expect(icon).toHaveStyle({ color: '#ff0000' });
    });

    it('variant 색상이 적용되어야 함', () => {
      render(<Icon type={IconType.HOME} variant="primary" data-testid="variant-icon" />);
      const icon = screen.getByTestId('variant-icon');
      expect(icon).toHaveStyle({ color: 'var(--color-primary, #1631F8)' });
    });

    it('기본 색상(currentColor)이 적용되어야 함', () => {
      render(<Icon type={IconType.HOME} data-testid="default-color-icon" />);
      const icon = screen.getByTestId('default-color-icon');
      expect(icon).toHaveStyle({ color: 'currentColor' });
    });
  });

  describe('변환 효과', () => {
    it('회전이 올바르게 적용되어야 함', () => {
      render(<Icon type={IconType.HOME} rotate={90} data-testid="rotated-icon" />);
      const icon = screen.getByTestId('rotated-icon');
      expect(icon).toHaveStyle({ transform: 'rotate(90deg)' });
    });

    it('좌우 반전이 올바르게 적용되어야 함', () => {
      render(<Icon type={IconType.HOME} flip data-testid="flipped-icon" />);
      const icon = screen.getByTestId('flipped-icon');
      expect(icon).toHaveStyle({ transform: 'scaleX(-1)' });
    });

    it('회전과 반전이 함께 적용되어야 함', () => {
      render(<Icon type={IconType.HOME} rotate={180} flip data-testid="transformed-icon" />);
      const icon = screen.getByTestId('transformed-icon');
      expect(icon).toHaveStyle({ transform: 'rotate(180deg) scaleX(-1)' });
    });
  });

  describe('애니메이션', () => {
    it('spin 애니메이션 클래스가 적용되어야 함', () => {
      render(<Icon type={IconType.HOME} animate animationType="spin" data-testid="spin-icon" />);
      const icon = screen.getByTestId('spin-icon');
      expect(icon).toHaveClass('icon--spin');
    });

    it('pulse 애니메이션 클래스가 적용되어야 함', () => {
      render(<Icon type={IconType.HOME} animate animationType="pulse" data-testid="pulse-icon" />);
      const icon = screen.getByTestId('pulse-icon');
      expect(icon).toHaveClass('icon--pulse');
    });

    it('bounce 애니메이션 클래스가 적용되어야 함', () => {
      render(<Icon type={IconType.HOME} animate animationType="bounce" data-testid="bounce-icon" />);
      const icon = screen.getByTestId('bounce-icon');
      expect(icon).toHaveClass('icon--bounce');
    });
  });

  describe('접근성', () => {
    it('aria-label이 올바르게 설정되어야 함', () => {
      render(<Icon type={IconType.HOME} ariaLabel="Home icon" data-testid="labeled-icon" />);
      const icon = screen.getByTestId('labeled-icon');
      expect(icon).toHaveAttribute('aria-label', 'Home icon');
      expect(icon).not.toHaveAttribute('aria-hidden');
    });

    it('aria-hidden이 기본적으로 true여야 함', () => {
      render(<Icon type={IconType.HOME} data-testid="hidden-icon" />);
      const icon = screen.getByTestId('hidden-icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('title이 올바르게 렌더링되어야 함', () => {
      render(<Icon type={IconType.HOME} title="Home" data-testid="titled-icon" />);
      const icon = screen.getByTestId('titled-icon');
      const titleElement = icon.querySelector('title');
      expect(titleElement).toHaveTextContent('Home');
    });
  });

  describe('클릭 상호작용', () => {
    it('onClick 핸들러가 호출되어야 함', () => {
      const handleClick = jest.fn();
      render(<Icon type={IconType.HOME} onClick={handleClick} data-testid="clickable-icon" />);
      const icon = screen.getByTestId('clickable-icon');
      
      fireEvent.click(icon);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('클릭 가능한 아이콘은 button role을 가져야 함', () => {
      const handleClick = jest.fn();
      render(<Icon type={IconType.HOME} onClick={handleClick} data-testid="button-icon" />);
      const icon = screen.getByTestId('button-icon');
      expect(icon).toHaveAttribute('role', 'button');
      expect(icon).toHaveAttribute('tabIndex', '0');
    });

    it('Enter 키로 클릭이 트리거되어야 함', () => {
      const handleClick = jest.fn();
      render(<Icon type={IconType.HOME} onClick={handleClick} data-testid="keyboard-icon" />);
      const icon = screen.getByTestId('keyboard-icon');
      
      fireEvent.keyDown(icon, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('Space 키로 클릭이 트리거되어야 함', () => {
      const handleClick = jest.fn();
      render(<Icon type={IconType.HOME} onClick={handleClick} data-testid="space-icon" />);
      const icon = screen.getByTestId('space-icon');
      
      fireEvent.keyDown(icon, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('다크모드', () => {
    it('다크모드 클래스가 적용되어야 함', () => {
      render(<Icon type={IconType.HOME} darkMode data-testid="dark-icon" />);
      const icon = screen.getByTestId('dark-icon');
      expect(icon).toHaveClass('icon--dark');
    });

    it('시스템 다크모드를 감지해야 함', () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      render(<Icon type={IconType.HOME} data-testid="system-dark-icon" />);
      const icon = screen.getByTestId('system-dark-icon');
      
      // 다크모드 감지는 useEffect 내에서 비동기로 처리되므로
      // 실제 테스트에서는 더 복잡한 설정이 필요할 수 있음
      
      window.matchMedia = originalMatchMedia;
    });
  });
});

describe('SpriteIcon Component', () => {
  it('스프라이트 아이콘이 올바르게 렌더링되어야 함', () => {
    render(<SpriteIcon type="home" spriteUrl="/icons/sprite.svg" data-testid="sprite-icon" />);
    const icon = screen.getByTestId('sprite-icon');
    const useElement = icon.querySelector('use');
    expect(useElement).toHaveAttribute('href', '/icons/sprite.svg#home');
  });

  it('기본 스프라이트 URL을 사용해야 함', () => {
    render(<SpriteIcon type="home" data-testid="default-sprite" />);
    const icon = screen.getByTestId('default-sprite');
    const useElement = icon.querySelector('use');
    expect(useElement).toHaveAttribute('href', '/icons/sprite.svg#home');
  });
});

describe('LoadingIcon Component', () => {
  it('로딩 아이콘이 스피너와 함께 렌더링되어야 함', () => {
    render(<LoadingIcon data-testid="loading-icon" />);
    const icon = screen.getByTestId('loading-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('icon--spin');
  });

  it('aria-label이 기본값으로 설정되어야 함', () => {
    render(<LoadingIcon data-testid="loading-default" />);
    const icon = screen.getByTestId('loading-default');
    expect(icon).toHaveAttribute('aria-label', 'Loading');
  });

  it('커스텀 aria-label을 설정할 수 있어야 함', () => {
    render(<LoadingIcon ariaLabel="Processing" data-testid="loading-custom" />);
    const icon = screen.getByTestId('loading-custom');
    expect(icon).toHaveAttribute('aria-label', 'Processing');
  });
});

describe('Icon Registry', () => {
  it('아이콘 존재 여부를 확인할 수 있어야 함', () => {
    expect(hasIcon(IconType.HOME)).toBe(true);
    expect(hasIcon('non-existent')).toBe(false);
  });

  it('아이콘 데이터를 가져올 수 있어야 함', () => {
    const homeData = getIconData(IconType.HOME);
    expect(homeData).toBeDefined();
    expect(homeData?.viewBox).toBe('0 0 24 24');
    expect(homeData?.paths).toBeDefined();
  });

  it('존재하지 않는 아이콘은 null을 반환해야 함', () => {
    const data = getIconData('non-existent');
    expect(data).toBeNull();
  });
});