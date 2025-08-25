'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { useFormValidation, formSchemas, ValidationError } from '@/shared/lib/validation'
import { useAuthActions } from '@/features/auth'
import { getPasswordStrength } from '@/shared/lib/utils'
import { Lock, CheckCircle, AlertCircle } from 'lucide-react'

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

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { resetPassword, isLoading } = useAuthActions()
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [serverError, setServerError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidToken, setIsValidToken] = useState(true)

  const token = searchParams.get('token')

  // Dynamic validation schema with password confirmation
  const validationSchema = {
    password: formSchemas.register.password,
    confirmPassword: [
      ...formSchemas.register.confirmPassword,
      // Override with current password for confirmation
    ]
  }

  const { validateForm, getFieldError, clearErrors } = useFormValidation(validationSchema)

  useEffect(() => {
    // Check if token is present
    if (!token) {
      setIsValidToken(false)
      setServerError('비밀번호 재설정 토큰이 없습니다.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      setServerError('비밀번호 재설정 토큰이 없습니다.')
      return
    }

    setServerError('')
    clearErrors()
    
    try {
      // Check password confirmation
      if (formData.password !== formData.confirmPassword) {
        setServerError('비밀번호가 일치하지 않습니다.')
        return
      }

      // Client-side validation
      const validationResult = validateForm(formData)
      
      if (!validationResult || Object.values(validationResult).some(field => !field.isValid)) {
        throw new ValidationError(validationResult, 'Form validation failed')
      }
      
      // Call reset password action
      await resetPassword(token, formData.password)
      
      // Show success state
      setIsSuccess(true)
      
      // Redirect to dashboard after successful reset
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)
      
    } catch (error) {
      console.error('Reset password error:', error)
      
      if (error instanceof ValidationError) {
        return
      }
      
      if (error instanceof Error) {
        if (error.message.includes('만료') || error.message.includes('유효하지 않습니다')) {
          setIsValidToken(false)
        }
        setServerError(error.message)
      } else {
        setServerError('비밀번호 재설정 중 오류가 발생했습니다.')
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

  if (isSuccess) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
        style={{
          backgroundImage: 'url(/images/User/login_bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        
        <div className="relative z-10 max-w-md w-full">
          <div className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-2xl text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">
              비밀번호 재설정 완료!
            </h1>
            <p className="text-white/80 mb-4">
              비밀번호가 성공적으로 변경되었습니다.
            </p>
            <p className="text-blue-300 text-sm mb-6">
              3초 후 대시보드로 이동합니다...
            </p>
            <Link href="/dashboard">
              <Button variant="gradient" size="full" className="h-12">
                대시보드로 이동
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
        style={{
          backgroundImage: 'url(/images/User/login_bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        
        <div className="relative z-10 max-w-md w-full">
          <div className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-2xl text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">
              유효하지 않은 링크
            </h1>
            <p className="text-white/80 mb-6">
              비밀번호 재설정 링크가 만료되었거나 유효하지 않습니다.
              새로운 비밀번호 재설정을 요청해주세요.
            </p>
            
            <div className="space-y-3">
              <Link href="/forgot-password">
                <Button variant="gradient" size="full" className="h-12">
                  비밀번호 재설정 요청
                </Button>
              </Link>
              
              <Link href="/login">
                <Button variant="outline" size="full" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  로그인으로 돌아가기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: 'url(/images/User/login_bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      
      <div className="relative z-10 max-w-md w-full">
        <div className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-6">
              <img 
                src="/images/Common/w_logo.svg" 
                alt="브이래닛 로고" 
                className="h-12 w-auto mx-auto"
              />
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">
              새 비밀번호 설정
            </h1>
            <p className="text-white/80">
              새로운 비밀번호를 입력해주세요.
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
            
            <div>
              <Input
                label="새 비밀번호"
                type="password"
                name="password"
                autoComplete="new-password"
                placeholder="새 비밀번호를 입력하세요"
                value={formData.password}
                onChange={handleInputChange}
                error={getFieldError('password')}
                disabled={isLoading}
                leftIcon={<Lock size={18} />}
                showPasswordToggle
                aria-label="새 비밀번호"
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

            <Button
              type="submit"
              variant="gradient"
              size="full"
              loading={isLoading}
              disabled={isLoading}
              className="h-12 text-lg font-semibold"
            >
              비밀번호 재설정
            </Button>

            <div className="text-center">
              <Link href="/login">
                <Button
                  type="button"
                  variant="link"
                  className="text-blue-300 hover:text-blue-200"
                >
                  로그인으로 돌아가기
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}