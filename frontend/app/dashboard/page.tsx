"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  FeedbackCategory,
  FeedbackItem,
  FeedbackSortBy,
  FeedbackStatus,
  Sentiment,
  SortOrder,
  deleteFeedback,
  getFeedback,
  getSummary,
  reanalyzeFeedback,
  updateFeedbackStatus,
} from "@/lib/api";

const categories: Array<"" | FeedbackCategory> = ["", "Bug", "Feature Request", "Improvement", "Other"];
const statuses: Array<"" | FeedbackStatus> = ["", "New", "In Review", "Resolved"];

function sentimentClass(sentiment?: Sentiment) {
  if (sentiment === "Positive") return "pill good";
  if (sentiment === "Negative") return "pill negative";
  return "pill neutral";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const [token, setToken] = useState<string>("");
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState<"" | FeedbackCategory>("");
  const [status, setStatus] = useState<"" | FeedbackStatus>("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<FeedbackSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const [stats, setStats] = useState({
    totalFeedback: 0,
    openItems: 0,
    averagePriority: 0,
    mostCommonTag: "-",
  });

  const [summary, setSummary] = useState<string>("");
  const [summaryDays, setSummaryDays] = useState(7);

  useEffect(() => {
    const stored = localStorage.getItem("feedpulse_admin_token");
    if (!stored) {
      window.location.href = "/login";
      return;
    }

    setToken(stored);
  }, []);

  async function loadData(targetPage = page) {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      const result = await getFeedback(
        {
          page: targetPage,
          pageSize: 10,
          category: category || undefined,
          status: status || undefined,
          q: search || undefined,
          sortBy,
          sortOrder,
        },
        token,
      );
      setItems(result.items);
      setTotalPages(result.totalPages);
      setPage(result.page);
      if (result.stats) {
        setStats(result.stats);
      }
    } catch (loadError) {
      if (loadError instanceof Error) {
        setError(loadError.message);
      } else {
        setError("Failed to load dashboard data");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, category, status, sortBy, sortOrder]);

  const averagePriority = useMemo(() => {
    const priorities = items.map((item) => item.ai_priority).filter((value): value is number => Boolean(value));
    if (!priorities.length) return "-";

    const avg = priorities.reduce((sum, value) => sum + value, 0) / priorities.length;
    return avg.toFixed(1);
  }, [items]);

  async function changeStatus(id: string, nextStatus: FeedbackStatus) {
    if (!token) return;

    await updateFeedbackStatus(id, nextStatus, token);
    await loadData(page);
  }

  async function removeItem(id: string) {
    if (!token) return;

    await deleteFeedback(id, token);
    await loadData(page);
  }

  async function rerunAi(id: string) {
    if (!token) return;

    await reanalyzeFeedback(id, token);
    await loadData(page);
  }

  async function generateSummary() {
    if (!token) return;

    const result = await getSummary(summaryDays, token);
    setSummary(result.summary);
  }

  function onSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loadData(1);
  }

  return (
    <main className="page-wrap">
      <section className="hero">
        <h1>Admin Dashboard</h1>
        <p>Filter, prioritize, and resolve submissions with AI assistance.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          <Link href="/" className="button ghost">
            Public Form
          </Link>
          <button
            className="button ghost"
            onClick={() => {
              localStorage.removeItem("feedpulse_admin_token");
              window.location.href = "/login";
            }}
          >
            Logout
          </button>
        </div>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <h3>Live Snapshot</h3>
        <p className="helper">
          Total feedback: {stats.totalFeedback} | Open items: {stats.openItems} | Average AI priority: {stats.averagePriority || averagePriority} | Most common tag: {stats.mostCommonTag}
        </p>
      </section>

      <section className="toolbar">
        <select value={category} onChange={(e) => setCategory(e.target.value as "" | FeedbackCategory)}>
          {categories.map((option) => (
            <option key={option || "all-category"} value={option}>
              {option || "All categories"}
            </option>
          ))}
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value as "" | FeedbackStatus)}>
          {statuses.map((option) => (
            <option key={option || "all-status"} value={option}>
              {option || "All statuses"}
            </option>
          ))}
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as FeedbackSortBy)}>
          <option value="createdAt">Sort by date</option>
          <option value="ai_priority">Sort by priority</option>
          <option value="ai_sentiment">Sort by sentiment</option>
        </select>

        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as SortOrder)}>
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>

        <form onSubmit={onSearchSubmit} style={{ gridColumn: "span 2", display: "flex", gap: 8 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or summary"
            style={{ width: "100%" }}
          />
          <button className="button ghost" type="submit">
            Search
          </button>
        </form>

        <button className="button ghost" onClick={() => loadData(1)}>
          Refresh
        </button>
      </section>

      {error && <p className="error">{error}</p>}

      <section className="card" style={{ overflowX: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>AI</th>
              <th>Priority</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td>
                  <strong>{item.title}</strong>
                  <div className="helper">{item.description.slice(0, 90)}...</div>
                  {item.ai_summary && <span className="badge">AI Summary Ready</span>}
                </td>
                <td>{item.category}</td>
                <td>
                  <select
                    value={item.status}
                    onChange={(event) => changeStatus(item._id, event.target.value as FeedbackStatus)}
                  >
                    {statuses
                      .filter((value): value is FeedbackStatus => Boolean(value))
                      .map((statusValue) => (
                        <option key={statusValue} value={statusValue}>
                          {statusValue}
                        </option>
                      ))}
                  </select>
                </td>
                <td>
                  <span className={sentimentClass(item.ai_sentiment)}>{item.ai_sentiment || "Pending"}</span>
                </td>
                <td>{item.ai_priority || "-"}</td>
                <td>{formatDate(item.createdAt)}</td>
                <td>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="button ghost" onClick={() => rerunAi(item._id)}>
                      Reanalyze
                    </button>
                    <button className="button danger" onClick={() => removeItem(item._id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          <button className="button ghost" disabled={page <= 1 || loading} onClick={() => loadData(page - 1)}>
            Prev
          </button>
          <button className="button ghost" disabled={page >= totalPages || loading} onClick={() => loadData(page + 1)}>
            Next
          </button>
        </div>
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <h3>AI Trend Summary</h3>
        <p className="helper">Generate an overall summary from feedback in the last N days.</p>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="number"
            min={1}
            max={30}
            value={summaryDays}
            onChange={(e) => setSummaryDays(Number(e.target.value))}
            style={{ width: 120 }}
          />
          <button className="button primary" onClick={generateSummary}>
            Generate Summary
          </button>
        </div>
        {summary && <div className="summary-box">{summary}</div>}
      </section>
    </main>
  );
}
