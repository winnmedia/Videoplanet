import './globals.scss'
import StyledComponentsRegistry from '../lib/registry'
import { Providers } from './providers'
import { ConfigProvider } from 'antd'
import type { Metadata } from 'next'

// Ant Design 테마 설정
const theme = {
  token: {
    colorPrimary: '#0031ff',
    colorSuccess: '#0058da',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1677ff',
    colorTextBase: '#23262d',
    colorBgBase: '#ffffff',
    borderRadius: 15,
    fontFamily: 'suit, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Button: {
      colorPrimary: '#0031ff',
      algorithm: true,
    },
    Input: {
      borderRadius: 15,
      paddingInline: 15,
    },
    Select: {
      borderRadius: 15,
    },
    Modal: {
      borderRadius: 15,
    },
    Card: {
      borderRadius: 15,
    },
    Table: {
      borderRadius: 15,
    },
  },
}

export const metadata: Metadata = {
  title: 'VRidge - 영상 제작 협업 플랫폼',
  description: '영상 제작 프로젝트 관리 및 협업을 위한 플랫폼',
  keywords: ['영상제작', '프로젝트관리', '협업플랫폼', 'VRidge'],
  authors: [{ name: 'WinMedia' }],
  viewport: 'width=device-width, initial-scale=1',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <StyledComponentsRegistry>
          <Providers>
            <ConfigProvider theme={theme}>
              <div id="root">
                {children}
              </div>
            </ConfigProvider>
          </Providers>
        </StyledComponentsRegistry>
      </body>
    </html>
  )
}