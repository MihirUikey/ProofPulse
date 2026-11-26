import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, Code2 } from "lucide-react";
import api from "../api/api";

function ActivityFeed({ user, onNavigate }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadActivity() {
      try {
        const response = await api.get("/submissions/mine");

        if (!cancelled) {
          setSubmissions(response.data.data || []);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load your submission activity.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadActivity();

    return () => {
      cancelled = true;
    };
  }, []);

  const recentSubmissions = [...submissions].sort(
    (first, second) =>
      new Date(second.submittedAt || 0) - new Date(first.submittedAt || 0),
  );
  const acceptedCount = submissions.filter(
    (submission) => submission.status === "Accepted",
  ).length;
  const awaitingReviewCount = submissions.filter((submission) =>
    ["Submitted", "In Review"].includes(submission.status),
  ).length;
  const firstName = user?.name?.trim().split(/\s+/)[0] || "Developer";

  return (
    <section className="overview-page">
      <header className="overview-heading">
        <div>
          <span className="eyebrow">YOUR DEVELOPER WORKSPACE</span>
          <h1>Your activity, {firstName}.</h1>
          <p>See the progress of the projects you have submitted.</p>
        </div>
        <div className="overview-date">
          <Activity size={17} />
          <span>Submission history</span>
        </div>
      </header>

      <div className="overview-stats-grid">
        <article className="overview-stat-card">
          <div className="overview-stat-top">
            <span>Total submissions</span>
            <div className="overview-stat-icon">
              <Code2 size={20} />
            </div>
          </div>
          <strong>{loading ? "…" : submissions.length}</strong>
          <small>Projects shared for review</small>
        </article>

        <article className="overview-stat-card">
          <div className="overview-stat-top">
            <span>Accepted</span>
            <div className="overview-stat-icon">
              <Activity size={20} />
            </div>
          </div>
          <strong>{loading ? "…" : acceptedCount}</strong>
          <small>Projects approved by reviewers</small>
        </article>

        <article className="overview-stat-card">
          <div className="overview-stat-top">
            <span>Awaiting review</span>
            <div className="overview-stat-icon">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <strong>{loading ? "…" : awaitingReviewCount}</strong>
          <small>Submitted or currently in review</small>
        </article>
      </div>

      <section className="overview-panel">
        <div className="overview-panel-heading">
          <div>
            <span className="eyebrow">RECENT WORK</span>
            <h2>Submission activity</h2>
          </div>
          <button
            type="button"
            className="overview-text-button"
            onClick={() => onNavigate("submissions")}
          >
            View submissions <ArrowUpRight size={16} />
          </button>
        </div>

        {loading ? (
          <p className="overview-message">Loading your activity...</p>
        ) : error ? (
          <p className="overview-error" role="alert">
            {error}
          </p>
        ) : recentSubmissions.length === 0 ? (
          <div className="overview-empty-state">
            <div className="overview-empty-icon">
              <Code2 size={25} />
            </div>
            <h3>Your activity starts with a challenge.</h3>
            <p>
              Submit a project to see its review status and feedback here.
            </p>
            <button
              type="button"
              className="overview-text-button"
              onClick={() => onNavigate("challenges")}
            >
              Explore challenges <ArrowUpRight size={16} />
            </button>
          </div>
        ) : (
          <div className="overview-recent-list">
            {recentSubmissions.map((submission) => (
              <article className="overview-recent-item" key={submission._id}>
                <div className="overview-recent-icon">
                  <Code2 size={19} />
                </div>
                <div className="overview-recent-details">
                  <h3>{submission.challenge?.title || "Untitled challenge"}</h3>
                  <p>
                    {submission.challenge?.category || "Challenge"} ·{" "}
                    {submission.submittedAt
                      ? new Date(submission.submittedAt).toLocaleDateString()
                      : "Date unavailable"}
                  </p>
                </div>
                <span
                  className={`overview-status overview-status-${(
                    submission.status || "unknown"
                  )
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                >
                  {submission.status || "Unknown"}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

export default ActivityFeed;
