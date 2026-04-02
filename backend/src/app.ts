import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authRouter } from "./routes/auth.routes";
import { feedbackRouter } from "./routes/feedback.routes";

export const app = express();

const allowedOrigins = new Set(
  env.CLIENT_ORIGIN.split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);

const localhostOriginRegex = /^https?:\/\/localhost:\d+$/;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients and same-origin requests.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.has(origin) || localhostOriginRegex.test(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS origin not allowed"));
    },
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
