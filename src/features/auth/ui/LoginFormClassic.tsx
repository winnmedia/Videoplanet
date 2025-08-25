'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthActions } from '../model/hooks'
import { Button } from '@/shared/ui/Button/Button'
import styles from './LoginFormClassic.module.scss'

interface LoginFormClassicProps {
  onSocialLogin?: (provider: 'google') => void
  onSuccess?: () => void
  className?: string
}

export function LoginFormClassic({ onSocialLogin, onSuccess, className }: LoginFormClassicProps) {
  const router = useRouter()
  const { login, isLoading } = useAuthActions()
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [rememberMe, setRememberMe] = useState(false)
  const [loginMessage, setLoginMessage] = useState('')
  
  // Load saved email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail')
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }))
      setRememberMe(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginMessage('')
    
    if (formData.email.length === 0) {
      setLoginMessage('아이디를 입력해주세요.')
      return
    }
    
    if (formData.password.length === 0) {
      setLoginMessage('비밀번호를 입력해주세요.')
      return
    }

    try {
      // Save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem('savedEmail', formData.email)
      } else {
        localStorage.removeItem('savedEmail')
      }
      
      // Simulate login instead of API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Set authentication state in localStorage
      localStorage.setItem('isAuthenticated', 'true')
      localStorage.setItem('user', JSON.stringify({
        name: '로그인 사용자',
        email: formData.email
      }))
      
      onSuccess?.()
      router.push('/dashboard')
      
    } catch (error) {
      console.error('Login error:', error)
      setLoginMessage('이메일 또는 비밀번호가 일치하지 않습니다.')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSocialLogin = (provider: 'google') => {
    onSocialLogin?.(provider)
  }

  const handleForgotPassword = () => {
    router.push('/forgot-password')
  }

  const handleSignUp = () => {
    router.push('/register')
  }

  return (
    <div className={`${styles.authForm} ${className || ''}`} data-testid="login-form-panel">
      <div className={styles.formWrap}>
        <div className={styles.title}>로그인</div>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.mt50}>
            <input
              type="email"
              name="email"
              className={`${styles.input} ${styles.ty01}`}
              placeholder="이메일"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isLoading}
              aria-label="이메일"
            />
          </div>

          <div className={styles.mt10}>
            <input
              type="password"
              name="password"
              className={`${styles.input} ${styles.ty01}`}
              placeholder="비밀번호"
              value={formData.password}
              onChange={handleInputChange}
              disabled={isLoading}
              aria-label="비밀번호"
            />
          </div>
          
          <div className={styles.mt10}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className={styles.checkmark}></span>
              <span className={styles.checkboxText}>아이디 저장</span>
            </label>
          </div>
          
          {loginMessage && (
            <div className={styles.error} role="alert" aria-live="polite">
              {loginMessage}
            </div>
          )}
          
          <div className={styles.tr}>
            <Button
              variant="ghost"
              size="small"
              onClick={handleForgotPassword}
              className={styles.findLink}
            >
              비밀번호 찾기
            </Button>
          </div>
          
          <Button
            type="submit"
            variant="primary"
            size="large"
            fullWidth
            loading={isLoading}
            className={styles.mt20}
            icon={isLoading ? undefined : "arrow-right"}
            iconPosition="right"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>
        </form>
        
        <div className={`${styles.mt20} ${styles.signupLink}`}>
          브이래닛이 처음이신가요?{' '}
          <Button
            variant="ghost"
            size="small"
            onClick={handleSignUp}
            className={styles.signupButton}
          >
            간편 가입하기
          </Button>
        </div>
        
        <div className={styles.line}></div>
        
        <div className={styles.snsLogin}>
          <div className={styles.snsButtons}>
            <button
              onClick={() => handleSocialLogin('google')}
              aria-label="구글 로그인"
              data-testid="google-login-button"
              className={styles.googleButton}
              title="구글 로그인"
              disabled={isLoading}
            >
              <span className={styles.googleText}>구글 계정으로 로그인</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}