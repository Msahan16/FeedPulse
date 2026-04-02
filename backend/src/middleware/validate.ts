import { NextFunction, Request, Response } from "express";
import { z, ZodSchema } from "zod";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (request: Request, response: Response, next: NextFunction) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      return response.status(400).json({
        success: false,
        data: null,
        error: "Validation error",
        message: result.error.issues.map((item) => item.message).join(", "),
      });
    }

    request.body = result.data as unknown;
    return next();
  };
}

export const optionalEmailSchema = z
  .string()
  .email("Submitter email must be a valid email")
  .max(120)
  .optional()
  .or(z.literal(""));
