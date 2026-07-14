import { Shield } from 'lucide-react'

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-gradient-to-br from-signal to-signal/60 rounded flex items-center justify-center">
        <Shield size={18} className="text-background font-bold" strokeWidth={3} />
      </div>
      <span className="font-semibold text-lg tracking-tight text-foreground">
        SentinelChain
      </span>
    </div>
  )
}
