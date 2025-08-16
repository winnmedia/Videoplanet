// =============================================================================
// FeedbackInput Component Tests - VideoPlanet 피드백 입력 컴포넌트 테스트
// =============================================================================

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import FeedbackInput from '@/features/feedback/components/FeedbackInput';
import { FeedbackInputData } from '@/features/feedback/types';

// Mock store 설정
const mockStore = configureStore({
  reducer: {
    ProjectStore: (state = { user: 'test@example.com' }) => state,
  },
});

// Mock 함수들
const mockRefetch = jest.fn();
const mockOnSubmit = jest.fn();

// 기본 props
const defaultProps = {
  project_id: '123',
  refetch: mockRefetch,
  onSubmit: mockOnSubmit,
};

// 테스트 유틸리티 함수
const renderFeedbackInput = (props = {}) => {
  return render(
    <Provider store={mockStore}>
      <FeedbackInput {...defaultProps} {...props} />
    </Provider>
  );
};

describe('FeedbackInput Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('렌더링 테스트', () => {
    it('모든 필수 요소가 올바르게 렌더링되어야 한다', () => {
      renderFeedbackInput();

      // 익명/일반 라디오 버튼
      expect(screen.getByLabelText('익명으로 피드백 등록')).toBeInTheDocument();
      expect(screen.getByLabelText('일반으로 피드백 등록')).toBeInTheDocument();

      // 입력 필드들
      expect(screen.getByPlaceholderText('구간 입력 (예: 05:30)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('내용 입력')).toBeInTheDocument();

      // 제출 버튼
      expect(screen.getByRole('button', { name: '피드백 등록' })).toBeInTheDocument();
    });

    it('라디오 버튼이 올바른 name과 value를 가져야 한다', () => {
      renderFeedbackInput();

      const anonymousRadio = screen.getByLabelText('익명으로 피드백 등록');
      const normalRadio = screen.getByLabelText('일반으로 피드백 등록');

      expect(anonymousRadio).toHaveAttribute('name', 'secret');
      expect(anonymousRadio).toHaveAttribute('value', 'true');
      expect(normalRadio).toHaveAttribute('name', 'secret');
      expect(normalRadio).toHaveAttribute('value', 'false');
    });
  });

  describe('폼 상호작용 테스트', () => {
    it('라디오 버튼 선택이 올바르게 작동해야 한다', async () => {
      const user = userEvent.setup();
      renderFeedbackInput();

      const anonymousRadio = screen.getByLabelText('익명으로 피드백 등록');
      const normalRadio = screen.getByLabelText('일반으로 피드백 등록');

      // 익명 선택
      await user.click(anonymousRadio);
      expect(anonymousRadio).toBeChecked();
      expect(normalRadio).not.toBeChecked();

      // 일반 선택
      await user.click(normalRadio);
      expect(normalRadio).toBeChecked();
      expect(anonymousRadio).not.toBeChecked();
    });

    it('텍스트 입력이 올바르게 작동해야 한다', async () => {
      const user = userEvent.setup();
      renderFeedbackInput();

      const sectionInput = screen.getByPlaceholderText('구간 입력 (예: 05:30)');
      const contentsInput = screen.getByPlaceholderText('내용 입력');

      await user.type(sectionInput, '05:30');
      await user.type(contentsInput, '테스트 피드백 내용입니다.');

      expect(sectionInput).toHaveValue('05:30');
      expect(contentsInput).toHaveValue('테스트 피드백 내용입니다.');
    });

    it('Enter 키로 폼 제출이 가능해야 한다', async () => {
      const user = userEvent.setup();
      renderFeedbackInput();

      const anonymousRadio = screen.getByLabelText('익명으로 피드백 등록');
      const sectionInput = screen.getByPlaceholderText('구간 입력 (예: 05:30)');
      const contentsInput = screen.getByPlaceholderText('내용 입력');

      // 필수 데이터 입력
      await user.click(anonymousRadio);
      await user.type(sectionInput, '05:30');
      await user.type(contentsInput, '테스트 피드백');

      // Enter 키로 제출
      await user.type(contentsInput, '{enter}');

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          secret: true,
          title: '',
          section: '05:30',
          contents: '테스트 피드백',
        });
      });
    });
  });

  describe('폼 검증 테스트', () => {
    it('필수 필드가 비어있으면 제출 버튼이 비활성화되어야 한다', () => {
      renderFeedbackInput();

      const submitButton = screen.getByRole('button', { name: '피드백 등록' });
      expect(submitButton).toBeDisabled();
    });

    it('모든 필수 필드가 채워지면 제출 버튼이 활성화되어야 한다', async () => {
      const user = userEvent.setup();
      renderFeedbackInput();

      const anonymousRadio = screen.getByLabelText('익명으로 피드백 등록');
      const sectionInput = screen.getByPlaceholderText('구간 입력 (예: 05:30)');
      const contentsInput = screen.getByPlaceholderText('내용 입력');
      const submitButton = screen.getByRole('button', { name: '피드백 등록' });

      await user.click(anonymousRadio);
      await user.type(sectionInput, '05:30');
      await user.type(contentsInput, '테스트 피드백');

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('잘못된 타임스탬프 형식에 대해 에러 메시지를 표시해야 한다', async () => {
      const user = userEvent.setup();
      renderFeedbackInput();

      const sectionInput = screen.getByPlaceholderText('구간 입력 (예: 05:30)');

      await user.type(sectionInput, '99:99');
      await user.tab(); // blur 이벤트 발생

      await waitFor(() => {
        expect(screen.getByText(/올바른 시간 형식을 입력해주세요/)).toBeInTheDocument();
      });
    });

    it('빈 내용에 대해 에러 메시지를 표시해야 한다', async () => {
      const user = userEvent.setup();
      renderFeedbackInput();

      const contentsInput = screen.getByPlaceholderText('내용 입력');

      await user.type(contentsInput, ' '); // 공백만 입력
      await user.tab(); // blur 이벤트 발생

      await waitFor(() => {
        expect(screen.getByText(/내용을 입력해주세요/)).toBeInTheDocument();
      });
    });

    it('글자수 제한을 초과하면 에러 메시지를 표시해야 한다', async () => {
      const user = userEvent.setup();
      renderFeedbackInput();

      const contentsInput = screen.getByPlaceholderText('내용 입력');
      const longContent = 'a'.repeat(1001); // 1000자 초과

      await user.type(contentsInput, longContent);
      await user.tab(); // blur 이벤트 발생

      await waitFor(() => {
        expect(screen.getByText(/1000자를 초과할 수 없습니다/)).toBeInTheDocument();
      });
    });
  });

  describe('폼 제출 테스트', () => {
    it('올바른 데이터로 폼 제출이 성공해야 한다', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      renderFeedbackInput();

      const normalRadio = screen.getByLabelText('일반으로 피드백 등록');
      const sectionInput = screen.getByPlaceholderText('구간 입력 (예: 05:30)');
      const contentsInput = screen.getByPlaceholderText('내용 입력');
      const submitButton = screen.getByRole('button', { name: '피드백 등록' });

      await user.click(normalRadio);
      await user.type(sectionInput, '10:45');
      await user.type(contentsInput, '정말 좋은 장면이네요!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          secret: false,
          title: '',
          section: '10:45',
          contents: '정말 좋은 장면이네요!',
        });
      });

      await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
      });
    });

    it('제출 중 로딩 상태를 표시해야 한다', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      renderFeedbackInput();

      const anonymousRadio = screen.getByLabelText('익명으로 피드백 등록');
      const sectionInput = screen.getByPlaceholderText('구간 입력 (예: 05:30)');
      const contentsInput = screen.getByPlaceholderText('내용 입력');
      const submitButton = screen.getByRole('button', { name: '피드백 등록' });

      await user.click(anonymousRadio);
      await user.type(sectionInput, '05:30');
      await user.type(contentsInput, '테스트 피드백');
      await user.click(submitButton);

      expect(screen.getByText('등록 중...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByText('피드백 등록')).toBeInTheDocument();
      }, { timeout: 200 });
    });

    it('제출 실패 시 에러 메시지를 표시해야 한다', async () => {
      const user = userEvent.setup();
      const errorMessage = '피드백 등록에 실패했습니다.';
      mockOnSubmit.mockRejectedValue(new Error(errorMessage));
      renderFeedbackInput();

      const anonymousRadio = screen.getByLabelText('익명으로 피드백 등록');
      const sectionInput = screen.getByPlaceholderText('구간 입력 (예: 05:30)');
      const contentsInput = screen.getByPlaceholderText('내용 입력');
      const submitButton = screen.getByRole('button', { name: '피드백 등록' });

      await user.click(anonymousRadio);
      await user.type(sectionInput, '05:30');
      await user.type(contentsInput, '테스트 피드백');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('제출 성공 후 폼이 초기화되어야 한다', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValue(undefined);
      renderFeedbackInput();

      const anonymousRadio = screen.getByLabelText('익명으로 피드백 등록');
      const sectionInput = screen.getByPlaceholderText('구간 입력 (예: 05:30)');
      const contentsInput = screen.getByPlaceholderText('내용 입력');
      const submitButton = screen.getByRole('button', { name: '피드백 등록' });

      await user.click(anonymousRadio);
      await user.type(sectionInput, '05:30');
      await user.type(contentsInput, '테스트 피드백');
      await user.click(submitButton);

      await waitFor(() => {
        expect(sectionInput).toHaveValue('');
        expect(contentsInput).toHaveValue('');
        expect(anonymousRadio).not.toBeChecked();
      });
    });
  });

  describe('접근성 테스트', () => {
    it('모든 입력 필드에 적절한 라벨이 있어야 한다', () => {
      renderFeedbackInput();

      expect(screen.getByLabelText('익명으로 피드백 등록')).toBeInTheDocument();
      expect(screen.getByLabelText('일반으로 피드백 등록')).toBeInTheDocument();
      expect(screen.getByLabelText('피드백 구간 타임스탬프')).toBeInTheDocument();
      expect(screen.getByLabelText('피드백 내용')).toBeInTheDocument();
    });

    it('에러 메시지가 적절한 aria 속성을 가져야 한다', async () => {
      const user = userEvent.setup();
      renderFeedbackInput();

      const sectionInput = screen.getByPlaceholderText('구간 입력 (예: 05:30)');
      await user.type(sectionInput, 'invalid');
      await user.tab();

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toBeInTheDocument();
        expect(sectionInput).toHaveAttribute('aria-describedby');
      });
    });

    it('제출 버튼에 적절한 aria-label이 있어야 한다', () => {
      renderFeedbackInput();

      const submitButton = screen.getByRole('button', { name: '피드백 등록' });
      expect(submitButton).toHaveAttribute('aria-label', '피드백 등록');
    });

    it('로딩 상태가 스크린 리더에게 전달되어야 한다', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      renderFeedbackInput();

      const anonymousRadio = screen.getByLabelText('익명으로 피드백 등록');
      const sectionInput = screen.getByPlaceholderText('구간 입력 (예: 05:30)');
      const contentsInput = screen.getByPlaceholderText('내용 입력');
      const submitButton = screen.getByRole('button', { name: '피드백 등록' });

      await user.click(anonymousRadio);
      await user.type(sectionInput, '05:30');
      await user.type(contentsInput, '테스트 피드백');
      await user.click(submitButton);

      const liveRegion = screen.getByLabelText(/피드백을 등록하고 있습니다/);
      expect(liveRegion).toBeInTheDocument();
    });
  });

  describe('키보드 네비게이션 테스트', () => {
    it('Tab 키로 모든 상호작용 요소에 접근 가능해야 한다', async () => {
      const user = userEvent.setup();
      renderFeedbackInput();

      const anonymousRadio = screen.getByLabelText('익명으로 피드백 등록');
      const normalRadio = screen.getByLabelText('일반으로 피드백 등록');
      const sectionInput = screen.getByPlaceholderText('구간 입력 (예: 05:30)');
      const contentsInput = screen.getByPlaceholderText('내용 입력');
      const submitButton = screen.getByRole('button', { name: '피드백 등록' });

      // Tab으로 순서대로 포커스 이동
      await user.tab();
      expect(anonymousRadio).toHaveFocus();

      await user.tab();
      expect(normalRadio).toHaveFocus();

      await user.tab();
      expect(sectionInput).toHaveFocus();

      await user.tab();
      expect(contentsInput).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    it('Enter와 Space 키로 라디오 버튼 선택이 가능해야 한다', async () => {
      const user = userEvent.setup();
      renderFeedbackInput();

      const anonymousRadio = screen.getByLabelText('익명으로 피드백 등록');

      await user.tab(); // 첫 번째 라디오 버튼에 포커스
      await user.keyboard(' '); // Space 키로 선택

      expect(anonymousRadio).toBeChecked();
    });
  });

  describe('Props 테스트', () => {
    it('onSubmit prop이 제공되지 않으면 기본 동작만 수행해야 한다', async () => {
      const user = userEvent.setup();
      renderFeedbackInput({ onSubmit: undefined });

      const anonymousRadio = screen.getByLabelText('익명으로 피드백 등록');
      const sectionInput = screen.getByPlaceholderText('구간 입력 (예: 05:30)');
      const contentsInput = screen.getByPlaceholderText('내용 입력');
      const submitButton = screen.getByRole('button', { name: '피드백 등록' });

      await user.click(anonymousRadio);
      await user.type(sectionInput, '05:30');
      await user.type(contentsInput, '테스트 피드백');
      await user.click(submitButton);

      expect(mockRefetch).toHaveBeenCalled();
    });

    it('project_id가 전달되어야 한다', () => {
      const { rerender } = renderFeedbackInput({ project_id: '456' });

      // project_id가 올바르게 전달되었는지 간접적으로 확인
      expect(screen.getByRole('button', { name: '피드백 등록' })).toBeInTheDocument();

      // 다른 project_id로 리렌더링
      rerender(
        <Provider store={mockStore}>
          <FeedbackInput {...defaultProps} project_id="789" />
        </Provider>
      );

      expect(screen.getByRole('button', { name: '피드백 등록' })).toBeInTheDocument();
    });
  });
});