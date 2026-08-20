import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import { DashboardClient } from '@/components/dashboard/DashboardClient'
import { UserDashboardClient } from '@/components/dashboard/UserDashboardClient'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/')

  const userEmail = session.user?.email?.toLowerCase().trim() ?? ''
  const admin = isAdmin(userEmail)
  const supabase = getSupabaseAdmin()

  if (admin) {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [{ data: projects }, { data: pendingDraws }, { data: monthDraws }] = await Promise.all([
      supabase
        .from('draw_projects')
        .select(`*, draw_requests(id, draw_number, requested_amount, approved_amount, status, created_at)`)
        .order('created_at', { ascending: false }),
      supabase
        .from('draw_requests')
        .select('*, draw_projects(address)')
        .eq('status', 'pending'),
      supabase
        .from('draw_requests')
        .select('approved_amount')
        .in('status', ['approved', 'paid'])
        .gte('updated_at', monthStart),
    ])

    return (
      <DashboardClient
        projects={projects ?? []}
        stats={{
          totalProjects: projects?.length ?? 0,
          activeDraws: pendingDraws?.length ?? 0,
          totalDrawnMonth: monthDraws?.reduce((s, d) => s + (d.approved_amount ?? 0), 0) ?? 0,
          remainingPipeline: projects?.reduce((s, p) => s + (p.remaining_balance ?? 0), 0) ?? 0,
        }}
      />
    )
  }

  // Non-admin: scope to their access
  let projectsWithRole: any[] = []
  try {
    const { data: accessRows } = await supabase
      .from('draw_project_access')
      .select('project_id, role')
      .eq('user_email', userEmail)

    if (accessRows && accessRows.length > 0) {
      const projectIds = accessRows.map((r) => r.project_id)
      const { data: projects } = await supabase
        .from('draw_projects')
        .select(`*, draw_requests(id, draw_number, requested_amount, approved_amount, status, created_at)`)
        .in('id', projectIds)
        .order('created_at', { ascending: false })

      const accessMap = Object.fromEntries(accessRows.map((r) => [r.project_id, r.role]))
      projectsWithRole = (projects ?? []).map((p) => ({ ...p, user_role: accessMap[p.id] ?? 'viewer' }))
    }
  } catch {
    // Table not yet created — show empty state
  }

  return <UserDashboardClient projects={projectsWithRole} userName={session.user?.name ?? ''} />
}
