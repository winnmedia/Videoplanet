'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import '@/css/User/Auth.scss'
import { usePasswordReset } from '@/features/auth/hooks/useAuth'

interface ResetPasswordForm {
  email: string
  auth_number: string
  password: string
  password1: string
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const { resetPassword, sendResetEmail, verifyResetCode, loading, error } = usePasswordReset()
  
  const [validEmail, setValidEmail] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [sendCode, setSendCode] = useState(false)
  
  const initial: ResetPasswordForm = {
    email: '',
    auth_number: '',
    password: '',
    password1: '',
  }
  
  const [inputs, setInputs] = useState<ResetPasswordForm>(initial)
  const { email, auth_number, password, password1 } = inputs

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, name } = e.target
    setInputs({
      ...inputs,
      [name]: value,
    })
  }

  const timeoutMessage = () => {
    setTimeout(() => {
      setErrorMessage('')
    }, 3000)
  }

  const handleSendAuthNumber = async () => {
    if (email.length <= 5) return
    
    try {
      setSendCode(true)
      await sendResetEmail(email)
      setTimeout(() => {
        setSendCode(false)
      }, 3000)
    } catch (err: any) {
      setSendCode(false)
      setErrorMessage(err.message || '인증번호 전송에 실패했습니다.')
      timeoutMessage()
    }
  }

  const handleVerifyAuthNumber = async () => {
    if (auth_number.length === 0) return
    
    try {
      await verifyResetCode(email, auth_number)
      setValidEmail(true)
    } catch (err: any) {
      setErrorMessage(err.message || '인증번호가 올바르지 않습니다.')
      timeoutMessage()
      setInputs({ ...inputs, auth_number: '' })
    }
  }

  const handleResetPassword = async () => {
    if (password.length <= 9 || password1.length <= 9) return
    
    if (password !== password1) {
      setErrorMessage('비밀번호가 일치하지 않습니다.')
      timeoutMessage()
      return
    }

    try {
      await resetPassword({
        email,
        password,
        auth_number,
      })
      
      alert('비밀번호를 변경했습니다.')
      router.push('/login')
    } catch (err: any) {
      setErrorMessage(err.message || '비밀번호 변경에 실패했습니다.')
      timeoutMessage()
    }
  }

  const AuthNumberButton = () => {
    return (
      email.length > 5 &&
      !sendCode && (
        <button
          onClick={handleSendAuthNumber}
          className="cert"
          disabled={loading}
        >
          {loading ? '전송 중...' : '인증'}
        </button>
      )
    )
  }

  const ResetButton = () => {
    return (
      password.length > 9 &&
      password1.length > 9 && (
        <button
          onClick={handleResetPassword}
          className="submit mt30"
          disabled={loading}
        >
          {loading ? '처리 중...' : '확인'}
        </button>
      )
    )
  }

  const VerifyButton = () => {
    return (
      auth_number.length > 0 && (
        <button
          onClick={handleVerifyAuthNumber}
          className="submit mt30"
          disabled={loading}
        >
          {loading ? '확인 중...' : '확인'}
        </button>
      )
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <div className="title">비밀번호 찾기</div>
        
        {!validEmail ? (
          <>
            <div className="pr mt50">
              <input
                type="email"
                name="email"
                value={email}
                onChange={onChange}
                placeholder="이메일 입력"
                className="ty01"
                maxLength={50}
                disabled={loading}
              />
              <AuthNumberButton />
            </div>
            
            {sendCode && (
              <div className="pr mt10">
                <input
                  type="text"
                  name="auth_number"
                  value={auth_number}
                  onChange={onChange}
                  placeholder="인증번호 입력"
                  className="ty01"
                  disabled={loading}
                />
              </div>
            )}
            
            {errorMessage && <div className="error">{errorMessage}</div>}
            {error && <div className="error">{error}</div>}
            
            <VerifyButton />
          </>
        ) : (
          <>
            <input
              type="password"
              name="password"
              onChange={onChange}
              value={password}
              placeholder="비밀번호 입력 (최소 10자)"
              className="ty01 mt10"
              maxLength={20}
              disabled={loading}
            />
            <input
              type="password"
              name="password1"
              onChange={onChange}
              value={password1}
              placeholder="새로운 비밀번호 확인"
              className="ty01 mt10"
              maxLength={20}
              disabled={loading}
            />
            {errorMessage && <div className="error">{errorMessage}</div>}
            {error && <div className="error">{error}</div>}
            <ResetButton />
          </>
        )}
      </div>
    </div>
  )
}