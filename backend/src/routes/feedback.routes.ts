import { Router } from "express";
import { z } from "zod";
import {
  createFeedback,
  deleteFeedback,
  getFeedbackById,
  listFeedback,
  reanalyzeFeedback,
  summaryFeedback,
  updateFeedback,
} from "../controllers/feedback.controller";
import { asyncHandler } from "../middleware/asyncHandler";
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

feedbackRouter.post("/", feedbackRateLimit, validateBody(createFeedbackSchema), asyncHandler(createFeedback));
feedbackRouter.get("/", requireAuth, asyncHandler(listFeedback));
feedbackRouter.get("/summary", requireAuth, asyncHandler(summaryFeedback));
feedbackRouter.post("/:id/reanalyze", requireAuth, asyncHandler(reanalyzeFeedback));
feedbackRouter.get("/:id", requireAuth, asyncHandler(getFeedbackById));
feedbackRouter.patch("/:id", requireAuth, validateBody(patchFeedbackSchema), asyncHandler(updateFeedback));
feedbackRouter.delete("/:id", requireAuth, asyncHandler(deleteFeedback));
