import { useState } from "react";
import api from "../api/api";

export default function RequestChallenge() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "JavaScript",
    difficulty: "Easy",
    reason: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await api.post("/challenge-requests", form);

      setMessage(
        response.data.message || "Challenge request submitted successfully.",
      );

      setForm({
        title: "",
        description: "",
        category: "JavaScript",
        difficulty: "Easy",
        reason: "",
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to submit your request. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="request-challenge-page">
      <span className="eyebrow">COMMUNITY CONTRIBUTIONS</span>

      <h1>Request a Challenge</h1>

      <p>
        Suggest a coding challenge that helps developers demonstrate their
        skills. Your request will be reviewed before it is published.
      </p>

      {message && (
        <div className="request-message success-message" role="status">
          {message}
        </div>
      )}

      {error && (
        <div className="request-message error-message" role="alert">
          {error}
        </div>
      )}

      <form className="request-challenge-form" onSubmit={handleSubmit}>
        <label htmlFor="request-title">Challenge title</label>
        <input
          id="request-title"
          name="title"
          type="text"
          minLength={5}
          maxLength={100}
          value={form.title}
          onChange={handleChange}
          placeholder="e.g. Build a rate limiter"
          required
        />

        <label htmlFor="request-description">Challenge description</label>
        <textarea
          id="request-description"
          name="description"
          minLength={20}
          maxLength={2000}
          rows={5}
          value={form.description}
          onChange={handleChange}
          placeholder="Explain the problem and what the developer needs to build."
          required
        />

        <label htmlFor="request-category">Technology</label>
        <select
          id="request-category"
          name="category"
          value={form.category}
          onChange={handleChange}
          required
        >
          <option value="JavaScript">JavaScript</option>
          <option value="React">React</option>
          <option value="Node.js">Node.js</option>
          <option value="MongoDB">MongoDB</option>
          <option value="C++">C++</option>
        </select>

        <label htmlFor="request-difficulty">Difficulty</label>
        <select
          id="request-difficulty"
          name="difficulty"
          value={form.difficulty}
          onChange={handleChange}
          required
        >
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>

        <label htmlFor="request-reason">
          Why should we add this challenge?
        </label>
        <textarea
          id="request-reason"
          name="reason"
          minLength={10}
          maxLength={1000}
          rows={4}
          value={form.reason}
          onChange={handleChange}
          placeholder="Explain what skill this challenge would help developers prove."
          required
        />

        <button type="submit" className="auth-submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Challenge Request"}
        </button>
      </form>
    </section>
  );
}
