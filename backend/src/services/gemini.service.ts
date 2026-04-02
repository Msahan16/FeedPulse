import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";
import { feedbackCategories, sentiments } from "../models/Feedback";

type GeminiResult = {
  sentiment: (typeof sentiments)[number];
  priority_score: number;
  summary: string;
  tags: string[];
  category: (typeof feedbackCategories)[number];
};

const client = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const promptTemplate = `You are an AI assistant for product feedback analysis.
Analyze this feedback and return strict JSON only.
JSON shape:
{
  "category": "Bug | Feature Request | Improvement | Other",
  "sentiment": "Positive | Neutral | Negative",
  "priority_score": 1-10 number,
  "summary": "single concise sentence",
  "tags": ["short", "tag", "array"]
}
No markdown, no extra text.`;

export async function analyzeFeedback(input: {
  title: string;
  description: string;
  category: string;
}): Promise<GeminiResult> {
  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `${promptTemplate}\n\nTitle: ${input.title}\nCategory: ${input.category}\nDescription: ${input.description}`;

  const generation = await model.generateContent(prompt);
  const content = generation.response.text().trim();
  const normalized = content.replace(/^```json/, "").replace(/```$/, "").trim();

  const parsed = JSON.parse(normalized) as GeminiResult;

  const sentiment = sentiments.includes(parsed.sentiment) ? parsed.sentiment : "Neutral";
  const category = feedbackCategories.includes(parsed.category) ? parsed.category : "Other";

  return {
    sentiment,
    category,
    priority_score: Math.min(10, Math.max(1, Number(parsed.priority_score || 5))),
    summary: String(parsed.summary || "No summary generated").slice(0, 400),
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8).map((tag) => String(tag).slice(0, 30)) : [],
  };
}
