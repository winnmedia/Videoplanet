'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/shared/ui/Button'
import { useAuthActions } from '@/features/auth'
import { CheckCircle, Mail, RefreshCw, AlertCircle } from 'lucide-react'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { verifyEmail, resendVerificationEmail, isLoading } = useAuthActions()
  
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error' | 'expired'>('pending')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const token = searchParams.get('token')
  const emailParam = searchParams.get('email')

  useEffect(() => {
    // Set email from URL parameter if available
    if (emailParam && !email) {
      setEmail(emailParam)
    }
  }, [emailParam, email])

  useEffect(() => {
    // Start cooldown timer if resend was recently clicked
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  useEffect(() => {
    // If token is present in URL, verify it automatically
    if (token) {
      handleVerifyEmail(token)
    }
  }, [token])

  const handleVerifyEmail = async (verificationToken: string) => {
    try {
      setVerificationStatus('pending')
      
      // Simulate email verification instead of actual API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setVerificationStatus('success')
      setMessage('이메일이 성공적으로 인증되었습니다!')
      
      // Redirect to dashboard since user is already authenticated
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)
    } catch (error) {
      console.error('Email verification error:', error)
      setVerificationStatus('error')
      
      if (error instanceof Error) {
        if (error.message.includes('만료') || error.message.includes('expired')) {
          setVerificationStatus('expired')
          setMessage('인증 링크가 만료되었습니다. 새로운 인증 이메일을 요청해주세요.')
        } else {
          setMessage(error.message)
        }
      } else {
        setMessage('이메일 인증 중 오류가 발생했습니다.')
      }
    }
  }

  const handleResendEmail = async () => {
    if (!email.trim()) {
      setMessage('이메일 주소를 입력해주세요.')
      return
    }

    try {
      // Simulate email resend instead of actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMessage('새로운 인증 이메일이 전송되었습니다. (시뮬레이션)')
      setResendCooldown(60) // 60 second cooldown
    } catch (error) {
      console.error('Resend verification error:', error)
      setMessage(error instanceof Error ? error.message : '이메일 재전송 중 오류가 발생했습니다.')
    }
  }

  const renderContent = () => {
    switch (verificationStatus) {
      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">
              인증 완료!
            </h1>
            <p className="text-white/80 mb-6">
              {message}
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
        )

      case 'error':
      case 'expired':
        return (
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">
              인증 실패
            </h1>
            <p className="text-white/80 mb-6">
              {message}
            </p>
            
            {verificationStatus === 'expired' && (
              <div className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="이메일 주소를 입력하세요"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <Button
                  onClick={handleResendEmail}
                  disabled={isLoading || resendCooldown > 0}
                  variant="gradient"
                  size="full"
                  className="h-12"
                  loading={isLoading}
                >
                  {resendCooldown > 0 
                    ? `${resendCooldown}초 후 재전송 가능` 
                    : '새로운 인증 이메일 전송'}
                </Button>
              </div>
            )}
            
            <div className="mt-6">
              <Link href="/login">
                <Button variant="outline" size="full" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  로그인으로 돌아가기
                </Button>
              </Link>
            </div>
          </div>
        )

      case 'pending':
      default:
        if (token) {
          return (
            <div className="text-center">
              <RefreshCw className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-spin" />
              <h1 className="text-3xl font-bold text-white mb-2">
                이메일 인증 중...
              </h1>
              <p className="text-white/80">
                잠시만 기다려주세요.
              </p>
            </div>
          )
        }

        return (
          <div className="text-center">
            <Mail className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">
              이메일을 확인하세요
            </h1>
            <p className="text-white/80 mb-6">
              회원가입 시 입력한 이메일 주소로 인증 링크가 전송되었습니다.<br />
              이메일의 링크를 클릭하여 계정을 활성화해주세요.
            </p>
            
            <div className="bg-blue-500/20 border border-blue-500/50 text-blue-200 px-4 py-3 rounded-lg mb-6">
              <p className="text-sm">
                이메일이 보이지 않나요? 스팸 폴더를 확인해보세요.<br />
                인증 링크는 24시간 동안 유효합니다.
              </p>
            </div>

            {/* Demo button for email verification simulation */}
            <div className="mb-6">
              <Button
                onClick={() => handleVerifyEmail('demo-token')}
                variant="gradient"
                size="full"
                className="h-12 bg-green-500 hover:bg-green-600"
                disabled={isLoading}
              >
EMAIL VERIFIED (DEMO)
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="이메일 주소를 입력하세요"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <Button
                onClick={handleResendEmail}
                disabled={isLoading || resendCooldown > 0}
                variant="gradient"
                size="full"
                className="h-12"
                loading={isLoading}
              >
                {resendCooldown > 0 
                  ? `${resendCooldown}초 후 재전송 가능` 
                  : '인증 이메일 재전송'}
              </Button>
            </div>

            {message && (
              <div className="mt-4 p-3 bg-green-500/20 border border-green-500/50 text-green-200 rounded-lg">
                <p className="text-sm">{message}</p>
              </div>
            )}

            <div className="mt-6">
              <Link href="/login">
                <Button variant="outline" size="full" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  로그인으로 돌아가기
                </Button>
              </Link>
            </div>
          </div>
        )
    }
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
      {/* Background overlay for better text readability */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Email verification container */}
      <div className="relative z-10 max-w-md w-full">
        <div className="bg-black/30 backdrop-blur-sm border border-white/20 rounded-2xl p-8 shadow-2xl">
          <Link href="/" className="inline-block mb-6 w-full text-center">
            <img 
              src="/images/Common/w_logo.svg" 
              alt="브이래닛 로고" 
              className="h-12 w-auto mx-auto"
            />
          </Link>
          
          {renderContent()}
        </div>
      </div>
    </div>
  )
}