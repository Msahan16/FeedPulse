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

const candidateModels = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash-latest",
];

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
  const prompt = `${promptTemplate}\n\nTitle: ${input.title}\nCategory: ${input.category}\nDescription: ${input.description}`;

  let lastError: unknown;
  let parsed: GeminiResult | null = null;

  for (const modelName of candidateModels) {
    try {
      const model = client.getGenerativeModel({ model: modelName });
      const generation = await model.generateContent(prompt);
      const content = generation.response.text().trim();
      const normalized = content.replace(/```json|```/gi, "").trim();
      parsed = JSON.parse(normalized) as GeminiResult;
      break;
    } catch (error) {
      // Keep trying the next model when a model is unavailable for this API version.
      if (error instanceof Error && /not found|not supported|404/i.test(error.message)) {
        continue;
      }

      lastError = error;
    }
  }

  if (!parsed) {
    throw lastError instanceof Error ? lastError : new Error("Gemini analysis failed");
  }

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
