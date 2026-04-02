import { Router } from "express";
import { z } from "zod";
import { loginAdmin } from "../controllers/auth.controller";
import { validateBody } from "../middleware/validate";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authRouter = Router();

authRouter.post("/login", validateBody(loginSchema), loginAdmin);
