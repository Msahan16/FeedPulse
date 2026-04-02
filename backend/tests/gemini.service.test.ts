const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn(() => ({
  generateContent: mockGenerateContent,
}));

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

import { analyzeFeedback } from "../src/services/gemini.service";

describe("Gemini Service", () => {
  test("parses model JSON and normalizes invalid fields", async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () =>
          "```json\n{\"category\":\"Unknown\",\"sentiment\":\"Very Happy\",\"priority_score\":12,\"summary\":\"Need faster dashboard load\",\"tags\":[\"performance\",\"dashboard\"]}\n```",
      },
    });

    const result = await analyzeFeedback({
      title: "Slow dashboard",
      category: "Bug",
      description: "Dashboard is slow while loading charts and cards for larger datasets.",
    });

    expect(mockGetGenerativeModel).toHaveBeenCalled();
    expect(result.category).toBe("Other");
    expect(result.sentiment).toBe("Neutral");
    expect(result.priority_score).toBe(10);
    expect(result.summary).toContain("Need faster dashboard load");
    expect(result.tags).toEqual(["performance", "dashboard"]);
  });
});
