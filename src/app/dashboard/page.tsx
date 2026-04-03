import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import { DashboardClient } from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/')
  if (!isAdmin(session.user?.email)) redirect('/submit')

  const supabase = getSupabaseAdmin()

  const { data: projects } = await supabase
    .from('draw_projects')
    .select(`*, draw_requests(id, draw_number, requested_amount, approved_amount, status, created_at)`)
    .order('created_at', { ascending: false })

  const { data: pendingDraws } = await supabase
    .from('draw_requests')
    .select('*, draw_projects(address)')
    .eq('status', 'pending')

  // Stats
  const totalProjects = projects?.length ?? 0
  const activeDraws = pendingDraws?.length ?? 0

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const { data: monthDraws } = await supabase
    .from('draw_requests')
    .select('approved_amount')
    .in('status', ['approved', 'paid'])
    .gte('updated_at', monthStart)

  const totalDrawnMonth = monthDraws?.reduce((s, d) => s + (d.approved_amount ?? 0), 0) ?? 0

  const remainingPipeline = projects?.reduce((s, p) => s + (p.remaining_balance ?? 0), 0) ?? 0

  return (
    <DashboardClient
      projects={projects ?? []}
      stats={{ totalProjects, activeDraws, totalDrawnMonth, remainingPipeline }}
    />
  )
}
