import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const supabase = getSupabaseAdmin()

  const updateData: any = {
    ...body,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('draw_requests')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update project totals if draw was approved/paid
  if (body.status === 'approved' && body.approved_amount) {
    const { data: draw } = await supabase.from('draw_requests').select('project_id').eq('id', params.id).single()
    if (draw?.project_id) {
      const { data: allDraws } = await supabase
        .from('draw_requests')
        .select('approved_amount, status')
        .eq('project_id', draw.project_id)
        .in('status', ['approved', 'paid'])

      const totalDrawn = allDraws?.reduce((sum, d) => sum + (d.approved_amount ?? 0), 0) ?? 0

      const { data: project } = await supabase
        .from('draw_projects')
        .select('holdback_amount')
        .eq('id', draw.project_id)
        .single()

      const holdback = project?.holdback_amount ?? 0
      const percentComplete = holdback > 0 ? Math.min(100, (totalDrawn / holdback) * 100) : 0
      const remainingBalance = Math.max(0, holdback - totalDrawn)

      await supabase
        .from('draw_projects')
        .update({ total_drawn: totalDrawn, percent_complete: percentComplete, remaining_balance: remainingBalance, updated_at: new Date().toISOString() })
        .eq('id', draw.project_id)
    }
  }

  return NextResponse.json(data)
}
