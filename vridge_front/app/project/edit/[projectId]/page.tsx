import ProjectEdit from '@/page/Cms/ProjectEdit'

interface PageProps {
  params: {
    projectId: string
  }
}

export default function ProjectEditPage({ params }: PageProps) {
  // Next.js uses projectId, but the component expects project_id
  return <ProjectEdit project_id={params.projectId} />
}