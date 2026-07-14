import React from 'react'

export function Table({
  children,
  className = '',
  scrollable = true,
}: {
  children: React.ReactNode
  className?: string
  scrollable?: boolean
}) {
  return (
    <div className={`${scrollable ? 'overflow-x-auto' : ''}`}>
      <table className={`w-full border-collapse text-sm ${className}`}>{children}</table>
    </div>
  )
}

export function TableHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <thead className={`border-b border-border bg-surface-secondary ${className}`}>
      {children}
    </thead>
  )
}

export function TableBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <tbody className={className}>{children}</tbody>
}

export function TableRow({
  children,
  className = '',
  sticky = false,
}: {
  children: React.ReactNode
  className?: string
  sticky?: boolean
}) {
  return (
    <tr
      className={`border-b border-border hover:bg-surface-secondary transition-colors ${
        sticky ? 'sticky bottom-0' : ''
      } ${className}`}
    >
      {children}
    </tr>
  )
}

export function TableHead({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-left font-semibold text-muted-foreground ${className}`}>
      {children}
    </th>
  )
}

export function TableCell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>
}
