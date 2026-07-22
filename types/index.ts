export interface User {
  id: string
  email: string
  displayName: string
  avatar?: string
  createdAt: string
}

export interface Level {
  id: string
  orderIndex: number
  labUrl: string | null
  title: string
  description: string
  vulnCategory: string
  owaspCategory: string
  mitreTechniqueId: string
  mitreTechniqueName: string
  cvssBaseVector: string
  cvssScore: number
  cweId: string
  cweTitle: string
  difficulty: 'Easy' | 'Intermediate' | 'Hard'
  points: number
  expectedFlag: string
  remediation: string
}

export type LevelStatus = 'locked' | 'in-progress' | 'solved'

export interface Progress {
  id: string
  userId: string
  levelId: string
  status: LevelStatus
  attempts: number
  score: number
  startedAt: string | null
  completedAt: string | null
  bestTime: string | null
}

export interface Hint {
  id: string
  levelId: string
  hintOrder: number
  title: string
  content: string
  scorePenalty: number
}

export interface HintUsage {
  id: string
  userId: string
  hintId: string
  requestedAt: string
}

export interface StageToken {
  id: string
  progressId: string
  signedToken: string
  exploitSignatureHash: string
  issuedAt: string
  expiresAt: string
}

export interface LabInstance {
  id: string
  levelId: string
  sessionId: string
  containerId: string
  status: 'running' | 'stopped' | 'expired'
  startedAt: string
  expiresAt: string
}

export interface AuditLogEntry {
  id: string
  userId: string
  eventType: string
  payloadJson: string
  prevHash: string
  entryHash: string
  createdAt: string
}

export interface Report {
  id: string
  userId: string
  pdfUrl: string | null
  summaryJson: string
  generatedAt: string
}

export interface LevelReportData {
  level: Level
  progress: Progress
  hintsUsed: HintUsage[]
  remediation: string
}

export interface DiffLine {
  line: number
  content: string
  type: 'unchanged' | 'added' | 'removed'
  note?: string
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  displayName: string
  avatar: string
  score: number
  levelsCompleted: number
  totalTime: string
  isCurrentUser?: boolean
}

export interface UserProfile {
  user: User
  totalScore: number
  levelsSolved: number
  rank: number
  streak: number
  certificates: Certificate[]
}

export interface Certificate {
  id: string
  levelId: string
  levelTitle: string
  completedAt: string
  score: number
}

export interface UserStats {
  totalPoints: number
  levelsSolved: number
  streak: number
  rank: number
}

export interface LevelCardData {
  id: string
  title: string
  description: string
  category: string
  owasp: string
  difficulty: 'Easy' | 'Intermediate' | 'Hard'
  status: LevelStatus
  order: number
  points: number
  attempts?: number
  bestTime?: string
  completedAt?: string | null
}
