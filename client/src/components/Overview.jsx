import { useEffect, useState } from "react";
import {
  Target,
  Send,
  CheckCircle2,
  Clock3,
  ArrowUpRight,
  Code2,
  Activity,
  Trophy,
} from "lucide-react";
import api from "../api/api";

function Overview({ user, onNavigate }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/submissions/mine");
        setSubmissions(response.data.data || []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load your submission activity.",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchSubmissions();
  }, []);

  const acceptedCount = submissions.filter(
    (submission) => submission.status === "Accepted",
  ).length;

  const inReviewCount = submissions.filter(
    (submission) =>
      submission.status === "In Review" || submission.status === "Submitted",
  ).length;

  const recentSubmissions = [...submissions]
    .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))
    .slice(0, 4);

  const firstName = user?.name?.trim().split(/\s+/)[0] || "Developer";

  return (
    <section className="overview-page">
      <header className="overview-heading">
        <div>
          <span className="eyebrow">YOUR DEVELOPER WORKSPACE</span>
          <h1>Welcome back, {firstName}.</h1>
          <p>Every challenge is a chance to turn your skills into proof.</p>
        </div>

        <div className="overview-date">
          <Activity size={17} />
          <span>Your progress, at a glance</span>
        </div>
      </header>

      <section className="overview-hero">
        <div className="overview-hero-content">
          <span className="eyebrow">BUILD. SUBMIT. PROVE.</span>
          <h2>Your next breakthrough starts with one challenge.</h2>
          <p>
            Work on practical tasks, submit your projects, and build a portfolio
            backed by evidence.
          </p>

          <button
            type="button"
            className="overview-primary-button"
            onClick={() => onNavigate("challenges")}
          >
            Explore Challenges <ArrowUpRight size={17} />
          </button>
        </div>

        <div className="overview-hero-icon">
          <Target size={76} strokeWidth={1.2} />
          <span>PROOF &gt; PROMISES</span>
        </div>
      </section>

      <div className="overview-section-heading">
        <div>
          <span className="eyebrow">YOUR PERFORMANCE</span>
          <h2>Progress overview</h2>
        </div>
        <button
          type="button"
          className="overview-text-button"
          onClick={() => onNavigate("submissions")}
        >
          View submissions <ArrowUpRight size={16} />
        </button>
      </div>

      <div className="overview-stats-grid">
        <article className="overview-stat-card">
          <div className="overview-stat-top">
            <span>All submissions</span>
            <div className="overview-stat-icon">
              <Send size={20} />
            </div>
          </div>
          <strong>{loading ? "…" : submissions.length}</strong>
          <small>Projects you've submitted</small>
        </article>

        <article className="overview-stat-card">
          <div className="overview-stat-top">
            <span>Accepted projects</span>
            <div className="overview-stat-icon">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <strong>{loading ? "…" : acceptedCount}</strong>
          <small>Submissions approved by reviewers</small>
        </article>

        <article className="overview-stat-card">
          <div className="overview-stat-top">
            <span>Awaiting review</span>
            <div className="overview-stat-icon">
              <Clock3 size={20} />
            </div>
          </div>
          <strong>{loading ? "…" : inReviewCount}</strong>
          <small>Submitted or under review</small>
        </article>

        <article className="overview-stat-card">
          <div className="overview-stat-top">
            <span>Challenges</span>
            <div className="overview-stat-icon">
              <Trophy size={20} />
            </div>
          </div>
          <strong>—</strong>
          <small>Challenge completion tracking comes next</small>
        </article>
      </div>

      <div className="overview-bottom-grid">
        <section className="overview-panel">
          <div className="overview-panel-heading">
            <div>
              <span className="eyebrow">LATEST WORK</span>
              <h2>Recent submissions</h2>
            </div>

            <button
              type="button"
              className="overview-icon-button"
              onClick={() => onNavigate("submissions")}
              aria-label="View all submissions"
              title="View all submissions"
            >
              <ArrowUpRight size={19} />
            </button>
          </div>

          {loading ? (
            <p className="overview-message">Loading your submissions...</p>
          ) : error ? (
            <p className="overview-error" role="alert">
              {error}
            </p>
          ) : recentSubmissions.length === 0 ? (
            <div className="overview-empty-state">
              <div className="overview-empty-icon">
                <Code2 size={25} />
              </div>
              <h3>Your first proof starts here.</h3>
              <p>
                Submit a project to start building your evidence-backed
                portfolio.
              </p>
              <button
                type="button"
                className="overview-text-button"
                onClick={() => onNavigate("challenges")}
              >
                Find a challenge <ArrowUpRight size={16} />
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
                    <h3>
                      {submission.challenge?.title || "Untitled challenge"}
                    </h3>
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

        <section className="overview-panel overview-activity-panel">
          <div className="overview-panel-heading">
            <div>
              <span className="eyebrow">KEEP MOVING</span>
              <h2>Your next steps</h2>
            </div>
            <Activity size={21} />
          </div>

          <button
            type="button"
            className="overview-action-item"
            onClick={() => onNavigate("challenges")}
          >
            <span className="overview-action-icon">
              <Target size={19} />
            </span>
            <span>
              <strong>Take on a challenge</strong>
              <small>Put your technical skills to the test.</small>
            </span>
            <ArrowUpRight size={17} />
          </button>

          <button
            type="button"
            className="overview-action-item"
            onClick={() => onNavigate("submissions")}
          >
            <span className="overview-action-icon">
              <Code2 size={19} />
            </span>
            <span>
              <strong>Review your submissions</strong>
              <small>Check statuses and reviewer feedback.</small>
            </span>
            <ArrowUpRight size={17} />
          </button>

          <button
            type="button"
            className="overview-action-item"
            onClick={() => onNavigate("activity")}
          >
            <span className="overview-action-icon">
              <Activity size={19} />
            </span>
            <span>
              <strong>Check your activity</strong>
              <small>Explore your progress and consistency.</small>
            </span>
            <ArrowUpRight size={17} />
          </button>
        </section>
      </div>
    </section>
  );
}

export default Overview;
