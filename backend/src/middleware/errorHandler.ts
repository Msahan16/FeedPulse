import { NextFunction, Request, Response } from "express";

export function notFoundHandler(_request: Request, response: Response) {
  return response.status(404).json({
    success: false,
    data: null,
    error: "Not Found",
    message: "Route does not exist",
  });
}

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  console.error(error);

  const message = error instanceof Error ? error.message : "Internal server error";

  return response.status(500).json({
    success: false,
    data: null,
    error: "Internal Server Error",
    message,
  });
}
