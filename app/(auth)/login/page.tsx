'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/logo'
import { ChevronRight } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Security Lab Access
          </h1>
          <p className="text-muted-foreground text-sm">
            Enter your credentials to begin training
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 mb-8">
          {error && (
            <div className="text-sm text-status-red bg-status-red/10 border border-status-red/20 rounded p-3">
              {error}
            </div>
          )}

          {/* Email Input */}
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

          {/* Password Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-surface-secondary border-border text-foreground placeholder:text-muted-foreground focus:border-signal focus:ring-signal/30"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-signal hover:bg-signal/90 text-background font-semibold h-10 transition-all duration-200"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-background/50 animate-pulse" />
                Authenticating...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                Sign In
                <ChevronRight size={16} />
              </div>
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Don&apos;t have an account?
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 text-signal font-medium hover:text-signal/90 transition-colors text-sm"
          >
            Create One
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
