export type FeedbackCategory = "Bug" | "Feature Request" | "Improvement" | "Other";
export type FeedbackStatus = "New" | "In Review" | "Resolved";
export type Sentiment = "Positive" | "Neutral" | "Negative";

export interface FeedbackItem {
  _id: string;
  title: string;
  description: string;
  category: FeedbackCategory;
  status: FeedbackStatus;
  submitterName?: string;
  submitterEmail?: string;
  ai_sentiment?: Sentiment;
  ai_priority?: number;
  ai_summary?: string;
  ai_tags?: string[];
  ai_processed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      cache: "no-store",
    });
  } catch {
    throw new Error(
      `Cannot reach API at ${API_BASE}. Make sure backend is running and CORS allows your frontend origin.`,
    );
  }

  const raw = await response.text();
  let payload: { success?: boolean; message?: string; data?: unknown } = {};

  try {
    payload = raw ? (JSON.parse(raw) as { success?: boolean; message?: string; data?: unknown }) : {};
  } catch {
    payload = {};
  }

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || raw || "Request failed");
  }

  return payload.data as T;
}

export async function submitFeedback(input: {
  title: string;
  description: string;
  category: FeedbackCategory;
  submitterName?: string;
  submitterEmail?: string;
}) {
  return request<FeedbackItem>("/api/feedback", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function loginAdmin(email: string, password: string) {
  return request<{ token: string; admin: { email: string } }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getFeedback(params: Record<string, string | number | undefined>, token: string) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query.append(key, String(value));
    }
  });

  return request<PaginatedResponse<FeedbackItem>>(`/api/feedback?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateFeedbackStatus(id: string, status: FeedbackStatus, token: string) {
  return request<FeedbackItem>(`/api/feedback/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
}

export async function deleteFeedback(id: string, token: string) {
  return request<{ deleted: true }>(`/api/feedback/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getSummary(days: number, token: string) {
  return request<{ summary: string; periodDays: number }>(`/api/feedback/summary?days=${days}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
