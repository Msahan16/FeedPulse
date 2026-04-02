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

  try {
    const synthetic = await analyzeFeedback({
      title: `Trend summary for last ${days} days`,
      category: "Other",
      description: stitchedDescription,
    });

    return synthetic.summary;
  } catch {
    const byCategory = items.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});

    const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || "Other";
    const avgPriority =
      items
        .map((item) => item.ai_priority)
        .filter((value): value is number => typeof value === "number")
        .reduce((sum, value, _, list) => sum + value / list.length, 0) || 0;

    return `Last ${days} days: ${items.length} feedback items, top category is ${topCategory}, average AI priority ${avgPriority.toFixed(1)}.`;
  }
}
