import { useState } from 'react'
import Navbar          from '../components/Navbar'
import Hero            from '../components/Hero'
import HowItWorks      from '../components/HowItWorks'
import Features        from '../components/Features'
import DemoMakerBanner from '../components/DemoMakerBanner'
import Footer          from '../components/Footer'
import DemoModal       from '../components/DemoModal'

export default function HomePage() {
  const [demoOpen, setDemoOpen] = useState(false)
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero onDemoOpen={() => setDemoOpen(true)} />
        <HowItWorks />
        <Features />
        {/* Visually separate "also available" section — not core Horizon */}
        <DemoMakerBanner />
      </main>
      <Footer />
      <DemoModal isOpen={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  )
}
