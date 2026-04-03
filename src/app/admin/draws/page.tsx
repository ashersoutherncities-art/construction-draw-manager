import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getSupabaseAdmin } from '@/lib/supabase'
import { AdminDrawsClient } from '@/components/admin/AdminDrawsClient'

export default async function AdminDrawsPage() {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session.user?.email)) redirect('/')

  const supabase = getSupabaseAdmin()
  const { data: allDraws } = await supabase
    .from('draw_requests')
    .select(`*, draw_projects(id, address, lender)`)
    .order('created_at', { ascending: false })

  const { data: projects } = await supabase
    .from('draw_projects')
    .select('id, address')
    .order('address')

  return <AdminDrawsClient draws={allDraws ?? []} projects={projects ?? []} />
}
