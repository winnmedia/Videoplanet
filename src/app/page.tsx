'use client'

import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useRouter, usePathname } from 'next/navigation'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { refetchProject } from '../utils/util'
import AppRoute from '../routes/AppRoute'

export default function HomePage() {
  const dispatch = useDispatch()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    refetchProject(dispatch, router)
  }, [dispatch, router])

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
      <AppRoute />
    </GoogleOAuthProvider>
  )
}