import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type RoleType = 'LECTURER' | 'STUDENT';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  department?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'knust_consult_secret_jwt_key_2026_super_secure';

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
};

export const requireRole = (allowedRole: RoleType) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (req.user.role !== allowedRole) {
      return res.status(403).json({
        error: `Access denied. This action requires ${allowedRole.toLowerCase()} privileges.`,
      });
    }

    next();
  };
};
