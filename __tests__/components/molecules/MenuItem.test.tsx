import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MenuItem } from '../../../components/molecules/MenuItem';
import type { MenuItemProps } from '../../../components/molecules/MenuItem/MenuItem';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('MenuItem Component', () => {
  const defaultProps: MenuItemProps = {
    icon: 'home.svg',
    label: 'Home',
    onClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('필수 props로 올바르게 렌더링된다', () => {
      render(<MenuItem {...defaultProps} />);
      
      expect(screen.getByRole('menuitem')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByAltText('')).toHaveAttribute('src', expect.stringContaining('home.svg'));
    });

    it('aria-label이 올바르게 설정된다', () => {
      render(<MenuItem {...defaultProps} />);
      
      expect(screen.getByRole('menuitem')).toHaveAttribute('aria-label', 'Home');
    });

    it('테스트 아이디가 설정된다', () => {
      render(<MenuItem {...defaultProps} data-testid="home-menu-item" />);
      
      expect(screen.getByTestId('home-menu-item')).toBeInTheDocument();
    });
  });

  describe('Icon 표시', () => {
    it('아이콘이 올바른 경로로 렌더링된다', () => {
      render(<MenuItem {...defaultProps} icon="project.svg" />);
      
      const icon = screen.getByAltText('');
      expect(icon).toHaveAttribute('src', expect.stringContaining('project.svg'));
    });

    it('아이콘에 aria-hidden이 설정된다', () => {
      render(<MenuItem {...defaultProps} />);
      
      const icon = screen.getByAltText('');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Sublabel 표시', () => {
    it('sublabel이 있을 때 표시된다', () => {
      render(<MenuItem {...defaultProps} sublabel="Dashboard" />);
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toHaveClass('menuItem__sublabel');
    });

    it('sublabel이 없을 때 표시되지 않는다', () => {
      render(<MenuItem {...defaultProps} />);
      
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });
  });

  describe('Active 상태', () => {
    it('active가 true일 때 활성 클래스가 적용된다', () => {
      render(<MenuItem {...defaultProps} active />);
      
      expect(screen.getByRole('menuitem')).toHaveClass('menuItem--active');
    });

    it('active가 false일 때 활성 클래스가 적용되지 않는다', () => {
      render(<MenuItem {...defaultProps} active={false} />);
      
      expect(screen.getByRole('menuitem')).not.toHaveClass('menuItem--active');
    });

    it('active 상태에서 aria-current가 설정된다', () => {
      render(<MenuItem {...defaultProps} active />);
      
      expect(screen.getByRole('menuitem')).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Disabled 상태', () => {
    it('disabled가 true일 때 비활성 클래스가 적용된다', () => {
      render(<MenuItem {...defaultProps} disabled />);
      
      const menuItem = screen.getByRole('menuitem');
      expect(menuItem).toHaveClass('menuItem--disabled');
      expect(menuItem).toHaveAttribute('aria-disabled', 'true');
      expect(menuItem).toHaveAttribute('tabIndex', '-1');
    });

    it('disabled 상태에서 클릭이 동작하지 않는다', async () => {
      const user = userEvent.setup();
      const mockOnClick = jest.fn();
      
      render(<MenuItem {...defaultProps} onClick={mockOnClick} disabled />);
      
      await user.click(screen.getByRole('menuitem'));
      
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('disabled 상태에서 키보드 이벤트가 동작하지 않는다', async () => {
      const user = userEvent.setup();
      const mockOnClick = jest.fn();
      
      render(<MenuItem {...defaultProps} onClick={mockOnClick} disabled />);
      
      const menuItem = screen.getByRole('menuitem');
      menuItem.focus();
      await user.keyboard('{Enter}');
      
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('href 링크 기능', () => {
    it('href가 있을 때 링크로 렌더링된다', () => {
      render(<MenuItem {...defaultProps} href="/dashboard" />);
      
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/dashboard');
    });

    it('href가 있고 external이 true일 때 target="_blank"가 설정된다', () => {
      render(<MenuItem {...defaultProps} href="https://example.com" external />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('href와 onClick이 모두 있을 때 href가 우선된다', () => {
      const mockOnClick = jest.fn();
      render(<MenuItem {...defaultProps} href="/dashboard" onClick={mockOnClick} />);
      
      expect(screen.getByRole('link')).toBeInTheDocument();
      expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
    });
  });

  describe('Action 버튼', () => {
    const actionButton = <button>Action</button>;

    it('rightAction이 있을 때 표시된다', () => {
      render(<MenuItem {...defaultProps} rightAction={actionButton} />);
      
      expect(screen.getByText('Action')).toBeInTheDocument();
      expect(screen.getByText('Action').closest('.menuItem__action')).toBeInTheDocument();
    });

    it('rightAction 클릭이 메인 클릭과 독립적으로 동작한다', async () => {
      const user = userEvent.setup();
      const mockOnClick = jest.fn();
      const mockActionClick = jest.fn();
      
      const actionWithClick = (
        <button onClick={mockActionClick}>Action</button>
      );
      
      render(
        <MenuItem 
          {...defaultProps} 
          onClick={mockOnClick} 
          rightAction={actionWithClick} 
        />
      );
      
      await user.click(screen.getByText('Action'));
      
      expect(mockActionClick).toHaveBeenCalledTimes(1);
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('클릭 이벤트', () => {
    it('클릭 시 onClick이 호출된다', async () => {
      const user = userEvent.setup();
      const mockOnClick = jest.fn();
      
      render(<MenuItem {...defaultProps} onClick={mockOnClick} />);
      
      await user.click(screen.getByRole('menuitem'));
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('Enter 키 입력 시 onClick이 호출된다', async () => {
      const user = userEvent.setup();
      const mockOnClick = jest.fn();
      
      render(<MenuItem {...defaultProps} onClick={mockOnClick} />);
      
      const menuItem = screen.getByRole('menuitem');
      menuItem.focus();
      await user.keyboard('{Enter}');
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('Space 키 입력 시 onClick이 호출된다', async () => {
      const user = userEvent.setup();
      const mockOnClick = jest.fn();
      
      render(<MenuItem {...defaultProps} onClick={mockOnClick} />);
      
      const menuItem = screen.getByRole('menuitem');
      menuItem.focus();
      await user.keyboard(' ');
      
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('다른 키 입력 시 onClick이 호출되지 않는다', async () => {
      const user = userEvent.setup();
      const mockOnClick = jest.fn();
      
      render(<MenuItem {...defaultProps} onClick={mockOnClick} />);
      
      const menuItem = screen.getByRole('menuitem');
      menuItem.focus();
      await user.keyboard('{Tab}');
      
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('접근성', () => {
    it('키보드 네비게이션이 가능하다', () => {
      render(<MenuItem {...defaultProps} />);
      
      const menuItem = screen.getByRole('menuitem');
      expect(menuItem).toHaveAttribute('tabIndex', '0');
    });

    it('role="menuitem"이 설정된다', () => {
      render(<MenuItem {...defaultProps} />);
      
      expect(screen.getByRole('menuitem')).toBeInTheDocument();
    });

    it('커스텀 aria-label이 올바르게 설정된다', () => {
      render(<MenuItem {...defaultProps} aria-label="Custom Label" />);
      
      expect(screen.getByRole('menuitem')).toHaveAttribute('aria-label', 'Custom Label');
    });
  });

  describe('CSS 클래스', () => {
    it('기본 클래스가 적용된다', () => {
      render(<MenuItem {...defaultProps} />);
      
      expect(screen.getByRole('menuitem')).toHaveClass('menuItem');
    });

    it('커스텀 className이 추가된다', () => {
      render(<MenuItem {...defaultProps} className="custom-class" />);
      
      const menuItem = screen.getByRole('menuitem');
      expect(menuItem).toHaveClass('menuItem');
      expect(menuItem).toHaveClass('custom-class');
    });

    it('여러 상태 클래스가 동시에 적용될 수 있다', () => {
      render(<MenuItem {...defaultProps} active disabled className="custom" />);
      
      const menuItem = screen.getByRole('menuitem');
      expect(menuItem).toHaveClass('menuItem');
      expect(menuItem).toHaveClass('menuItem--active');
      expect(menuItem).toHaveClass('menuItem--disabled');
      expect(menuItem).toHaveClass('custom');
    });
  });

  describe('에러 처리', () => {
    it('icon이 없어도 에러가 발생하지 않는다', () => {
      expect(() => {
        render(<MenuItem label="Test" onClick={jest.fn()} />);
      }).not.toThrow();
    });

    it('onClick이 없어도 에러가 발생하지 않는다', () => {
      expect(() => {
        render(<MenuItem icon="test.svg" label="Test" />);
      }).not.toThrow();
    });

    it('빈 label이어도 에러가 발생하지 않는다', () => {
      expect(() => {
        render(<MenuItem icon="test.svg" label="" onClick={jest.fn()} />);
      }).not.toThrow();
    });
  });
});