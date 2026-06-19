import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Volume2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function DemoModal({ isOpen, onClose }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1,    opacity: 1, y: 0  }}
            exit={{    scale: 0.96, opacity: 0, y: 10 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative w-full max-w-2xl bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-gray-900">Horizon in Action</h2>
                <p className="text-xs text-gray-500 mt-0.5">Watch how a single photo becomes a 360° experience</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Simulated viewer */}
            <div className="relative aspect-video bg-gradient-to-b from-sky-100 via-sky-50 to-emerald-50 overflow-hidden">
              {/* Sky */}
              <div className="absolute top-0 w-full h-2/3 bg-gradient-to-b from-sky-200/50 to-transparent" />
              {/* Ground */}
              <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-emerald-100 to-transparent" />
              {/* Sun */}
              <div className="absolute top-8 right-16 w-14 h-14 rounded-full bg-amber-200 border-4 border-amber-100" />
              {/* Mountains */}
              <svg className="absolute bottom-1/4 w-full" viewBox="0 0 800 140" fill="none">
                <path d="M0 140 L120 50 L240 100 L360 20 L480 75 L600 35 L720 85 L800 55 L800 140Z" fill="#d1fae5" opacity="0.8" />
              </svg>
              {/* Hotspots */}
              {[{ x: '25%', y: '45%', label: 'Main Entrance' }, { x: '60%', y: '35%', label: 'Summit Peak' }].map(spot => (
                <div key={spot.label} className="absolute" style={{ left: spot.x, top: spot.y }}>
                  <span className="absolute -inset-1.5 rounded-full bg-blue-500/25 animate-ping" />
                  <span className="relative flex w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow cursor-pointer" />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-white border border-gray-200 rounded shadow-sm text-[10px] text-gray-700 whitespace-nowrap">
                    {spot.label}
                  </div>
                </div>
              ))}
              {/* Badges */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm">
                <span className="text-xs font-bold text-blue-600">360°</span>
                <span className="text-xs text-gray-500">Interactive Tour</span>
              </div>
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 rounded-full shadow-sm">
                <Volume2 size={11} className="text-green-500" />
                <span className="text-xs text-gray-600">AI Narrating…</span>
              </div>
              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shadow-xl cursor-pointer hover:bg-blue-700 transition-colors">
                  <Play size={26} className="text-white ml-1" fill="white" />
                </div>
              </div>
              {/* Progress bar */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-3 px-4 py-2 bg-white/90 border border-gray-200 rounded-lg shadow-sm">
                  <Play size={12} className="text-blue-600 shrink-0" fill="currentColor" />
                  <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className="w-1/3 h-full bg-blue-600 rounded-full" />
                  </div>
                  <span className="text-xs text-gray-400 tabular-nums shrink-0">0:42 / 2:15</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100 bg-gray-50">
              <div>
                <p className="text-sm font-semibold text-gray-900">Ready to create your own?</p>
                <p className="text-xs text-gray-500">Free to use — no credit card needed.</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={onClose} className="btn-outline text-sm px-4 py-2">Close</button>
                <Link to="/signup" onClick={onClose} className="btn-primary text-sm px-4 py-2">Start Free</Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
