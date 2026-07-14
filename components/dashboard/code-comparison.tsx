'use client'

import React, { useState } from 'react'
import { tokenizeCode } from '@/lib/tokenizer'
import { HelpCircle } from 'lucide-react'
import type { DiffLine } from '@/types'

interface CodeComparisonProps {
  leftCode: DiffLine[]
  rightCode: DiffLine[]
  language?: 'js' | 'sql'
  title?: string
}

function CodeBlock({ lines, language = 'js' }: { lines: DiffLine[]; language: 'js' | 'sql' }) {
  const [activeNote, setActiveNote] = useState<number | null>(null)

  return (
    <div className="relative overflow-x-auto">
      <pre className="bg-surface-secondary border border-border rounded text-sm font-mono text-foreground">
        <code>
          {lines.map((line) => {
            const tokens = tokenizeCode(line.content, language)
            const bgColor =
              line.type === 'added'
                ? 'bg-status-green/10'
                : line.type === 'removed'
                  ? 'bg-status-red/10'
                  : ''
            const textDecoration = line.type === 'removed' ? 'line-through opacity-60' : ''

            return (
              <div
                key={`${line.line}-${line.type}`}
                className={`flex gap-4 px-4 py-2 ${bgColor} ${line.note ? 'relative' : ''}`}
              >
                <span className="text-muted-foreground min-w-8 text-right select-none">
                  {line.line}
                </span>
                <div className={`flex-1 ${textDecoration}`}>
                  {line.note && (
                    <button
                      onClick={() => setActiveNote(activeNote === line.line ? null : line.line)}
                      className="absolute right-2 top-2 text-accent hover:text-accent/80 transition-colors"
                      title="Show annotation"
                    >
                      <HelpCircle size={16} />
                    </button>
                  )}
                  <span>
                    {tokens.map((token, idx) => {
                      const colors = {
                        keyword: 'text-accent',
                        string: 'text-status-green',
                        comment: 'text-muted-foreground',
                        number: 'text-status-amber',
                        default: 'text-foreground',
                      }
                      return (
                        <span key={idx} className={colors[token.type]}>
                          {token.value}
                        </span>
                      )
                    })}
                  </span>
                </div>
                {line.note && activeNote === line.line && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-surface-elevated border border-border rounded p-3 text-xs text-muted-foreground">
                    {line.note}
                  </div>
                )}
              </div>
            )
          })}
        </code>
      </pre>
    </div>
  )
}

function UnifiedBlock({ lines, language = 'js' }: { lines: DiffLine[]; language: 'js' | 'sql' }) {
  const [activeNote, setActiveNote] = useState<number | null>(null)

  return (
    <div className="relative overflow-x-auto">
      <pre className="bg-surface-secondary border border-border rounded text-sm font-mono text-foreground">
        <code>
          {lines.map((line, idx) => {
            const tokens = tokenizeCode(line.content, language)
            const bgColor =
              line.type === 'added'
                ? 'bg-status-green/10'
                : line.type === 'removed'
                  ? 'bg-status-red/10'
                  : ''
            const textDecoration = line.type === 'removed' ? 'line-through opacity-60' : ''
            const prefix = line.type === 'added' ? '+ ' : line.type === 'removed' ? '- ' : '  '

            return (
              <div
                key={`${idx}-${line.type}`}
                className={`flex gap-4 px-4 py-2 ${bgColor} ${line.note ? 'relative' : ''}`}
              >
                <span className="text-muted-foreground min-w-6 text-right select-none">
                  {prefix}
                </span>
                <span className="text-muted-foreground min-w-8 text-right select-none">
                  {line.line}
                </span>
                <div className={`flex-1 ${textDecoration}`}>
                  {line.note && (
                    <button
                      onClick={() => setActiveNote(activeNote === idx ? null : idx)}
                      className="absolute right-2 top-2 text-accent hover:text-accent/80 transition-colors"
                      title="Show annotation"
                    >
                      <HelpCircle size={16} />
                    </button>
                  )}
                  <span>
                    {tokens.map((token, tIdx) => {
                      const colors = {
                        keyword: 'text-accent',
                        string: 'text-status-green',
                        comment: 'text-muted-foreground',
                        number: 'text-status-amber',
                        default: 'text-foreground',
                      }
                      return (
                        <span key={tIdx} className={colors[token.type]}>
                          {token.value}
                        </span>
                      )
                    })}
                  </span>
                </div>
                {line.note && activeNote === idx && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-surface-elevated border border-border rounded p-3 text-xs text-muted-foreground">
                    {line.note}
                  </div>
                )}
              </div>
            )
          })}
        </code>
      </pre>
    </div>
  )
}

export function CodeComparison({ leftCode, rightCode, language = 'js', title }: CodeComparisonProps) {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('side-by-side')

  const unifiedLines: DiffLine[] = []
  let leftIdx = 0
  let rightIdx = 0

  while (leftIdx < leftCode.length || rightIdx < rightCode.length) {
    const left = leftCode[leftIdx]
    const right = rightCode[rightIdx]

    if (left && left.type === 'unchanged' && right && right.type === 'unchanged') {
      unifiedLines.push(left)
      leftIdx++
      rightIdx++
    } else if (left && left.type === 'removed') {
      unifiedLines.push(left)
      leftIdx++
    } else if (right && right.type === 'added') {
      unifiedLines.push(right)
      rightIdx++
    } else if (left && !right) {
      unifiedLines.push(left)
      leftIdx++
    } else if (right && !left) {
      unifiedLines.push(right)
      rightIdx++
    } else {
      if (left) {
        unifiedLines.push(left)
        leftIdx++
      }
      if (right) {
        unifiedLines.push(right)
        rightIdx++
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {title && <h3 className="text-lg font-semibold">{title}</h3>}
        <div className="flex gap-1 p-1 bg-surface-secondary rounded-lg border border-border">
          <button
            onClick={() => setViewMode('side-by-side')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'side-by-side' ? 'bg-accent text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Side by Side
          </button>
          <button
            onClick={() => setViewMode('unified')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'unified' ? 'bg-accent text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Unified
          </button>
        </div>
      </div>

      {viewMode === 'side-by-side' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Vulnerable Code</h4>
            <CodeBlock lines={leftCode} language={language} />
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Patched Code</h4>
            <CodeBlock lines={rightCode} language={language} />
          </div>
        </div>
      ) : (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Unified Diff</h4>
          <UnifiedBlock lines={unifiedLines} language={language} />
        </div>
      )}
    </div>
  )
}
