import { useState, useRef, useCallback } from 'react'
import { UploadCloud, X, Info } from 'lucide-react'

const ACCEPT_360 = '.jpg,.jpeg,.png,.webp,.mp4,.mov'

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Upload360Tab({ onFileSelect }) {
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview]   = useState(null)
  const inputRef = useRef(null)

  const processFile = useCallback(file => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview({ url, name: file.name, size: formatBytes(file.size), type: file.type })
    onFileSelect(file)
  }, [onFileSelect])

  const handleDrop = e => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleRemove = () => {
    setPreview(null); onFileSelect(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onClick={() => !preview && inputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed transition-colors overflow-hidden
          ${preview ? 'border-gray-200 cursor-default' : 'cursor-pointer'}
          ${dragging ? 'border-blue-500 bg-blue-50' : preview ? 'border-gray-200' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
        style={{ minHeight: 180 }}
      >
        {preview ? (
          <div className="relative">
            {preview.type?.startsWith('video/') ? (
              <video src={preview.url} className="w-full h-40 object-cover" muted autoPlay loop playsInline />
            ) : (
              <img src={preview.url} alt={preview.name} className="w-full h-40 object-cover" />
            )}
            <button
              onClick={e => { e.stopPropagation(); handleRemove() }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
            >
              <X size={14} />
            </button>
            <div className="bg-white border-t border-gray-100 px-3 py-2 flex items-center gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{preview.name}</p>
                <p className="text-[11px] text-gray-400">{preview.size}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 px-5 text-center">
            <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center mb-3 transition-colors ${
              dragging ? 'border-blue-500 bg-blue-100' : 'border-gray-200 bg-gray-50'
            }`}>
              <UploadCloud size={22} className={dragging ? 'text-blue-600' : 'text-gray-400'} />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              {dragging ? 'Drop your 360° file' : 'Upload equirectangular 360° photo or video'}
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              From Insta360, GoPro MAX, Ricoh Theta<br />
              Equirectangular format only
            </p>
          </div>
        )}
      </div>

      {!preview && (
        <button onClick={() => inputRef.current?.click()} className="btn-outline w-full text-sm py-2.5">
          Browse Files
        </button>
      )}

      <input ref={inputRef} type="file" accept={ACCEPT_360} onChange={e => { if (e.target.files[0]) processFile(e.target.files[0]) }} className="hidden" />

      {/* Info box */}
      <div className="flex gap-2.5 p-3.5 bg-blue-50 border border-blue-200 rounded-lg">
        <Info size={15} className="text-blue-600 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700 leading-relaxed">
          <span className="font-semibold">Path B — Real 360° Sphere Viewer mode.</span>{' '}
          Your file will be displayed in an interactive 3D sphere with hotspot support.
          Drag to explore the full panorama.
        </p>
      </div>
    </div>
  )
}
