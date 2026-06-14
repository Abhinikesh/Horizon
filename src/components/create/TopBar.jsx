import { Link } from 'react-router-dom'
import { Globe, ArrowLeft, User } from 'lucide-react'

export default function TopBar() {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 gap-4 shrink-0 z-20">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
          <Globe size={14} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="text-base font-bold text-gray-900 tracking-tight hidden sm:block">
          360<span className="text-blue-600">Tales</span>
        </span>
      </Link>

      {/* Divider */}
      <div className="h-5 w-px bg-gray-200 shrink-0" />

      {/* Back */}
      <Link
        to="/"
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={15} />
        <span>Back to Home</span>
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Page title — center */}
      <span className="text-sm font-semibold text-gray-700 hidden md:block">
        Create 360° Story
      </span>

      <div className="flex-1 hidden md:block" />

      {/* User avatar */}
      <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer">
        <User size={16} />
      </div>
    </header>
  )
}
