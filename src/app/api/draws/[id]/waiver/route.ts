import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

const BUCKET = 'lien-waivers'

// Uploads go through the server (service-role key) rather than the browser
// directly, because the bucket is private and gated on next-auth admin
// status, not Supabase's own auth — the anon-key client has no standing to
// write to it.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  const path = `${params.id}/${Date.now()}-${file.name}`
  const bytes = new Uint8Array(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type || 'application/octet-stream' })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data, error } = await supabase
    .from('draw_requests')
    .update({ waiver_file_url: path, waiver_file_name: file.name, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// Returns a short-lived signed URL to view/download the attached waiver.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const { data: draw, error: drawError } = await supabase
    .from('draw_requests')
    .select('waiver_file_url')
    .eq('id', params.id)
    .single()

  if (drawError) return NextResponse.json({ error: drawError.message }, { status: 500 })
  if (!draw?.waiver_file_url) return NextResponse.json({ error: 'No waiver attached' }, { status: 404 })

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(draw.waiver_file_url, 300)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ url: data.signedUrl })
}
