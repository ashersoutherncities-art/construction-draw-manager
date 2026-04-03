'use client'

import { useState } from 'react'

interface DrawRequest {
  id: string
  draw_number: number
  requested_by: string
  requested_amount: number
}

interface Props {
  draw: DrawRequest
  onClose: () => void
  onSuccess: () => void
}

export function ApproveModal({ draw, onClose, onSuccess }: Props) {
  const [approvedAmount, setApprovedAmount] = useState(String(draw.requested_amount))
  const [notes, setNotes] = useState('')
  const [lenderDate, setLenderDate] = useState('')
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    setLoading(true)
    const res = await fetch(`/api/draws/${draw.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'approved',
        approved_amount: parseFloat(approvedAmount),
        admin_notes: notes,
        lender_submission_date: lenderDate || null,
      }),
    })
    if (res.ok) onSuccess()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="bg-green-600 text-white px-6 py-4 rounded-t-2xl">
          <h2 className="text-lg font-bold">Approve Draw Request</h2>
          <p className="text-white/80 text-sm">Draw #{draw.draw_number} — {draw.requested_by}</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Approved Amount <span className="text-gray-400">(requested: ${draw.requested_amount.toLocaleString()})</span>
            </label>
            <input
              type="number"
              value={approvedAmount}
              onChange={e => setApprovedAmount(e.target.value)}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lender Submission Date</label>
            <input
              type="date"
              value={lenderDate}
              onChange={e => setLenderDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any notes about this approval..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none resize-none text-sm"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition">
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? 'Approving...' : '✓ Approve Draw'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
