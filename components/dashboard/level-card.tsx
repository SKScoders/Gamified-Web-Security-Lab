'use client'

import { useRouter } from 'next/navigation'
import { StatusBadge } from '@/components/status-badge'
import { cn } from '@/lib/utils'
import { ChevronRight, Lock } from 'lucide-react'
import type { LevelCardData } from '@/types'

interface LevelCardProps {
  level: LevelCardData
  onClick?: () => void
}

export function LevelCard({ level, onClick }: LevelCardProps) {
  const router = useRouter()
  const isLocked = level.status === 'locked'

  return (
    <button
      onClick={onClick || (() => { if (!isLocked) router.push(`/level/${level.id}`) })}
      disabled={isLocked}
      className={cn(
        'surface-card p-6 text-left transition-all duration-200 hover:border-signal/50 group',
        isLocked && 'cursor-not-allowed opacity-60',
        !isLocked && 'hover:border-signal cursor-pointer'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-6 h-6 rounded bg-signal/10 text-signal text-xs font-semibold flex items-center justify-center">
              {level.order}
            </span>
            <span className="text-xs font-mono text-muted-foreground uppercase">
              {level.difficulty}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-foreground group-hover:text-signal transition-colors">
            {level.title}
          </h3>
        </div>
        {isLocked ? (
          <Lock size={20} className="text-muted-foreground flex-shrink-0 mt-1" />
        ) : (
          <ChevronRight size={20} className="text-muted-foreground group-hover:text-signal group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        {level.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <StatusBadge status={level.status} />
          {level.completedAt && (
            <span className="text-xs text-muted-foreground font-mono">
              {level.completedAt}
            </span>
          )}
        </div>
        <div className="text-sm font-mono text-signal font-semibold">
          +{level.points}
        </div>
      </div>
    </button>
  )
}
