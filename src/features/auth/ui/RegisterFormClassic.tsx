'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthActions } from '../model/hooks'
import styles from './LoginFormClassic.module.scss'

interface RegisterFormClassicProps {
  onSocialLogin?: (provider: 'google' | 'naver' | 'kakao') => void
  onSuccess?: () => void
  className?: string
}

export function RegisterFormClassic({ onSocialLogin, onSuccess, className }: RegisterFormClassicProps) {
  const router = useRouter()
  const { isLoading } = useAuthActions()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    
    if (formData.name.length === 0) {
      setMessage('이름을 입력해주세요.')
      return
    }
    
    if (formData.email.length === 0) {
      setMessage('이메일을 입력해주세요.')
      return
    }
    
    if (formData.password.length === 0) {
      setMessage('비밀번호를 입력해주세요.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage('비밀번호가 일치하지 않습니다.')
      return
    }

    try {
      // Simulate registration instead of API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Set authentication state in localStorage
      localStorage.setItem('isAuthenticated', 'true')
      localStorage.setItem('user', JSON.stringify({
        name: formData.name,
        email: formData.email
      }))
      
      // Show success message first
      setMessage('회원가입이 완료되었습니다! 대시보드로 이동합니다.')
      
      // Redirect to email verification page for proper flow
      setTimeout(() => {
        router.push('/verify-email?email=' + encodeURIComponent(formData.email))
      }, 1500)
      
      onSuccess?.()
      
    } catch (error) {
      console.error('Registration error:', error)
      setMessage('회원가입 중 오류가 발생했습니다.')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSocialLogin = (provider: 'google' | 'naver' | 'kakao') => {
    onSocialLogin?.(provider)
  }

  const handleLogin = () => {
    router.push('/login')
  }

  return (
    <div className={`${styles.authForm} ${className || ''}`} data-testid="register-form-panel">
      <div className={styles.formWrap}>
        <div className={styles.title}>회원가입</div>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="이름"
            className={`${styles.input} ${styles.ty01} ${styles.mt50}`}
            value={formData.name}
            onChange={handleInputChange}
            disabled={isLoading}
            aria-label="이름"
          />

          <input
            type="email"
            name="email"
            placeholder="이메일"
            className={`${styles.input} ${styles.ty01} ${styles.mt10}`}
            value={formData.email}
            onChange={handleInputChange}
            disabled={isLoading}
            aria-label="이메일"
          />

          <input
            type="password"
            name="password"
            placeholder="비밀번호"
            className={`${styles.input} ${styles.ty01} ${styles.mt10}`}
            value={formData.password}
            onChange={handleInputChange}
            disabled={isLoading}
            aria-label="비밀번호"
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="비밀번호 확인"
            className={`${styles.input} ${styles.ty01} ${styles.mt10}`}
            value={formData.confirmPassword}
            onChange={handleInputChange}
            disabled={isLoading}
            aria-label="비밀번호 확인"
          />
          
          {message && (
            <div className={message.includes('완료되었습니다') ? styles.success : styles.error} role="alert" aria-live="polite">
              {message}
            </div>
          )}
          
          <button 
            className={`${styles.submit} ${styles.mt20}`} 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? '가입 중...' : '가입하기'}
          </button>
        </form>
        
        <div className={`${styles.mt20} ${styles.signupLink}`}>
          이미 계정이 있으신가요?{' '}
          <span 
            onClick={handleLogin}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          >
            로그인하기
          </span>
        </div>
        
        <div className={styles.line}></div>
        
        <div className={styles.snsLogin}>
          <ul>
            <li 
              className={styles.kakao}
              onClick={() => handleSocialLogin('kakao')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleSocialLogin('kakao')}
              aria-label="카카오 회원가입"
              data-testid="kakao-register-button"
            >
              카카오 회원가입
            </li>
            <li 
              className={styles.google}
              onClick={() => handleSocialLogin('google')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleSocialLogin('google')}
              aria-label="구글 회원가입"
              data-testid="google-register-button"
            >
              구글 회원가입
            </li>
            <li 
              className={styles.naver}
              onClick={() => handleSocialLogin('naver')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleSocialLogin('naver')}
              aria-label="네이버 회원가입"
              data-testid="naver-register-button"
            >
              네이버 회원가입
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}