'use client'

import React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Checkbox } from '@/shared/ui/Checkbox'
import { useFormValidation, formSchemas, ValidationError } from '@/shared/lib/validation'
import { useAuthActions } from '../model/hooks'
import { Mail, Lock, Chrome, MessageCircle } from 'lucide-react'

interface LoginFormProps {
  onSocialLogin?: (provider: 'google' | 'naver' | 'kakao') => void
  onSuccess?: () => void
  className?: string
}

export function LoginForm({ onSocialLogin, onSuccess, className }: LoginFormProps) {
  const router = useRouter()
  const { login, isLoading } = useAuthActions()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [serverError, setServerError] = useState('')

  const { validateForm, getFieldError, clearErrors } = useFormValidation(formSchemas.login)

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
      
      // Call login action
      await login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe
      })
      
      // Success callback
      onSuccess?.()
      
      // Redirect to dashboard
      router.push('/dashboard')
      
    } catch (error) {
      console.error('Login error:', error)
      
      if (error instanceof ValidationError) {
        // Validation errors are handled by the form validation hook
        return
      }
      
      // Handle API errors
      if (error instanceof Error) {
        setServerError(error.message)
      } else {
        setServerError('로그인 중 오류가 발생했습니다.')
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

  const handleSocialLogin = (provider: 'google' | 'naver' | 'kakao') => {
    onSocialLogin?.(provider)
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
          계정에 로그인
        </h1>
        <p className="text-white/80">
          아직 계정이 없으신가요?{' '}
          <Link href="/register" className="font-medium text-blue-300 hover:text-blue-200 underline">
            회원가입
          </Link>
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
        
        <div className="space-y-4">
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
          
          <Input
            label="비밀번호"
            type="password"
            name="password"
            autoComplete="current-password"
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
        </div>

        <div className="flex items-center justify-between">
          <Checkbox
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleInputChange}
            label="로그인 상태 유지"
            className="text-white"
          />

          <Link 
            href="/forgot-password" 
            className="text-sm font-medium text-blue-300 hover:text-blue-200 underline"
          >
            비밀번호를 잊으셨나요?
          </Link>
        </div>

        <Button
          type="submit"
          variant="gradient"
          size="full"
          loading={isLoading}
          disabled={isLoading}
          className="h-12 text-lg font-semibold"
        >
          로그인
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-transparent text-white/80">또는</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Button
            type="button"
            variant="social"
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            aria-label="Google로 로그인"
          >
            <img 
              className="h-5 w-5" 
              src="/images/User/google_icon.svg" 
              alt="Google"
            />
          </Button>

          <Button
            type="button"
            variant="social"
            onClick={() => handleSocialLogin('naver')}
            disabled={isLoading}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            aria-label="네이버로 로그인"
          >
            <img 
              className="h-5 w-5" 
              src="/images/User/naver_icon.svg" 
              alt="Naver"
            />
          </Button>

          <Button
            type="button"
            variant="social"
            onClick={() => handleSocialLogin('kakao')}
            disabled={isLoading}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            aria-label="카카오로 로그인"
          >
            <img 
              className="h-5 w-5" 
              src="/images/User/kakao_icon.svg" 
              alt="Kakao"
            />
          </Button>
        </div>
      </form>
    </div>
  )
}