import { lazy, Suspense } from 'react'
import { ImageIcon, Play, Pause } from 'lucide-react'

const SphereViewer = lazy(() => import('./SphereViewer'))

const EFFECTS = [
  { id: 'slowPan',   label: 'Slow Pan'   },
  { id: 'zoomIn',    label: 'Zoom In'    },
  { id: 'rotate',    label: 'Rotate'     },
  { id: 'kenBurns',  label: 'Ken Burns'  },
]

export default function MiddlePanel({
  fileUrl, is360,
  effect, onEffectChange,
  isPreviewing, onTogglePreview,
  hotspots, onHotspotsChange,
}) {
  return (
    <div className="flex flex-col h-full min-h-[500px] md:min-h-0">
      {/* Panel header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-200 bg-white">
        <h2 className="text-sm font-semibold text-gray-900">Preview</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          {fileUrl
            ? is360
              ? 'Drag inside the sphere to explore your 360° view'
              : 'Select an animation effect and press Play to preview'
            : 'Upload or capture a photo to see your preview'}
        </p>
      </div>

      <div className="flex-1 flex flex-col p-5 gap-5 overflow-y-auto">
        {/* ── EMPTY STATE ── */}
        {!fileUrl && (
          <div className="flex-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-20 px-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-4">
              <ImageIcon size={28} className="text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-500 mb-1">Your 360° preview will appear here</p>
            <p className="text-xs text-gray-400">Upload or capture a photo to get started</p>
          </div>
        )}

        {/* ── PATH A — normal image with CSS effects ── */}
        {fileUrl && !is360 && (
          <>
            {/* Image preview box */}
            <div className="relative rounded-xl overflow-hidden bg-gray-900" style={{ aspectRatio: '16/9' }}>
              <img
                src={fileUrl}
                alt="Preview"
                className={`w-full h-full object-cover ${isPreviewing ? `effect-${effect}` : ''}`}
                style={{ willChange: 'transform' }}
              />
              {/* Overlay when previewing */}
              {isPreviewing && (
                <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none">
                  <div className="absolute bottom-3 left-3 px-2 py-1 bg-blue-600 rounded text-white text-[11px] font-semibold">
                    PREVIEWING
                  </div>
                </div>
              )}
            </div>

            {/* Effect selector */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">Effect Preview</p>
                <button
                  onClick={onTogglePreview}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isPreviewing
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isPreviewing ? <Pause size={12} /> : <Play size={12} />}
                  {isPreviewing ? 'Pause' : 'Play Preview'}
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {EFFECTS.map(e => (
                  <button
                    key={e.id}
                    onClick={() => { onEffectChange(e.id); if (!isPreviewing) onTogglePreview() }}
                    className={`py-2 px-1 rounded-lg text-xs font-semibold border transition-colors text-center ${
                      effect === e.id
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── PATH B — Three.js 360° sphere ── */}
        {fileUrl && is360 && (
          <Suspense fallback={
            <div className="flex-1 rounded-xl bg-gray-900 flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <p className="text-white/60 text-sm">Loading 360° viewer…</p>
              </div>
            </div>
          }>
            <SphereViewer
              imageUrl={fileUrl}
              hotspots={hotspots}
              onHotspotsChange={onHotspotsChange}
            />
          </Suspense>
        )}
      </div>
    </div>
  )
}
