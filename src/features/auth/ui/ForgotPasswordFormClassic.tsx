'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthActions } from '../model/hooks'
import styles from './LoginFormClassic.module.scss'

interface ForgotPasswordFormClassicProps {
  onSuccess?: () => void
  className?: string
}

export function ForgotPasswordFormClassic({ onSuccess, className }: ForgotPasswordFormClassicProps) {
  const router = useRouter()
  const { isLoading } = useAuthActions()
  
  const [formData, setFormData] = useState({
    email: ''
  })
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    
    if (formData.email.length === 0) {
      setMessage('이메일을 입력해주세요.')
      return
    }

    try {
      // Simulate password reset email
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setMessage('비밀번호 재설정 링크를 이메일로 발송했습니다.')
      onSuccess?.()
      
    } catch (error) {
      console.error('Password reset error:', error)
      setMessage('오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleBackToLogin = () => {
    router.push('/login')
  }

  return (
    <div className={`${styles.authForm} ${className || ''}`} data-testid="forgot-password-form-panel">
      <div className={styles.formWrap}>
        <div className={styles.title}>비밀번호 찾기</div>
        
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="이메일"
            className={`${styles.input} ${styles.ty01} ${styles.mt50}`}
            value={formData.email}
            onChange={handleInputChange}
            disabled={isLoading}
            aria-label="이메일"
          />
          
          {message && (
            <div className={message.includes('발송했습니다') ? styles.success : styles.error} role="alert" aria-live="polite">
              {message}
            </div>
          )}
          
          <button 
            className={`${styles.submit} ${styles.mt20}`} 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? '발송 중...' : '재설정 링크 발송'}
          </button>
        </form>
        
        <div className={`${styles.mt20} ${styles.signupLink}`}>
          로그인 페이지로{' '}
          <span 
            onClick={handleBackToLogin}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleBackToLogin()}
          >
            돌아가기
          </span>
        </div>
      </div>
    </div>
  )
}