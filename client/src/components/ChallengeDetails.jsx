import { useState } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

function ChallengeDetails({ challenge, onBack, onAttempt }) {
  const { isAuthenticated } = useAuth();

  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!challenge) {
    return (
      <section className="challenge-details">
        <h2>Challenge not found</h2>
        <button type="button" onClick={onBack}>
          Back to challenges
        </button>
      </section>
    );
  }

  const handleAttempt = () => {
    if (!isAuthenticated) {
      setError("Please log in to submit your project.");
      setShowSubmissionForm(false);

      if (onAttempt) {
        onAttempt(challenge);
      }

      return;
    }

    setError("");
    setMessage("");
    setShowSubmissionForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    const trimmedUrl = repositoryUrl.trim();
    const trimmedDescription = description.trim();

    if (!trimmedUrl || !trimmedDescription) {
      setError("Please provide both your GitHub URL and project description.");
      return;
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(trimmedUrl);
    } catch {
      setError("Please enter a valid GitHub repository URL.");
      return;
    }

    const validGitHubUrl =
      parsedUrl.protocol === "https:" &&
      parsedUrl.hostname.toLowerCase() === "github.com" &&
      !parsedUrl.username &&
      !parsedUrl.password &&
      /^\/[^/]+\/[^/]+\/?$/.test(parsedUrl.pathname);

    if (!validGitHubUrl) {
      setError(
        "Use a repository URL like https://github.com/username/repository.",
      );
      return;
    }

    if (trimmedDescription.length > 1000) {
      setError("Your description cannot exceed 1000 characters.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.post("/submissions", {
        challengeId: challenge._id,
        repositoryUrl: trimmedUrl,
        description: trimmedDescription,
      });

      setMessage(
        response.data.message || "Your project was submitted successfully!",
      );

      setRepositoryUrl("");
      setDescription("");
      setShowSubmissionForm(false);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Your session may have expired. Please log in again.");
      } else {
        setError(
          err.response?.data?.message ||
            "Unable to submit your project. Please try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="challenge-details">
      <button type="button" className="back-button" onClick={onBack}>
        ← Back to challenges
      </button>

      <div className="challenge-details-header">
        <div className="challenge-card-top">
          <span className="category-badge">{challenge.category}</span>

          <span
            className={`difficulty-badge ${challenge.difficulty.toLowerCase()}`}
          >
            {challenge.difficulty}
          </span>
        </div>

        <h1>{challenge.title}</h1>

        <p className="challenge-details-description">{challenge.description}</p>
      </div>

      <div className="details-section">
        <h2>Project requirements</h2>
        <p>
          Review the challenge description and evaluation criteria carefully
          before beginning your implementation.
        </p>
      </div>

      <div className="details-section">
        <h2>Evaluation criteria</h2>

        {challenge.evaluationCriteria?.length > 0 ? (
          <ul>
            {challenge.evaluationCriteria.map((criterion, index) => (
              <li key={index}>{criterion}</li>
            ))}
          </ul>
        ) : (
          <p>No evaluation criteria have been provided yet.</p>
        )}
      </div>

      <div className="details-section submission-instructions">
        <h2>How to complete this challenge</h2>

        <ol>
          <li>Read the challenge requirements carefully.</li>
          <li>Build your solution in your local development environment.</li>
          <li>Upload your project to a GitHub repository.</li>
          <li>Submit your repository using the form below.</li>
        </ol>

        <button type="button" className="auth-submit" onClick={handleAttempt}>
          {showSubmissionForm ? "Submission Form Open" : "Attempt Challenge →"}
        </button>
      </div>

      {message && (
        <div className="submission-success" role="status">
          {message}
        </div>
      )}

      {error && (
        <div className="submission-error" role="alert">
          {error}
        </div>
      )}

      {showSubmissionForm && (
        <form className="submission-form" onSubmit={handleSubmit}>
          <h2>Submit your project</h2>

          <p>
            Share your implementation so it can be reviewed against the
            challenge requirements.
          </p>

          <div className="form-group">
            <label htmlFor="repositoryUrl">GitHub repository URL</label>

            <input
              id="repositoryUrl"
              type="url"
              placeholder="https://github.com/username/repository"
              value={repositoryUrl}
              onChange={(event) => setRepositoryUrl(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="submissionDescription">
              Describe your implementation
            </label>

            <textarea
              id="submissionDescription"
              placeholder="Explain what you built, the technical decisions you made, and any important features."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={1000}
              rows={5}
              required
            />

            <small>{description.length}/1000 characters</small>
          </div>

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Project"}
          </button>
        </form>
      )}
    </section>
  );
}

export default ChallengeDetails;
