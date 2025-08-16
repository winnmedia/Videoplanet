import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '개인정보 취급방침',
  description: 'Vlanet의 개인정보 취급방침을 확인하세요. 사용자의 개인정보를 안전하게 보호하고 관리하는 방법에 대해 안내합니다.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: '개인정보 취급방침 | Vlanet',
    description: 'Vlanet의 개인정보 취급방침을 확인하세요.',
    url: 'https://vlanet.co.kr/privacy',
  },
}