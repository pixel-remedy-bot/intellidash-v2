import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Initialize Prisma Client with database URL
const createPrismaClient = () => {
  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    console.warn('DATABASE_URL not set - Prisma client will fail when connecting')
    return new PrismaClient()
  }
  
  // Use pg adapter for Prisma 7 with local PostgreSQL
  const pool = new Pool({ connectionString: databaseUrl })
  const adapter = new PrismaPg(pool)
  
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
