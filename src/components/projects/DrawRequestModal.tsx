'use client'

import { useState } from 'react'

interface LineItem {
  trade: string
  description: string
  budgeted_amount: string
  requested_amount: string
}

interface Props {
  projectId: string
  projectAddress: string
  nextDrawNum: number
  onClose: () => void
  onSuccess: () => void
  submitterEmail?: string
  isPublic?: boolean
}

const TRADES = ['Framing', 'Electrical', 'Plumbing', 'HVAC', 'Roofing', 'Siding', 'Windows/Doors', 'Flooring', 'Kitchen', 'Bathrooms', 'Paint', 'Landscaping', 'Other']

export function DrawRequestModal({ projectId, projectAddress, nextDrawNum, onClose, onSuccess, isPublic }: Props) {
  const [requestedBy, setRequestedBy] = useState('')
  const [email, setEmail] = useState('')
  const [description, setDescription] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([{ trade: '', description: '', budgeted_amount: '', requested_amount: '' }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const totalRequested = lineItems.reduce((sum, li) => sum + (parseFloat(li.requested_amount) || 0), 0)

  const addLineItem = () => setLineItems([...lineItems, { trade: '', description: '', budgeted_amount: '', requested_amount: '' }])
  const removeLineItem = (i: number) => setLineItems(lineItems.filter((_, idx) => idx !== i))
  const updateLineItem = (i: number, field: keyof LineItem, value: string) => {
    setLineItems(lineItems.map((li, idx) => idx === i ? { ...li, [field]: value } : li))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!requestedBy.trim()) { setError('Please enter your name/company'); return }
    setLoading(true)
    setError('')

    const validLineItems = lineItems.filter(li => li.trade && li.requested_amount)

    const res = await fetch(`/api/projects/${projectId}/draws`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requested_by: requestedBy,
        description,
        invoice_number: invoiceNumber,
        invoice_amount: invoiceAmount ? parseFloat(invoiceAmount) : null,
        requested_amount: totalRequested || (invoiceAmount ? parseFloat(invoiceAmount) : 0),
        lineItems: validLineItems.map(li => ({
          trade: li.trade,
          description: li.description,
          budgeted_amount: li.budgeted_amount ? parseFloat(li.budgeted_amount) : null,
          requested_amount: parseFloat(li.requested_amount),
        })),
      }),
    })

    if (res.ok) {
      onSuccess()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to submit draw request')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-[#132452] text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Submit Draw Request</h2>
            <p className="text-white/60 text-sm">{projectAddress} • Draw #{nextDrawNum}</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name / Company *</label>
              <input
                value={requestedBy}
                onChange={e => setRequestedBy(e.target.value)}
                placeholder="ABC Plumbing LLC"
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#fa8c41] outline-none"
              />
            </div>
            {isPublic && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#fa8c41] outline-none"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description of Work Completed</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the work completed in this draw period..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#fa8c41] outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
              <input
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
                placeholder="INV-1234"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#fa8c41] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Amount</label>
              <input
                type="number"
                value={invoiceAmount}
                onChange={e => setInvoiceAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#fa8c41] outline-none"
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Line Items</label>
              <button
                type="button"
                onClick={addLineItem}
                className="text-[#fa8c41] text-sm hover:underline font-medium"
              >
                + Add Row
              </button>
            </div>
            <div className="space-y-2">
              {lineItems.map((li, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <select
                    value={li.trade}
                    onChange={e => updateLineItem(i, 'trade', e.target.value)}
                    className="w-36 px-2 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#fa8c41] outline-none flex-shrink-0"
                  >
                    <option value="">Trade...</option>
                    {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input
                    value={li.description}
                    onChange={e => updateLineItem(i, 'description', e.target.value)}
                    placeholder="Description"
                    className="flex-1 px-2 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#fa8c41] outline-none"
                  />
                  <input
                    type="number"
                    value={li.requested_amount}
                    onChange={e => updateLineItem(i, 'requested_amount', e.target.value)}
                    placeholder="Amount"
                    step="0.01"
                    className="w-24 px-2 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#fa8c41] outline-none"
                  />
                  {lineItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLineItem(i)}
                      className="text-red-400 hover:text-red-600 text-lg leading-none flex-shrink-0 pt-1"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            {totalRequested > 0 && (
              <div className="mt-2 text-right text-sm font-bold text-[#132452]">
                Total: ${totalRequested.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-[#132452] text-white font-semibold rounded-lg hover:bg-[#0e1a3d] transition disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Draw Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
