'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/logo'
import { ChevronRight } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function SignupPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { register } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      await register(email, password, displayName)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-12 text-center">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Create Account
          </h1>
          <p className="text-muted-foreground text-sm">
            Join SentinelChain and start your security training
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mb-8">
          {error && (
            <div className="text-sm text-status-red bg-status-red/10 border border-status-red/20 rounded p-3">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="displayName" className="block text-sm font-medium text-foreground">
              Display Name
            </label>
            <Input
              id="displayName"
              type="text"
              placeholder="Alex Rivera"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="bg-surface-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-signal focus:ring-signal/30"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="analyst@sentinelchain.dev"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-surface-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-signal focus:ring-signal/30"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Min 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="bg-surface-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-signal focus:ring-signal/30"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-signal hover:bg-signal/90 text-background font-semibold h-10 transition-all duration-200"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-background/50 animate-pulse" />
                Creating account...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                Create Account
                <ChevronRight size={16} />
              </div>
            )}
          </Button>
        </form>

        <div className="pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Already have an account?
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-signal font-medium hover:text-signal/90 transition-colors text-sm"
          >
            Sign In
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
