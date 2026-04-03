'use client'

import { useState, useEffect } from 'react'
import { DrawRequestModal } from '@/components/projects/DrawRequestModal'

interface Project {
  id: string
  address: string
  lender: string
  gc_name: string
}

export function PublicSubmitClient() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/projects/public')
      .then(r => r.json())
      .then(data => { setProjects(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (success) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-[#132452] mb-2">Draw Request Submitted!</h2>
          <p className="text-gray-500 mb-6">Your draw request has been submitted and the project manager has been notified. You'll be contacted once it's reviewed.</p>
          <button
            onClick={() => setSuccess(false)}
            className="bg-[#fa8c41] text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-500 transition"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* Header */}
      <header className="bg-[#132452] text-white px-6 py-5 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="text-white text-lg font-bold">🏗️ Southern Cities Construction LLC</div>
          <h1 className="text-2xl font-bold mt-1">Draw Request Portal</h1>
          <p className="text-white/60 text-sm mt-1">Submit your draw request for review and payment</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading projects...</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-lg font-bold text-[#132452] mb-2">Select Your Project</h2>
            <p className="text-gray-500 text-sm mb-6">Choose the project you're submitting a draw request for.</p>

            <div className="space-y-3 mb-6">
              {projects.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No active projects available. Contact Southern Cities Construction for assistance.</p>
              ) : (
                projects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className="w-full text-left p-4 border-2 border-gray-100 rounded-xl hover:border-[#fa8c41] hover:bg-orange-50 transition group"
                  >
                    <div className="font-semibold text-[#132452] group-hover:text-[#fa8c41] transition">{project.address}</div>
                    <div className="text-gray-400 text-sm mt-0.5">{project.gc_name} • {project.lender}</div>
                  </button>
                ))
              )}
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-gray-400 text-xs text-center">
                Can't find your project? Contact us at{' '}
                <a href="mailto:dariuswalton906@gmail.com" className="text-[#fa8c41] hover:underline">
                  dariuswalton906@gmail.com
                </a>
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <a href="/" className="text-gray-400 text-sm hover:text-[#132452] transition">
            Admin? Sign in here →
          </a>
        </div>
      </main>

      {selectedProject && (
        <DrawRequestModal
          projectId={selectedProject.id}
          projectAddress={selectedProject.address}
          nextDrawNum={1}
          isPublic={true}
          onClose={() => setSelectedProject(null)}
          onSuccess={() => { setSelectedProject(null); setSuccess(true) }}
        />
      )}
    </div>
  )
}
