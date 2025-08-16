import { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | Vlanet',
    default: 'Vlanet - 영상 콘텐츠 협업 플랫폼',
  },
  description: '영상 콘텐츠 협업의 신세계, 브이래닛으로 당장 이주하세요! 쉽고 정확한 영상 피드백, 프로젝트 관리, 라이브 코멘트까지 한 번에.',
  keywords: ['영상 편집', '콘텐츠 제작', '협업 도구', '피드백', '프로젝트 관리', '브이래닛', 'vlanet'],
  authors: [{ name: '윈앤미디어' }],
  creator: '윈앤미디어',
  publisher: '윈앤미디어',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://vlanet.co.kr',
    siteName: 'Vlanet',
    title: 'Vlanet - 영상 콘텐츠 협업 플랫폼',
    description: '영상 콘텐츠 협업의 신세계, 브이래닛으로 당장 이주하세요!',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Vlanet - 영상 콘텐츠 협업 플랫폼',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vlanet - 영상 콘텐츠 협업 플랫폼',
    description: '영상 콘텐츠 협업의 신세계, 브이래닛으로 당장 이주하세요!',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}