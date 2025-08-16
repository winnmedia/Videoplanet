/**
 * ProjectInput 컴포넌트 단위 테스트
 * VideoPlanet 프로젝트 - Next.js 14 App Router 통합
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectInput } from '@/features/projects/components';
import type { ProjectInputData, ProjectInputProps } from '@/features/projects/types';

// ===== 모의 데이터 =====
const mockInputs: ProjectInputData = {
  name: '',
  description: '',
  manager: '',
  consumer: '',
};

const mockOnChange = jest.fn();

const defaultProps: ProjectInputProps = {
  inputs: mockInputs,
  onChange: mockOnChange,
};

// ===== 유틸리티 함수 =====
const renderProjectInput = (props: Partial<ProjectInputProps> = {}) => {
  return render(<ProjectInput {...defaultProps} {...props} />);
};

// ===== 테스트 스위트 =====
describe('ProjectInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===== 렌더링 테스트 =====
  describe('렌더링', () => {
    test('모든 필드가 올바르게 렌더링된다', () => {
      renderProjectInput();

      expect(screen.getByLabelText('프로젝트 이름')).toBeInTheDocument();
      expect(screen.getByLabelText('담당자')).toBeInTheDocument();
      expect(screen.getByLabelText('고객사')).toBeInTheDocument();
      expect(screen.getByLabelText('프로젝트 세부 설명')).toBeInTheDocument();
    });

    test('초기값이 올바르게 표시된다', () => {
      const filledInputs: ProjectInputData = {
        name: '테스트 프로젝트',
        description: '프로젝트 설명',
        manager: '김담당',
        consumer: '테스트 회사',
      };

      renderProjectInput({ inputs: filledInputs });

      expect(screen.getByDisplayValue('테스트 프로젝트')).toBeInTheDocument();
      expect(screen.getByDisplayValue('프로젝트 설명')).toBeInTheDocument();
      expect(screen.getByDisplayValue('김담당')).toBeInTheDocument();
      expect(screen.getByDisplayValue('테스트 회사')).toBeInTheDocument();
    });
  });

  // ===== 입력 테스트 =====
  describe('사용자 입력', () => {
    test('프로젝트 이름 입력이 올바르게 동작한다', async () => {
      const user = userEvent.setup();
      renderProjectInput();

      const nameInput = screen.getByLabelText('프로젝트 이름');
      await user.type(nameInput, '새 프로젝트');

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            name: 'name',
            value: '새 프로젝트',
          }),
        })
      );
    });

    test('담당자 입력이 올바르게 동작한다', async () => {
      const user = userEvent.setup();
      renderProjectInput();

      const managerInput = screen.getByLabelText('담당자');
      await user.type(managerInput, '김담당자');

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            name: 'manager',
            value: '김담당자',
          }),
        })
      );
    });

    test('고객사 입력이 올바르게 동작한다', async () => {
      const user = userEvent.setup();
      renderProjectInput();

      const consumerInput = screen.getByLabelText('고객사');
      await user.type(consumerInput, '테스트 고객사');

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            name: 'consumer',
            value: '테스트 고객사',
          }),
        })
      );
    });

    test('프로젝트 설명 입력이 올바르게 동작한다', async () => {
      const user = userEvent.setup();
      renderProjectInput();

      const descriptionInput = screen.getByLabelText('프로젝트 세부 설명');
      await user.type(descriptionInput, '상세 설명입니다.');

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            name: 'description',
            value: '상세 설명입니다.',
          }),
        })
      );
    });
  });

  // ===== 최대 길이 검증 테스트 =====
  describe('입력 제한', () => {
    test('프로젝트 이름은 최대 50자까지 입력 가능하다', () => {
      renderProjectInput();
      const nameInput = screen.getByLabelText('프로젝트 이름') as HTMLInputElement;
      expect(nameInput.maxLength).toBe(50);
    });

    test('담당자는 최대 50자까지 입력 가능하다', () => {
      renderProjectInput();
      const managerInput = screen.getByLabelText('담당자') as HTMLInputElement;
      expect(managerInput.maxLength).toBe(50);
    });

    test('고객사는 최대 50자까지 입력 가능하다', () => {
      renderProjectInput();
      const consumerInput = screen.getByLabelText('고객사') as HTMLInputElement;
      expect(consumerInput.maxLength).toBe(50);
    });

    test('프로젝트 설명은 최대 100자까지 입력 가능하다', () => {
      renderProjectInput();
      const descriptionInput = screen.getByLabelText('프로젝트 세부 설명') as HTMLTextAreaElement;
      expect(descriptionInput.maxLength).toBe(100);
    });
  });

  // ===== 에러 표시 테스트 =====
  describe('에러 표시', () => {
    test('에러가 있을 때 에러 메시지가 표시된다', () => {
      const errors = {
        name: '프로젝트 이름을 입력해주세요.',
        manager: '담당자를 입력해주세요.',
        consumer: '고객사를 입력해주세요.',
        description: '프로젝트 설명을 입력해주세요.',
      };

      renderProjectInput({ errors });

      expect(screen.getByText('프로젝트 이름을 입력해주세요.')).toBeInTheDocument();
      expect(screen.getByText('담당자를 입력해주세요.')).toBeInTheDocument();
      expect(screen.getByText('고객사를 입력해주세요.')).toBeInTheDocument();
      expect(screen.getByText('프로젝트 설명을 입력해주세요.')).toBeInTheDocument();
    });

    test('에러가 있는 필드에 error 클래스가 적용된다', () => {
      const errors = {
        name: '프로젝트 이름을 입력해주세요.',
      };

      renderProjectInput({ errors });
      
      const nameInput = screen.getByLabelText('프로젝트 이름');
      expect(nameInput).toHaveClass('error');
    });

    test('aria-invalid 속성이 올바르게 설정된다', () => {
      const errors = {
        name: '프로젝트 이름을 입력해주세요.',
      };

      renderProjectInput({ errors });
      
      const nameInput = screen.getByLabelText('프로젝트 이름');
      expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    });

    test('에러 메시지 ID가 aria-describedby에 연결된다', () => {
      const errors = {
        name: '프로젝트 이름을 입력해주세요.',
      };

      renderProjectInput({ errors });
      
      const nameInput = screen.getByLabelText('프로젝트 이름');
      expect(nameInput).toHaveAttribute('aria-describedby', 'name-error');
    });
  });

  // ===== 비활성화 상태 테스트 =====
  describe('비활성화 상태', () => {
    test('disabled prop이 true일 때 모든 입력 필드가 비활성화된다', () => {
      renderProjectInput({ disabled: true });

      expect(screen.getByLabelText('프로젝트 이름')).toBeDisabled();
      expect(screen.getByLabelText('담당자')).toBeDisabled();
      expect(screen.getByLabelText('고객사')).toBeDisabled();
      expect(screen.getByLabelText('프로젝트 세부 설명')).toBeDisabled();
    });

    test('비활성화 상태에서는 입력이 불가능하다', async () => {
      const user = userEvent.setup();
      renderProjectInput({ disabled: true });

      const nameInput = screen.getByLabelText('프로젝트 이름');
      await user.type(nameInput, '입력 시도');

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  // ===== 글자 수 카운터 테스트 =====
  describe('글자 수 카운터', () => {
    test('설명 필드에 글자 수가 표시된다', () => {
      const inputs = { ...mockInputs, description: '테스트 설명' };
      renderProjectInput({ inputs });

      expect(screen.getByText('6/100')).toBeInTheDocument();
    });

    test('빈 설명일 때 0/100이 표시된다', () => {
      renderProjectInput();
      expect(screen.getByText('0/100')).toBeInTheDocument();
    });
  });

  // ===== 접근성 테스트 =====
  describe('접근성', () => {
    test('모든 입력 필드에 적절한 레이블이 연결되어 있다', () => {
      renderProjectInput();

      const nameInput = screen.getByLabelText('프로젝트 이름');
      const managerInput = screen.getByLabelText('담당자');
      const consumerInput = screen.getByLabelText('고객사');
      const descriptionInput = screen.getByLabelText('프로젝트 세부 설명');

      expect(nameInput).toHaveAccessibleName();
      expect(managerInput).toHaveAccessibleName();
      expect(consumerInput).toHaveAccessibleName();
      expect(descriptionInput).toHaveAccessibleName();
    });

    test('에러 메시지가 스크린 리더에게 알림으로 전달된다', () => {
      const errors = {
        name: '프로젝트 이름을 입력해주세요.',
      };

      renderProjectInput({ errors });
      
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent('프로젝트 이름을 입력해주세요.');
    });
  });

  // ===== 스냅샷 테스트 =====
  describe('스냅샷', () => {
    test('기본 상태 스냅샷', () => {
      const { container } = renderProjectInput();
      expect(container.firstChild).toMatchSnapshot();
    });

    test('에러 상태 스냅샷', () => {
      const errors = {
        name: '프로젝트 이름을 입력해주세요.',
        description: '프로젝트 설명을 입력해주세요.',
      };

      const { container } = renderProjectInput({ errors });
      expect(container.firstChild).toMatchSnapshot();
    });

    test('비활성화 상태 스냅샷', () => {
      const { container } = renderProjectInput({ disabled: true });
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});