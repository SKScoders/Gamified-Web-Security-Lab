'use client'

import React, { useState } from 'react'

interface SegmentOption {
  value: string
  label: string
}

interface SegmentControlProps {
  options: SegmentOption[]
  defaultValue?: string
  onChange?: (value: string) => void
  className?: string
}

export function SegmentControl({
  options,
  defaultValue,
  onChange,
  className = '',
}: SegmentControlProps) {
  const [activeValue, setActiveValue] = useState(defaultValue || options[0]?.value)

  const handleChange = (value: string) => {
    setActiveValue(value)
    onChange?.(value)
  }

  return (
    <div
      className={`inline-flex gap-1 p-1 bg-surface-secondary rounded-lg border border-border ${className}`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => handleChange(option.value)}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            activeValue === option.value
              ? 'bg-accent text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
