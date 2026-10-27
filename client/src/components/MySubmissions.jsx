import { useEffect, useState } from "react";
import api from "../api/api";

function MySubmissions({ onBack }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchMySubmissions() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/submissions/mine");

        setSubmissions(response.data.data || []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load your submissions. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchMySubmissions();
  }, []);

  if (loading) {
    return (
      <section className="submissions-section">
        <h2>My Submissions</h2>
        <p>Loading your submissions...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="submissions-section">
        <h2>My Submissions</h2>
        <p role="alert" className="submission-error">
          {error}
        </p>
      </section>
    );
  }

  return (
    <section className="submissions-section">
      <button type="button" className="auth-nav-button" onClick={onBack}>
        ← Back to Challenges
      </button>
      <div className="section-heading">
        <div>
          <span className="eyebrow">YOUR PROGRESS</span>
          <h2>My Submissions</h2>
          <p>Track the projects you have submitted.</p>
        </div>

        <span className="result-count">{submissions.length} submissions</span>
      </div>

      {submissions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">&lt;/&gt;</div>
          <h3>No submissions yet</h3>
          <p>
            Complete a challenge and submit your GitHub repository to see it
            here.
          </p>
        </div>
      ) : (
        <div className="submissions-grid">
          {submissions.map((submission) => (
            <article className="submission-card" key={submission._id}>
              <div className="submission-card-header">
                <span className="eyebrow">
                  {submission.challenge?.category || "Challenge"}
                </span>

                <span className="submission-status">{submission.status}</span>
              </div>

              <h3>{submission.challenge?.title || "Untitled challenge"}</h3>

              <p className="submission-difficulty">
                Difficulty:{" "}
                {submission.challenge?.difficulty || "Not specified"}
              </p>

              <p className="submission-description">{submission.description}</p>

              <p className="submission-date">
                Submitted:{" "}
                {submission.submittedAt
                  ? new Date(submission.submittedAt).toLocaleDateString()
                  : "Date unavailable"}
              </p>

              <a
                className="primary-link submission-repo-link"
                href={submission.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View GitHub Repository ↗
              </a>

              {submission.feedback && (
                <div className="submission-feedback">
                  <h4>Feedback</h4>
                  <p>{submission.feedback}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default MySubmissions;
