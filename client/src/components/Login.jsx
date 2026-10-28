import { useState } from "react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

function Login({ onSwitchToRegister, onLoginSuccess }) {
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        email: form.email.trim(),
        password: form.password,
      });

      const { token, user } = response.data;

      if (!token || !user?.id || !["user", "admin"].includes(user.role)) {
        throw new Error("The server returned an invalid login response.");
      }

      login(token, user);

      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-card">
      <span className="eyebrow">WELCOME BACK</span>
      <h2>Log in to ProofPulse</h2>
      <p className="auth-description">
        Sign in to submit projects, track your progress, and suggest challenges.
      </p>

      {error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <label htmlFor="login-email">Email address</label>
        <input
          id="login-email"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
          required
        />

        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          name="password"
          type="password"
          placeholder="Your password"
          value={form.password}
          onChange={handleChange}
          autoComplete="current-password"
          required
        />

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="auth-switch">
        Don't have an account?{" "}
        <button type="button" onClick={onSwitchToRegister}>
          Create one
        </button>
      </p>
    </section>
  );
}

export default Login;
