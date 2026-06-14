import { useState, useRef, useEffect, useCallback } from 'react'
import { RotateCcw, Camera, CheckCircle, RefreshCw } from 'lucide-react'

export default function CameraTab({ onCapture }) {
  const videoRef      = useRef(null)
  const canvasRef     = useRef(null)
  const streamRef     = useRef(null)
  const panoramaTimer = useRef(null)

  const [permState,   setPermState]   = useState('idle')   // idle | requesting | granted | denied
  const [facingMode,  setFacingMode]  = useState('environment')
  const [panoramic,   setPanoramic]   = useState(false)
  const [panProgress, setPanProgress] = useState(0)
  const [captured,    setCaptured]    = useState(null)     // data URL
  const [panDone,     setPanDone]     = useState(false)

  /* ── Start camera stream ── */
  const startStream = useCallback(async (facing = facingMode) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    setPermState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setPermState('granted')
    } catch {
      setPermState('denied')
    }
  }, [facingMode])

  /* Stop stream on unmount */
  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      if (panoramaTimer.current) clearInterval(panoramaTimer.current)
    }
  }, [])

  /* ── Capture single frame ── */
  const captureFrame = () => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return null
    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 360
    canvas.getContext('2d').drawImage(video, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.92)
  }

  const handleCapture = () => {
    const dataUrl = captureFrame()
    if (!dataUrl) return
    setCaptured(dataUrl)
    // Stop stream while previewing
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
  }

  const handleRetake = () => {
    setCaptured(null)
    setPanDone(false)
    setPanProgress(0)
    startStream(facingMode)
  }

  const handleUsePhoto = () => {
    if (!captured) return
    // Convert dataURL to File
    fetch(captured)
      .then(r => r.blob())
      .then(blob => {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' })
        onCapture(file)
      })
  }

  /* ── Switch camera ── */
  const handleSwitchCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    startStream(next)
  }

  /* ── Panoramic mode ── */
  const startPanorama = () => {
    setPanProgress(0)
    setPanDone(false)
    setCaptured(null)
    panoramaTimer.current = setInterval(() => {
      setPanProgress(prev => {
        if (prev >= 100) {
          clearInterval(panoramaTimer.current)
          const dataUrl = captureFrame()
          setCaptured(dataUrl)
          setPanDone(true)
          return 100
        }
        return prev + 1
      })
    }, 100)
  }

  const togglePanoramic = () => {
    const next = !panoramic
    setPanoramic(next)
    if (next) startPanorama()
    else {
      clearInterval(panoramaTimer.current)
      setPanProgress(0)
      setPanDone(false)
      setCaptured(null)
    }
  }

  return (
    <div className="space-y-3">
      {/* Permission states */}
      {permState === 'idle' && (
        <div className="rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center py-14 px-6 text-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center">
            <Camera size={22} className="text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700">Camera access needed</p>
            <p className="text-xs text-gray-400 mt-0.5">Your camera will activate when you click below</p>
          </div>
          <button onClick={() => startStream(facingMode)} className="btn-primary text-sm px-5 py-2">
            Enable Camera
          </button>
        </div>
      )}

      {permState === 'requesting' && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center py-14 gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Requesting camera access…</p>
        </div>
      )}

      {permState === 'denied' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center space-y-2">
          <p className="text-sm font-semibold text-red-700">Camera access denied</p>
          <p className="text-xs text-red-500">Please allow camera access in your browser settings and try again.</p>
          <button onClick={() => startStream(facingMode)} className="btn-outline text-sm px-4 py-2">
            Try Again
          </button>
        </div>
      )}

      {permState === 'granted' && (
        <>
          {/* Video container */}
          <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
            {!captured ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                {/* Panoramic overlay */}
                {panoramic && (
                  <>
                    {/* Progress bar */}
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-white/20">
                      <div
                        className="h-full bg-blue-500 transition-all duration-100"
                        style={{ width: `${panProgress}%` }}
                      />
                    </div>
                    {/* Guide dot */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-blue-400 bg-blue-400/20 backdrop-blur-sm transition-all duration-100"
                      style={{ left: `calc(${panProgress}% - 16px)`, maxLeft: 'calc(100% - 32px)' }}
                    />
                    {/* Instruction */}
                    <div className="absolute inset-x-0 bottom-4 flex justify-center">
                      <div className="px-3 py-1.5 bg-black/60 rounded-full">
                        <p className="text-white text-xs">Slowly rotate your phone left to right</p>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              /* Captured preview */
              <>
                <img src={captured} alt="Captured" className="w-full h-full object-cover" />
                {panDone && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-green-500 rounded-full shadow">
                    <CheckCircle size={13} className="text-white" />
                    <span className="text-white text-xs font-semibold">Panorama Complete</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Panoramic progress % badge */}
          {panoramic && !panDone && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-100" style={{ width: `${panProgress}%` }} />
              </div>
              <span className="text-xs font-semibold text-gray-600 tabular-nums w-9 text-right">{panProgress}%</span>
            </div>
          )}

          {/* Controls */}
          {!captured ? (
            <div className="flex items-center gap-2">
              {/* Switch camera */}
              <button
                onClick={handleSwitchCamera}
                className="w-10 h-10 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors shrink-0"
                title="Switch camera"
              >
                <RefreshCw size={16} />
              </button>

              {/* Capture button */}
              <button
                onClick={handleCapture}
                disabled={panoramic}
                className={`flex-1 h-10 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                  panoramic
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Camera size={16} />
                Capture
              </button>

              {/* Panoramic toggle */}
              <button
                onClick={togglePanoramic}
                className={`px-3 h-10 rounded-lg border text-xs font-semibold transition-colors shrink-0 ${
                  panoramic
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {panoramic ? 'Stop Pan' : 'Panoramic'}
              </button>
            </div>
          ) : (
            /* After capture */
            <div className="flex gap-2">
              <button onClick={handleRetake} className="btn-outline flex-1 text-sm py-2.5">
                Retake
              </button>
              <button onClick={handleUsePhoto} className="btn-primary flex-1 text-sm py-2.5">
                Use This Photo
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
