import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import { ProjectDetailClient } from '@/components/projects/ProjectDetailClient'

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session.user?.email)) redirect('/')

  const supabase = getSupabaseAdmin()
  const { data: project, error } = await supabase
    .from('draw_projects')
    .select(`*, draw_requests(*, draw_line_items(*))`)
    .eq('id', params.id)
    .single()

  if (error || !project) redirect('/dashboard')

  return <ProjectDetailClient project={project} />
}
