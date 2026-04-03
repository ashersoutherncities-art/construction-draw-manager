import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

const SEED_DATA = {
  "parsedAt": "2026-03-26T15:18:00.000Z",
  "source": "Kiavi DRF Excel Files",
  "projects": [
    {
      "address": "723 Pee Dee Ave, Albemarle, NC 28001",
      "loanNumber": 79232,
      "holdbackAmount": 61300,
      "totalConstructionCost": 61315,
      "originalBudget": 61315,
      "percentComplete": 86.3,
      "remainingBalance": 8420.50,
      "totalDrawn": 52894.50,
      "gcName": "Southern Cities Construction LLC",
      "lender": "Kiavi",
      "draws": [
        { "number": 1, "requested": 19725, "approved": 19275, "prorated": 19270.28, "status": "Approved" },
        { "number": 2, "requested": 17125, "approved": 14400, "prorated": 14396.48, "status": "Approved" },
        { "number": 3, "requested": 11550, "approved": 11550, "prorated": 11547.17, "status": "Approved" },
        { "number": 4, "requested": 7820, "approved": 2232.50, "prorated": 2231.95, "status": "Approved" },
        { "number": 5, "requested": 6437, "approved": 5437, "prorated": 5435.67, "status": "Approved" }
      ]
    },
    {
      "address": "1209 National Avenue, New Bern, NC 28560",
      "loanNumber": 35028466,
      "holdbackAmount": 61300,
      "totalConstructionCost": 61315,
      "originalBudget": 61315,
      "percentComplete": 86.3,
      "remainingBalance": 8420.50,
      "totalDrawn": 52894.50,
      "gcName": "Southern Cities Construction LLC",
      "lender": "Kiavi",
      "draws": [
        { "number": 1, "requested": 19725, "approved": 19275, "prorated": 19270.28, "status": "Approved" },
        { "number": 2, "requested": 17125, "approved": 14400, "prorated": 14396.48, "status": "Approved" },
        { "number": 3, "requested": 11550, "approved": 11550, "prorated": 11547.17, "status": "Approved" },
        { "number": 4, "requested": 7820, "approved": 2232.50, "prorated": 2231.95, "status": "Approved" },
        { "number": 5, "requested": 6437, "approved": 5437, "prorated": 5435.67, "status": "Approved" }
      ]
    },
    {
      "address": "226 S Morrow Ave, Albemarle, NC 28001",
      "loanNumber": 35114541,
      "holdbackAmount": 49500,
      "totalConstructionCost": 49508,
      "originalBudget": 49508,
      "percentComplete": 61.9,
      "remainingBalance": 18875.50,
      "totalDrawn": 30632.50,
      "gcName": "Southern Cities Construction",
      "lender": "Kiavi",
      "draws": [
        { "number": 1, "requested": 11350, "approved": 8267.50, "prorated": 8266.16, "status": "Approved" },
        { "number": 2, "requested": 5632, "approved": 5632, "prorated": 5631.09, "status": "Approved" },
        { "number": 3, "requested": 12900, "approved": 12900, "prorated": 12897.92, "status": "Approved" },
        { "number": 4, "requested": 5558, "approved": 3833, "prorated": 3832.38, "status": "Approved" }
      ]
    },
    {
      "address": "114 Corban Avenue SE, Concord, NC 28025",
      "loanNumber": 34963901,
      "holdbackAmount": 80500,
      "totalConstructionCost": 80535,
      "originalBudget": 80535,
      "percentComplete": 33.6,
      "remainingBalance": 53445,
      "totalDrawn": 27090,
      "gcName": "Southern Cities Construction LLC",
      "lender": "Kiavi",
      "draws": [
        { "number": 1, "requested": 7450, "approved": 7450, "prorated": 7446.76, "status": "Approved" },
        { "number": 2, "requested": 12150, "approved": 10750, "prorated": 10745.33, "status": "Approved" },
        { "number": 3, "requested": 12200, "approved": 8890, "prorated": 8886.14, "status": "Approved" }
      ]
    },
    {
      "address": "913 Church Street, Newport, NC 28570",
      "loanNumber": 34910477,
      "holdbackAmount": 129200,
      "totalConstructionCost": 129255,
      "originalBudget": 129255,
      "percentComplete": 30.2,
      "remainingBalance": 90255,
      "totalDrawn": 39000,
      "gcName": "Southern Cities Construction",
      "lender": "Kiavi",
      "draws": [
        { "number": 1, "requested": 24000, "approved": 18600, "prorated": 18592.09, "status": "Approved" },
        { "number": 2, "requested": 14300, "approved": 9000, "prorated": 8996.17, "status": "Approved" },
        { "number": 3, "requested": 11400, "approved": 11400, "prorated": 11395.15, "status": "Approved" }
      ]
    }
  ]
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || !isAdmin(session.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  // Check if projects already exist
  const { data: existing } = await supabase.from('draw_projects').select('id').limit(1)
  if (existing && existing.length > 0) {
    return NextResponse.json({ message: 'Already seeded', count: existing.length })
  }

  let inserted = 0
  const errors: string[] = []

  for (const p of SEED_DATA.projects) {
    // Insert project
    const { data: project, error: pError } = await supabase
      .from('draw_projects')
      .insert([{
        address: p.address,
        lender: p.lender,
        loan_number: String(p.loanNumber),
        holdback_amount: p.holdbackAmount,
        total_construction_cost: p.totalConstructionCost,
        original_budget: p.originalBudget,
        percent_complete: p.percentComplete,
        remaining_balance: p.remainingBalance,
        total_drawn: p.totalDrawn,
        gc_name: p.gcName,
        status: 'active',
      }])
      .select()
      .single()

    if (pError) {
      errors.push(`Project ${p.address}: ${pError.message}`)
      continue
    }

    inserted++

    // Insert draws
    if (p.draws && p.draws.length > 0) {
      for (const d of p.draws) {
        const { error: dError } = await supabase.from('draw_requests').insert([{
          project_id: project.id,
          draw_number: d.number,
          requested_by: p.gcName,
          requested_amount: d.requested,
          approved_amount: d.approved,
          status: 'approved',
          description: `Draw #${d.number} - ${p.lender} submission`,
          admin_notes: `Prorated amount: $${d.prorated}`,
        }])
        if (dError) errors.push(`Draw ${d.number} for ${p.address}: ${dError.message}`)
      }
    }
  }

  return NextResponse.json({
    message: `Seeded ${inserted} projects`,
    errors: errors.length > 0 ? errors : undefined,
  })
}
