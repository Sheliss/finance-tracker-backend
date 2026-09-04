import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. Token missing." });
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res
      .status(500)
      .json({ error: "Internal server error: JWT secret is missing." });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as unknown as {
      userId: string;
      email: string;
    };

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }
};
