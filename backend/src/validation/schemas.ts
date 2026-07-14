import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export const submitFlagSchema = z.object({
  proof: z.string().min(1, 'Proof string required'),
})

export const leaderboardQuerySchema = z.object({
  timeframe: z.enum(['all', 'week']).optional().default('all'),
})
