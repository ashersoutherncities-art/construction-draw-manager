'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DrawRequestModal } from './DrawRequestModal'
import { ApproveModal } from './ApproveModal'
import { DenyModal } from './DenyModal'

interface LineItem {
  id: string
  trade: string
  description: string
  budgeted_amount: number
  requested_amount: number
  approved_amount: number
}

interface DrawRequest {
  id: string
  draw_number: number
  requested_by: string
  requested_amount: number
  approved_amount: number
  status: string
  description: string
  invoice_number: string
  invoice_amount: number
  created_at: string
  updated_at: string
  admin_notes: string
  denial_reason: string
  draw_line_items: LineItem[]
}

interface Project {
  id: string
  address: string
  lender: string
  loan_number: string
  holdback_amount: number
  total_construction_cost: number
  original_budget: number
  percent_complete: number
  remaining_balance: number
  total_drawn: number
  gc_name: string
  status: string
  draw_requests: DrawRequest[]
}

function fmt(n: number | null | undefined) {
  if (n == null) return '$0'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-orange-100 text-orange-700 border-orange-200',
    approved: 'bg-green-100 text-green-700 border-green-200',
    denied: 'bg-red-100 text-red-700 border-red-200',
    paid: 'bg-blue-100 text-blue-700 border-blue-200',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

export function ProjectDetailClient({ project: initialProject }: { project: Project }) {
  const [project, setProject] = useState(initialProject)
  const [showNewDraw, setShowNewDraw] = useState(false)
  const [approveTarget, setApproveTarget] = useState<DrawRequest | null>(null)
  const [denyTarget, setDenyTarget] = useState<DrawRequest | null>(null)

  const draws = [...(project.draw_requests ?? [])].sort((a, b) => (a.draw_number ?? 0) - (b.draw_number ?? 0))
  const pendingDraws = draws.filter(d => d.status === 'pending')
  const pct = Math.min(100, Math.max(0, project.percent_complete ?? 0))

  const refreshProject = async () => {
    const res = await fetch(`/api/projects/${project.id}`)
    if (res.ok) setProject(await res.json())
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* Header */}
      <header className="bg-[#132452] text-white px-6 py-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="text-white/60 hover:text-white text-sm transition">
              ← Back to Dashboard
            </Link>
            <h1 className="text-xl font-bold mt-1">{project.address}</h1>
            <p className="text-white/60 text-sm">{project.lender} • Loan #{project.loan_number}</p>
          </div>
          <button
            onClick={() => setShowNewDraw(true)}
            className="bg-[#fa8c41] text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-orange-500 transition"
          >
            + New Draw Request
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Budget Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-[#132452] mb-5">Budget Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
            {[
              { label: 'Holdback Amount', value: fmt(project.holdback_amount), color: 'text-[#132452]' },
              { label: 'Total Drawn', value: fmt(project.total_drawn), color: 'text-orange-600' },
              { label: 'Remaining', value: fmt(project.remaining_balance), color: 'text-green-600' },
              { label: 'Original Budget', value: fmt(project.original_budget), color: 'text-[#132452]' },
            ].map((item) => (
              <div key={item.label} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-gray-500 text-xs mb-1">{item.label}</div>
                <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
              </div>
            ))}
          </div>
          <div>
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Construction Progress</span>
              <span>{pct.toFixed(1)}% Complete</span>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#fa8c41] rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Pending Draw Requests */}
        {pendingDraws.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6">
            <h2 className="text-lg font-bold text-[#132452] mb-4 flex items-center gap-2">
              ⏳ Pending Draw Requests
              <span className="bg-[#fa8c41] text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingDraws.length}</span>
            </h2>
            <div className="space-y-3">
              {pendingDraws.map((draw) => (
                <div key={draw.id} className="border border-orange-100 rounded-lg p-4 bg-orange-50">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <div className="font-semibold text-[#132452]">Draw #{draw.draw_number} — {draw.requested_by}</div>
                      <div className="text-gray-600 text-sm mt-1">{draw.description}</div>
                      {draw.invoice_number && (
                        <div className="text-gray-400 text-xs mt-1">Invoice #{draw.invoice_number} • {fmt(draw.invoice_amount)}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-4">
                        <div className="text-xl font-bold text-[#132452]">{fmt(draw.requested_amount)}</div>
                        <div className="text-gray-400 text-xs">requested</div>
                      </div>
                      <button
                        onClick={() => setApproveTarget(draw)}
                        className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setDenyTarget(draw)}
                        className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-600 transition"
                      >
                        Deny
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Draw History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-[#132452] mb-4">Draw History</h2>
          {draws.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No draws yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Draw #</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Requested By</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">Requested</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">Approved</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Date</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {draws.map((draw) => (
                    <tr key={draw.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-3 font-semibold text-[#132452]">#{draw.draw_number}</td>
                      <td className="py-3 px-3 text-gray-600">{draw.requested_by ?? '—'}</td>
                      <td className="py-3 px-3 text-right font-medium">{fmt(draw.requested_amount)}</td>
                      <td className="py-3 px-3 text-right font-medium text-green-700">{draw.approved_amount ? fmt(draw.approved_amount) : '—'}</td>
                      <td className="py-3 px-3"><StatusBadge status={draw.status} /></td>
                      <td className="py-3 px-3 text-gray-500">{new Date(draw.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-3 text-gray-400 text-xs max-w-[200px] truncate">{draw.admin_notes ?? draw.description ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200">
                    <td colSpan={2} className="py-3 px-3 font-bold text-[#132452]">Totals</td>
                    <td className="py-3 px-3 text-right font-bold text-[#132452]">
                      {fmt(draws.reduce((s, d) => s + (d.requested_amount ?? 0), 0))}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-green-700">
                      {fmt(draws.reduce((s, d) => s + (d.approved_amount ?? 0), 0))}
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </main>

      {showNewDraw && (
        <DrawRequestModal
          projectId={project.id}
          projectAddress={project.address}
          nextDrawNum={(Math.max(...draws.map(d => d.draw_number ?? 0), 0)) + 1}
          onClose={() => setShowNewDraw(false)}
          onSuccess={() => { setShowNewDraw(false); refreshProject() }}
        />
      )}

      {approveTarget && (
        <ApproveModal
          draw={approveTarget}
          onClose={() => setApproveTarget(null)}
          onSuccess={() => { setApproveTarget(null); refreshProject() }}
        />
      )}

      {denyTarget && (
        <DenyModal
          draw={denyTarget}
          onClose={() => setDenyTarget(null)}
          onSuccess={() => { setDenyTarget(null); refreshProject() }}
        />
      )}
    </div>
  )
}
