import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { UserModel } from "../models/User";

export async function loginAdmin(request: Request, response: Response) {
  const { email, password } = request.body as { email: string; password: string };

  if (email !== env.ADMIN_EMAIL || password !== env.ADMIN_PASSWORD) {
    return response.status(401).json({
      success: false,
      data: null,
      error: "Unauthorized",
      message: "Invalid credentials",
    });
  }

  await UserModel.updateOne({ email }, { email, role: "admin" }, { upsert: true });

  const token = jwt.sign({ email }, env.JWT_SECRET, { expiresIn: "8h" });

  return response.status(200).json({
    success: true,
    data: { token, admin: { email } },
    error: null,
    message: "Login successful",
  });
}
