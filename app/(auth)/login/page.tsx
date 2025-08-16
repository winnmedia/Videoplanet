'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDispatch } from 'react-redux'
import queryString from 'query-string'
import Image from 'next/image'
import type { LoginCredentials, EmailVerificationParams } from '@/features/auth/types'
// useAuth import removed to prevent circular dependency
import { authApi } from '@/features/auth/api/authApi'
import { checkSession, refetchProject } from '@/utils/util'
import logo from '@/assets/images/Common/vlanet-logo.svg'
import './AuthForm.scss'

function LoginPageContent() {
  const dispatch = useDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()
  // Direct API call instead of useAuth hook to prevent circular dependency
  
  const initialInput: LoginCredentials = {
    email: '',
    password: '',
  }
  
  const [inputs, setInputs] = useState<LoginCredentials>(initialInput)
  const [loginMessage, setLoginMessage] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  
  const { email, password } = inputs
  
  // URL 파라미터에서 초대 링크 정보 추출
  const uid = searchParams?.get('uid')
  const token = searchParams?.get('token')
  const inviteParams: EmailVerificationParams | null = 
    uid && token ? { uid, token } : null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, name } = e.target
    setInputs({
      ...inputs,
      [name]: value,
    })
  }

  // 세션 체크 및 리다이렉트
  useEffect(() => {
    const session = checkSession()
    if (session) {
      if (inviteParams) {
        router.push(`/email-check?uid=${inviteParams.uid}&token=${inviteParams.token}`)
      } else {
        router.push('/dashboard')
      }
    }
  }, [inviteParams, router])

  // 로그인 성공 처리
  const handleLoginSuccess = (jwt: string) => {
    window.localStorage.setItem('VGID', JSON.stringify(jwt))
    refetchProject(dispatch, router)
    
    if (inviteParams) {
      // 초대 링크 처리 페이지로 이동
      router.push(`/email-check?uid=${inviteParams.uid}&token=${inviteParams.token}`)
    } else {
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
    // 입력 검증
    if (!email.trim()) {
      setLoginMessage('이메일을 입력해주세요.')
      return
    }
    
    if (!password.trim()) {
      setLoginMessage('비밀번호를 입력해주세요.')
      return
    }

    setIsLoading(true)
    setLoginMessage('')
    
    try {
      const response = await authApi.signIn(inputs)
      handleLoginSuccess(response.data.vridge_session)
    } catch (error) {
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
    <div className="Auth_Form">
      <div className="form_wrap">
        <div className="logo">
          <Image src={logo} alt="Vlanet Logo" width={150} height={50} />
        </div>
        <div className="title">로그인</div>
        
        <input
          type="email"
          name="email"
          placeholder="이메일"
          className="ty01 mt50"
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
          className="ty01 mt10"
          value={password}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          autoComplete="current-password"
          disabled={isLoading}
        />
        
        {loginMessage && (
          <div className="error" role="alert" aria-live="polite">
            {loginMessage}
          </div>
        )}
        
        <div 
          className="find_link tr" 
          onClick={() => router.push('/reset-password')}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              router.push('/reset-password')
            }
          }}
        >
          비밀번호 찾기
        </div>
        
        <button 
          className={`submit mt20 ${isLoading ? 'loading' : ''}`}
          onClick={handleLogin}
          disabled={isLoading}
          type="button"
        >
          {isLoading ? '로그인 중...' : '로그인'}
        </button>
        
        <div className="mt20 signup_link">
          브이릿지가 처음이신가요?{' '}
          <span 
            onClick={() => router.push('/signup')}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                router.push('/signup')
              }
            }}
          >
            간편 가입하기
          </span>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="Auth_Form">
        <div className="form_wrap">
          <div className="title">로그인</div>
          <div style={{textAlign: 'center', padding: '50px 0'}}>
            로딩 중...
          </div>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}