import { useState } from 'react'
import UploadTab from './UploadTab'
import CameraTab from './CameraTab'
import Upload360Tab from './Upload360Tab'

const TABS = [
  { id: 'upload',  label: 'Upload File',   emoji: '📁' },
  { id: 'camera',  label: 'Camera',         emoji: '📷' },
  { id: '360',     label: '360° File',      emoji: '🌐' },
]

export default function LeftPanel({ onFileSelect, fileUrl }) {
  const [activeTab, setActiveTab] = useState('upload')

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">Upload or Capture</h2>
        <p className="text-xs text-gray-500 mt-0.5">Add your tourist place photo or video</p>
      </div>

      {/* Tab strip */}
      <div className="flex gap-1 px-4 pt-3 pb-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg text-[11px] font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-transparent'
            }`}
          >
            <span className="text-base leading-none">{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'upload' && (
          <UploadTab onFileSelect={f => onFileSelect(f, false)} fileUrl={fileUrl && !false} />
        )}
        {activeTab === 'camera' && (
          <CameraTab onCapture={f => onFileSelect(f, false)} />
        )}
        {activeTab === '360' && (
          <Upload360Tab onFileSelect={f => onFileSelect(f, true)} />
        )}
      </div>
    </div>
  )
}
