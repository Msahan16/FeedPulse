"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { FeedbackCategory, submitFeedback } from "@/lib/api";

const categories: FeedbackCategory[] = ["Bug", "Feature Request", "Improvement", "Other"];

export default function HomePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<FeedbackCategory>("Bug");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const remaining = useMemo(() => Math.max(0, 20 - description.length), [description.length]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (description.trim().length < 20) {
      setError("Description must be at least 20 characters.");
      return;
    }

    try {
      setLoading(true);
      await submitFeedback({
        title,
        description,
        category,
        submitterName: submitterName || undefined,
        submitterEmail: submitterEmail || undefined,
      });
      setTitle("");
      setDescription("");
      setCategory("Bug");
      setSubmitterName("");
      setSubmitterEmail("");
      setMessage("Feedback submitted successfully. AI analysis is now processing.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to submit feedback");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-wrap">
      <section className="hero">
        <h1>FeedPulse</h1>
        <p>
          Share product feedback in seconds. Our AI will auto-categorize sentiment, priority, and key
          tags to help teams ship the right thing next.
        </p>
        <Link href="/login" className="button ghost" style={{ display: "inline-block", marginTop: 10 }}>
          Admin Login
        </Link>
      </section>

      <section className="grid">
        <article className="card">
          <h2>Submit Feedback</h2>
          <form onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="A short title"
              />
            </div>

            <div className="field">
              <label htmlFor="category">Category</label>
              <select id="category" value={category} onChange={(e) => setCategory(e.target.value as FeedbackCategory)}>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                minLength={20}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Tell us what happened, what you expected, and why this matters."
              />
              <p className="helper">
                {remaining > 0 ? `${remaining} more characters required` : "Minimum reached"}
              </p>
            </div>

            <div className="field">
              <label htmlFor="name">Name (optional)</label>
              <input id="name" value={submitterName} onChange={(e) => setSubmitterName(e.target.value)} />
            </div>

            <div className="field">
              <label htmlFor="email">Email (optional)</label>
              <input
                id="email"
                type="email"
                value={submitterEmail}
                onChange={(e) => setSubmitterEmail(e.target.value)}
              />
            </div>

            {error && <p className="error">{error}</p>}
            {message && <p className="helper">{message}</p>}

            <button className="button primary" disabled={loading} type="submit">
              {loading ? "Submitting..." : "Send Feedback"}
            </button>
          </form>
        </article>

        <aside className="card">
          <h3>What Happens Next</h3>
          <p>
            Every submission gets AI enrichment: sentiment, priority score (1-10), summary, and tags.
            Admins can review all feedback in one dashboard.
          </p>
          <ul>
            <li>Public form without sign-in</li>
            <li>Safe validation before saving data</li>
            <li>Admin workflow from New to Resolved</li>
          </ul>
        </aside>
      </section>
    </main>
  );
}
