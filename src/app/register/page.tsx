'use client'

import { useRouter } from 'next/navigation'
import { RegisterFormClassic } from '@/features/auth/ui/RegisterFormClassic'
// import { LoginIntro } from '@/widgets/ui/LoginIntro' // TODO: 향후 구현
import styles from '../login/LoginPage.module.scss'

export default function RegisterPage() {
  const router = useRouter()

  const handleSocialLogin = async (provider: 'google' | 'naver' | 'kakao') => {
    try {
      console.log(`Initiating ${provider} registration`)
      
      // Set authentication state for social login
      localStorage.setItem('isAuthenticated', 'true')
      localStorage.setItem('user', JSON.stringify({
        name: `${provider} 사용자`,
        email: `user@${provider}.com`
      }))
      
      // Redirect to dashboard after setting auth state
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } catch (error) {
      console.error(`${provider} registration error:`, error)
    }
  }

  const handleSuccess = () => {
    console.log('Registration successful')
  }

  return (
    <div 
      className={styles.loginPage}
      data-testid="register-page"
    >
      <div className="hidden lg:block">
        <LoginIntro />
      </div>
      <RegisterFormClassic
        onSocialLogin={handleSocialLogin}
        onSuccess={handleSuccess}
      />
    </div>
  )
}