import { InferSchemaType, model, Schema } from "mongoose";

export const feedbackCategories = ["Bug", "Feature Request", "Improvement", "Other"] as const;
export const feedbackStatuses = ["New", "In Review", "Resolved"] as const;
export const sentiments = ["Positive", "Neutral", "Negative"] as const;

const FeedbackSchema = new Schema(
  {
    title: { type: String, required: true, maxlength: 120, trim: true },
    description: { type: String, required: true, minlength: 20, trim: true },
    category: { type: String, required: true, enum: feedbackCategories },
    status: { type: String, enum: feedbackStatuses, default: "New" },
    submitterName: { type: String, trim: true },
    submitterEmail: { type: String, trim: true },
    ai_category: { type: String, enum: feedbackCategories },
    ai_sentiment: { type: String, enum: sentiments },
    ai_priority: { type: Number, min: 1, max: 10 },
    ai_summary: { type: String },
    ai_tags: { type: [String], default: [] },
    ai_processed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

FeedbackSchema.index({ status: 1, category: 1, ai_priority: -1, createdAt: -1 });

export type FeedbackDocument = InferSchemaType<typeof FeedbackSchema>;

export const FeedbackModel = model("Feedback", FeedbackSchema);
