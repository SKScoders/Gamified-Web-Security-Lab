'use client'

import React from 'react'
import { Circle, Minus, Square, X, ExternalLink } from 'lucide-react'

interface LabFrameProps {
  src?: string
  title?: string
}

export function LabFrame({ src, title }: LabFrameProps) {
  const displayUrl = src || 'about:blank'

  return (
    <div className="flex flex-col h-full bg-surface-secondary border border-border rounded-lg overflow-hidden">
      {/* Browser Chrome */}
      <div className="bg-surface-elevated border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="p-1 hover:bg-border rounded transition-colors">
            <Minus size={14} className="text-muted-foreground" />
          </button>
          <button className="p-1 hover:bg-border rounded transition-colors">
            <Circle size={14} className="text-muted-foreground" />
          </button>
          <button className="p-1 hover:bg-border rounded transition-colors">
            <Square size={14} className="text-muted-foreground" />
          </button>
          <button className="p-1 hover:bg-border rounded transition-colors ml-2">
            <X size={14} className="text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 mx-4 px-3 py-1 bg-border rounded text-xs text-muted-foreground text-center truncate">
          {title || displayUrl}
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          {src && (
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-border rounded transition-colors"
              title="Open in new tab"
            >
              <ExternalLink size={14} />
            </a>
          )}
          <div className="w-2 h-2 bg-status-green rounded-full" />
          <span className="text-xs">Secure</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {src ? (
          <iframe
            src={src}
            title={title || 'Lab Environment'}
            className="w-full h-full border-0"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <div className="text-sm mb-2">Lab environment will load here</div>
              <div className="text-xs text-muted-foreground/50">
                Interactive terminal and application instance
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
