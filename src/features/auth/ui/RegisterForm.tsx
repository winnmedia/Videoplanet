'use client'

import React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Checkbox } from '@/shared/ui/Checkbox'
import { useFormValidation, formSchemas, validationRules, ValidationError } from '@/shared/lib/validation'
import { useAuthActions } from '../model/hooks'
import { getPasswordStrength } from '@/shared/lib/utils'
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react'

interface RegisterFormProps {
  onSuccess?: () => void
  className?: string
}

interface PasswordStrengthProps {
  password: string
}

function PasswordStrength({ password }: PasswordStrengthProps) {
  const { score, feedback } = getPasswordStrength(password)
  
  const strengthLabels = ['매우 약함', '약함', '보통', '강함', '매우 강함']
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']
  
  if (!password) return null
  
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-2">
        {[...Array(5)].map((_, index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full ${
              index < score ? strengthColors[score - 1] : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-white/80">
        강도: {strengthLabels[score - 1] || '없음'}
      </p>
      {feedback.length > 0 && (
        <ul className="text-xs text-white/60 mt-1">
          {feedback.map((item, index) => (
            <li key={index}>• {item}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function RegisterForm({ onSuccess, className }: RegisterFormProps) {
  const router = useRouter()
  const { register, isLoading } = useAuthActions()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    agreeToPrivacy: false,
    agreeToMarketing: false
  })
  const [serverError, setServerError] = useState('')
  const [step, setStep] = useState(1) // Multi-step form

  // Dynamic validation schema with password confirmation
  const validationSchema = {
    ...formSchemas.register,
    confirmPassword: [
      validationRules.required('비밀번호 확인을 입력해주세요.'),
      validationRules.confirmPassword(formData.password)
    ]
  }

  const { validateForm, getFieldError, clearErrors } = useFormValidation(validationSchema)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError('')
    clearErrors()
    
    // Step 1: Basic information
    if (step === 1) {
      const validationResult = validateForm({
        name: formData.name,
        email: formData.email,
        password: '',
        confirmPassword: ''
      })
      
      if (validationResult.name.isValid && validationResult.email.isValid) {
        setStep(2)
      }
      return
    }
    
    // Step 2: Password setup
    if (step === 2) {
      const passwordFields = { 
        password: formData.password, 
        confirmPassword: formData.confirmPassword 
      }
      const passwordSchema = {
        password: validationSchema.password,
        confirmPassword: validationSchema.confirmPassword
      }
      
      const validationResult = validateForm({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      })
      
      if (validationResult.password.isValid && validationResult.confirmPassword.isValid) {
        setStep(3)
      }
      return
    }
    
    // Step 3: Terms agreement and final submission
    try {
      // Validate required terms
      if (!formData.agreeToTerms) {
        setServerError('서비스 이용약관에 동의해주세요.')
        return
      }
      
      if (!formData.agreeToPrivacy) {
        setServerError('개인정보처리방침에 동의해주세요.')
        return
      }
      
      // Final validation
      const validationResult = validateForm(formData)
      
      if (!validationResult || Object.values(validationResult).some(field => !field.isValid)) {
        throw new ValidationError(validationResult, 'Form validation failed')
      }
      
      // Call register action
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        agreeToMarketing: formData.agreeToMarketing
      })
      
      // Success callback
      onSuccess?.()
      
      // Redirect to email verification
      router.push('/verify-email')
      
    } catch (error) {
      console.error('Registration error:', error)
      
      if (error instanceof ValidationError) {
        return
      }
      
      if (error instanceof Error) {
        setServerError(error.message)
      } else {
        setServerError('회원가입 중 오류가 발생했습니다.')
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-8">
      {[1, 2, 3].map((stepNumber) => (
        <div key={stepNumber} className="flex items-center">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            ${step >= stepNumber 
              ? 'bg-blue-500 text-white' 
              : 'bg-white/20 text-white/60'
            }
          `}>
            {stepNumber}
          </div>
          {stepNumber < 3 && (
            <div className={`
              w-12 h-0.5 mx-2
              ${step > stepNumber ? 'bg-blue-500' : 'bg-white/20'}
            `} />
          )}
        </div>
      ))}
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-4">
      <Input
        label="이름"
        type="text"
        name="name"
        autoComplete="name"
        placeholder="이름을 입력하세요"
        value={formData.name}
        onChange={handleInputChange}
        error={getFieldError('name')}
        disabled={isLoading}
        leftIcon={<User size={18} />}
        aria-label="이름"
        className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
      />
      
      <Input
        label="이메일 주소"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="이메일 주소를 입력하세요"
        value={formData.email}
        onChange={handleInputChange}
        error={getFieldError('email')}
        disabled={isLoading}
        leftIcon={<Mail size={18} />}
        aria-label="이메일 주소"
        className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
      />
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <Input
          label="비밀번호"
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="비밀번호를 입력하세요"
          value={formData.password}
          onChange={handleInputChange}
          error={getFieldError('password')}
          disabled={isLoading}
          leftIcon={<Lock size={18} />}
          showPasswordToggle
          aria-label="비밀번호"
          className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
        />
        <PasswordStrength password={formData.password} />
      </div>
      
      <Input
        label="비밀번호 확인"
        type="password"
        name="confirmPassword"
        autoComplete="new-password"
        placeholder="비밀번호를 다시 입력하세요"
        value={formData.confirmPassword}
        onChange={handleInputChange}
        error={getFieldError('confirmPassword')}
        disabled={isLoading}
        leftIcon={<Lock size={18} />}
        showPasswordToggle
        aria-label="비밀번호 확인"
        className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
      />
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="bg-white/10 p-4 rounded-lg">
        <h3 className="text-white font-medium mb-3">약관 동의</h3>
        
        <div className="space-y-3">
          <Checkbox
            name="agreeToTerms"
            checked={formData.agreeToTerms}
            onChange={handleInputChange}
            label={
              <span className="text-white">
                <span className="text-red-400">*</span> 서비스 이용약관에 동의합니다.{' '}
                <Link href="/terms" className="text-blue-300 underline">보기</Link>
              </span>
            }
          />
          
          <Checkbox
            name="agreeToPrivacy"
            checked={formData.agreeToPrivacy}
            onChange={handleInputChange}
            label={
              <span className="text-white">
                <span className="text-red-400">*</span> 개인정보처리방침에 동의합니다.{' '}
                <Link href="/privacy" className="text-blue-300 underline">보기</Link>
              </span>
            }
          />
          
          <Checkbox
            name="agreeToMarketing"
            checked={formData.agreeToMarketing}
            onChange={handleInputChange}
            label={
              <span className="text-white">
                마케팅 정보 수신에 동의합니다. (선택)
              </span>
            }
          />
        </div>
      </div>
    </div>
  )

  return (
    <div className={className}>
      <div className="text-center mb-8">
        <Link href="/" className="inline-block mb-6">
          <img 
            src="/images/Common/w_logo.svg" 
            alt="브이래닛 로고" 
            className="h-12 w-auto mx-auto"
          />
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">
          계정 만들기
        </h1>
        <p className="text-white/80">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="font-medium text-blue-300 hover:text-blue-200 underline">
            로그인
          </Link>
        </p>
      </div>
      
      {renderStepIndicator()}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {serverError && (
          <div 
            className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg" 
            role="alert"
            aria-live="polite"
          >
            <span className="block sm:inline">{serverError}</span>
          </div>
        )}
        
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        <div className="flex gap-3">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              disabled={isLoading}
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              이전
            </Button>
          )}
          
          <Button
            type="submit"
            variant="gradient"
            size="full"
            loading={isLoading}
            disabled={isLoading}
            className={`h-12 text-lg font-semibold ${step > 1 ? 'flex-1' : ''}`}
          >
            {step === 3 ? '회원가입 완료' : '다음'}
          </Button>
        </div>
      </form>
    </div>
  )
}