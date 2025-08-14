import ProjectView from '@/page/Cms/ProjectView'

interface PageProps {
  params: {
    projectId: string
  }
}

export default function ProjectViewPage({ params }: PageProps) {
  return <ProjectView project_id={params.projectId} />
}