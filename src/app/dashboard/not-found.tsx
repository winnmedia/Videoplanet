import NotFoundTemplate from '@/shared/ui/not-found/NotFoundTemplate'

export default function DashboardNotFound() {
  return (
    <NotFoundTemplate 
      title="대시보드를 찾을 수 없습니다"
      description="요청하신 대시보드 페이지가 존재하지 않습니다."
    />
  )
}