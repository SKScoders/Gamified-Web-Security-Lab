import { Trophy, Zap, TrendingUp, Award } from 'lucide-react'

interface UserStats {
  totalPoints: number
  levelsSolved: number
  streak: number
  rank: number
}

interface StatsGridProps {
  stats: UserStats
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Points Card */}
      <div className="surface-card p-4 flex items-start gap-4">
        <div className="w-10 h-10 bg-signal/10 rounded flex items-center justify-center flex-shrink-0">
          <Trophy size={20} className="text-signal" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-mono mb-1">TOTAL POINTS</p>
          <p className="text-2xl font-semibold text-foreground">{stats.totalPoints}</p>
        </div>
      </div>

      {/* Levels Solved Card */}
      <div className="surface-card p-4 flex items-start gap-4">
        <div className="w-10 h-10 bg-green-500/10 rounded flex items-center justify-center flex-shrink-0">
          <Award size={20} className="text-green-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-mono mb-1">SOLVED</p>
          <p className="text-2xl font-semibold text-foreground">{stats.levelsSolved}/4</p>
        </div>
      </div>

      {/* Streak Card */}
      <div className="surface-card p-4 flex items-start gap-4">
        <div className="w-10 h-10 bg-amber-500/10 rounded flex items-center justify-center flex-shrink-0">
          <Zap size={20} className="text-amber-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-mono mb-1">STREAK</p>
          <p className="text-2xl font-semibold text-foreground">{stats.streak}</p>
        </div>
      </div>

      {/* Rank Card */}
      <div className="surface-card p-4 flex items-start gap-4">
        <div className="w-10 h-10 bg-signal/10 rounded flex items-center justify-center flex-shrink-0">
          <TrendingUp size={20} className="text-signal" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-mono mb-1">LEADERBOARD</p>
          <p className="text-2xl font-semibold text-foreground">#{stats.rank}</p>
        </div>
      </div>
    </div>
  )
}
