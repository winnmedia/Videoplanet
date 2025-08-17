'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { authApi } from '@/features/auth/api/authApi'
import logo from '@/assets/images/Common/b_sb_logo.svg'
import '../login/LoginPage.scss'

interface ResetPasswordForm {
  email: string
  auth_number: string
  password: string
  password1: string
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [validEmail, setValidEmail] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  
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

  // 비밀번호 재설정 인증번호 발송
  const handleSendAuthNumber = async () => {
    if (!email || !email.trim()) {
      setErrorMessage('이메일을 입력해주세요.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setErrorMessage('올바른 이메일 형식이 아닙니다.')
      return
    }

    setIsLoading(true)
    try {
      await authApi.sendAuthNumber({ email }, 'password_reset')
      setEmailSent(true)
      setSuccessMessage('인증번호가 이메일로 발송되었습니다.')
      setErrorMessage('')
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || '인증번호 발송에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 인증번호 확인
  const handleVerifyEmail = async () => {
    if (!auth_number || !auth_number.trim()) {
      setErrorMessage('인증번호를 입력해주세요.')
      return
    }

    setIsLoading(true)
    try {
      await authApi.verifyEmail({ email, auth_number }, 'password_reset')
      setValidEmail(true)
      setSuccessMessage('이메일 인증이 완료되었습니다. 새 비밀번호를 입력해주세요.')
      setErrorMessage('')
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || '인증번호가 일치하지 않습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 비밀번호 재설정
  const handleResetPassword = async () => {
    // 유효성 검사
    if (!password || password.length < 10) {
      setErrorMessage('비밀번호는 최소 10자 이상이어야 합니다.')
      return
    }

    if (password !== password1) {
      setErrorMessage('비밀번호가 일치하지 않습니다.')
      return
    }

    setIsLoading(true)
    try {
      await authApi.resetPassword({
        email,
        password,
        auth_number
      })
      
      alert('비밀번호가 재설정되었습니다. 로그인 페이지로 이동합니다.')
      router.push('/login')
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || '비밀번호 재설정에 실패했습니다.')
    } finally {
      setIsLoading(false)
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

      {/* 오른쪽: 비밀번호 재설정 폼 */}
      <div className="login-form-section">
        <div className="form-wrap">
          <div className="form-logo">
            <Image src={logo} alt="Vlanet Logo" width={60} height={60} />
          </div>
          <div className="form-title">비밀번호 찾기</div>
          
          {!validEmail ? (
            <>
              {/* 이메일 인증 단계 */}
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={onChange}
                  placeholder="가입하신 이메일"
                  className="input-field"
                  disabled={emailSent || isLoading}
                />
                {!emailSent && (
                  <button
                    onClick={handleSendAuthNumber}
                    disabled={isLoading}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      padding: '8px 16px',
                      backgroundColor: '#1631F8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      opacity: isLoading ? 0.7 : 1
                    }}
                  >
                    {isLoading ? '발송중...' : '인증번호 발송'}
                  </button>
                )}
              </div>

              {emailSent && (
                <>
                  <div style={{ position: 'relative', marginTop: '10px' }}>
                    <input
                      type="text"
                      name="auth_number"
                      value={auth_number}
                      onChange={onChange}
                      placeholder="인증번호 입력"
                      className="input-field"
                      disabled={isLoading}
                    />
                    <button
                      onClick={handleVerifyEmail}
                      disabled={isLoading}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        padding: '8px 16px',
                        backgroundColor: '#1631F8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        opacity: isLoading ? 0.7 : 1
                      }}
                    >
                      {isLoading ? '확인중...' : '인증번호 확인'}
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {/* 새 비밀번호 입력 단계 */}
              <input
                type="password"
                name="password"
                value={password}
                onChange={onChange}
                placeholder="새 비밀번호 (최소 10자)"
                className="input-field"
                maxLength={20}
                disabled={isLoading}
              />
              
              <input
                type="password"
                name="password1"
                value={password1}
                onChange={onChange}
                placeholder="새 비밀번호 확인"
                className="input-field"
                maxLength={20}
                disabled={isLoading}
              />
              
              <button
                className={`submit-button ${isLoading ? 'loading' : ''}`}
                onClick={handleResetPassword}
                disabled={isLoading}
                type="button"
              >
                {isLoading ? '재설정 중...' : '비밀번호 재설정'}
              </button>
            </>
          )}
          
          {errorMessage && (
            <div className="error-message" role="alert">
              {errorMessage}
            </div>
          )}
          
          {successMessage && (
            <div style={{ color: '#28a745', fontSize: '14px', marginTop: '10px', textAlign: 'center' }}>
              {successMessage}
            </div>
          )}
          
          <div className="signup-link">
            계정이 기억나셨나요?{' '}
            <button 
              className="signup-btn"
              onClick={() => router.push('/login')}
              type="button"
            >
              로그인으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}