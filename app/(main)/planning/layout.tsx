import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI 영상 기획 | Planet',
  description: 'AI의 도움으로 전문적인 영상 기획서를 단계별로 작성해보세요',
  keywords: ['영상 기획', 'AI', '스토리보드', '콘티', 'Planet'],
  openGraph: {
    title: 'AI 영상 기획 | Planet',
    description: 'AI의 도움으로 전문적인 영상 기획서를 단계별로 작성해보세요',
    type: 'website',
  },
}

interface PlanningLayoutProps {
  children: React.ReactNode
}

export default function PlanningLayout({ children }: PlanningLayoutProps) {
  return (
    <div className="planning-layout">
      <div className="planning-container">
        {children}
      </div>
    </div>
  )
}