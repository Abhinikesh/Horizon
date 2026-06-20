import { useEffect, useState, useCallback } from 'react'
import { Globe } from 'lucide-react'

const STEPS = [
  'Analyzing your image…',
  'Generating AI depth map…',
  'Creating parallax animation…',
  'Synthesizing voice narration…',
  'Assembling final video…',
  'Finalizing output…',
]

/**
 * ProcessingScreen
 *
 * Props:
 *  - useDemoTimer  : boolean  — use a local 12s fake timer (no backend)
 *  - progress      : number   — 0-100, driven by real backend poll
 *  - stepIndex     : number   — 0-5, driven by real backend poll
 *  - onComplete    : fn       — called when processing finishes
 *  - steps         : string[] — custom step labels (defaults to STEPS)
 *  - taskLabel     : string   — bottom progress-bar label
 */
export default function ProcessingScreen({
  useDemoTimer = false,
  progress: externalProgress = 0,
  stepIndex: externalStep = 0,
  onComplete,
  steps = STEPS,
  taskLabel = 'Processing your story',
}) {
  const [localProgress, setLocalProgress] = useState(0)
  const [localStep,     setLocalStep]     = useState(0)

  const progress = useDemoTimer ? localProgress : externalProgress
  const stepIdx  = useDemoTimer ? localStep     : externalStep

  /* ── Demo timer mode ── */
  useEffect(() => {
    if (!useDemoTimer) return

    // Cycle steps every 2.5s
    const stepTimer = setInterval(() =>
      setLocalStep(s => Math.min(s + 1, STEPS.length - 1)), 2500)

    // Smooth progress over 12s then fire onComplete
    const start    = performance.now()
    const DURATION = 12_000
    let raf
    const tick = now => {
      const pct = Math.min(100, Math.round(((now - start) / DURATION) * 100))
      setLocalProgress(pct)
      if (pct < 100) {
        raf = requestAnimationFrame(tick)
      } else {
        setTimeout(onComplete, 600)
      }
    }
    raf = requestAnimationFrame(tick)

    return () => {
      clearInterval(stepTimer)
      cancelAnimationFrame(raf)
    }
  }, [useDemoTimer, onComplete])

  /* ── Real backend mode: fire onComplete when progress hits 100 ── */
  useEffect(() => {
    if (!useDemoTimer && externalProgress >= 100) {
      setTimeout(onComplete, 800)
    }
  }, [useDemoTimer, externalProgress, onComplete])

  const RADIUS = 54
  const CIRC   = 2 * Math.PI * RADIUS
  const offset = CIRC - (progress / 100) * CIRC

  const remaining = Math.max(0, Math.ceil(((100 - progress) / 100) * (useDemoTimer ? 12 : 90)))

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="absolute top-5 left-6 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
          <Globe size={14} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="text-base font-bold text-gray-900">360<span className="text-blue-600">Tales</span></span>
      </div>

      <div className="flex flex-col items-center gap-8 max-w-sm w-full">
        {/* SVG ring */}
        <div className="relative">
          <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
            <circle cx="64" cy="64" r={RADIUS} fill="none" stroke="#e5e7eb" strokeWidth="7" />
            <circle
              cx="64" cy="64" r={RADIUS}
              fill="none" stroke="#2563eb" strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-900 tabular-nums">{progress}%</span>
          </div>
        </div>

        {/* Step text */}
        <div className="text-center space-y-1.5">
          <p className="text-base font-semibold text-gray-900">{steps[Math.min(stepIdx, steps.length - 1)]}</p>
          <p className="text-sm text-gray-400">Please keep this tab open</p>
        </div>

        {/* Step dots */}
        <div className="flex gap-2">
          {steps.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              i < stepIdx ? 'bg-blue-600' : i === stepIdx ? 'bg-blue-400 scale-125' : 'bg-gray-200'
            }`} />
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-full space-y-2">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>{taskLabel}</span>
            <span className="tabular-nums">~{remaining}s remaining</span>
          </div>
        </div>
      </div>
    </div>
  )
}
