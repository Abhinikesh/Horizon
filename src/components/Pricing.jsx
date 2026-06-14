import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInView } from 'react-intersection-observer'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    price: { monthly: 0, annual: 0 },
    description: 'Perfect for individual creators just getting started.',
    cta: 'Get Started Free',
    ctaHref: '/signup',
    featured: false,
    features: [
      '5 videos per month',
      'Up to 1080p export',
      '3 language voices',
      'Basic hotspots (2 per scene)',
      'Standard AI narration',
      'Social export (720p)',
      'Community support',
    ],
  },
  {
    name: 'Creator',
    price: { monthly: 19, annual: 15 },
    description: 'For serious creators building an audience.',
    cta: 'Start Free Trial',
    ctaHref: '/signup',
    featured: true,
    badge: 'Most Popular',
    features: [
      'Unlimited videos',
      '4K UHD export',
      '40+ language voices',
      'Unlimited hotspots',
      'GPT-4 powered narration',
      'All social presets (4K)',
      'Custom branding & watermark',
      'Priority processing queue',
      'Email support',
    ],
  },
  {
    name: 'Studio',
    price: { monthly: 79, annual: 59 },
    description: 'For agencies, tour operators, and media teams.',
    cta: 'Contact Sales',
    ctaHref: 'mailto:sales@360tales.app',
    featured: false,
    features: [
      'Everything in Creator',
      'Team workspace (10 seats)',
      'API access & webhooks',
      'White-label export',
      'VR headset optimized output',
      'Batch processing (100+ videos)',
      'Custom AI voice cloning',
      'Dedicated account manager',
      'SLA-backed uptime guarantee',
    ],
  },
]

export default function Pricing() {
  const [annual, setAnnual] = useState(false)
  const { ref, inView } = useInView({ threshold: 0.05, triggerOnce: true })

  return (
    <section id="pricing" className="section-gray" ref={ref}>
      <div className="container">

        {/* Header */}
        <div className="mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45 }}
            className="section-title"
          >
            Simple Plans, No <span className="text-blue-600">Hidden Fees</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="section-sub"
          >
            Start free and scale as you grow. Cancel any time.
          </motion.p>

          {/* Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, delay: 0.14 }}
            className="mt-6 flex items-center gap-3"
          >
            <span className={`text-sm font-medium ${!annual ? 'text-gray-900' : 'text-gray-400'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(v => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 ${annual ? 'bg-blue-600' : 'bg-gray-200'}`}
              aria-label="Toggle billing period"
            >
              <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${annual ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <span className={`text-sm font-medium ${annual ? 'text-gray-900' : 'text-gray-400'}`}>
              Annual
              <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded">Save 20%</span>
            </span>
          </motion.div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, i) => {
            const price = annual ? plan.price.annual : plan.price.monthly
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`relative flex flex-col bg-white rounded-lg border ${
                  plan.featured
                    ? 'border-blue-600 shadow-md'
                    : 'border-gray-200 shadow-sm'
                }`}
              >
                {/* Featured header strip */}
                {plan.featured && (
                  <div className="px-6 py-2 bg-blue-600 rounded-t-lg">
                    <span className="text-xs font-bold text-white tracking-wide">{plan.badge}</span>
                  </div>
                )}

                <div className="p-7 flex flex-col flex-1">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mb-6">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      {price === 0 ? 'Free' : `$${price}`}
                    </span>
                    {price > 0 && <span className="text-gray-400 text-sm ml-1">/mo</span>}
                    {annual && price > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        Billed annually · Save ${(plan.price.monthly - price) * 12}/yr
                      </p>
                    )}
                  </div>

                  {/* CTA */}
                  <Link
                    to={plan.ctaHref}
                    className={`mb-7 text-sm font-semibold px-4 py-2.5 rounded-lg text-center transition-all duration-150 active:scale-[.98] ${
                      plan.featured
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    {plan.cta}
                  </Link>

                  {/* Features */}
                  <ul className="space-y-2.5 mt-auto">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <Check size={15} className={`mt-0.5 shrink-0 ${plan.featured ? 'text-blue-600' : 'text-gray-400'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Enterprise note */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-white border border-gray-200 rounded-lg"
        >
          <div>
            <p className="font-semibold text-gray-900 text-sm">Need a custom enterprise plan?</p>
            <p className="text-sm text-gray-500 mt-0.5">Custom AI models, on-premise deployment, and dedicated infrastructure.</p>
          </div>
          <a href="mailto:enterprise@360tales.app" className="btn-outline shrink-0 text-sm">
            Talk to Sales
          </a>
        </motion.div>
      </div>
    </section>
  )
}
