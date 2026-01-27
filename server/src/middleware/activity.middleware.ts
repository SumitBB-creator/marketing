import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

export const trackActivity = async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const user = req.user;

    // Check if we have a valid user and session from auth middleware
    if (user && user.sessionId) {
        // Optimization: We could throttle this e.g. using Redis or checking "last_active" in memory
        // For MVP, we'll just update it directly but maybe catch errors silently to not block request
        try {
            // We might want to check the last update time if possible, 
            // but `update` operations are relatively cheap if indexed.
            await prisma.userSession.update({
                where: { id: user.sessionId },
                data: { last_active_at: new Date() }
            });
        } catch (error) {
            console.error("Failed to track activity", error);
        }
    }

    next();
};
