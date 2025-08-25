'use client'

import { useRouter } from 'next/navigation'
import { LoginFormClassic } from '@/features/auth/ui/LoginFormClassic'
import { LoginIntro } from '@/widgets/ui/LoginIntro'
import styles from './LoginPage.module.scss'
export default function LoginPage() {
  const router = useRouter()

  const handleSocialLogin = async (provider: 'google') => {
    try {
      // Implementation will depend on the social provider's SDK
      console.log(`Initiating ${provider} login`)
      
      // Set authentication state for social login
      localStorage.setItem('isAuthenticated', 'true')
      localStorage.setItem('user', JSON.stringify({
        name: `${provider} 사용자`,
        email: `user@${provider}.com`
      }))
      
      // For now, just redirect to dashboard for demo
      // In real implementation, this would handle OAuth flow
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } catch (error) {
      console.error(`${provider} login error:`, error)
    }
  }

  const handleLoginSuccess = () => {
    console.log('Login successful')
  }

  return (
    <div 
      className={styles.loginPage}
      data-testid="login-page"
    >
      <LoginIntro />
      <LoginFormClassic
        onSocialLogin={handleSocialLogin}
        onSuccess={handleLoginSuccess}
      />
    </div>
  )
}