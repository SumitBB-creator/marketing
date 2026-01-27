"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        const decoded = (0, jwt_1.verifyToken)(token);
        if (decoded) {
            // @ts-ignore
            req.user = decoded;
            next();
        }
        else {
            res.status(403).json({ message: 'Invalid token' });
        }
    }
    else {
        res.status(401).json({ message: 'Authorization header missing' });
    }
};
exports.authenticate = authenticate;
const requireRole = (roles) => {
    return (req, res, next) => {
        // @ts-ignore
        const userRole = req.user?.role;
        if (roles.includes(userRole)) {
            next();
        }
        else {
            res.status(403).json({ message: 'Forbidden: Insufficient rights' });
        }
    };
};
exports.requireRole = requireRole;
