import { FeedbackModel } from "../models/Feedback";
import { analyzeFeedback } from "./gemini.service";

export async function generatePeriodSummary(days: number) {
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const items = await FeedbackModel.find({ createdAt: { $gte: start } })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  if (!items.length) {
    return "No feedback in this period yet.";
  }

  const stitchedDescription = items
    .map((item, index) => `${index + 1}. [${item.category}] ${item.title}: ${item.description}`)
    .join("\n");

  const synthetic = await analyzeFeedback({
    title: `Trend summary for last ${days} days`,
    category: "Other",
    description: stitchedDescription,
  });

  return synthetic.summary;
}
