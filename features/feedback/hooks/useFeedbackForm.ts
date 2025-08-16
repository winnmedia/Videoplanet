// =============================================================================
// useFeedbackForm Hook - VideoPlanet 피드백 폼 관리 훅
// =============================================================================

import { useState, useCallback, useMemo } from 'react';
import {
  FeedbackFormState,
  FeedbackFormErrors,
  FeedbackFormValidation,
  UseFeedbackFormReturn,
  FeedbackInputData,
} from '../types';
import { isValidTimestamp } from '../api/feedbackApi';

interface UseFeedbackFormOptions {
  onSubmit: (data: FeedbackInputData) => Promise<void>;
  initialValues?: Partial<FeedbackFormState>;
  validateOnChange?: boolean;
}

// 기본값 정의
const DEFAULT_FORM_STATE: FeedbackFormState = {
  secret: false,
  title: '',
  section: '',
  contents: '',
};

/**
 * 피드백 폼 상태 관리 및 검증 훅
 */
export function useFeedbackForm({
  onSubmit,
  initialValues = {},
  validateOnChange = false,
}: UseFeedbackFormOptions): UseFeedbackFormReturn {
  // 폼 상태
  const [values, setValues] = useState<FeedbackFormState>({
    ...DEFAULT_FORM_STATE,
    ...initialValues,
  });
  
  const [errors, setErrors] = useState<FeedbackFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [touched, setTouched] = useState<Record<keyof FeedbackFormState, boolean>>({
    secret: false,
    title: false,
    section: false,
    contents: false,
  });

  // 필드별 검증 함수
  const validateField = useCallback((field: keyof FeedbackFormState): boolean => {
    const value = values[field];
    let error = '';

    switch (field) {
      case 'secret':
        if (value !== true && value !== false && value !== 'true' && value !== 'false') {
          error = '익명 여부를 선택해주세요.';
        }
        break;
        
      case 'section':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          error = '구간을 입력해주세요.';
        } else if (typeof value === 'string' && !isValidTimestamp(value.trim())) {
          error = '올바른 시간 형식을 입력해주세요. (예: 05:30)';
        }
        break;
        
      case 'contents':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          error = '내용을 입력해주세요.';
        } else if (typeof value === 'string' && value.trim().length < 2) {
          error = '내용은 최소 2자 이상 입력해주세요.';
        } else if (typeof value === 'string' && value.length > 1000) {
          error = '내용은 1000자를 초과할 수 없습니다.';
        }
        break;
        
      case 'title':
        // title은 선택사항이므로 검증하지 않음
        break;
    }

    setErrors(prev => ({
      ...prev,
      [field]: error || undefined,
    }));

    return !error;
  }, [values]);

  // 전체 폼 검증
  const validateForm = useCallback((): boolean => {
    const fieldValidations: Record<keyof FeedbackFormState, boolean> = {
      secret: validateField('secret'),
      title: validateField('title'),
      section: validateField('section'),
      contents: validateField('contents'),
    };

    const isValid = Object.values(fieldValidations).every(Boolean);

    // 전체 에러 확인
    if (!isValid) {
      setErrors(prev => ({
        ...prev,
        general: '입력란을 올바르게 채워주세요.',
      }));
    } else {
      setErrors(prev => {
        const { general, ...rest } = prev;
        return rest;
      });
    }

    return isValid;
  }, [validateField]);

  // 개별 필드 값 변경
  const handleChange = useCallback((field: keyof FeedbackFormState, value: string | boolean) => {
    setValues(prev => ({
      ...prev,
      [field]: value,
    }));

    setTouched(prev => ({
      ...prev,
      [field]: true,
    }));

    // 즉시 검증 (옵션)
    if (validateOnChange) {
      setTimeout(() => validateField(field), 0);
    }
  }, [validateField, validateOnChange]);

  // 여러 필드 값 설정
  const setFormValues = useCallback((newValues: Partial<FeedbackFormState>) => {
    setValues(prev => ({
      ...prev,
      ...newValues,
    }));

    // 변경된 필드들을 touched로 표시
    const changedFields = Object.keys(newValues) as (keyof FeedbackFormState)[];
    setTouched(prev => {
      const newTouched = { ...prev };
      changedFields.forEach(field => {
        newTouched[field] = true;
      });
      return newTouched;
    });
  }, []);

  // 폼 리셋
  const reset = useCallback(() => {
    setValues({
      ...DEFAULT_FORM_STATE,
      ...initialValues,
    });
    setErrors({});
    setTouched({
      secret: false,
      title: false,
      section: false,
      contents: false,
    });
    setIsSubmitting(false);

    // 라디오 버튼 초기화 (DOM 조작)
    try {
      const secretInputs = document.getElementsByName('secret') as NodeListOf<HTMLInputElement>;
      secretInputs.forEach(input => {
        input.checked = false;
      });
    } catch (error) {
      console.warn('Failed to reset radio buttons:', error);
    }
  }, [initialValues]);

  // 폼 제출
  const handleSubmit = useCallback(async () => {
    // 모든 필드를 touched로 표시
    setTouched({
      secret: true,
      title: true,
      section: true,
      contents: true,
    });

    // 폼 검증
    const isValid = validateForm();
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);
    setErrors(prev => {
      const { general, ...rest } = prev;
      return rest;
    });

    try {
      // 데이터 변환
      const submitData: FeedbackInputData = {
        secret: values.secret === true || values.secret === 'true',
        title: values.title,
        section: values.section.toString().trim(),
        contents: values.contents.toString().trim(),
      };

      await onSubmit(submitData);
      
      // 성공 시 폼 리셋
      reset();
    } catch (error) {
      console.error('Form submission error:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : '피드백 등록 중 오류가 발생했습니다.';
        
      setErrors(prev => ({
        ...prev,
        general: errorMessage,
      }));
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateForm, onSubmit, reset]);

  // 폼 유효성 상태 (computed)
  const isValid = useMemo((): boolean => {
    const hasRequiredFields = 
      (values.secret === true || values.secret === false || values.secret === 'true' || values.secret === 'false') &&
      values.section.toString().trim() !== '' &&
      values.contents.toString().trim() !== '';

    const hasNoErrors = Object.keys(errors).length === 0 || 
      (Object.keys(errors).length === 1 && errors.general);

    return Boolean(hasRequiredFields && hasNoErrors);
  }, [values, errors]);

  // 필드별 에러 표시 여부
  const shouldShowError = useCallback((field: keyof FeedbackFormState) => {
    return touched[field] && errors[field];
  }, [touched, errors]);

  // 특정 필드의 에러 메시지
  const getFieldError = useCallback((field: keyof FeedbackFormState) => {
    return shouldShowError(field) ? errors[field] : undefined;
  }, [shouldShowError, errors]);

  // 폼 상태 요약
  const formStatus = useMemo(() => {
    if (isSubmitting) return 'submitting';
    if (!isValid) return 'invalid';
    if (Object.values(touched).some(Boolean)) return 'dirty';
    return 'pristine';
  }, [isSubmitting, isValid, touched]);

  return {
    // 폼 상태
    values,
    errors,
    isValid,
    isSubmitting,
    
    // 폼 액션
    handleChange,
    handleSubmit,
    reset,
    setValues: setFormValues,
    
    // 검증
    validateField,
    validateForm,
    
    // 유틸리티
    touched,
    shouldShowError,
    getFieldError,
    formStatus,
  };
}

// 추가 유틸리티 훅들

/**
 * 타임스탬프 입력 관리를 위한 특화 훅
 */
export function useTimestampInput(initialValue: string = '') {
  const [value, setValue] = useState<string>(initialValue);
  const [isValid, setIsValid] = useState<boolean>(true);

  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
    setIsValid(isValidTimestamp(newValue) || newValue === '');
  }, []);

  const formatValue = useCallback((rawValue: string) => {
    // 숫자만 추출
    const numbers = rawValue.replace(/\D/g, '');
    
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}:${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}:${numbers.slice(2, 4)}`;
    }
  }, []);

  const handleFormattedChange = useCallback((rawValue: string) => {
    const formatted = formatValue(rawValue);
    handleChange(formatted);
  }, [formatValue, handleChange]);

  return {
    value,
    isValid,
    handleChange,
    handleFormattedChange,
    formatValue,
  };
}

export default useFeedbackForm;