import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ReduxProvider from '@/providers/ReduxProvider'
import '@/Common.scss'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vlanet - 영상 콘텐츠 협업의 신세계',
  description: '쉽고 정확한 영상 피드백 툴, 한 눈에 파악할 수 있는 프로젝트 진행 단계, 다양한 문서 양식으로 영상 제작 전문성 UP!',
  keywords: '영상제작, 피드백, 프로젝트관리, 협업툴, 영상편집',
  authors: [{ name: '윈앤미디어' }],
  openGraph: {
    title: 'Vlanet - 영상 콘텐츠 협업의 신세계',
    description: '쉽고 정확한 영상 피드백 툴, 한 눈에 파악할 수 있는 프로젝트 진행 단계',
    type: 'website',
    locale: 'ko_KR',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <ReduxProvider>
          {children}
        </ReduxProvider>
      </body>
    </html>
  )
}