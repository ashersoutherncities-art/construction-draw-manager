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

export function DenyModal({ draw, onClose, onSuccess }: Props) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDeny = async () => {
    if (!reason.trim()) return
    setLoading(true)
    const res = await fetch(`/api/draws/${draw.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'denied', denial_reason: reason }),
    })
    if (res.ok) onSuccess()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="bg-red-500 text-white px-6 py-4 rounded-t-2xl">
          <h2 className="text-lg font-bold">Deny Draw Request</h2>
          <p className="text-white/80 text-sm">Draw #{draw.draw_number} — {draw.requested_by}</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Denial Reason *</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Explain why this draw is being denied..."
              rows={3}
              required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none text-sm"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition">
              Cancel
            </button>
            <button
              onClick={handleDeny}
              disabled={loading || !reason.trim()}
              className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition disabled:opacity-50"
            >
              {loading ? 'Denying...' : '✗ Deny Draw'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
