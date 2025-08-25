'use client'

import { useRouter } from 'next/navigation'
import { ForgotPasswordFormClassic } from '@/features/auth/ui/ForgotPasswordFormClassic'
// import { LoginIntro } from '@/widgets/ui/LoginIntro' // TODO: 향후 구현
import styles from '../login/LoginPage.module.scss'

export default function ForgotPasswordPage() {
  const router = useRouter()

  const handleSuccess = () => {
    console.log('Password reset email sent successfully')
  }

  return (
    <div 
      className={styles.loginPage}
      data-testid="forgot-password-page"
    >
      <div className="hidden lg:block">
        <LoginIntro />
      </div>
      <ForgotPasswordFormClassic
        onSuccess={handleSuccess}
      />
    </div>
  )
}