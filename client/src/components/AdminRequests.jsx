import { useEffect, useState } from "react";
import api from "../api/api";

function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("Pending");
  const [reloadCount, setReloadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeRequestId, setActiveRequestId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadRequests() {
      setLoading(true);

      try {
        const params = filter === "All" ? {} : { status: filter };
        const response = await api.get("/challenge-requests", { params });

        if (!cancelled) {
          setRequests(response.data.data || []);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load challenge requests.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRequests();

    return () => {
      cancelled = true;
    };
  }, [filter, reloadCount]);

  async function reviewRequest(request, decision) {
    let reviewNote = "";

    if (decision === "reject") {
      reviewNote = window.prompt("Add a reason for rejecting this request:");

      if (reviewNote === null) {
        return;
      }

      if (!reviewNote.trim()) {
        setError("A rejection note is required.");
        return;
      }
    }

    setActiveRequestId(request._id);
    setError("");
    setMessage("");

    try {
      const response = await api.patch(
        `/challenge-requests/${request._id}/${decision}`,
        { reviewNote },
      );
      setMessage(response.data.message || "Request review completed.");
      setReloadCount((count) => count + 1);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          `Unable to ${decision} this request.`,
      );
      setReloadCount((count) => count + 1);
    } finally {
      setActiveRequestId(null);
    }
  }

  return (
    <section className="admin-requests-page">
      <header className="section-heading">
        <div>
          <span className="eyebrow">ADMINISTRATION</span>
          <h1>Challenge requests</h1>
          <p>Review community suggestions and publish approved challenges.</p>
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
            aria-label="Filter challenge requests by status"
          >
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="All">All requests</option>
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
          <p>Loading challenge requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <h2>No {filter === "All" ? "" : filter.toLowerCase()} requests</h2>
          <p>
            {filter === "Pending"
              ? "New student challenge suggestions will appear here."
              : "There are no requests matching this status."}
          </p>
        </div>
      ) : (
        <div className="admin-request-list">
          {requests.map((request) => {
            const isProcessing = activeRequestId === request._id;
            const canApprove =
              request.status === "Pending" ||
              (request.status === "Approved" &&
                request.publicationPending);

            return (
              <article className="admin-request-card" key={request._id}>
                <header className="admin-request-card-heading">
                  <div>
                    <span className="category-badge">{request.category}</span>
                    <span
                      className={`admin-request-status admin-request-status-${request.status.toLowerCase()}`}
                    >
                      {request.status}
                    </span>
                  </div>
                  <span className="challenge-date">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </header>

                <h2>{request.title}</h2>
                <p>{request.description}</p>

                <dl className="admin-request-details">
                  <div>
                    <dt>Difficulty</dt>
                    <dd>{request.difficulty}</dd>
                  </div>
                  <div>
                    <dt>Requested by</dt>
                    <dd>
                      {request.requestedBy?.name ||
                        request.requestedBy?.email ||
                        "Developer"}
                    </dd>
                  </div>
                </dl>

                <div className="admin-request-reason">
                  <strong>Why it should be added</strong>
                  <p>{request.reason}</p>
                </div>

                {request.reviewNote && (
                  <div className="admin-request-reason">
                    <strong>Review note</strong>
                    <p>{request.reviewNote}</p>
                  </div>
                )}

                {request.reviewedAt && (
                  <p className="admin-request-review-meta">
                    Reviewed by{" "}
                    {request.reviewedBy?.name ||
                      request.reviewedBy?.email ||
                      "an administrator"}{" "}
                    on {new Date(request.reviewedAt).toLocaleDateString()}
                  </p>
                )}

                {request.challengePublished && (
                  <p className="admin-request-published" role="status">
                    Published as a challenge.
                  </p>
                )}

                <footer className="admin-request-actions">
                  {canApprove && (
                    <button
                      type="button"
                      className="auth-submit"
                      disabled={isProcessing}
                      onClick={() => reviewRequest(request, "approve")}
                    >
                      {isProcessing
                        ? "Publishing..."
                        : request.status === "Approved"
                          ? request.challengePublished
                            ? "Complete publishing"
                            : "Retry publishing"
                          : "Approve & publish"}
                    </button>
                  )}
                  {request.status === "Pending" && (
                    <button
                      type="button"
                      className="auth-nav-button"
                      disabled={isProcessing}
                      onClick={() => reviewRequest(request, "reject")}
                    >
                      Reject
                    </button>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default AdminRequests;
