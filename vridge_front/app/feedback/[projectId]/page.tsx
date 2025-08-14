import Feedback from '@/page/Cms/Feedback'

interface PageProps {
  params: {
    projectId: string
  }
}

export default function FeedbackPage({ params }: PageProps) {
  return <Feedback project_id={params.projectId} />
}