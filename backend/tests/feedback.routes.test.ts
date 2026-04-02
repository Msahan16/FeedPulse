import jwt from "jsonwebtoken";
import request from "supertest";

jest.mock("../src/models/Feedback", () => {
  const limit = jest.fn();
  const skip = jest.fn(() => ({ limit }));
  const sort = jest.fn(() => ({ skip }));
  const find = jest.fn(() => ({ sort }));

  return {
    feedbackCategories: ["Bug", "Feature Request", "Improvement", "Other"],
    feedbackStatuses: ["New", "In Review", "Resolved"],
    sentiments: ["Positive", "Neutral", "Negative"],
    FeedbackModel: {
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      countDocuments: jest.fn(),
      find,
      __chain: { sort, skip, limit },
    },
  };
});

jest.mock("../src/services/gemini.service", () => ({
  analyzeFeedback: jest.fn().mockResolvedValue({
    sentiment: "Positive",
    priority_score: 8,
    summary: "Users need a dark mode toggle in dashboard settings.",
    tags: ["ui", "settings", "accessibility"],
    category: "Feature Request",
  }),
}));

import { app } from "../src/app";
import { FeedbackModel } from "../src/models/Feedback";
import { analyzeFeedback } from "../src/services/gemini.service";

type FeedbackModelMock = {
  create: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
  countDocuments: jest.Mock;
  find: jest.Mock;
  __chain: {
    sort: jest.Mock;
    skip: jest.Mock;
    limit: jest.Mock;
  };
};

const mockedFeedbackModel = FeedbackModel as unknown as FeedbackModelMock;
const mockedAnalyzeFeedback = analyzeFeedback as jest.MockedFunction<typeof analyzeFeedback>;

async function flushBackgroundTasks() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("Feedback API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFeedbackModel.__chain.limit.mockResolvedValue([]);
    mockedFeedbackModel.countDocuments.mockResolvedValue(0);
    mockedFeedbackModel.findByIdAndDelete.mockResolvedValue(null);
  });

  test("POST /api/feedback valid submission saves to DB and triggers AI", async () => {
    mockedFeedbackModel.create.mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      title: "Dark mode request",
      description: "Please add dark mode in the dashboard settings because night usage is high.",
      category: "Feature Request",
      status: "New",
      ai_processed: false,
    });

    mockedFeedbackModel.findByIdAndUpdate.mockResolvedValue({ _id: "507f1f77bcf86cd799439011" });

    const response = await request(app).post("/api/feedback").send({
      title: "Dark mode request",
      description: "Please add dark mode in the dashboard settings because night usage is high.",
      category: "Feature Request",
      submitterName: "Riya",
      submitterEmail: "riya@example.com",
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe("Dark mode request");

    await flushBackgroundTasks();

    expect(mockedFeedbackModel.create).toHaveBeenCalledTimes(1);
    expect(mockedAnalyzeFeedback).toHaveBeenCalledTimes(1);
    expect(mockedFeedbackModel.findByIdAndUpdate).toHaveBeenCalledWith("507f1f77bcf86cd799439011", {
      ai_category: "Feature Request",
      ai_sentiment: "Positive",
      ai_priority: 8,
      ai_summary: "Users need a dark mode toggle in dashboard settings.",
      ai_tags: ["ui", "settings", "accessibility"],
      ai_processed: true,
    });
  });

  test("POST /api/feedback rejects empty title", async () => {
    const response = await request(app).post("/api/feedback").send({
      title: "",
      description: "This has enough characters to pass description rules.",
      category: "Bug",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(String(response.body.message).toLowerCase()).toContain("at least");
  });

  test("PATCH /api/feedback/:id updates status", async () => {
    const token = jwt.sign({ email: process.env.ADMIN_EMAIL }, process.env.JWT_SECRET || "test-secret");

    mockedFeedbackModel.findByIdAndUpdate.mockResolvedValue({
      _id: "507f1f77bcf86cd799439012",
      title: "Broken upload",
      description: "File upload fails when attaching image and trying to save draft.",
      category: "Bug",
      status: "Resolved",
    });

    const response = await request(app)
      .patch("/api/feedback/507f1f77bcf86cd799439012")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "Resolved" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("Resolved");
    expect(mockedFeedbackModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439012",
      { status: "Resolved" },
      { new: true, runValidators: true },
    );
  });

  test("Protected route rejects unauthenticated requests", async () => {
    const response = await request(app).get("/api/feedback");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("Missing bearer token");
  });
});
