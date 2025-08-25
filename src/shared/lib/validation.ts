// Form validation utilities with comprehensive error handling

export interface ValidationRule<T = any> {
  test: (value: T) => boolean
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface FieldValidationResult {
  [fieldName: string]: ValidationResult
}

// Common validation rules
export const validationRules = {
  required: (message = '필수 입력 항목입니다.'): ValidationRule<string> => ({
    test: (value) => value != null && value.trim().length > 0,
    message
  }),

  email: (message = '올바른 이메일 형식을 입력해주세요.'): ValidationRule<string> => ({
    test: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value)
    },
    message
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    test: (value) => value.length >= min,
    message: message || `최소 ${min}자 이상 입력해주세요.`
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    test: (value) => value.length <= max,
    message: message || `최대 ${max}자까지 입력 가능합니다.`
  }),

  password: (message = '비밀번호는 8자 이상이며, 영문, 숫자, 특수문자를 포함해야 합니다.'): ValidationRule<string> => ({
    test: (value) => {
      const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      return passwordRegex.test(value)
    },
    message
  }),

  confirmPassword: (originalPassword: string, message = '비밀번호가 일치하지 않습니다.'): ValidationRule<string> => ({
    test: (value) => value === originalPassword,
    message
  }),

  phone: (message = '올바른 전화번호 형식을 입력해주세요.'): ValidationRule<string> => ({
    test: (value) => {
      const phoneRegex = /^(010|011|016|017|018|019)-?\d{3,4}-?\d{4}$/
      return phoneRegex.test(value.replace(/\s/g, ''))
    },
    message
  }),

  korean: (message = '한글만 입력 가능합니다.'): ValidationRule<string> => ({
    test: (value) => {
      const koreanRegex = /^[ㄱ-ㅎㅏ-ㅣ가-힣\s]+$/
      return koreanRegex.test(value)
    },
    message
  }),

  number: (message = '숫자만 입력 가능합니다.'): ValidationRule<string> => ({
    test: (value) => {
      return !isNaN(Number(value)) && isFinite(Number(value))
    },
    message
  }),

  url: (message = '올바른 URL 형식을 입력해주세요.'): ValidationRule<string> => ({
    test: (value) => {
      try {
        new URL(value)
        return true
      } catch {
        return false
      }
    },
    message
  }),

  custom: <T>(testFn: (value: T) => boolean, message: string): ValidationRule<T> => ({
    test: testFn,
    message
  })
}

// Validate a single field with multiple rules
export function validateField<T>(value: T, rules: ValidationRule<T>[]): ValidationResult {
  const errors: string[] = []
  
  for (const rule of rules) {
    if (!rule.test(value)) {
      errors.push(rule.message)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Validate multiple fields
export function validateForm<T extends Record<string, any>>(
  data: T,
  schema: Record<keyof T, ValidationRule<any>[]>
): FieldValidationResult {
  const result: FieldValidationResult = {}
  
  for (const [fieldName, rules] of Object.entries(schema)) {
    const fieldValue = data[fieldName]
    result[fieldName] = validateField(fieldValue, rules)
  }
  
  return result
}

// Check if form validation result is valid
export function isFormValid(validationResult: FieldValidationResult): boolean {
  return Object.values(validationResult).every(field => field.isValid)
}

// Get all errors from validation result
export function getAllErrors(validationResult: FieldValidationResult): string[] {
  return Object.values(validationResult)
    .flatMap(field => field.errors)
}

// Get first error for each field
export function getFirstErrors(validationResult: FieldValidationResult): Record<string, string> {
  const errors: Record<string, string> = {}
  
  for (const [fieldName, result] of Object.entries(validationResult)) {
    if (!result.isValid && result.errors.length > 0) {
      errors[fieldName] = result.errors[0]
    }
  }
  
  return errors
}

// Form validation schemas
export const formSchemas = {
  login: {
    email: [
      validationRules.required('이메일을 입력해주세요.'),
      validationRules.email()
    ],
    password: [
      validationRules.required('비밀번호를 입력해주세요.'),
      validationRules.minLength(1, '비밀번호를 입력해주세요.')
    ]
  },

  register: {
    name: [
      validationRules.required('이름을 입력해주세요.'),
      validationRules.minLength(2, '이름은 2자 이상이어야 합니다.'),
      validationRules.korean('한글만 입력 가능합니다.')
    ],
    email: [
      validationRules.required('이메일을 입력해주세요.'),
      validationRules.email()
    ],
    password: [
      validationRules.required('비밀번호를 입력해주세요.'),
      validationRules.password()
    ],
    confirmPassword: [] // Will be set dynamically
  },

  contact: {
    name: [
      validationRules.required('이름을 입력해주세요.'),
      validationRules.minLength(2, '이름은 2자 이상이어야 합니다.')
    ],
    email: [
      validationRules.required('이메일을 입력해주세요.'),
      validationRules.email()
    ],
    phone: [
      validationRules.required('전화번호를 입력해주세요.'),
      validationRules.phone()
    ],
    message: [
      validationRules.required('메시지를 입력해주세요.'),
      validationRules.minLength(10, '메시지는 10자 이상이어야 합니다.'),
      validationRules.maxLength(1000, '메시지는 1000자 이하여야 합니다.')
    ]
  },

  project: {
    title: [
      validationRules.required('프로젝트 제목을 입력해주세요.'),
      validationRules.minLength(3, '제목은 3자 이상이어야 합니다.'),
      validationRules.maxLength(100, '제목은 100자 이하여야 합니다.')
    ],
    description: [
      validationRules.required('프로젝트 설명을 입력해주세요.'),
      validationRules.minLength(10, '설명은 10자 이상이어야 합니다.'),
      validationRules.maxLength(500, '설명은 500자 이하여야 합니다.')
    ],
    dueDate: [
      validationRules.required('마감일을 선택해주세요.'),
      validationRules.custom(
        (value: string) => new Date(value) > new Date(),
        '마감일은 현재 날짜보다 이후여야 합니다.'
      )
    ],
    budget: [
      validationRules.required('예산을 입력해주세요.'),
      validationRules.number(),
      validationRules.custom(
        (value: string) => Number(value) > 0,
        '예산은 0보다 커야 합니다.'
      )
    ]
  }
}

// Custom error class for validation errors
export class ValidationError extends Error {
  public fieldErrors: FieldValidationResult

  constructor(fieldErrors: FieldValidationResult, message = 'Validation failed') {
    super(message)
    this.name = 'ValidationError'
    this.fieldErrors = fieldErrors
  }

  get statusCode() {
    return 400
  }

  get details() {
    return {
      errors: this.fieldErrors,
      firstErrors: getFirstErrors(this.fieldErrors),
      allErrors: getAllErrors(this.fieldErrors)
    }
  }
}

// React hook for form validation
export function useFormValidation<T extends Record<string, any>>(
  schema: Record<keyof T, ValidationRule<any>[]>
) {
  const [errors, setErrors] = React.useState<FieldValidationResult>({})
  const [isValid, setIsValid] = React.useState(true)

  const validateFormData = React.useCallback((data: T) => {
    const validationResult = validateForm(data, schema)
    setErrors(validationResult)
    setIsValid(isFormValid(validationResult))
    return validationResult
  }, [schema])

  const validateSingleField = React.useCallback((fieldName: keyof T, value: any) => {
    const rules = schema[fieldName]
    if (!rules) return

    const fieldResult = validateField(value, rules)
    setErrors(prev => ({
      ...prev,
      [fieldName]: fieldResult
    }))
  }, [schema])

  const clearErrors = React.useCallback(() => {
    setErrors({})
    setIsValid(true)
  }, [])

  const getFieldError = React.useCallback((fieldName: keyof T) => {
    const fieldErrors = errors[fieldName as string]
    return fieldErrors && !fieldErrors.isValid ? fieldErrors.errors[0] : undefined
  }, [errors])

  return {
    errors,
    isValid,
    validateForm: validateFormData,
    validateField: validateSingleField,
    clearErrors,
    getFieldError,
    firstErrors: getFirstErrors(errors)
  }
}

// Import React for the hook
import React from 'react'