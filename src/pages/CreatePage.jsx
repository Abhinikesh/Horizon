import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import TopBar from '../components/create/TopBar'
import LeftPanel from '../components/create/LeftPanel'
import MiddlePanel from '../components/create/MiddlePanel'
import RightPanel from '../components/create/RightPanel'
import ProcessingScreen from '../components/create/ProcessingScreen'
import ResultScreen from '../components/create/ResultScreen'

export default function CreatePage() {
  const navigate = useNavigate()

  // Auth guard
  useEffect(() => {
    if (!localStorage.getItem('360tales_auth')) navigate('/login')
  }, [navigate])

  // App flow state
  const [appState, setAppState] = useState('create') // 'create' | 'processing' | 'result'

  // File state
  const [file, setFile] = useState(null)
  const [fileUrl, setFileUrl] = useState(null)
  const [is360, setIs360] = useState(false)

  // Preview state
  const [effect, setEffect] = useState('slowPan')
  const [isPreviewing, setIsPreviewing] = useState(false)

  // Hotspots for sphere viewer
  const [hotspots, setHotspots] = useState([])

  // Narration
  const [narration, setNarration] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiGenerated, setAiGenerated] = useState(false)

  // Voice
  const [language, setLanguage] = useState('English')
  const [voiceStyle, setVoiceStyle] = useState('Natural (Female)')

  // Export
  const [format, setFormat] = useState('Standard MP4')

  // Additional options
  const [bgMusic, setBgMusic] = useState(false)
  const [musicStyle, setMusicStyle] = useState('Ambient')
  const [subtitles, setSubtitles] = useState(true)
  const [watermark, setWatermark] = useState(false)
  const [watermarkText, setWatermarkText] = useState('')

  // Mobile step navigation
  const [mobileStep, setMobileStep] = useState(0) // 0=left, 1=middle, 2=right

  const handleFileSelect = useCallback((selectedFile, as360 = false) => {
    if (!selectedFile) {
      setFile(null)
      setFileUrl(null)
      setIs360(false)
      return
    }
    const url = URL.createObjectURL(selectedFile)
    setFile(selectedFile)
    setFileUrl(url)
    setIs360(as360)
    setHotspots([])
    setIsPreviewing(false)
  }, [])

  const handleGenerate = () => {
    if (!file && !fileUrl) return
    setAppState('processing')
  }

  const handleProcessingComplete = () => {
    setAppState('result')
  }

  const handleCreateAnother = () => {
    setFile(null)
    setFileUrl(null)
    setIs360(false)
    setNarration('')
    setAiGenerated(false)
    setHotspots([])
    setAppState('create')
    setMobileStep(0)
  }

  const handleAiGenerate = () => {
    setAiLoading(true)
    setTimeout(() => {
      setNarration(
        'Nestled in the heart of one of the world\'s most iconic landscapes, this breathtaking destination ' +
        'has captivated travelers for centuries. The site holds deep cultural and historical significance — ' +
        'a testament to remarkable human achievement and natural wonder. Visitors are drawn by its timeless beauty, ' +
        'architectural grandeur, and the stories etched into every stone. Best visited during the early morning hours ' +
        'when golden light illuminates the scene. A truly immersive experience awaits those who take the time to explore ' +
        'beyond the surface and listen to the whispers of history.'
      )
      setAiLoading(false)
      setAiGenerated(true)
    }, 2200)
  }

  if (appState === 'processing') {
    return <ProcessingScreen onComplete={handleProcessingComplete} />
  }

  if (appState === 'result') {
    return (
      <ResultScreen
        fileUrl={fileUrl}
        format={format}
        language={language}
        voiceStyle={voiceStyle}
        onCreateAnother={handleCreateAnother}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />

      {/* Mobile step indicator */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          {['Input', 'Preview', 'Settings'].map((label, i) => (
            <button
              key={label}
              onClick={() => setMobileStep(i)}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                mobileStep === i
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main 3-column layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* LEFT PANEL */}
        <div className={`w-full md:w-[340px] lg:w-[380px] border-r border-gray-200 bg-white overflow-y-auto shrink-0 ${mobileStep !== 0 ? 'hidden md:block' : ''}`}>
          <LeftPanel onFileSelect={handleFileSelect} fileUrl={fileUrl} />
        </div>

        {/* MIDDLE PANEL */}
        <div className={`flex-1 overflow-y-auto bg-gray-50 ${mobileStep !== 1 ? 'hidden md:block' : ''}`}>
          <MiddlePanel
            fileUrl={fileUrl}
            is360={is360}
            effect={effect}
            onEffectChange={setEffect}
            isPreviewing={isPreviewing}
            onTogglePreview={() => setIsPreviewing(v => !v)}
            hotspots={hotspots}
            onHotspotsChange={setHotspots}
          />
        </div>

        {/* RIGHT PANEL */}
        <div className={`w-full md:w-[340px] lg:w-[380px] border-l border-gray-200 bg-white overflow-y-auto shrink-0 ${mobileStep !== 2 ? 'hidden md:block' : ''}`}>
          <RightPanel
            narration={narration}
            onNarrationChange={setNarration}
            aiLoading={aiLoading}
            aiGenerated={aiGenerated}
            onAiGenerate={handleAiGenerate}
            language={language}
            onLanguageChange={setLanguage}
            voiceStyle={voiceStyle}
            onVoiceStyleChange={setVoiceStyle}
            format={format}
            onFormatChange={setFormat}
            bgMusic={bgMusic}
            onBgMusicChange={setBgMusic}
            musicStyle={musicStyle}
            onMusicStyleChange={setMusicStyle}
            subtitles={subtitles}
            onSubtitlesChange={setSubtitles}
            watermark={watermark}
            onWatermarkChange={setWatermark}
            watermarkText={watermarkText}
            onWatermarkTextChange={setWatermarkText}
            canGenerate={!!fileUrl}
            onGenerate={handleGenerate}
          />
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <div className="md:hidden bg-white border-t border-gray-200 px-4 py-3 flex gap-3">
        {mobileStep > 0 && (
          <button onClick={() => setMobileStep(s => s - 1)} className="btn-outline flex-1 py-2.5 text-sm">
            Back
          </button>
        )}
        {mobileStep < 2 && (
          <button onClick={() => setMobileStep(s => s + 1)} className="btn-primary flex-1 py-2.5 text-sm">
            Next
          </button>
        )}
        {mobileStep === 2 && (
          <button
            onClick={handleGenerate}
            disabled={!fileUrl}
            className={`btn-primary flex-1 py-2.5 text-sm ${!fileUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Generate Story
          </button>
        )}
      </div>
    </div>
  )
}
