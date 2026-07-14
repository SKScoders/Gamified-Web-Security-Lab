import { prisma } from '../../server'
import crypto from 'crypto'

function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

function canonicalJson(payload: Record<string, unknown>): string {
  return JSON.stringify(payload, Object.keys(payload).sort())
}

export async function logEvent(
  userId: string,
  eventType: string,
  payload: Record<string, unknown>
) {
  const lastEntry = await prisma.auditLog.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { entryHash: true },
  })

  const prevHash = lastEntry?.entryHash || '0'
  const payloadJson = canonicalJson(payload)
  const entryHash = sha256(prevHash + payloadJson)

  return prisma.auditLog.create({
    data: {
      userId,
      eventType,
      payloadJson,
      prevHash,
      entryHash,
    },
  })
}
