import { Request, Response } from "express";
import { z } from "zod";
import { feedbackCategories, feedbackStatuses, FeedbackModel } from "../models/Feedback";
import { analyzeFeedback } from "../services/gemini.service";
import { generatePeriodSummary } from "../services/summary.service";

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(10),
  category: z.enum(feedbackCategories).optional(),
  status: z.enum(feedbackStatuses).optional(),
  q: z.string().trim().optional(),
});

export async function createFeedback(request: Request, response: Response) {
  const input = request.body as {
    title: string;
    description: string;
    category: (typeof feedbackCategories)[number];
    submitterName?: string;
    submitterEmail?: string;
  };

  const created = await FeedbackModel.create({
    ...input,
    submitterEmail: input.submitterEmail || undefined,
  });

  // Process AI enrichment in background; failure must not block submission.
  void (async () => {
    try {
      const ai = await analyzeFeedback({
        title: created.title,
        description: created.description,
        category: created.category,
      });

      await FeedbackModel.findByIdAndUpdate(created._id, {
        ai_category: ai.category,
        ai_sentiment: ai.sentiment,
        ai_priority: ai.priority_score,
        ai_summary: ai.summary,
        ai_tags: ai.tags,
        ai_processed: true,
      });
    } catch (error) {
      console.error("Gemini analysis failed", error);
    }
  })();

  return response.status(201).json({
    success: true,
    data: created,
    error: null,
    message: "Feedback submitted",
  });
}

export async function listFeedback(request: Request, response: Response) {
  const parsed = querySchema.parse(request.query);
  const filter: Record<string, unknown> = {};

  if (parsed.category) filter.category = parsed.category;
  if (parsed.status) filter.status = parsed.status;
  if (parsed.q) {
    filter.$or = [
      { title: { $regex: parsed.q, $options: "i" } },
      { ai_summary: { $regex: parsed.q, $options: "i" } },
      { description: { $regex: parsed.q, $options: "i" } },
    ];
  }

  const skip = (parsed.page - 1) * parsed.pageSize;

  const [items, total] = await Promise.all([
    FeedbackModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parsed.pageSize),
    FeedbackModel.countDocuments(filter),
  ]);

  return response.status(200).json({
    success: true,
    data: {
      items,
      total,
      page: parsed.page,
      pageSize: parsed.pageSize,
      totalPages: Math.max(1, Math.ceil(total / parsed.pageSize)),
    },
    error: null,
    message: "Feedback list fetched",
  });
}

export async function getFeedbackById(request: Request, response: Response) {
  const item = await FeedbackModel.findById(request.params.id);

  if (!item) {
    return response.status(404).json({
      success: false,
      data: null,
      error: "Not Found",
      message: "Feedback not found",
    });
  }

  return response.status(200).json({
    success: true,
    data: item,
    error: null,
    message: "Feedback found",
  });
}

export async function updateFeedback(request: Request, response: Response) {
  const { status } = request.body as { status: (typeof feedbackStatuses)[number] };

  const item = await FeedbackModel.findByIdAndUpdate(
    request.params.id,
    { status },
    { new: true, runValidators: true },
  );

  if (!item) {
    return response.status(404).json({
      success: false,
      data: null,
      error: "Not Found",
      message: "Feedback not found",
    });
  }

  return response.status(200).json({
    success: true,
    data: item,
    error: null,
    message: "Feedback updated",
  });
}

export async function deleteFeedback(request: Request, response: Response) {
  const item = await FeedbackModel.findByIdAndDelete(request.params.id);

  if (!item) {
    return response.status(404).json({
      success: false,
      data: null,
      error: "Not Found",
      message: "Feedback not found",
    });
  }

  return response.status(200).json({
    success: true,
    data: { deleted: true },
    error: null,
    message: "Feedback deleted",
  });
}

export async function summaryFeedback(request: Request, response: Response) {
  const days = Math.max(1, Math.min(30, Number(request.query.days || 7)));
  const summary = await generatePeriodSummary(days);

  return response.status(200).json({
    success: true,
    data: { summary, periodDays: days },
    error: null,
    message: "Summary generated",
  });
}
