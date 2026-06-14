import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import { ScanEye, Aperture, Bot, Languages, MapPin, Share2 } from 'lucide-react'

const features = [
  {
    icon: ScanEye,
    title: 'AI Depth-Based 360° Effect',
    description:
      'Our monocular depth estimation AI converts flat photos into parallax-rich 360° scenes with realistic spatial depth — no 3D camera needed.',
  },
  {
    icon: Aperture,
    title: 'Live Camera Panoramic Capture',
    description:
      'Capture sweeping panoramas directly from your phone or webcam using our guided in-browser camera tool. No app installation required.',
  },
  {
    icon: Bot,
    title: 'AI Auto-Description from Image',
    description:
      'Our vision-language model generates a historically accurate, engaging narration script with cultural context automatically from any landmark.',
  },
  {
    icon: Languages,
    title: 'Multi-Language Voice Narration',
    description:
      'Generate lifelike AI voiceovers in 40+ languages including Hindi, Spanish, French, Arabic, and Japanese with natural tone and accent variation.',
  },
  {
    icon: MapPin,
    title: 'Interactive Hotspot Info Points',
    description:
      'Add clickable info-point overlays to your 360° scene — label architectural details, historical facts, or links to related content viewers can explore.',
  },
  {
    icon: Share2,
    title: 'Social Media Export Presets',
    description:
      'One-click export for Instagram Reels (9:16), YouTube 360, Facebook 360 VR, and Meta Quest — all in the right resolution and codec.',
  },
]

export default function Features() {
  const { ref, inView } = useInView({ threshold: 0.05, triggerOnce: true })

  return (
    <section id="features" className="section-white" ref={ref}>
      <div className="container">

        {/* Header */}
        <div className="mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45 }}
            className="section-title"
          >
            Everything You Need to{' '}
            <span className="text-blue-600">Tell Immersive Stories</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="section-sub"
          >
            Professional-grade tools previously exclusive to expensive production studios —
            now available to every creator, traveler, and marketer.
          </motion.p>
        </div>

        {/* 3×2 grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, i) => {
            const Icon = feat.icon
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="card p-6 group hover:shadow-md transition-shadow duration-200"
              >
                <div className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center mb-4 group-hover:border-blue-200 group-hover:bg-blue-50 transition-colors">
                  <Icon size={18} className="text-blue-600" strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{feat.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feat.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
