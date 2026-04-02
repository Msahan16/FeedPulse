import { Router } from "express";
import { z } from "zod";
import {
  createFeedback,
  deleteFeedback,
  getFeedbackById,
  listFeedback,
  summaryFeedback,
  updateFeedback,
} from "../controllers/feedback.controller";
import { requireAuth } from "../middleware/auth";
import { feedbackRateLimit } from "../middleware/rateLimit";
import { optionalEmailSchema, validateBody } from "../middleware/validate";
import { feedbackCategories, feedbackStatuses } from "../models/Feedback";

const createFeedbackSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(20).max(5000),
  category: z.enum(feedbackCategories),
  submitterName: z.string().trim().max(100).optional(),
  submitterEmail: optionalEmailSchema,
});

const patchFeedbackSchema = z.object({
  status: z.enum(feedbackStatuses),
});

export const feedbackRouter = Router();

feedbackRouter.post("/", feedbackRateLimit, validateBody(createFeedbackSchema), createFeedback);
feedbackRouter.get("/", requireAuth, listFeedback);
feedbackRouter.get("/summary", requireAuth, summaryFeedback);
feedbackRouter.get("/:id", requireAuth, getFeedbackById);
feedbackRouter.patch("/:id", requireAuth, validateBody(patchFeedbackSchema), updateFeedback);
feedbackRouter.delete("/:id", requireAuth, deleteFeedback);
