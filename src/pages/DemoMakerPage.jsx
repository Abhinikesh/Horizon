/**
 * DemoMakerPage — standalone demo / explainer video creator.
 * Route: /demo-maker   (accessible via navbar, homepage banner, and sidebar)
 *
 * Tabs:
 *   📸 Photos to Video  — slideshow with per-photo narration
 *   🎥 Screen Recording Voiceover — add TTS over an existing recording
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Link2, Play, RefreshCw } from 'lucide-react'
import { useToast } from '../components/ToastProvider'
import ProcessingScreen from '../components/create/ProcessingScreen'
import PhotosTab        from '../components/demo/PhotosTab'
import VoiceoverTab     from '../components/demo/VoiceoverTab'
import { demoAPI, projectsAPI, getToken } from '../services/api'

/* ── Processing step labels ─────────────────────────────────────────────── */
const PHOTOS_STEPS = [
  'Generating narration audio…',
  'Building slideshow…',
  'Adding transitions…',
  'Mixing audio tracks…',
  'Adding background music…',
  'Finalizing demo video…',
]

const VOICEOVER_STEPS = [
  'Processing your video…',
  'Generating voiceover…',
  'Syncing audio…',
  'Mixing tracks…',
  'Finalizing…',
]

/* ── Progress → step index mapping ─────────────────────────────────────── */
const photosStepIdx  = (p) => p < 10 ? 0 : p < 40 ? 0 : p < 60 ? 1 : p < 70 ? 2 : p < 80 ? 3 : p < 90 ? 4 : 5
const voiceStepIdx   = (p) => p < 15 ? 0 : p < 55 ? 1 : p < 70 ? 2 : p < 90 ? 3 : 4

/* ── Auth guard ─────────────────────────────────────────────────────────── */
function useAuth() {
  const navigate = useNavigate()
  useEffect(() => {
    // getToken() reads 'horizon_token' — the key api.js actually uses
    if (!getToken())
      navigate('/login', { state: { from: '/demo-maker' }, replace: true })
  }, [navigate])
}

/** Back href: /dashboard when logged in, / when not. */
function useBackHref() {
  return getToken() ? '/dashboard' : '/'
}

export default function DemoMakerPage() {
  useAuth()
  const addToast  = useToast()
  const backHref  = useBackHref()

  /* ── UI state ─── */
  const [activeTab, setActiveTab] = useState('photos')          // 'photos' | 'voiceover'
  const [phase,     setPhase]     = useState('input')           // 'input' | 'processing' | 'result'

  /* ── Processing state ─── */
  const [projectId,  setProjectId]  = useState(null)
  const [progress,   setProgress]   = useState(0)
  const [projectData, setProjectData] = useState(null)

  /* ── Result state ─── */
  const [result, setResult] = useState(null)

  const pollRef = useRef(null)

  /* ─────────────────────────── Generate handler ─────────────────────────── */

  const handleGenerate = useCallback(async (params) => {
    setPhase('processing')
    setProgress(0)
    setProjectId(null)

    try {
      let res
      if (params.type === 'photos') {
        const { type: _, ...body } = params
        res = await demoAPI.photosToVideo(body)
      } else {
        const { type: _, ...body } = params
        res = await demoAPI.voiceoverVideo(body)
      }

      const pid = res.project_id || res.data?.project_id
      if (!pid) throw new Error('No project_id returned')
      setProjectId(pid)
      startPolling(pid, params.type)
    } catch (err) {
      addToast('Generation failed — is the backend running?')
      setPhase('input')
    }
  }, [])

  /* ─────────────────────────── Polling ──────────────────────────────────── */

  const startPolling = useCallback((pid, type) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const data = await projectsAPI.get(pid)
        const proj  = data.data || data
        setProgress(proj.progress_percent ?? 0)
        setProjectData(proj)

        if (proj.status === 'ready') {
          clearInterval(pollRef.current)
          pollRef.current = null
          setProgress(100)
          setResult({ ...proj, projectType: type })
          setTimeout(() => setPhase('result'), 600)
        } else if (proj.status === 'failed') {
          clearInterval(pollRef.current)
          pollRef.current = null
          addToast('Generation failed. Please try again.')
          setPhase('input')
        }
      } catch {/* network hiccup — keep polling */}
    }, 2000)
  }, [])

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  /* ─────────────────────────── Phase: Processing ─────────────────────────── */

  if (phase === 'processing') {
    const steps   = activeTab === 'photos' ? PHOTOS_STEPS : VOICEOVER_STEPS
    const stepIdx = activeTab === 'photos' ? photosStepIdx(progress) : voiceStepIdx(progress)
    const task    = activeTab === 'photos' ? 'Building your demo video' : 'Creating voiceover video'

    return (
      <ProcessingScreen
        progress={progress}
        stepIndex={stepIdx}
        steps={steps}
        taskLabel={task}
        onComplete={() => { /* handled by polling */ }}
      />
    )
  }

  /* ─────────────────────────── Phase: Result ─────────────────────────────── */

  if (phase === 'result' && result) {
    return <DemoResultScreen result={result} onCreateAnother={() => { setPhase('input'); setResult(null) }} />
  }

  /* ─────────────────────────── Phase: Input ──────────────────────────────── */

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Top bar */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 shrink-0">
        <Link to={backHref} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">
          <ArrowLeft size={15} />
          Back to Horizon
        </Link>
        <div className="h-5 w-px bg-gray-200 mx-1" />
        <span className="text-base font-bold text-gray-900">
          Demo <span className="text-blue-600">Maker</span>
        </span>
        <div className="flex-1" />
        <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
          Beta
        </span>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Create a Product Demo Video</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Turn photos or screen recordings into polished explainer videos with AI narration.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'photos',    emoji: '📸', label: 'Photos to Video' },
            { id: 'voiceover', emoji: '🎥', label: 'Screen Recording Voiceover' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <span>{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          {activeTab === 'photos'
            ? <PhotosTab    onGenerate={handleGenerate} generating={false} />
            : <VoiceoverTab onGenerate={handleGenerate} generating={false} />
          }
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   DemoResultScreen — inline result view (no QR, no 3-col layout)
═══════════════════════════════════════════════════════════════════════════ */

function DemoResultScreen({ result, onCreateAnother }) {
  const addToast   = useToast()
  const backHref   = useBackHref()
  const [videoErr, setVideoErr] = useState(false)

  const videoSrc  = result?.output_url  || result?.output_video_url || ''
  const shareLink = `${window.location.origin}/share/${result?.id || ''}`

  const handleDownload = () => {
    if (!videoSrc) { addToast('No video URL available'); return }
    const a = document.createElement('a')
    a.href     = videoSrc
    a.download = `demo-video-${(result?.id || 'output').slice(0, 8)}.mp4`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    addToast('Download started!')
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink).catch(() => {})
    addToast('Share link copied!')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 shrink-0">
        <Link to={backHref} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">
          <ArrowLeft size={15} />
          Back to Horizon
        </Link>
        <div className="h-5 w-px bg-gray-200 mx-1" />
        <span className="text-base font-bold text-gray-900">
          Demo <span className="text-blue-600">Maker</span>
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-green-600">
          <span className="text-sm font-semibold">✅ Demo Ready</span>
        </div>
      </header>

      <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 space-y-6">

        <div>
          <h1 className="text-xl font-bold text-gray-900">{result?.title || 'Your Demo Video is Ready!'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Download or share your video below.</p>
        </div>

        {/* Video player */}
        <div className="rounded-xl overflow-hidden bg-black border border-gray-200 shadow-sm">
          {videoErr || !videoSrc ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 bg-gray-100">
              <Play size={32} className="text-gray-300" />
              <p className="text-sm text-gray-400">Video preview unavailable</p>
              <p className="text-xs text-gray-300">Your download is still ready below</p>
            </div>
          ) : (
            <video
              src={videoSrc}
              controls
              autoPlay
              loop
              playsInline
              onError={() => setVideoErr(true)}
              style={{ width: '100%', display: 'block' }}
            />
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <button onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-3 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[.98] transition-all">
            <Download size={16} />
            Download MP4
          </button>
          <button onClick={handleCopy}
            className="flex items-center gap-2 px-5 py-3 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors">
            <Link2 size={16} />
            Copy Share Link
          </button>
        </div>

        {/* Create another */}
        <div className="pt-2 border-t border-gray-100">
          <button
            onClick={onCreateAnother}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            <RefreshCw size={14} />
            Create Another Demo
          </button>
        </div>
      </div>
    </div>
  )
}
