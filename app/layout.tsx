import { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import '@/css/Common.scss'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Planet',
  description: '영상 제작 협업 플랫폼',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}