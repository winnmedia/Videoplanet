import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '이용약관',
  description: 'Vlanet 서비스 이용약관을 확인하세요. 안전하고 올바른 서비스 이용을 위한 약관과 정책을 안내합니다.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: '이용약관 | Vlanet',
    description: 'Vlanet 서비스 이용약관을 확인하세요.',
    url: 'https://vlanet.co.kr/terms',
  },
}