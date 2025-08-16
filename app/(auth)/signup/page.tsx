'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import './Signup.scss'

interface SignupFormData {
  email: string
  auth_number: string
  nickname: string
  password: string
  password1: string
}

export default function Signup() {
  const router = useRouter()
  const [validEmail, setValidEmail] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const initial: SignupFormData = {
    email: '',
    auth_number: '',
    nickname: '',
    password: '',
    password1: '',
  }
  
  const [inputs, setInputs] = useState<SignupFormData>(initial)
  const { email, auth_number, nickname, password, password1 } = inputs

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, name } = e.target
    setInputs({
      ...inputs,
      [name]: value,
    })
  }

  // 에러 메시지 자동 삭제
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage('')
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [errorMessage])

  const handleSignUp = async () => {
    if (password !== password1) {
      setErrorMessage('비밀번호가 일치하지 않습니다.')
      return
    }

    if (nickname.length < 2) {
      setErrorMessage('닉네임은 최소 2자 이상 입력해주세요.')
      return
    }

    if (password.length < 10) {
      setErrorMessage('비밀번호는 최소 10자 이상 입력해주세요.')
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      // 임시로 성공 처리
      alert('회원가입이 완료되었습니다!')
      router.replace('/dashboard')
    } catch (err: any) {
      setErrorMessage('회원가입 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const SignUpBtn = () => {
    const isFormValid = nickname.length > 1 && 
                       password.length > 9 && 
                       password1.length > 9

    return isFormValid ? (
      <button
        onClick={handleSignUp}
        disabled={isLoading}
        className="submit mt30"
        aria-label="회원가입 완료"
      >
        {isLoading ? '처리중...' : 'Sign Up'}
      </button>
    ) : null
  }

  return (
    <div className="auth-container">
      <div className="Auth_Form">
        <div className="form_wrap">
          <div className="title">SIGN UP</div>
          {!validEmail ? (
            <div className="email-auth">
              <div className="pr mt50">
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={onChange}
                  placeholder="이메일 입력"
                  className="ty01"
                  maxLength={50}
                  aria-label="이메일"
                  autoComplete="email"
                />
                <button
                  onClick={() => setValidEmail(true)}
                  className="cert"
                  aria-label="이메일 인증 (데모용)"
                >
                  인증
                </button>
              </div>
            </div>
          ) : (
            <>
              <input
                type="text"
                name="nickname"
                value={nickname}
                onChange={onChange}
                placeholder="닉네임 입력 (최소 2자)"
                className="ty01 mt50"
                maxLength={10}
                aria-label="닉네임"
                autoComplete="username"
              />
              <input
                type="password"
                name="password"
                value={password}
                onChange={onChange}
                placeholder="비밀번호 입력 (최소 10자)"
                className="ty01 mt10"
                maxLength={20}
                aria-label="비밀번호"
                autoComplete="new-password"
              />
              <input
                type="password"
                name="password1"
                value={password1}
                onChange={onChange}
                placeholder="비밀번호 확인"
                className="ty01 mt10"
                maxLength={20}
                aria-label="비밀번호 확인"
                autoComplete="new-password"
              />
              {errorMessage && (
                <div className="error" role="alert" aria-live="polite">
                  {errorMessage}
                </div>
              )}
              <SignUpBtn />
            </>
          )}
        </div>
      </div>
    </div>
  )
}