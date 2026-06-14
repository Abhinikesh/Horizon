import { useState, useRef, useCallback } from 'react'
import { UploadCloud, X, FileImage, FileVideo } from 'lucide-react'

const ACCEPT = '.jpg,.jpeg,.png,.webp,.mp4,.mov'
const MAX_MB = 50

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function UploadTab({ onFileSelect }) {
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState(null)   // { url, name, size, type }
  const inputRef = useRef(null)

  const processFile = useCallback(file => {
    if (!file) return
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`File is too large. Maximum size is ${MAX_MB} MB.`)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview({ url, name: file.name, size: formatBytes(file.size), type: file.type })
    onFileSelect(file)
  }, [onFileSelect])

  const handleDrop = useCallback(e => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const handleDragOver = e => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)

  const handleInputChange = e => {
    const file = e.target.files[0]
    if (file) processFile(file)
  }

  const handleRemove = () => {
    setPreview(null)
    onFileSelect(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const isVideo = preview?.type?.startsWith('video/')

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !preview && inputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed transition-colors duration-150 overflow-hidden
          ${preview ? 'border-gray-200 cursor-default' : 'cursor-pointer'}
          ${dragging ? 'border-blue-500 bg-blue-50' : preview ? 'border-gray-200' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
        style={{ minHeight: 200 }}
      >
        {preview ? (
          /* ── File preview ── */
          <div className="relative">
            {isVideo ? (
              <video
                src={preview.url}
                className="w-full h-44 object-cover"
                muted
                loop
                autoPlay
                playsInline
              />
            ) : (
              <img
                src={preview.url}
                alt={preview.name}
                className="w-full h-44 object-cover"
              />
            )}
            {/* Remove button */}
            <button
              onClick={e => { e.stopPropagation(); handleRemove() }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center text-gray-500 hover:text-red-500 hover:border-red-300 transition-colors"
            >
              <X size={14} />
            </button>
            {/* File info bar */}
            <div className="bg-white border-t border-gray-100 px-4 py-2.5 flex items-center gap-2.5">
              {isVideo
                ? <FileVideo size={16} className="text-blue-500 shrink-0" />
                : <FileImage size={16} className="text-blue-500 shrink-0" />
              }
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{preview.name}</p>
                <p className="text-[11px] text-gray-400">{preview.size}</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
                className="ml-auto text-xs text-blue-600 hover:text-blue-700 font-medium shrink-0"
              >
                Change
              </button>
            </div>
          </div>
        ) : (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center mb-4 transition-colors ${
              dragging ? 'border-blue-500 bg-blue-100' : 'border-gray-200 bg-gray-50'
            }`}>
              <UploadCloud size={22} className={dragging ? 'text-blue-600' : 'text-gray-400'} />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              {dragging ? 'Drop your file here' : 'Drag & drop your photo or video'}
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Supports JPEG, PNG, WebP, MP4, MOV<br />Max {MAX_MB} MB
            </p>
          </div>
        )}
      </div>

      {/* Browse button */}
      {!preview && (
        <button
          onClick={() => inputRef.current?.click()}
          className="btn-outline w-full text-sm py-2.5"
        >
          Browse Files
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  )
}
