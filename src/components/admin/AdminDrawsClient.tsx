'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ApproveModal } from '@/components/projects/ApproveModal'
import { DenyModal } from '@/components/projects/DenyModal'

interface Draw {
  id: string
  draw_number: number
  requested_by: string
  requested_amount: number
  approved_amount: number
  status: string
  description: string
  invoice_number: string
  created_at: string
  draw_projects: { id: string; address: string; lender: string } | null
}

interface Project {
  id: string
  address: string
}

function fmt(n: number | null | undefined) {
  if (n == null) return '$0'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-orange-100 text-orange-700',
    approved: 'bg-green-100 text-green-700',
    denied: 'bg-red-100 text-red-700',
    paid: 'bg-blue-100 text-blue-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

export function AdminDrawsClient({ draws: initialDraws, projects }: { draws: Draw[]; projects: Project[] }) {
  const [draws, setDraws] = useState(initialDraws)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterProject, setFilterProject] = useState('all')
  const [approveTarget, setApproveTarget] = useState<Draw | null>(null)
  const [denyTarget, setDenyTarget] = useState<Draw | null>(null)

  const filtered = draws.filter(d => {
    if (filterStatus !== 'all' && d.status !== filterStatus) return false
    if (filterProject !== 'all' && d.draw_projects?.id !== filterProject) return false
    return true
  })

  const refreshDraws = async () => {
    const res = await fetch('/api/draws/all')
    if (res.ok) {
      const data = await res.json()
      setDraws(data)
    } else {
      // Fallback: just reload
      window.location.reload()
    }
  }

  const pendingCount = draws.filter(d => d.status === 'pending').length

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <header className="bg-[#132452] text-white px-6 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="text-white/60 hover:text-white text-sm transition">← Dashboard</Link>
            <h1 className="text-xl font-bold mt-1">All Draw Requests</h1>
          </div>
          {pendingCount > 0 && (
            <span className="bg-[#fa8c41] text-white px-3 py-1 rounded-full text-sm font-bold">
              {pendingCount} pending
            </span>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#fa8c41] outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Project</label>
            <select
              value={filterProject}
              onChange={e => setFilterProject(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#fa8c41] outline-none"
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.address}</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-500 self-end pb-2">
            Showing {filtered.length} of {draws.length} draws
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Project</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Draw #</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Sub Name</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Amount</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Approved</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Invoice #</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-400">No draws found</td>
                  </tr>
                ) : (
                  filtered.map(draw => (
                    <tr key={draw.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {draw.draw_projects ? (
                          <Link
                            href={`/projects/${draw.draw_projects.id}`}
                            className="text-[#132452] hover:text-[#fa8c41] font-medium transition text-xs leading-tight"
                          >
                            {draw.draw_projects.address}
                          </Link>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#132452]">#{draw.draw_number}</td>
                      <td className="py-3 px-4 text-gray-600">{draw.requested_by ?? '—'}</td>
                      <td className="py-3 px-4 text-right font-medium">{fmt(draw.requested_amount)}</td>
                      <td className="py-3 px-4 text-right font-medium text-green-700">
                        {draw.approved_amount ? fmt(draw.approved_amount) : '—'}
                      </td>
                      <td className="py-3 px-4 text-gray-500 text-xs">{draw.invoice_number ?? '—'}</td>
                      <td className="py-3 px-4"><StatusBadge status={draw.status} /></td>
                      <td className="py-3 px-4 text-gray-400 text-xs">{new Date(draw.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        {draw.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setApproveTarget(draw)}
                              className="bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold hover:bg-green-700 transition"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setDenyTarget(draw)}
                              className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold hover:bg-red-600 transition"
                            >
                              ✗
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {approveTarget && (
        <ApproveModal
          draw={approveTarget}
          onClose={() => setApproveTarget(null)}
          onSuccess={() => { setApproveTarget(null); window.location.reload() }}
        />
      )}

      {denyTarget && (
        <DenyModal
          draw={denyTarget}
          onClose={() => setDenyTarget(null)}
          onSuccess={() => { setDenyTarget(null); window.location.reload() }}
        />
      )}
    </div>
  )
}
