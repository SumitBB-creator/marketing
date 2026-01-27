import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (decoded) {
            // @ts-ignore
            req.user = decoded;
            next();
        } else {
            res.status(403).json({ message: 'Invalid token' });
        }
    } else {
        res.status(401).json({ message: 'Authorization header missing' });
    }
};

export const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // @ts-ignore
        const userRole = req.user?.role;

        if (roles.includes(userRole)) {
            next();
        } else {
            res.status(403).json({ message: 'Forbidden: Insufficient rights' });
        }
    };
};
