import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'
import { WebVitalsReporter } from '@/shared/ui/WebVitalsReporter'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '브이래닛 - Project Feedback Platform',
  description: 'Professional video project feedback and collaboration platform',
  keywords: ['video feedback', 'project management', 'collaboration'],
  authors: [{ name: '브이래닛 Team' }],
  robots: 'index, follow',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers>
            <WebVitalsReporter />
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}