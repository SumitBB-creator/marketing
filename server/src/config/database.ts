import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ||
    // Prevent multiple connections in serverless/Vercel environment
    new PrismaClient({
        log: ['query'],
        datasources: {
            db: {
                url: (process.env.DATABASE_URL?.includes('?')
                    ? `${process.env.DATABASE_URL}&connection_limit=1`
                    : `${process.env.DATABASE_URL}?connection_limit=1`)
            },
        },
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
