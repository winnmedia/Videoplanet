'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TestPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Set authentication
    localStorage.setItem('isAuthenticated', 'true')
    localStorage.setItem('user', JSON.stringify({
      id: 1,
      name: 'Test User',
      email: 'test@example.com'
    }))
    
    // Redirect to planning page
    setTimeout(() => {
      router.push('/planning')
    }, 1000)
  }, [router])
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Setting up test environment...</h1>
      <p>Redirecting to Planning page in 1 second...</p>
    </div>
  )
}