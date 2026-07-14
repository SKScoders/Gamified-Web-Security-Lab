'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import { useAuth } from '@/lib/auth-context'
import { Menu, X, LogOut, User } from 'lucide-react'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const { logout } = useAuth()

  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/dashboard"
              className="text-sm text-foreground hover:text-signal transition-colors"
            >
              Challenges
            </Link>
            <Link
              href="/leaderboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Leaderboard
            </Link>
            <Link
              href="/profile"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Profile
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-foreground hover:bg-surface-elevated"
              onClick={() => router.push('/profile')}
            >
              <User size={18} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-foreground hover:bg-surface-elevated"
              onClick={async () => { await logout(); router.push('/login') }}
            >
              <LogOut size={18} />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-foreground hover:text-signal transition-colors"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden pb-4 space-y-3 border-t border-border pt-4">
            <Link
              href="/dashboard"
              className="block text-sm text-foreground hover:text-signal transition-colors"
            >
              Challenges
            </Link>
            <Link
              href="/leaderboard"
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Leaderboard
            </Link>
            <Link
              href="/profile"
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Profile
            </Link>
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" size="sm" className="flex-1" onClick={() => router.push('/profile')}>
                <User size={18} />
              </Button>
              <Button variant="ghost" size="sm" className="flex-1" onClick={async () => { await logout(); router.push('/login') }}>
                <LogOut size={18} />
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
