import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Play, Upload, Cpu, Video, CheckCircle } from 'lucide-react'

/* ── Lightweight static mockup (white/light theme) ── */
function AppMockup() {
  const [step, setStep] = useState(0)
  const labels = ['Uploading photo…', 'AI processing…', 'Generating 360°…', 'Done']

  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % labels.length), 2000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">

        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="w-3 h-3 rounded-full bg-green-400" />
          <span className="flex-1 mx-3 px-3 py-1 bg-white border border-gray-200 rounded text-xs text-gray-400 font-mono truncate">
            360tales.app/create
          </span>
          <span className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${step === 3 ? 'text-green-700 bg-green-50' : 'text-blue-700 bg-blue-50'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${step === 3 ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`} />
            {labels[step]}
          </span>
        </div>

        {/* Panoramic viewer */}
        <div className="relative h-52 bg-gradient-to-b from-sky-100 via-sky-50 to-emerald-50 overflow-hidden">
          {/* Landscape SVG */}
          <svg className="absolute bottom-0 w-full" viewBox="0 0 400 120" fill="none">
            <path d="M0 120 L70 55 L130 80 L200 30 L270 65 L330 40 L400 70 L400 120 Z" fill="#d1fae5" />
            <path d="M0 120 L70 70 L130 95 L200 50 L270 82 L330 60 L400 90 L400 120 Z" fill="#a7f3d0" />
          </svg>
          {/* Sky */}
          <div className="absolute top-0 w-full h-20 bg-gradient-to-b from-sky-200/60 to-transparent" />
          {/* Sun */}
          <div className="absolute top-6 right-12 w-12 h-12 rounded-full bg-amber-200 border-4 border-amber-100" />

          {/* Hotspots */}
          {[{ x: '28%', y: '48%' }, { x: '62%', y: '38%' }].map((p, i) => (
            <div key={i} className="absolute" style={{ left: p.x, top: p.y }}>
              <span className="absolute -inset-1.5 rounded-full bg-blue-500/20 animate-ping" />
              <span className="relative flex w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow" />
            </div>
          ))}

          {/* 360 pill */}
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-white/90 border border-gray-200 rounded-full shadow-sm">
            <span className="text-xs font-bold text-blue-600">360°</span>
          </div>

          {/* Drag hint */}
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 px-3 py-1 bg-white/80 border border-gray-200 rounded-full shadow-sm">
            <span className="text-[11px] text-gray-500">← Drag to explore →</span>
          </div>
        </div>

        {/* Player bar */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <Play size={12} className="text-white ml-0.5" fill="white" />
            </button>
            <div className="flex-1 flex items-end gap-0.5 h-7">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${40 + Math.sin(i * 0.9) * 30}%`,
                    background: i < 15 ? '#2563eb' : '#e5e7eb',
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400 tabular-nums shrink-0">1:24</span>
          </div>

          <div className="flex gap-2">
            {['Taj Mahal, Agra', 'AI Narrated', 'EN · HI · FR'].map(tag => (
              <span key={tag} className="px-2.5 py-1 text-[11px] font-medium rounded bg-gray-100 text-gray-600">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Floating feature chips */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {[
          { icon: Upload, label: 'Upload photo' },
          { icon: Cpu,    label: 'AI narration' },
          { icon: Video,  label: 'Export video' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm text-xs text-gray-600 font-medium">
            <Icon size={13} className="text-blue-600" />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Hero({ onDemoOpen }) {
  return (
    <section id="home" className="pt-32 pb-24 bg-white">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 bg-blue-50 border border-blue-100 rounded-full">
              <CheckCircle size={13} className="text-blue-600" />
              <span className="text-xs font-semibold text-blue-700">Public Beta — Free to start</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-[1.12] mb-5">
              Turn Any Photo Into an Immersive{' '}
              <span className="text-blue-600">360° Story</span>
            </h1>

            <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-lg">
              Upload a tourist place image, add your text — get a cinematic narrated 360° video in minutes. No editing skills needed. Powered by AI.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/signup" className="btn-primary text-sm px-6 py-3">
                Start Creating Free
                <ArrowRight size={16} />
              </Link>
              <button
                onClick={onDemoOpen}
                className="btn-outline text-sm px-6 py-3"
              >
                <Play size={15} />
                Watch Demo
              </button>
            </div>
          </div>

          {/* Right — mockup */}
          <AppMockup />
        </div>
      </div>
    </section>
  )
}
