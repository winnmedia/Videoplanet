'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { LoginCredentials } from '@/features/auth/types'
import { authApi } from '@/features/auth/api/authApi'
import { API_BASE_URL } from '@/lib/config'
import logo from '@/assets/images/Common/b_sb_logo.svg'
import './LoginPage.scss'

export default function LoginPage() {
  console.log('[LoginPage] Component function called')
  
  const router = useRouter()
  const [inputs, setInputs] = useState<LoginCredentials>({
    email: '',
    password: '',
  })
  const [loginMessage, setLoginMessage] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [rememberEmail, setRememberEmail] = useState<boolean>(false)
  
  const { email, password } = inputs

  // Component mount test - 저장된 이메일 불러오기
  useEffect(() => {
    console.log('[LoginPage] useEffect executed!')
    console.log('[LoginPage] API_BASE_URL:', API_BASE_URL)
    
    // 저장된 이메일 불러오기
    const savedEmail = localStorage.getItem('rememberedEmail')
    if (savedEmail) {
      setInputs(prev => ({ ...prev, email: savedEmail }))
      setRememberEmail(true)
      console.log('[LoginPage] Loaded saved email:', savedEmail)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, name } = e.target
    console.log(`[LoginPage] Input change: ${name} = ${value}`)
    setInputs({
      ...inputs,
      [name]: value,
    })
  }

  const handleLogin = async () => {
    console.log('[LoginPage] Login button clicked!')
    console.log('[LoginPage] Current inputs:', { email, password: password.length + ' chars' })
    
    // Validation
    if (!email || !email.trim()) {
      setLoginMessage('이메일을 입력해주세요.')
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setLoginMessage('올바른 이메일 형식이 아닙니다.')
      return
    }
    
    if (!password || !password.trim()) {
      setLoginMessage('비밀번호를 입력해주세요.')
      return
    }

    setIsLoading(true)
    setLoginMessage('')
    
    try {
      console.log('[LoginPage] Making API call to:', `${API_BASE_URL}/users/login`)
      const response = await authApi.signIn(inputs)
      console.log('[LoginPage] API response received:', response.status)
      console.log('[LoginPage] API response data:', response.data)
      
      if (response.data && response.data.vridge_session) {
        console.log('[LoginPage] Login successful, saving session')
        
        // localStorage에 저장
        window.localStorage.setItem('VGID', JSON.stringify(response.data.vridge_session))
        
        // 쿠키에도 저장 (미들웨어에서 확인할 수 있도록)
        document.cookie = `VGID=${encodeURIComponent(JSON.stringify(response.data.vridge_session))}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
        console.log('[LoginPage] Session saved to localStorage and cookie')
        
        // 아이디 기억하기 체크박스 처리
        if (rememberEmail) {
          localStorage.setItem('rememberedEmail', email)
          console.log('[LoginPage] Email saved for remember')
        } else {
          localStorage.removeItem('rememberedEmail')
        }
        
        console.log('[LoginPage] Navigating to /dashboard...')
        // window.location.href로 강제 페이지 새로고침과 함께 이동
        window.location.href = '/dashboard'
      } else {
        throw new Error('응답에 세션 정보가 없습니다.')
      }
    } catch (error: any) {
      console.error('[LoginPage] Login error:', error)
      if (error?.response?.data?.message) {
        setLoginMessage(error.response.data.message)
      } else if (error?.response?.status === 401) {
        setLoginMessage('이메일 또는 비밀번호가 일치하지 않습니다.')
      } else if (error?.response?.status === 400) {
        setLoginMessage('입력한 정보를 다시 확인해주세요.')
      } else {
        setLoginMessage('로그인 중 오류가 발생했습니다. 다시 시도해주세요.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }

  console.log('[LoginPage] Rendering with state:', { 
    emailLength: email.length, 
    hasPassword: password.length > 0,
    isLoading,
    hasMessage: !!loginMessage 
  })

  return (
    <div className="login-page-container">
      {/* Left: Intro section */}
      <div className="login-intro">
        <div className="intro-wrap">
          <div className="slogan">
            당신의 창의력에
            <br />
            날개를 달아 줄<br />
            <span>콘텐츠 제작 협업툴</span>
          </div>
          <div className="features">
            <ul>
              <li>
                Connect
                <br /> with each other
              </li>
              <li>
                Easy
                <br /> Feedback
              </li>
              <li>
                Study
                <br /> Together
              </li>
            </ul>
            <div className="tagline">
              vlanet to
              <br /> connection
            </div>
          </div>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="login-form-section">
        <div className="form-wrap">
          <div className="form-logo">
            <Image src={logo} alt="Vlanet Logo" width={60} height={60} />
          </div>
          <div className="form-title">로그인</div>
          
          <input
            type="email"
            name="email"
            placeholder="이메일"
            className="input-field"
            value={email}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            autoComplete="email"
            disabled={isLoading}
          />

          <input
            type="password"
            name="password"
            placeholder="비밀번호"
            className="input-field"
            value={password}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            autoComplete="current-password"
            disabled={isLoading}
          />
          
          {loginMessage && (
            <div className="error-message" role="alert">
              {loginMessage}
            </div>
          )}
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#666',
              whiteSpace: 'nowrap'
            }}>
              아이디저장
              <input
                type="checkbox"
                checked={rememberEmail}
                onChange={(e) => {
                  setRememberEmail(e.target.checked)
                  console.log('[LoginPage] Remember email:', e.target.checked)
                }}
                style={{
                  marginLeft: '6px',
                  cursor: 'pointer'
                }}
              />
            </label>
            
            <button 
              className="forgot-link" 
              onClick={() => {
                console.log('[LoginPage] Reset password clicked')
                window.location.href = '/reset-password'
              }}
              type="button"
              style={{
                padding: 0,
                background: 'none',
                border: 'none',
                color: '#666',
                fontSize: '14px',
                cursor: 'pointer',
                textDecoration: 'underline',
                whiteSpace: 'nowrap'
              }}
            >
              비밀번호 찾기
            </button>
          </div>
          
          <button 
            className={`submit-button ${isLoading ? 'loading' : ''}`}
            onClick={handleLogin}
            disabled={isLoading}
            type="button"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
          
          <div className="signup-link">
            브이래닛이 처음이신가요?{' '}
            <button 
              className="signup-btn"
              onClick={() => {
                console.log('[LoginPage] Signup clicked')
                window.location.href = '/signup'
              }}
              type="button"
            >
              간편 가입하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}