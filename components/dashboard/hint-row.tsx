'use client'

import React, { useState } from 'react'
import { Lightbulb, ChevronDown } from 'lucide-react'

interface HintRowProps {
  title: string
  content: string
  scorePenalty: number
  revealed?: boolean
  onReveal?: () => void
  disabled?: boolean
}

export function HintRow({ title, content, scorePenalty, revealed = false, onReveal, disabled = false }: HintRowProps) {
  const [isRevealed, setIsRevealed] = useState(revealed)

  const handleReveal = () => {
    if (disabled || isRevealed) return
    setIsRevealed(true)
    onReveal?.()
  }

  return (
    <div
      className={`border border-border rounded-lg overflow-hidden ${
        disabled ? 'opacity-50 cursor-not-allowed bg-surface-secondary' : 'bg-card'
      }`}
    >
      <button
        onClick={handleReveal}
        disabled={disabled || isRevealed}
        className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
          isRevealed ? 'bg-surface-secondary/50' : 'hover:border-accent/50'
        }`}
      >
        <div className="flex gap-3">
          <Lightbulb
            size={20}
            className={`flex-shrink-0 mt-0.5 ${isRevealed ? 'text-status-amber' : 'text-muted-foreground'}`}
          />
          <div>
            <h4 className="font-medium text-sm mb-1">{title}</h4>
            {!isRevealed && (
              <span className="text-xs text-status-amber font-mono">-{scorePenalty} points to reveal</span>
            )}
          </div>
        </div>
        {!isRevealed && !disabled && (
          <ChevronDown size={16} className="text-muted-foreground flex-shrink-0" />
        )}
      </button>
      {isRevealed && (
        <div className="px-4 pb-4 pt-0 border-t border-border">
          <p className="text-xs text-muted-foreground leading-relaxed mt-3">{content}</p>
          <span className="text-xs text-status-red font-mono mt-2 inline-block">-{scorePenalty} pts applied</span>
        </div>
      )}
    </div>
  )
}
