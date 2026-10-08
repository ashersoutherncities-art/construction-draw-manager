'use client'

import { useState } from 'react'

interface DrawRequest {
  id: string
  draw_number: number
  requested_by: string
  requested_amount: number
  waiver_file_url?: string | null
  waiver_file_name?: string | null
  milestone_confirmed?: boolean | null
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
  const [error, setError] = useState('')

  const [waiverFileName, setWaiverFileName] = useState(draw.waiver_file_name ?? '')
  const [uploadingWaiver, setUploadingWaiver] = useState(false)
  const [milestoneLabel, setMilestoneLabel] = useState('')
  const [milestoneConfirmed, setMilestoneConfirmed] = useState(Boolean(draw.milestone_confirmed))

  const canApprove = Boolean(waiverFileName) && milestoneConfirmed

  const handleWaiverUpload = async (file: File) => {
    setUploadingWaiver(true)
    setError('')
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`/api/draws/${draw.id}/waiver`, { method: 'POST', body: formData })
    if (res.ok) {
      setWaiverFileName(file.name)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to upload lien waiver')
    }
    setUploadingWaiver(false)
  }

  const handleApprove = async () => {
    if (!canApprove) return
    setLoading(true)
    setError('')
    const res = await fetch(`/api/draws/${draw.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'approved',
        approved_amount: parseFloat(approvedAmount),
        admin_notes: notes,
        lender_submission_date: lenderDate || null,
        milestone_label: milestoneLabel || null,
        milestone_confirmed: milestoneConfirmed,
      }),
    })
    if (res.ok) {
      onSuccess()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to approve draw')
    }
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
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}

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

          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Lien Waiver <span className="text-red-500">*</span>
              <span className="block text-xs font-normal text-gray-400 mt-0.5">
                Conditional waiver before payment, or unconditional if this trade's already been paid out-of-band.
              </span>
            </label>
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleWaiverUpload(f) }}
              className="w-full text-sm"
            />
            {uploadingWaiver && <p className="text-xs text-gray-400">Uploading...</p>}
            {waiverFileName && !uploadingWaiver && (
              <p className="text-xs text-green-700 font-medium">✓ Attached: {waiverFileName}</p>
            )}
          </div>

          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Milestone <span className="text-red-500">*</span>
            </label>
            <input
              value={milestoneLabel}
              onChange={e => setMilestoneLabel(e.target.value)}
              placeholder="e.g. Framing complete"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={milestoneConfirmed}
                onChange={e => setMilestoneConfirmed(e.target.checked)}
                className="w-4 h-4"
              />
              I've confirmed this work is actually complete
            </label>
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
          {!canApprove && (
            <p className="text-xs text-orange-600">Attach a lien waiver and confirm the milestone before this draw can be approved.</p>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition">
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={loading || !canApprove}
              className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Approving...' : '✓ Approve Draw'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
