"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const globalForPrisma = global;
exports.prisma = globalForPrisma.prisma ||
    // Prevent multiple connections in serverless/Vercel environment
    new client_1.PrismaClient({
        log: ['query'],
        datasources: {
            db: {
                url: (process.env.DATABASE_URL?.includes('?')
                    ? `${process.env.DATABASE_URL}&connection_limit=1`
                    : `${process.env.DATABASE_URL}?connection_limit=1`)
            },
        },
    });
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
exports.default = exports.prisma;
