import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// Public endpoint - returns only address + id for sub submission dropdown
export async function GET() {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('draw_projects')
    .select('id, address, lender, gc_name')
    .eq('status', 'active')
    .order('address')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
