'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDispatch } from 'react-redux'
import '@/css/User/Auth.scss'

import logo from '@/assets/images/Common/logo.svg'
import { useInvitation } from '@/features/auth/hooks/useAuth'
import { checkSession, refetchProject } from '@/utils/util'

interface EmailCheckPageProps {
  params: {
    token: string
  }
}

export default function EmailCheckPage({ params }: EmailCheckPageProps) {
  const router = useRouter()
  const dispatch = useDispatch()
  const searchParams = useSearchParams()
  const { acceptInvitation, loading, error } = useInvitation()
  
  const uid = searchParams?.get('uid')
  const token = params.token
  
  const [result, setResult] = useState<'loading' | 'success' | 'fail'>('loading')

  useEffect(() => {
    const handleInvitation = async () => {
      if (checkSession()) {
        if (uid && token) {
          try {
            await acceptInvitation({ uid, token })
            setResult('success')
          } catch (err) {
            console.error('Invitation acceptance failed:', err)
            setResult('fail')
          }
        } else {
          setResult('fail')
        }
      } else {
        router.push(`/login?uid=${uid}&token=${token}`)
      }
    }

    handleInvitation()
  }, [uid, token, acceptInvitation, router])

  const handleStartClick = async () => {
    try {
      await refetchProject(dispatch, router)
      router.push('/dashboard')
    } catch (err) {
      console.error('Failed to refetch project data:', err)
      router.push('/dashboard')
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-form bg">
        <div className="emailcheck">
          <div className="logo">
            <img src={logo.src} alt="Vlanet Logo" />
          </div>
          
          {result === 'success' ? (
            <>
              <div className="ment">
                안녕하세요, <br />
                <span className="en">vlanet</span>를 함께 사용하도록
                초대받으셨습니다.
              </div>
              <button
                onClick={handleStartClick}
                className="submit"
                disabled={loading}
              >
                {loading ? '로딩 중...' : '시작하기'}
              </button>
            </>
          ) : result === 'fail' ? (
            <div className="ment">
              죄송합니다,
              <br />
              계정 이메일과 초대받은 이메일이
              <br />
              <span className="un">일치하지 않습니다.</span>
            </div>
          ) : (
            <div className="ment">
              {loading ? '이메일 확인중...' : '처리 중...'}
            </div>
          )}
          
          {error && (
            <div className="error mt20">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}