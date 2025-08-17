'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import queryString from 'query-string'
import Image from 'next/image'
import type { LoginCredentials, EmailVerificationParams } from '@/features/auth/types'
// useAuth import removed to prevent circular dependency
import { authApi } from '@/features/auth/api/authApi'
import { API_BASE_URL } from '@/lib/config'
import { checkSession, refetchProject } from '@/utils/util'
import logo from '@/assets/images/Common/b_sb_logo.svg'
import wLogo from '@/assets/images/Common/w_logo.svg'
import './AuthForm.scss'
import './LoginPage.scss'

function LoginPageContent() {
  const dispatch = useDispatch()
  const router = useRouter()
  // Direct API call instead of useAuth hook to prevent circular dependency
  
  const initialInput: LoginCredentials = {
    email: '',
    password: '',
  }
  
  const [inputs, setInputs] = useState<LoginCredentials>(initialInput)
  const [loginMessage, setLoginMessage] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [inviteParams, setInviteParams] = useState<EmailVerificationParams | null>(null)
  
  const { email, password } = inputs
  
  // URL 파라미터 처리
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const uid = params.get('uid')
      const token = params.get('token')
      if (uid && token) {
        setInviteParams({ uid, token })
      }
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, name } = e.target
    setInputs({
      ...inputs,
      [name]: value,
    })
  }

  // 세션 체크 및 리다이렉트
  useEffect(() => {
    try {
      console.log('[Login] Checking session...')
      const session = checkSession()
      console.log('[Login] Session status:', !!session)
      
      if (session) {
        console.log('[Login] Session found, redirecting...')
        if (inviteParams) {
          console.log('[Login] Redirecting to email-check with params:', inviteParams)
          router.push(`/email-check?uid=${inviteParams.uid}&token=${inviteParams.token}`)
        } else {
          console.log('[Login] Redirecting to dashboard')
          router.push('/dashboard')
        }
      } else {
        console.log('[Login] No session found, staying on login page')
      }
    } catch (error) {
      console.error('[Login] Error during session check:', error)
    }
  }, [inviteParams, router])

  // 로그인 성공 처리
  const handleLoginSuccess = (jwt: string) => {
    console.log('[Login] 로그인 성공, JWT 저장')
    window.localStorage.setItem('VGID', JSON.stringify(jwt))
    
    console.log('[Login] 프로젝트 목록 가져오기 시작')
    refetchProject(dispatch, router)
    
    if (inviteParams) {
      // 초대 링크 처리 페이지로 이동
      console.log('[Login] 초대 링크 파라미터 있음, email-check로 이동')
      router.push(`/email-check?uid=${inviteParams.uid}&token=${inviteParams.token}`)
    } else {
      console.log('[Login] 대시보드로 이동')
      router.push('/dashboard')
    }
  }

  // 로그인 에러 처리
  const handleLoginError = (error: any) => {
    console.error('Login error:', error)
    if (error?.response?.data?.message) {
      setLoginMessage(error.response.data.message)
    } else {
      setLoginMessage('이메일 또는 비밀번호가 일치하지 않습니다.')
    }
  }

  // 로그인 처리
  const handleLogin = async () => {
    console.log('[Login] 로그인 버튼 클릭됨', { email, hasPassword: !!password })
    
    // 입력 검증
    if (!email.trim()) {
      setLoginMessage('이메일을 입력해주세요.')
      console.log('[Login] 이메일 입력 필요')
      return
    }
    
    if (!password.trim()) {
      setLoginMessage('비밀번호를 입력해주세요.')
      console.log('[Login] 비밀번호 입력 필요')
      return
    }

    setIsLoading(true)
    setLoginMessage('')
    console.log('[Login] API 호출 시작:', API_BASE_URL)
    
    try {
      const response = await authApi.signIn(inputs)
      console.log('[Login] API 응답 성공:', response.status)
      handleLoginSuccess(response.data.vridge_session)
    } catch (error) {
      console.error('[Login] API 호출 오류:', error)
      handleLoginError(error)
    } finally {
      setIsLoading(false)
    }
  }

  // Enter 키 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }

  return (
    <div className="login-page-container">
      {/* 왼쪽: 인트로 섹션 */}
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

      {/* 오른쪽: 로그인 폼 */}
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
            <div className="error-message" role="alert" aria-live="polite">
              {loginMessage}
            </div>
          )}
          
          <button 
            className="forgot-link" 
            onClick={(e) => {
              e.preventDefault()
              console.log('[Login] 비밀번호 찾기 클릭')
              console.log('[Debug] localStorage VGID:', localStorage.getItem('VGID'))
              
              // localStorage 토큰 제거 후 이동
              localStorage.removeItem('VGID')
              console.log('[Debug] VGID 제거 후 이동 시도')
              
              // window.location.href로 직접 이동
              window.location.href = '/reset-password'
            }}
            type="button"
          >
            비밀번호 찾기
          </button>
          
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
              onClick={(e) => {
                e.preventDefault()
                console.log('[Login] 회원가입 버튼 클릭됨')
                console.log('[Debug] localStorage VGID:', localStorage.getItem('VGID'))
                console.log('[Debug] 현재 URL:', window.location.href)
                
                // localStorage 토큰 제거 후 이동
                localStorage.removeItem('VGID')
                console.log('[Debug] VGID 제거 후 이동 시도')
                
                // window.location.href로 직접 이동
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

export default function LoginPage() {
  console.log('[Login] LoginPage component rendered')
  
  return <LoginPageContent />
}