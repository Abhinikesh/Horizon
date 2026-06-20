/**
 * PhotosTab — "Photos to Video" workflow for Demo Maker.
 * Handles multi-photo upload, drag-to-reorder, per-photo narration,
 * AI auto-describe, and video settings.
 */
import { useState, useRef, useCallback } from 'react'
import {
  UploadCloud, X, Sparkles, GripVertical, ChevronDown,
  PlusCircle, Loader, Play,
} from 'lucide-react'
import { useToast } from '../ToastProvider'
import { uploadAPI, aiAPI, musicAPI } from '../../services/api'

const LANGUAGES   = ['English','Hindi','Spanish','French','German','Japanese','Portuguese','Arabic']
const VOICE_STYLES = ['Natural Female','Natural Male','Calm Female','Energetic Male','Professional Male']
const TRANSITIONS  = ['Fade','Slide','Zoom']
const DURATIONS    = [3, 4, 5, 6]
const FORMATS      = [
  { id: '16:9', label: 'Standard 16:9',  sub: 'YouTube / LinkedIn' },
  { id: '1:1',  label: 'Square 1:1',     sub: 'Twitter / Facebook' },
  { id: '9:16', label: 'Vertical 9:16',  sub: 'Reels / TikTok'    },
]
const MUSIC_STYLES = ['Ambient','Classical','Nature Sounds','Upbeat Travel','Cinematic']

const MAX_PHOTOS = 10
const MAX_NARR   = 200

export default function PhotosTab({ onGenerate, generating }) {
  const addToast = useToast()

  /* ── Photo state ── */
  const [photos, setPhotos]     = useState([]) // [{id, file, previewUrl, fileId, localPath, narration, uploading, aiLoading}]
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [bulkAiLoading, setBulkAiLoading]   = useState(false)
  const fileInputRef = useRef()

  /* ── Settings ── */
  const [duration,   setDuration]   = useState(4)
  const [transition, setTransition] = useState('Fade')
  const [language,   setLanguage]   = useState('English')
  const [voice,      setVoice]      = useState('Natural Female')
  const [bgMusic,    setBgMusic]    = useState(false)
  const [musicStyle, setMusicStyle] = useState('Ambient')
  const [format,     setFormat]     = useState('16:9')
  const [musicPreviewing, setMusicPreviewing] = useState(false)
  const musicAudioRef = useRef(null)

  /* ─────────────────────────────── Upload helpers ─────────────────────────── */

  const uploadPhoto = async (file, id) => {
    const preview = URL.createObjectURL(file)
    const entry   = { id, file, previewUrl: preview, fileId: null, localPath: null, narration: '', uploading: true, aiLoading: false }
    setPhotos(prev => [...prev, entry])

    try {
      const res = await uploadAPI.uploadImage(file)
      setPhotos(prev => prev.map(p =>
        p.id === id ? { ...p, fileId: res.file_id, localPath: res.local_path, uploading: false } : p
      ))
    } catch {
      addToast('Upload failed — please try again')
      setPhotos(prev => prev.filter(p => p.id !== id))
    }
  }

  const addFiles = useCallback(async (files) => {
    const allowed = MAX_PHOTOS - photos.length
    const toAdd   = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .slice(0, allowed)

    if (toAdd.length === 0) {
      if (photos.length >= MAX_PHOTOS) addToast(`Maximum ${MAX_PHOTOS} photos allowed`)
      return
    }
    for (const file of toAdd) {
      await uploadPhoto(file, `${Date.now()}_${Math.random()}`)
    }
  }, [photos.length])

  /* ── Drop zone ── */
  const onDrop = useCallback((e) => {
    e.preventDefault()
    setIsDraggingOver(false)
    addFiles(e.dataTransfer.files)
  }, [addFiles])

  const onDragOver = (e) => { e.preventDefault(); setIsDraggingOver(true) }
  const onDragLeave = () => setIsDraggingOver(false)

  /* ── Remove photo ── */
  const removePhoto = (id) => setPhotos(prev => prev.filter(p => p.id !== id))

  /* ── Update narration ── */
  const setNarration = (id, text) =>
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, narration: text.slice(0, MAX_NARR) } : p))

  /* ── Drag-to-reorder ── */
  const dragItem = useRef(null)
  const dragOver = useRef(null)

  const onReorderDragStart = (i) => { dragItem.current = i }
  const onReorderDragEnter = (i) => { dragOver.current = i }
  const onReorderDragEnd   = () => {
    if (dragItem.current === null || dragOver.current === null) return
    const next = [...photos]
    const [moved] = next.splice(dragItem.current, 1)
    next.splice(dragOver.current, 0, moved)
    dragItem.current = null
    dragOver.current = null
    setPhotos(next)
  }

  /* ── AI auto-describe ── */
  const autoDescribe = async (id) => {
    const photo = photos.find(p => p.id === id)
    if (!photo?.fileId) { addToast('Photo still uploading…'); return }
    setPhotos(prev => prev.map(p => p.id === id ? { ...p, aiLoading: true } : p))
    try {
      const res = await aiAPI.describe(photo.fileId, language)
      const text = (res.description || res.narration || '').slice(0, MAX_NARR)
      setPhotos(prev => prev.map(p => p.id === id ? { ...p, narration: text, aiLoading: false } : p))
    } catch {
      addToast('AI describe failed')
      setPhotos(prev => prev.map(p => p.id === id ? { ...p, aiLoading: false } : p))
    }
  }

  const autoDescribeAll = async () => {
    const pending = photos.filter(p => !p.narration.trim() && p.fileId)
    if (!pending.length) { addToast('All photos already have narration'); return }
    setBulkAiLoading(true)
    for (const p of pending) await autoDescribe(p.id)
    setBulkAiLoading(false)
  }

  /* ── Music preview ── */
  const handleMusicPreview = async () => {
    if (musicPreviewing) {
      musicAudioRef.current?.pause()
      musicAudioRef.current = null
      setMusicPreviewing(false)
      return
    }
    setMusicPreviewing(true)
    try {
      const url   = await musicAPI.preview(musicStyle)
      const audio = new Audio(url)
      musicAudioRef.current = audio
      audio.onended = () => { setMusicPreviewing(false); musicAudioRef.current = null }
      audio.onerror = () => { setMusicPreviewing(false); musicAudioRef.current = null }
      audio.play()
    } catch { setMusicPreviewing(false) }
  }

  /* ── Generate ── */
  const handleGenerate = () => {
    const ready = photos.filter(p => p.localPath)
    if (ready.length === 0) { addToast('Add at least one photo first'); return }
    const missing = ready.filter(p => !p.narration.trim())
    if (missing.length > 0) { addToast('Add narration for all photos (or use ✨ Auto-describe)'); return }

    onGenerate({
      type:     'photos',
      file_ids: ready.map(p => p.fileId),
      narrations: ready.map(p => p.narration.trim()),
      slide_duration: duration,
      transition,
      language,
      voice_style: voice,
      add_background_music: bgMusic,
      music_style: musicStyle,
      export_format: format,
    })
  }

  const canGenerate = photos.length > 0 && photos.every(p => !p.uploading) && !generating

  /* ─────────────────────────────── Render ─────────────────────────────────── */
  return (
    <div className="flex gap-6 min-h-0">

      {/* LEFT — upload + thumbnails */}
      <div className="w-72 shrink-0 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Photos</h3>

        {/* Drop zone */}
        {photos.length < MAX_PHOTOS && (
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              isDraggingOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <UploadCloud size={24} className="mx-auto text-gray-400 mb-2" />
            <p className="text-xs font-medium text-gray-700">
              Drop 5–10 photos here
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">in the order you want them to appear</p>
            <p className="text-[10px] text-gray-300 mt-2">JPEG · PNG · WebP · max 10 per upload</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={e => addFiles(e.target.files)}
        />

        {/* Thumbnails list */}
        {photos.length > 0 && (
          <div className="space-y-2">
            {photos.map((photo, i) => (
              <div
                key={photo.id}
                draggable
                onDragStart={() => onReorderDragStart(i)}
                onDragEnter={() => onReorderDragEnter(i)}
                onDragEnd={onReorderDragEnd}
                className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2 cursor-grab active:cursor-grabbing"
              >
                <GripVertical size={14} className="text-gray-300 shrink-0" />
                <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 shrink-0 relative">
                  <img src={photo.previewUrl} alt="" className="w-full h-full object-cover" />
                  {photo.uploading && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <Loader size={12} className="animate-spin text-blue-500" />
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-500 flex-1 truncate">Photo {i + 1}</span>
                <button onClick={() => removePhoto(photo.id)} className="text-gray-300 hover:text-red-400 transition-colors shrink-0">
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {photos.length > 0 && photos.length < MAX_PHOTOS && (
          <button onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors">
            <PlusCircle size={13} />
            Add More Photos
          </button>
        )}
      </div>

      {/* MIDDLE — per-photo narration */}
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Narration per Photo</h3>
          {photos.length > 0 && (
            <button
              onClick={autoDescribeAll}
              disabled={bulkAiLoading}
              className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 disabled:opacity-50 transition-colors"
            >
              {bulkAiLoading ? <Loader size={11} className="animate-spin" /> : <Sparkles size={11} />}
              Generate narration for all
            </button>
          )}
        </div>

        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-300">
            <UploadCloud size={36} className="mb-3" />
            <p className="text-sm text-gray-400">Upload photos to add narration</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {photos.map((photo, i) => (
              <div key={photo.id} className="bg-white border border-gray-200 rounded-xl p-3 flex gap-3">
                <img src={photo.previewUrl} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0 border border-gray-100" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-gray-500">Photo {i + 1}</span>
                    <button
                      onClick={() => autoDescribe(photo.id)}
                      disabled={photo.aiLoading || photo.uploading}
                      className="flex items-center gap-1 text-[10px] font-semibold text-purple-600 hover:text-purple-700 disabled:opacity-40 transition-colors"
                    >
                      {photo.aiLoading ? <Loader size={10} className="animate-spin" /> : <Sparkles size={10} />}
                      Auto-describe
                    </button>
                  </div>
                  <textarea
                    value={photo.narration}
                    onChange={e => setNarration(photo.id, e.target.value)}
                    placeholder="e.g. Here's the upload screen where users add their image"
                    rows={2}
                    className="w-full text-xs text-gray-700 placeholder-gray-300 border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-colors"
                  />
                  <div className="text-right">
                    <span className={`text-[10px] ${photo.narration.length > MAX_NARR - 20 ? 'text-amber-500' : 'text-gray-300'}`}>
                      {photo.narration.length}/{MAX_NARR}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT — settings */}
      <div className="w-64 shrink-0 space-y-5">
        <h3 className="text-sm font-semibold text-gray-700">Video Settings</h3>

        {/* Slide duration */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">Slide Duration</label>
          <div className="grid grid-cols-4 gap-1">
            {DURATIONS.map(d => (
              <button key={d} onClick={() => setDuration(d)}
                className={`py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  duration === d ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>
                {d}s
              </button>
            ))}
          </div>
        </div>

        {/* Transition */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">Transition</label>
          <div className="grid grid-cols-3 gap-1">
            {TRANSITIONS.map(t => (
              <button key={t} onClick={() => setTransition(t)}
                className={`py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  transition === t ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">Language</label>
          <Select value={language} onChange={setLanguage} options={LANGUAGES} />
        </div>

        {/* Voice style */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">Voice Style</label>
          <Select value={voice} onChange={setVoice} options={VOICE_STYLES} />
        </div>

        {/* Export format */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">Export Format</label>
          <div className="space-y-1">
            {FORMATS.map(f => (
              <button key={f.id} onClick={() => setFormat(f.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-colors ${
                  format === f.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                }`}>
                <span className={`text-xs font-semibold ${format === f.id ? 'text-blue-700' : 'text-gray-700'}`}>{f.label}</span>
                <span className="text-[10px] text-gray-400">{f.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Background music */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-gray-500">Background Music</label>
            <button
              onClick={() => setBgMusic(b => !b)}
              className={`relative w-8 h-4.5 rounded-full transition-colors ${bgMusic ? 'bg-blue-600' : 'bg-gray-300'}`}
              style={{ height: '18px', width: '32px' }}
            >
              <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all ${bgMusic ? 'left-[14px]' : 'left-0.5'}`} />
            </button>
          </div>
          {bgMusic && (
            <div className="space-y-2">
              <div className="flex gap-1.5">
                <div className="flex-1">
                  <Select value={musicStyle} onChange={setMusicStyle} options={MUSIC_STYLES} />
                </div>
                <button onClick={handleMusicPreview} title="Preview"
                  className={`shrink-0 px-2 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                    musicPreviewing ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>
                  {musicPreviewing ? <Loader size={11} className="animate-spin" /> : <Play size={11} />}
                </button>
              </div>
              <p className="text-[10px] text-gray-400">🎵 Plays at 15% beneath narration</p>
            </div>
          )}
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[.99] transition-all flex items-center justify-center gap-2"
        >
          {generating ? <><Loader size={16} className="animate-spin" /> Generating…</> : '🎬 Generate Demo Video'}
        </button>
      </div>
    </div>
  )
}

/* ── Tiny Select helper ── */
function Select({ value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none px-3 py-2 pr-8 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-colors cursor-pointer"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  )
}
