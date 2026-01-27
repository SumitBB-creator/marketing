import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

export const requireRole = (roles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // @ts-ignore
        const user = req.user;

        if (!user || !roles.includes(user.role)) {
            return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
        }

        next();
    };
};
