import { Link } from 'react-router-dom'
import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import { Camera, Wand2, Download, ArrowRight } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: Camera,
    title: 'Upload or Capture',
    description:
      'Upload any high-resolution photo of a tourist destination, or capture one live using your device camera. Supports JPEG, PNG, WebP and RAW formats.',
  },
  {
    number: '02',
    icon: Wand2,
    title: 'Describe or Let AI Write',
    description:
      'Type a custom narration for your place, or tap "Auto-Generate" and our AI instantly crafts a rich, engaging description using image recognition and travel data.',
  },
  {
    number: '03',
    icon: Download,
    title: 'Download & Share',
    description:
      'Receive your fully rendered 360° narrated video with AI voiceover in your chosen language. Export in Instagram Reels, YouTube 360, or VR-ready formats.',
  },
]

export default function HowItWorks() {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true })

  return (
    <section id="how-it-works" className="section-gray" ref={ref}>
      <div className="container">

        {/* Header */}
        <div className="mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45 }}
            className="section-title"
          >
            From Photo to{' '}
            <span className="text-blue-600">360° Story</span>
            {' '}in 3 Steps
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="section-sub"
          >
            No video editing experience needed. Our AI handles the heavy lifting —
            you just bring the photo and the story.
          </motion.p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="card p-7 group relative overflow-hidden"
              >
                {/* Large visible step number — behind content */}
                <span
                  className="absolute top-4 right-4 text-6xl font-black leading-none select-none pointer-events-none"
                  style={{ color: '#D1D5DB', zIndex: 0 }}
                >
                  {step.number}
                </span>

                {/* Icon & text — above number */}
                <div className="relative" style={{ zIndex: 1 }}>
                  <div className="w-11 h-11 rounded-lg bg-blue-600 flex items-center justify-center mb-5">
                    <Icon size={20} className="text-white" strokeWidth={2} />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-12 flex items-center gap-3"
        >
          <Link to="/signup" className="btn-primary">
            Create Your First 360° Story
            <ArrowRight size={16} />
          </Link>
          <span className="text-sm text-gray-400">No credit card required</span>
        </motion.div>
      </div>
    </section>
  )
}
