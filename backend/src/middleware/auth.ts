import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return response.status(401).json({
      success: false,
      data: null,
      error: "Unauthorized",
      message: "Missing bearer token",
    });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { email: string };
    request.admin = { email: payload.email };
    next();
  } catch {
    return response.status(401).json({
      success: false,
      data: null,
      error: "Unauthorized",
      message: "Invalid or expired token",
    });
  }
}
