import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from '../config/prisma';



export interface AuthRequest extends Request {
  user?: {
    user_id: number;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as {
      user_id: number;
      email: string;
      role: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

/**
 * Optional authentication — extracts user info if token is present,
 * but does NOT reject requests without a token.
 * Used by chatbot endpoint to support both authenticated and anonymous users.
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as {
        user_id: number;
        email: string;
        role: string;
      };
      req.user = decoded;
    }
  } catch (error) {
    // Token invalid — proceed as unauthenticated
    req.user = undefined;
  }
  next();
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        message: "Access denied: Required role missing"
      });
      return;
    }
    next();
  };
};
