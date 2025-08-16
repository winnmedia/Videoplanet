import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FormGroup } from '@/components/molecules/FormGroup';

describe('FormGroup Component', () => {
  describe('기본 렌더링', () => {
    it('label과 children이 렌더링되어야 함', () => {
      render(
        <FormGroup label="이름">
          <input type="text" />
        </FormGroup>
      );
      
      expect(screen.getByText('이름')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('label 없이도 렌더링되어야 함', () => {
      render(
        <FormGroup>
          <input type="text" />
        </FormGroup>
      );
      
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('필수 표시', () => {
    it('required가 true일 때 * 표시가 나타나야 함', () => {
      render(
        <FormGroup label="이메일" required>
          <input type="email" />
        </FormGroup>
      );
      
      const asterisk = screen.getByText('*');
      expect(asterisk).toBeInTheDocument();
      expect(asterisk).toHaveClass('form-group__required');
    });

    it('required가 false일 때 * 표시가 없어야 함', () => {
      render(
        <FormGroup label="닉네임" required={false}>
          <input type="text" />
        </FormGroup>
      );
      
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });
  });

  describe('에러 메시지', () => {
    it('error가 있을 때 에러 메시지가 표시되어야 함', () => {
      render(
        <FormGroup label="비밀번호" error="비밀번호는 8자 이상이어야 합니다">
          <input type="password" />
        </FormGroup>
      );
      
      expect(screen.getByText('비밀번호는 8자 이상이어야 합니다')).toBeInTheDocument();
      expect(screen.getByText('비밀번호는 8자 이상이어야 합니다')).toHaveClass('form-group__error');
    });

    it('error가 없을 때 에러 메시지가 표시되지 않아야 함', () => {
      render(
        <FormGroup label="비밀번호">
          <input type="password" />
        </FormGroup>
      );
      
      expect(screen.queryByText('비밀번호는 8자 이상이어야 합니다')).not.toBeInTheDocument();
    });

    it('error가 있을 때 에러 스타일이 적용되어야 함', () => {
      const { container } = render(
        <FormGroup label="이메일" error="올바른 이메일을 입력하세요">
          <input type="email" />
        </FormGroup>
      );
      
      const formGroup = container.firstChild;
      expect(formGroup).toHaveClass('form-group--error');
    });
  });

  describe('힌트 메시지', () => {
    it('hint가 있을 때 힌트 메시지가 표시되어야 함', () => {
      render(
        <FormGroup label="사용자명" hint="영문, 숫자, 언더스코어만 사용 가능">
          <input type="text" />
        </FormGroup>
      );
      
      expect(screen.getByText('영문, 숫자, 언더스코어만 사용 가능')).toBeInTheDocument();
      expect(screen.getByText('영문, 숫자, 언더스코어만 사용 가능')).toHaveClass('form-group__hint');
    });

    it('error와 hint가 모두 있을 때 error만 표시되어야 함', () => {
      render(
        <FormGroup 
          label="이메일" 
          error="이미 사용 중인 이메일입니다"
          hint="이메일 형식으로 입력하세요"
        >
          <input type="email" />
        </FormGroup>
      );
      
      expect(screen.getByText('이미 사용 중인 이메일입니다')).toBeInTheDocument();
      expect(screen.queryByText('이메일 형식으로 입력하세요')).not.toBeInTheDocument();
    });
  });

  describe('레이아웃', () => {
    it('horizontal 레이아웃이 적용되어야 함', () => {
      const { container } = render(
        <FormGroup label="이름" layout="horizontal">
          <input type="text" />
        </FormGroup>
      );
      
      const formGroup = container.firstChild;
      expect(formGroup).toHaveClass('form-group--horizontal');
    });

    it('vertical 레이아웃이 기본값이어야 함', () => {
      const { container } = render(
        <FormGroup label="이름">
          <input type="text" />
        </FormGroup>
      );
      
      const formGroup = container.firstChild;
      expect(formGroup).toHaveClass('form-group--vertical');
    });
  });

  describe('크기', () => {
    it('small 크기가 적용되어야 함', () => {
      const { container } = render(
        <FormGroup label="이름" size="small">
          <input type="text" />
        </FormGroup>
      );
      
      const formGroup = container.firstChild;
      expect(formGroup).toHaveClass('form-group--small');
    });

    it('medium 크기가 기본값이어야 함', () => {
      const { container } = render(
        <FormGroup label="이름">
          <input type="text" />
        </FormGroup>
      );
      
      const formGroup = container.firstChild;
      expect(formGroup).toHaveClass('form-group--medium');
    });

    it('large 크기가 적용되어야 함', () => {
      const { container } = render(
        <FormGroup label="이름" size="large">
          <input type="text" />
        </FormGroup>
      );
      
      const formGroup = container.firstChild;
      expect(formGroup).toHaveClass('form-group--large');
    });
  });

  describe('전체 너비', () => {
    it('fullWidth가 true일 때 전체 너비 스타일이 적용되어야 함', () => {
      const { container } = render(
        <FormGroup label="설명" fullWidth>
          <textarea />
        </FormGroup>
      );
      
      const formGroup = container.firstChild;
      expect(formGroup).toHaveClass('form-group--full-width');
    });
  });

  describe('커스텀 클래스 및 스타일', () => {
    it('커스텀 className이 추가되어야 함', () => {
      const { container } = render(
        <FormGroup label="이름" className="custom-form-group">
          <input type="text" />
        </FormGroup>
      );
      
      const formGroup = container.firstChild;
      expect(formGroup).toHaveClass('form-group', 'custom-form-group');
    });

    it('커스텀 style이 적용되어야 함', () => {
      const { container } = render(
        <FormGroup label="이름" style={{ marginTop: '20px' }}>
          <input type="text" />
        </FormGroup>
      );
      
      const formGroup = container.firstChild;
      expect(formGroup).toHaveStyle({ marginTop: '20px' });
    });
  });

  describe('접근성', () => {
    it('label이 htmlFor로 input과 연결되어야 함', () => {
      render(
        <FormGroup label="이메일" htmlFor="email-input">
          <input type="email" id="email-input" />
        </FormGroup>
      );
      
      const label = screen.getByText('이메일');
      const input = screen.getByRole('textbox');
      
      expect(label.closest('label')).toHaveAttribute('for', 'email-input');
      expect(input).toHaveAttribute('id', 'email-input');
    });
  });
});