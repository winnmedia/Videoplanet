import type { ReactNode } from 'react'
// SCSS import removed temporarily for build compatibility

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        {children}
      </div>
    </div>
  )
}