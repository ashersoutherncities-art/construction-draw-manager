import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const supabase = getSupabaseAdmin()

  // Get next draw number
  const { data: existing } = await supabase
    .from('draw_requests')
    .select('draw_number')
    .eq('project_id', params.id)
    .order('draw_number', { ascending: false })
    .limit(1)

  const nextDrawNum = existing && existing.length > 0 ? (existing[0].draw_number ?? 0) + 1 : 1

  const { lineItems, ...drawData } = body

  const { data: draw, error } = await supabase
    .from('draw_requests')
    .insert([{
      ...drawData,
      project_id: params.id,
      draw_number: nextDrawNum,
      status: 'pending',
    }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Insert line items if any
  if (lineItems && lineItems.length > 0) {
    const { error: liError } = await supabase
      .from('draw_line_items')
      .insert(lineItems.map((li: any) => ({ ...li, draw_request_id: draw.id })))
    if (liError) console.error('Line items error:', liError)
  }

  // Try to send email notification
  try {
    const projectRes = await supabase.from('draw_projects').select('address').eq('id', params.id).single()
    const address = projectRes.data?.address ?? 'Unknown'
    console.log(`New draw request submitted for ${address} - $${draw.requested_amount} by ${draw.requested_by}`)
  } catch {}

  return NextResponse.json(draw)
}
