import { Metadata } from 'next'

export const homeMetadata: Metadata = {
  title: 'Vlanet - 영상 콘텐츠 협업 플랫폼',
  description: '영상 콘텐츠 협업의 신세계, 브이래닛으로 당장 이주하세요! 쉽고 정확한 영상 피드백, 프로젝트 관리, 라이브 코멘트까지 한 번에.',
  keywords: ['영상 편집', '콘텐츠 제작', '협업 도구', '피드백', '프로젝트 관리', '브이래닛', 'vlanet', '영상 제작', '유튜브', '콘텐츠 크리에이터'],
  openGraph: {
    title: 'Vlanet - 영상 콘텐츠 협업 플랫폼',
    description: '영상 콘텐츠 협업의 신세계, 브이래닛으로 당장 이주하세요!',
    url: 'https://vlanet.co.kr',
    images: [
      {
        url: '/og-home.jpg',
        width: 1200,
        height: 630,
        alt: 'Vlanet 홈페이지',
      },
    ],
  },
}

export const privacyMetadata: Metadata = {
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

export const termsMetadata: Metadata = {
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