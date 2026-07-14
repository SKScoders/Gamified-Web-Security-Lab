'use client'

import React, { useState, useRef, useEffect } from 'react'

interface ResizableContainerProps {
  children: [React.ReactNode, React.ReactNode]
  defaultLeftWidth?: number
  minLeftWidth?: number
  maxLeftWidth?: number
}

export function ResizableContainer({
  children,
  defaultLeftWidth = 50,
  minLeftWidth = 360,
  maxLeftWidth = 75,
}: ResizableContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth)
  const [isDragging, setIsDragging] = useState(false)

  const handlePointerDown = () => {
    setIsDragging(true)
  }

  useEffect(() => {
    if (!isDragging) return

    const handlePointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100

      // Calculate pixel values for constraints
      const containerWidth = containerRect.width
      const minPercent = (minLeftWidth / containerWidth) * 100
      const maxPercent = (maxLeftWidth / containerWidth) * 100

      const constrainedWidth = Math.max(minPercent, Math.min(maxPercent, newLeftWidth))
      setLeftWidth(constrainedWidth)
    }

    const handlePointerUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)

    return () => {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
    }
  }, [isDragging, minLeftWidth, maxLeftWidth])

  return (
    <div ref={containerRef} className="flex h-full gap-0">
      <div style={{ width: `${leftWidth}%` }} className="overflow-auto">
        {children[0]}
      </div>

      <div
        onPointerDown={handlePointerDown}
        className={`w-1 cursor-col-resize bg-border transition-colors ${
          isDragging ? 'bg-accent' : 'hover:bg-accent'
        }`}
      />

      <div style={{ width: `${100 - leftWidth}%` }} className="overflow-auto">
        {children[1]}
      </div>
    </div>
  )
}
