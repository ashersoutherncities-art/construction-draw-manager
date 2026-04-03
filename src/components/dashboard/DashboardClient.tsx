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
  draw_requests: Array<{
    id: string
    draw_number: number
    requested_amount: number
    approved_amount: number
    status: string
    created_at: string
  }>
}

interface Stats {
  totalProjects: number
  activeDraws: number
  totalDrawnMonth: number
  remainingPipeline: number
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export function DashboardClient({ projects, stats }: { projects: Project[]; stats: Stats }) {
  const getLastDrawDate = (project: Project) => {
    if (!project.draw_requests || project.draw_requests.length === 0) return null
    const sorted = [...project.draw_requests].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return new Date(sorted[0].created_at).toLocaleDateString()
  }

  const getPendingCount = (project: Project) => {
    return project.draw_requests?.filter(d => d.status === 'pending').length ?? 0
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* Header */}
      <header className="bg-[#132452] text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div>
          <h1 className="text-xl font-bold">🏗️ Draw Manager</h1>
          <p className="text-white/60 text-xs">Southern Cities Construction LLC</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/draws" className="text-white/80 hover:text-white text-sm transition">
            Pending Draws
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-white/60 hover:text-white text-sm transition"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Projects', value: stats.totalProjects, suffix: '' },
            { label: 'Active Draws', value: stats.activeDraws, suffix: ' pending', highlight: stats.activeDraws > 0 },
            { label: 'Drawn This Month', value: fmt(stats.totalDrawnMonth), suffix: '' },
            { label: 'Remaining Pipeline', value: fmt(stats.remainingPipeline), suffix: '' },
          ].map((stat) => (
            <div key={stat.label} className={`bg-white rounded-xl p-5 shadow-sm border ${stat.highlight ? 'border-[#fa8c41]' : 'border-gray-100'}`}>
              <div className="text-gray-500 text-sm mb-1">{stat.label}</div>
              <div className={`text-2xl font-bold ${stat.highlight ? 'text-[#fa8c41]' : 'text-[#132452]'}`}>
                {stat.value}{stat.suffix}
              </div>
            </div>
          ))}
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#132452]">Active Projects</h2>
          <Link
            href="/admin/draws"
            className="bg-[#fa8c41] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-500 transition"
          >
            View All Pending →
          </Link>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">🏗️</div>
            <p className="text-lg font-medium">No projects yet</p>
            <p className="text-sm mt-2">
              <a href="/api/seed" className="text-[#fa8c41] hover:underline">Click here to seed initial data</a>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {projects.map((project) => {
              const pct = Math.min(100, Math.max(0, project.percent_complete ?? 0))
              const pendingCount = getPendingCount(project)
              const lastDraw = getLastDrawDate(project)

              return (
                <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition overflow-hidden">
                  {/* Card header */}
                  <div className="bg-[#132452] px-5 py-4">
                    <div className="flex items-start justify-between">
                      <h3 className="text-white font-semibold text-sm leading-tight pr-2">{project.address}</h3>
                      {pendingCount > 0 && (
                        <span className="bg-[#fa8c41] text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                          {pendingCount} pending
                        </span>
                      )}
                    </div>
                    <p className="text-white/60 text-xs mt-1">{project.lender} • #{project.loan_number}</p>
                  </div>

                  {/* Card body */}
                  <div className="p-5">
                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{pct.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#fa8c41] rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Amounts */}
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
                        <div className="text-gray-400 text-xs">Last Draw</div>
                        <div className="font-semibold text-gray-600">{lastDraw ?? '—'}</div>
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
