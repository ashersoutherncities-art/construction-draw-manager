'use client'

import { signOut } from 'next-auth/react'
import Link from 'next/link'

interface Project {
  id: string
  address: string
  lender: string
  loan_number: string
  holdback_amount: number
  total_drawn: number
  remaining_balance: number
  percent_complete: number
  status: string
  user_role: string
  draw_requests: Array<{
    id: string
    draw_number: number
    requested_amount: number
    approved_amount: number
    status: string
    created_at: string
  }>
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="bg-white/15 text-white text-xs font-semibold px-2 py-0.5 rounded-full capitalize flex-shrink-0">
      {role}
    </span>
  )
}

export function UserDashboardClient({ projects, userName }: { projects: Project[]; userName: string }) {
  const getPendingCount = (project: Project) =>
    project.draw_requests?.filter((d) => d.status === 'pending').length ?? 0

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <header className="bg-[#132452] text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div>
          <h1 className="text-xl font-bold">🏗️ Draw Manager</h1>
          <p className="text-white/60 text-xs">Southern Cities Construction</p>
        </div>
        <div className="flex items-center gap-4">
          {userName && <span className="text-white/60 text-sm">{userName}</span>}
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-white/60 hover:text-white text-sm transition"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-[#132452] mb-4">Your Projects</h2>

        {projects.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">🏗️</div>
            <p className="text-lg font-medium">No projects shared with you yet</p>
            <p className="text-sm mt-2">Ask your Southern Cities contact to grant access.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {projects.map((project) => {
              const pct = Math.min(100, Math.max(0, project.percent_complete ?? 0))
              const pendingCount = getPendingCount(project)

              return (
                <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition overflow-hidden">
                  <div className="bg-[#132452] px-5 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-white font-semibold text-sm leading-tight">{project.address}</h3>
                      <RoleBadge role={project.user_role} />
                    </div>
                    <p className="text-white/60 text-xs mt-1">{project.lender} • #{project.loan_number}</p>
                  </div>

                  <div className="p-5">
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{pct.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#fa8c41] rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div>
                        <div className="text-gray-400 text-xs">Holdback</div>
                        <div className="font-semibold text-[#132452]">{fmt(project.holdback_amount ?? 0)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs">Total Drawn</div>
                        <div className="font-semibold text-[#132452]">{fmt(project.total_drawn ?? 0)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs">Remaining</div>
                        <div className="font-semibold text-green-600">{fmt(project.remaining_balance ?? 0)}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-xs">Pending Draws</div>
                        <div className="font-semibold text-gray-600">{pendingCount || '—'}</div>
                      </div>
                    </div>

                    <Link
                      href={`/projects/${project.id}`}
                      className="block w-full text-center py-2 border-2 border-[#132452] text-[#132452] font-semibold rounded-lg hover:bg-[#132452] hover:text-white transition text-sm"
                    >
                      View Project →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
