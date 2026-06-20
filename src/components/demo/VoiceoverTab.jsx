/**
 * VoiceoverTab — "Screen Recording Voiceover" workflow for Demo Maker.
 * Single video upload, narration script editor, audio mixing settings.
 */
import { useState, useRef, useCallback } from 'react'
import { UploadCloud, X, Sparkles, ChevronDown, Loader, Film, Volume2, VolumeX } from 'lucide-react'
import { useToast } from '../ToastProvider'
import { uploadAPI } from '../../services/api'

const LANGUAGES    = ['English','Hindi','Spanish','French','German','Japanese','Portuguese','Arabic']
const VOICE_STYLES = ['Natural Female','Natural Male','Calm Female','Energetic Male','Professional Male']
const MAX_NARR     = 2000

const TEMPLATE = `Welcome to [your app name]. Let's walk through how it works.

First, [describe first action].

Next, [describe second action].

Finally, [describe result or outcome].

That's how easy it is to get started.`

export default function VoiceoverTab({ onGenerate, generating }) {
  const addToast = useToast()

  /* ── Video state ── */
  const [video,         setVideo]         = useState(null)  // {file, previewUrl, fileId, localPath, duration, uploading}
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const fileInputRef = useRef()
  const videoRef     = useRef()

  /* ── Narration ── */
  const [narration, setNarration] = useState('')

  /* ── Settings ── */
  const [language,    setLanguage]    = useState('English')
  const [voice,       setVoice]       = useState('Natural Female')
  const [audioMode,   setAudioMode]   = useState('keep_low')     // 'mute_original' | 'keep_low'
  const [origVolume,  setOrigVolume]  = useState(0.20)
  const [autoStretch, setAutoStretch] = useState(true)

  /* ─────────────────────────────── Upload ─────────────────────────────────── */

  const uploadVideo = useCallback(async (file) => {
    if (!file.type.match(/video\/(mp4|quicktime|webm)/)) {
      addToast('Please upload an MP4, MOV, or WebM file')
      return
    }
    if (file.size > 200 * 1024 * 1024) {
      addToast('Video must be under 200 MB')
      return
    }
    const previewUrl = URL.createObjectURL(file)
    setVideo({ file, previewUrl, fileId: null, localPath: null, duration: null, uploading: true })

    try {
      const res = await uploadAPI.uploadVideo(file)
      setVideo(v => ({ ...v, fileId: res.file_id, localPath: res.local_path, uploading: false }))
    } catch {
      addToast('Video upload failed — please try again')
      setVideo(null)
    }
  }, [])

  const onDrop = (e) => {
    e.preventDefault()
    setIsDraggingOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadVideo(file)
  }

  const onVideoLoaded = () => {
    if (!videoRef.current) return
    const secs = videoRef.current.duration
    if (isNaN(secs)) return
    const m = Math.floor(secs / 60)
    const s = Math.round(secs % 60)
    setVideo(v => v ? { ...v, duration: `${m}:${String(s).padStart(2, '0')}` } : v)
  }

  /* ── Template insert ── */
  const insertTemplate = () => {
    if (narration.trim()) {
      if (!window.confirm('This will replace your current script. Continue?')) return
    }
    setNarration(TEMPLATE)
  }

  /* ── Generate ── */
  const handleGenerate = () => {
    if (!video?.localPath && !video?.fileId) { addToast('Upload a screen recording first'); return }
    if (video.uploading) { addToast('Please wait for the upload to finish'); return }
    if (!narration.trim()) { addToast('Write a narration script first'); return }

    onGenerate({
      type:            'voiceover',
      file_id:         video.fileId,
      narration_text:  narration.trim(),
      language,
      voice_style:     voice,
      audio_mode:      audioMode,
      original_volume: audioMode === 'keep_low' ? origVolume : 0,
      auto_stretch:    autoStretch,
    })
  }

  const canGenerate = video && !video.uploading && narration.trim().length > 0 && !generating

  /* ─────────────────────────────── Render ─────────────────────────────────── */
  return (
    <div className="flex gap-6 min-h-0">

      {/* LEFT — video upload */}
      <div className="w-72 shrink-0 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Screen Recording</h3>

        {!video ? (
          <div
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); setIsDraggingOver(true) }}
            onDragLeave={() => setIsDraggingOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDraggingOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <Film size={28} className="mx-auto text-gray-400 mb-3" />
            <p className="text-xs font-medium text-gray-700">Drop your screen recording here</p>
            <p className="text-[11px] text-gray-400 mt-1">MP4 · MOV · WebM · max 200 MB</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-black border border-gray-200">
              <video
                ref={videoRef}
                src={video.previewUrl}
                controls
                playsInline
                onLoadedMetadata={onVideoLoaded}
                className="w-full max-h-48 object-contain"
              />
              {video.uploading && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                  <Loader size={20} className="animate-spin text-white" />
                  <span className="text-xs text-white font-medium">Uploading…</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
              <div>
                <p className="text-xs font-medium text-gray-700 truncate max-w-[160px]">{video.file.name}</p>
                {video.duration && (
                  <p className="text-[11px] text-gray-400">Duration: {video.duration}</p>
                )}
              </div>
              <button onClick={() => setVideo(null)} className="text-gray-300 hover:text-red-400 transition-colors ml-2">
                <X size={15} />
              </button>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors text-left px-1"
            >
              ↩ Replace video
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={e => { if (e.target.files[0]) uploadVideo(e.target.files[0]) }}
        />
      </div>

      {/* MIDDLE — narration script */}
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Narration Script</h3>
          <button
            onClick={insertTemplate}
            className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors"
          >
            <Sparkles size={11} />
            Suggest narration structure
          </button>
        </div>

        <div className="relative">
          <textarea
            value={narration}
            onChange={e => setNarration(e.target.value.slice(0, MAX_NARR))}
            placeholder={`Write the full narration script for this video.\n\nDescribe what's happening as the viewer watches — e.g. First, click the upload button. Then select your photo...`}
            className="w-full h-[420px] text-sm text-gray-700 placeholder-gray-300 border border-gray-200 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-colors leading-relaxed"
          />
          <div className={`absolute bottom-3 right-3 text-[11px] font-medium ${narration.length > MAX_NARR - 100 ? 'text-amber-500' : 'text-gray-300'}`}>
            {narration.length} / {MAX_NARR}
          </div>
        </div>
      </div>

      {/* RIGHT — audio settings */}
      <div className="w-64 shrink-0 space-y-5">
        <h3 className="text-sm font-semibold text-gray-700">Audio Settings</h3>

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

        {/* Original audio mode */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-2 block">Original Video Audio</label>
          <div className="space-y-2">
            {[
              { id: 'mute_original', icon: VolumeX, label: 'Mute original, narration only' },
              { id: 'keep_low',      icon: Volume2, label: 'Keep original low, layer narration' },
            ].map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setAudioMode(id)}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                  audioMode === id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                }`}>
                <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                  audioMode === id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                }`}>
                  {audioMode === id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Icon size={12} className={audioMode === id ? 'text-blue-600' : 'text-gray-400'} />
                    <span className={`text-xs font-semibold ${audioMode === id ? 'text-blue-700' : 'text-gray-700'}`}>
                      {id === 'mute_original' ? '🔇 Mute original' : '🔉 Keep original low'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed">{label}</p>
                </div>
              </button>
            ))}
          </div>

          {audioMode === 'keep_low' && (
            <div className="mt-3 px-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-gray-500 font-medium">Original volume</span>
                <span className="text-[11px] font-semibold text-gray-700">{Math.round(origVolume * 100)}%</span>
              </div>
              <input
                type="range" min={0} max={100} step={5}
                value={Math.round(origVolume * 100)}
                onChange={e => setOrigVolume(Number(e.target.value) / 100)}
                className="w-full h-1.5 rounded-full appearance-none bg-gray-200 accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-300 mt-1">
                <span>Silent</span><span>Full</span>
              </div>
            </div>
          )}
        </div>

        {/* Auto-stretch */}
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <button
            onClick={() => setAutoStretch(s => !s)}
            className={`shrink-0 mt-0.5 relative w-8 rounded-full transition-colors`}
            style={{ height: '18px', width: '32px', background: autoStretch ? '#2563eb' : '#d1d5db' }}
          >
            <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all ${autoStretch ? 'left-[14px]' : 'left-0.5'}`} />
          </button>
          <div>
            <p className="text-xs font-semibold text-gray-700">⏱ Auto-stretch narration</p>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
              Adjusts narration speed (±15%) to match video length
            </p>
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[.99] transition-all flex items-center justify-center gap-2"
        >
          {generating ? <><Loader size={16} className="animate-spin" />Generating…</> : '🎬 Generate Voiceover Video'}
        </button>
      </div>
    </div>
  )
}

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
