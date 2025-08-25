'use client'

import React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { useFormValidation, formSchemas, ValidationError } from '@/shared/lib/validation'
import { useAuthActions } from '../model/hooks'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'

interface ForgotPasswordFormProps {
  onSuccess?: (email: string) => void
  className?: string
}

export function ForgotPasswordForm({ onSuccess, className }: ForgotPasswordFormProps) {
  const { forgotPassword, isLoading } = useAuthActions()
  const [formData, setFormData] = useState({
    email: ''
  })
  const [serverError, setServerError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const { validateForm, getFieldError, clearErrors } = useFormValidation({
    email: formSchemas.login.email
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError('')
    clearErrors()
    
    try {
      // Client-side validation
      const validationResult = validateForm(formData)
      
      if (!validationResult || Object.values(validationResult).some(field => !field.isValid)) {
        throw new ValidationError(validationResult, 'Form validation failed')
      }
      
      // Call forgot password action
      await forgotPassword(formData.email)
      
      // Show success state
      setIsSuccess(true)
      
      // Success callback
      onSuccess?.(formData.email)
      
    } catch (error) {
      console.error('Forgot password error:', error)
      
      if (error instanceof ValidationError) {
        return
      }
      
      if (error instanceof Error) {
        setServerError(error.message)
      } else {
        setServerError('비밀번호 재설정 요청 중 오류가 발생했습니다.')
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleRetry = () => {
    setIsSuccess(false)
    setFormData({ email: '' })
    setServerError('')
    clearErrors()
  }

  if (isSuccess) {
    return (
      <div className={className}>
        <div className="text-center">
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">
              이메일을 확인하세요
            </h1>
            <p className="text-white/80 mb-4">
              비밀번호 재설정 링크가 다음 이메일로 전송되었습니다:
            </p>
            <p className="text-blue-300 font-medium mb-6">
              {formData.email}
            </p>
            <div className="bg-blue-500/20 border border-blue-500/50 text-blue-200 px-4 py-3 rounded-lg mb-6">
              <p className="text-sm">
                이메일이 보이지 않나요? 스팸 폴더를 확인해보세요.
                링크는 15분 동안 유효합니다.
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button
              type="button"
              variant="gradient"
              size="full"
              onClick={handleRetry}
              className="h-12 text-lg font-semibold"
            >
              다른 이메일로 재전송
            </Button>
            
            <Link href="/login">
              <Button
                type="button"
                variant="outline"
                size="full"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <ArrowLeft size={18} className="mr-2" />
                로그인으로 돌아가기
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

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
          비밀번호 재설정
        </h1>
        <p className="text-white/80">
          가입한 이메일 주소를 입력하시면<br />
          비밀번호 재설정 링크를 보내드립니다.
        </p>
      </div>
      
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
        
        <Input
          label="이메일 주소"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="가입한 이메일 주소를 입력하세요"
          value={formData.email}
          onChange={handleInputChange}
          error={getFieldError('email')}
          disabled={isLoading}
          leftIcon={<Mail size={18} />}
          aria-label="이메일 주소"
          className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
        />

        <Button
          type="submit"
          variant="gradient"
          size="full"
          loading={isLoading}
          disabled={isLoading}
          className="h-12 text-lg font-semibold"
        >
          비밀번호 재설정 링크 전송
        </Button>

        <div className="text-center">
          <Link href="/login">
            <Button
              type="button"
              variant="link"
              className="text-blue-300 hover:text-blue-200"
            >
              <ArrowLeft size={18} className="mr-2" />
              로그인으로 돌아가기
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}