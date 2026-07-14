import React from 'react'

interface VerticalProgressLineProps {
  total: number
  completed: number
}

export function VerticalProgressLine({ total, completed }: VerticalProgressLineProps) {
  const percentage = (completed / total) * 100

  return (
    <div className="relative w-1 h-full bg-border rounded-full overflow-hidden">
      <div
        style={{ height: `${percentage}%` }}
        className="w-full bg-gradient-to-t from-accent to-status-green transition-all duration-500"
      />
    </div>
  )
}
