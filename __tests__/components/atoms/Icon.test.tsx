import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Icon } from '@/components/atoms/Icon';

describe('Icon Component', () => {
  describe('기본 렌더링', () => {
    it('아이콘이 올바르게 렌더링되어야 함', () => {
      render(<Icon name="home" />);
      const icon = screen.getByTestId('icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('icon');
    });

    it('지정된 아이콘 이름이 클래스에 포함되어야 함', () => {
      render(<Icon name="settings" />);
      const icon = screen.getByTestId('icon');
      expect(icon).toHaveClass('icon--settings');
    });
  });

  describe('크기 변형', () => {
    it('small 크기가 적용되어야 함', () => {
      render(<Icon name="user" size="small" />);
      const icon = screen.getByTestId('icon');
      expect(icon).toHaveClass('icon--small');
    });

    it('medium 크기가 기본값이어야 함', () => {
      render(<Icon name="user" />);
      const icon = screen.getByTestId('icon');
      expect(icon).toHaveClass('icon--medium');
    });

    it('large 크기가 적용되어야 함', () => {
      render(<Icon name="user" size="large" />);
      const icon = screen.getByTestId('icon');
      expect(icon).toHaveClass('icon--large');
    });
  });

  describe('색상 설정', () => {
    it('primary 색상이 적용되어야 함', () => {
      render(<Icon name="star" color="primary" />);
      const icon = screen.getByTestId('icon');
      expect(icon).toHaveClass('icon--primary');
    });

    it('secondary 색상이 적용되어야 함', () => {
      render(<Icon name="star" color="secondary" />);
      const icon = screen.getByTestId('icon');
      expect(icon).toHaveClass('icon--secondary');
    });

    it('custom 색상이 인라인 스타일로 적용되어야 함', () => {
      render(<Icon name="star" color="#ff0000" />);
      const icon = screen.getByTestId('icon');
      expect(icon).toHaveStyle({ color: '#ff0000' });
    });
  });

  describe('회전 애니메이션', () => {
    it('spin 속성이 true일 때 회전 클래스가 적용되어야 함', () => {
      render(<Icon name="spinner" spin />);
      const icon = screen.getByTestId('icon');
      expect(icon).toHaveClass('icon--spin');
    });

    it('spin 속성이 false일 때 회전 클래스가 적용되지 않아야 함', () => {
      render(<Icon name="spinner" spin={false} />);
      const icon = screen.getByTestId('icon');
      expect(icon).not.toHaveClass('icon--spin');
    });
  });

  describe('클릭 이벤트', () => {
    it('onClick 핸들러가 호출되어야 함', () => {
      const handleClick = jest.fn();
      render(<Icon name="close" onClick={handleClick} />);
      const icon = screen.getByTestId('icon');
      icon.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('onClick이 있을 때 버튼 역할과 스타일이 적용되어야 함', () => {
      render(<Icon name="close" onClick={() => {}} />);
      const icon = screen.getByTestId('icon');
      expect(icon).toHaveClass('icon--clickable');
      expect(icon).toHaveAttribute('role', 'button');
      expect(icon).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('접근성', () => {
    it('aria-label이 제공되어야 함', () => {
      render(<Icon name="search" ariaLabel="검색" />);
      const icon = screen.getByTestId('icon');
      expect(icon).toHaveAttribute('aria-label', '검색');
    });

    it('aria-hidden이 기본적으로 true여야 함', () => {
      render(<Icon name="decorative" />);
      const icon = screen.getByTestId('icon');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('ariaLabel이 있을 때 aria-hidden이 false여야 함', () => {
      render(<Icon name="important" ariaLabel="중요" />);
      const icon = screen.getByTestId('icon');
      expect(icon).toHaveAttribute('aria-hidden', 'false');
    });
  });

  describe('커스텀 클래스 및 스타일', () => {
    it('커스텀 className이 추가되어야 함', () => {
      render(<Icon name="custom" className="custom-icon" />);
      const icon = screen.getByTestId('icon');
      expect(icon).toHaveClass('icon', 'custom-icon');
    });

    it('커스텀 style이 적용되어야 함', () => {
      render(<Icon name="styled" style={{ marginTop: '10px' }} />);
      const icon = screen.getByTestId('icon');
      expect(icon).toHaveStyle({ marginTop: '10px' });
    });
  });

  describe('title 속성', () => {
    it('title이 툴팁으로 표시되어야 함', () => {
      render(<Icon name="info" title="정보 아이콘" />);
      const icon = screen.getByTestId('icon');
      expect(icon).toHaveAttribute('title', '정보 아이콘');
    });
  });
});