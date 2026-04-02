import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authRouter } from "./routes/auth.routes";
import { feedbackRouter } from "./routes/feedback.routes";

export const app = express();

app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
  }),
);

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_request, response) => {
  response.status(200).json({
    success: true,
    data: { status: "ok" },
    error: null,
    message: "Service healthy",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/feedback", feedbackRouter);

app.use(notFoundHandler);
app.use(errorHandler);
