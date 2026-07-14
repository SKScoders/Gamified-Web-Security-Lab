import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: 'solved' | 'in-progress' | 'locked' | 'failed'
  size?: 'sm' | 'md'
}

const statusConfig = {
  solved: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    label: 'Solved',
  },
  'in-progress': {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    label: 'In Progress',
  },
  locked: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    label: 'Locked',
  },
  failed: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    label: 'Failed',
  },
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <div
      className={cn(
        'font-mono font-medium rounded',
        config.bg,
        config.text,
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
      )}
    >
      {config.label}
    </div>
  )
}
