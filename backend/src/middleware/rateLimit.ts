import { NextFunction, Request, Response } from "express";

type Entry = {
  count: number;
  resetAt: number;
};

const requests = new Map<string, Entry>();

export function feedbackRateLimit(request: Request, response: Response, next: NextFunction) {
  const key = request.ip || "anonymous";
  const now = Date.now();
  const hour = 60 * 60 * 1000;

  const entry = requests.get(key);

  if (!entry || now > entry.resetAt) {
    requests.set(key, { count: 1, resetAt: now + hour });
    return next();
  }

  if (entry.count >= 5) {
    return response.status(429).json({
      success: false,
      data: null,
      error: "Rate limit exceeded",
      message: "You can submit up to 5 feedback items per hour",
    });
  }

  entry.count += 1;
  requests.set(key, entry);

  next();
}
