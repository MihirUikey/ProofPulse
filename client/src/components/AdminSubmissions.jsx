import { useEffect, useState } from "react";
import api from "../api/api";

const reviewStatuses = [
  "In Review",
  "Changes Requested",
  "Accepted",
  "Rejected",
];

function AdminSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [reviews, setReviews] = useState({});
  const [filter, setFilter] = useState("Submitted");
  const [loading, setLoading] = useState(true);
  const [activeSubmissionId, setActiveSubmissionId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSubmissions() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/submissions/admin", {
          params: { status: filter },
        });

        if (!cancelled) {
          const loadedSubmissions = response.data.data || [];
          setSubmissions(loadedSubmissions);
          setReviews(
            Object.fromEntries(
              loadedSubmissions.map((submission) => [
                submission._id,
                {
                  status: reviewStatuses.includes(submission.status)
                    ? submission.status
                    : "In Review",
                  feedback: submission.feedback || "",
                },
              ]),
            ),
          );
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load submissions for review.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSubmissions();

    return () => {
      cancelled = true;
    };
  }, [filter]);

  function updateReview(submissionId, field, value) {
    setReviews((previous) => ({
      ...previous,
      [submissionId]: {
        ...previous[submissionId],
        [field]: value,
      },
    }));
    setError("");
    setMessage("");
  }

  async function saveReview(submission) {
    const review = reviews[submission._id];

    if (!review?.feedback.trim()) {
      setError("Add feedback before saving this review.");
      return;
    }

    setActiveSubmissionId(submission._id);
    setError("");
    setMessage("");

    try {
      const response = await api.patch(
        `/submissions/admin/${submission._id}/review`,
        review,
      );
      const reviewedSubmission = response.data.data;

      setSubmissions((previous) =>
        filter !== "All" && filter !== reviewedSubmission.status
          ? previous.filter((item) => item._id !== submission._id)
          : previous.map((item) =>
              item._id === submission._id ? reviewedSubmission : item,
            ),
      );
      setMessage(response.data.message || "Submission review saved.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to save this review. Please try again.",
      );
    } finally {
      setActiveSubmissionId(null);
    }
  }

  return (
    <section className="admin-requests-page">
      <header className="section-heading">
        <div>
          <span className="eyebrow">ADMINISTRATION</span>
          <h1>Review submissions</h1>
          <p>Evaluate submitted projects and give developers actionable feedback.</p>
        </div>

        <label className="admin-request-filter">
          <span>Show</span>
          <select
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value);
              setError("");
              setMessage("");
            }}
            aria-label="Filter submissions by status"
          >
            <option value="Submitted">Submitted</option>
            {reviewStatuses.map((status) => (
              <option value={status} key={status}>
                {status}
              </option>
            ))}
            <option value="All">All submissions</option>
          </select>
        </label>
      </header>

      {message && (
        <div className="success-message" role="status">
          {message}
        </div>
      )}
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="empty-state">
          <p>Loading submissions...</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="empty-state">
          <h2>No {filter === "All" ? "" : filter.toLowerCase()} submissions</h2>
          <p>
            {filter === "Submitted"
              ? "New developer projects will appear here when they are submitted."
              : "There are no submissions matching this status."}
          </p>
        </div>
      ) : (
        <div className="admin-request-list">
          {submissions.map((submission) => {
            const review = reviews[submission._id] || {
              status: "In Review",
              feedback: "",
            };
            const isProcessing = activeSubmissionId === submission._id;

            return (
              <article className="admin-request-card" key={submission._id}>
                <header className="admin-request-card-heading">
                  <div>
                    <span className="category-badge">
                      {submission.challenge?.category || "Challenge"}
                    </span>
                    <span
                      className={`admin-request-status admin-review-status-${submission.status.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {submission.status}
                    </span>
                  </div>
                  <span className="challenge-date">
                    Submitted{" "}
                    {submission.submittedAt
                      ? new Date(submission.submittedAt).toLocaleDateString()
                      : "date unavailable"}
                  </span>
                </header>

                <h2>{submission.challenge?.title || "Untitled challenge"}</h2>

                <dl className="admin-request-details">
                  <div>
                    <dt>Developer</dt>
                    <dd>
                      {submission.user?.name ||
                        submission.user?.email ||
                        "Developer"}
                    </dd>
                  </div>
                </dl>

                <div className="admin-request-reason">
                  <strong>Developer's implementation notes</strong>
                  <p>{submission.description}</p>
                </div>

                <a
                  className="primary-link submission-repo-link"
                  href={submission.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View GitHub Repository ↗
                </a>

                {submission.challenge?.evaluationCriteria?.length > 0 && (
                  <div className="admin-request-reason">
                    <strong>Evaluation criteria</strong>
                    <ul>
                      {submission.challenge.evaluationCriteria.map(
                        (criterion, index) => (
                          <li key={`${submission._id}-criterion-${index}`}>
                            {criterion}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}

                <div className="admin-review-form">
                  <label>
                    Review decision
                    <select
                      value={review.status}
                      onChange={(event) =>
                        updateReview(
                          submission._id,
                          "status",
                          event.target.value,
                        )
                      }
                      disabled={isProcessing}
                    >
                      {reviewStatuses.map((status) => (
                        <option value={status} key={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Feedback for the developer
                    <textarea
                      value={review.feedback}
                      onChange={(event) =>
                        updateReview(
                          submission._id,
                          "feedback",
                          event.target.value,
                        )
                      }
                      maxLength={3000}
                      rows={4}
                      required
                      disabled={isProcessing}
                    />
                    <small>{review.feedback.length}/3000 characters</small>
                  </label>

                  <button
                    type="button"
                    className="auth-submit"
                    onClick={() => saveReview(submission)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Saving review..." : "Save review"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default AdminSubmissions;
