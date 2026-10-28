import { useEffect, useState, useRef } from "react";
import ChallengeCard from "./components/ChallengeCard";
import ChallengeForm from "./components/ChallengeForm";
import ChallengeDetails from "./components/ChallengeDetails";
import MySubmissions from "./components/MySubmissions";
import Login from "./components/Login";
import Register from "./components/Register";
import Sidebar from "./components/Sidebar";
import DeveloperProfile from "./components/DeveloperProfile";
import PublicDeveloperProfile from "./components/PublicDeveloperProfile";
import Overview from "./components/Overview";
import RequestChallenge from "./components/RequestChallenge";
import AdminRequests from "./components/AdminRequests";
import AdminSubmissions from "./components/AdminSubmissions";
import api from "./api/api";
import { useAuth } from "./context/AuthContext";
import "./App.css";

const API_URL = "/challenges";

const initialForm = {
  title: "",
  description: "",
  category: "JavaScript",
  difficulty: "Easy",
  evaluationCriteria: "",
};

const authenticatedViews = [
  "overview",
  "activity",
  "request-challenge",
  "submissions",
  "feedback",
  "profile",
  "skills",
  "admin-challenges",
  "admin-requests",
  "admin-submissions",
];

const adminViews = [
  "admin-challenges",
  "admin-requests",
  "admin-submissions",
];

function App() {
  const { user, isAuthenticated, authLoading, logout } = useAuth();

  const [publicProfileId, setPublicProfileId] = useState(
    () => new URLSearchParams(window.location.search).get("profile"),
  );
  const [authView, setAuthView] = useState(null);
  const [activeView, setActiveView] = useState("challenges");
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const formRef = useRef(null);
  const requiresAuthentication = authenticatedViews.includes(activeView);
  const requiresAdmin = adminViews.includes(activeView);

  useEffect(() => {
    function syncPublicProfile() {
      setPublicProfileId(
        new URLSearchParams(window.location.search).get("profile"),
      );
    }

    window.addEventListener("popstate", syncPublicProfile);
    return () => window.removeEventListener("popstate", syncPublicProfile);
  }, []);

  function closePublicProfile() {
    const url = new URL(window.location.href);
    url.searchParams.delete("profile");
    window.history.replaceState(
      {},
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
    setPublicProfileId(null);
  }

  // Load challenges when the component mounts
  useEffect(() => {
    let cancelled = false;

    async function loadChallenges() {
      try {
        const response = await api.get(API_URL);

        if (!cancelled) {
          setError("");
          setChallenges(response.data.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load challenges. Check whether the backend is running.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadChallenges();

    return () => {
      cancelled = true;
    };
  }, []);

  // Handle form input changes
  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));

    setError("");
    setMessage("");
  }

  // Create a new challenge
  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");
    // Validate the challenge title
    if (!form.title.trim()) {
      setError("Please enter a challenge title.");
      return;
    }

    if (form.title.trim().length < 3) {
      setError("The title must contain at least 3 characters.");
      return;
    }

    if (form.title.trim().length > 100) {
      setError("The title cannot exceed 100 characters.");
      return;
    }

    // Validate the description
    if (!form.description.trim()) {
      setError("Please enter a challenge description.");
      return;
    }

    if (form.description.trim().length < 10) {
      setError("The description must contain at least 10 characters.");
      return;
    }
    const criteria = form.evaluationCriteria
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const challengeData = {
      title: form.title,
      description: form.description,
      category: form.category,
      difficulty: form.difficulty,
      evaluationCriteria: criteria,
    };

    try {
      setSubmitting(true);

      let response;

      if (editingId) {
        // Update the existing challenge
        response = await api.put(`${API_URL}/${editingId}`, challengeData);

        setChallenges((previous) =>
          previous.map((challenge) =>
            challenge._id === editingId ? response.data.data : challenge,
          ),
        );

        setMessage("Challenge updated successfully!");
      } else {
        // Create a new challenge
        response = await api.post(API_URL, challengeData);

        setChallenges((previous) => [response.data.data, ...previous]);

        setMessage("Challenge created successfully!");
      }

      setForm(initialForm);
      setEditingId(null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to save challenge. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // Delete a challenge
  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this challenge?",
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await api.delete(`${API_URL}/${id}`);

      setChallenges((previous) =>
        previous.filter((challenge) => challenge._id !== id),
      );

      setMessage("Challenge deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete challenge.");
    }
  }

  function handleEdit(challenge) {
    setEditingId(challenge._id);

    setForm({
      title: challenge.title,
      description: challenge.description,
      category: challenge.category,
      difficulty: challenge.difficulty,
      evaluationCriteria: challenge.evaluationCriteria.join("\n"),
    });

    setError("");
    setMessage("");

    formRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
  function handleOpenChallenge(challenge) {
    setSelectedChallenge(challenge);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBackToChallenges() {
    setSelectedChallenge(null);
  }
  // Search and filter challenges
  const filteredChallenges = challenges.filter((challenge) => {
    const matchesSearch = [
      challenge.title,
      challenge.description,
      challenge.category,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter = filter === "All" || challenge.difficulty === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div
      className={`app-shell ${
        sidebarCollapsed ? "app-shell-sidebar-collapsed" : ""
      }`}
    >
      <Sidebar
        activeView={activeView}
        isAdmin={user?.role === "admin"}
        isAuthenticated={isAuthenticated}
        onCollapseChange={setSidebarCollapsed}
        onNavigate={(view) => {
          setActiveView(view);
          setSelectedChallenge(null);
          setMessage("");
          setError("");
        }}
      />
      <header className="navbar">
        <a href="/" className="brand">
          <span className="brand-icon">P</span>
          <span>
            Proof<span className="brand-highlight">Pulse</span>
          </span>
        </a>

        <div className="nav-label">
          <span className="status-dot"></span>
          Developer Challenge Platform
        </div>

        <div className="auth-nav-actions">
          {authLoading ? (
            <span className="nav-label">Checking session...</span>
          ) : isAuthenticated ? (
            <>
              <span className="auth-nav-user">
                Hi, {user?.name || "Developer"}
              </span>
              <button
                type="button"
                className="auth-nav-button"
                onClick={() => {
                  setActiveView("submissions");
                  setSelectedChallenge(null);
                  setMessage("");
                  setError("");
                }}
              >
                My Submissions
              </button>

              <button
                type="button"
                className="auth-nav-button"
                onClick={() => {
                  logout();
                  setActiveView("challenges");
                  setSelectedChallenge(null);
                  setAuthView(null);
                  setEditingId(null);
                  setForm(initialForm);
                  setMessage("");
                  setError("");
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="auth-nav-button"
                onClick={() => {
                  setAuthView("login");
                  document
                    .getElementById("account")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Log in
              </button>

              <button
                type="button"
                className="auth-nav-button auth-nav-primary"
                onClick={() => {
                  setAuthView("register");
                  document
                    .getElementById("account")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Create account
              </button>
            </>
          )}
        </div>
      </header>

      <main className="main-container">
        {publicProfileId ? (
          <PublicDeveloperProfile
            userId={publicProfileId}
            onBack={closePublicProfile}
          />
        ) : authLoading && requiresAuthentication ? (
          <section className="auth-card access-gate">
            <span className="eyebrow">PROOFPULSE WORKSPACE</span>
            <h2>Restoring your session...</h2>
            <p className="auth-description">
              Please wait while we check your account.
            </p>
          </section>
        ) : !isAuthenticated && requiresAuthentication ? (
          <section className="auth-card access-gate">
            <span className="eyebrow">MEMBER WORKSPACE</span>
            <h2>Log in to continue</h2>
            <p className="auth-description">
              This area is part of your ProofPulse workspace. Log in or create
              an account to continue.
            </p>
            {authView === "login" ? (
              <Login
                onSwitchToRegister={() => setAuthView("register")}
                onLoginSuccess={() => setAuthView(null)}
              />
            ) : authView === "register" ? (
              <Register
                onSwitchToLogin={() => setAuthView("login")}
                onRegisterSuccess={() => setAuthView("login")}
              />
            ) : (
              <div className="access-gate-actions">
                <button
                  type="button"
                  className="auth-submit"
                  onClick={() => setAuthView("login")}
                >
                  Log in
                </button>
                <button
                  type="button"
                  className="auth-nav-button"
                  onClick={() => setAuthView("register")}
                >
                  Create account
                </button>
              </div>
            )}
          </section>
        ) : requiresAdmin && user?.role !== "admin" ? (
          <section className="sidebar-placeholder access-gate">
            <span className="eyebrow">ADMINISTRATION</span>
            <h1>Administrator access required</h1>
            <p>
              This page is only available to ProofPulse administrators.
            </p>
            <button
              type="button"
              className="auth-submit"
              onClick={() => setActiveView("challenges")}
            >
              Explore Challenges
            </button>
          </section>
        ) : activeView === "request-challenge" && user?.role === "admin" ? (
          <section className="sidebar-placeholder access-gate">
            <span className="eyebrow">CHALLENGE REQUESTS</span>
            <h1>Developer access required</h1>
            <p>
              Challenge suggestions are available to developer accounts.
              Administrators can manage and review requests from Administration.
            </p>
            <button
              type="button"
              className="auth-submit"
              onClick={() => setActiveView("admin-requests")}
            >
              Review Challenge Requests
            </button>
          </section>
        ) : activeView === "overview" ? (
          <Overview user={user} onNavigate={setActiveView} />
        ) : activeView === "activity" ? (
          <section className="sidebar-placeholder">
            <span className="eyebrow">PROOFPULSE WORKSPACE</span>
            <h1>Activity &amp; Streaks</h1>
            <p>
              Your activity calendar, daily streaks, and consistency tracking
              will appear here.
            </p>
          </section>
        ) : activeView === "admin-requests" &&
          isAuthenticated &&
          user?.role === "admin" ? (
          <AdminRequests />
        ) : activeView === "admin-submissions" &&
          isAuthenticated &&
          user?.role === "admin" ? (
          <AdminSubmissions />
        ) : ["profile", "skills"].includes(activeView) && isAuthenticated ? (
          <DeveloperProfile />
        ) : ["submissions", "feedback"].includes(activeView) &&
          isAuthenticated ? (
          <MySubmissions onBack={() => setActiveView("challenges")} />
        ) : activeView === "request-challenge" &&
          isAuthenticated &&
          user?.role !== "admin" ? (
          <RequestChallenge />
        ) : selectedChallenge ? (
          <ChallengeDetails
            challenge={selectedChallenge}
            onBack={handleBackToChallenges}
            onAttempt={(challenge) => {
              setMessage(
                `"${challenge.title}" selected! Challenge attempts are coming soon.`,
              );
            }}
          />
        ) : (
          <>
            <section className="hero">
              <div className="hero-content">
                <span className="eyebrow">YOUR SKILLS. YOUR PROOF.</span>

                <h1>
                  Don't just claim it.
                  <br />
                  <span>Prove it.</span>
                </h1>

                <p>
                  Take on practical coding challenges, demonstrate your
                  abilities, and build evidence of your technical skills.
                </p>

                <a href="#challenges" className="primary-link">
                  Explore challenges <span>↓</span>
                </a>
              </div>
              <div className="hero-visual" aria-hidden="true">
                <div className="visual-card">
                  <span className="visual-label">SKILL STATUS</span>
                  <div className="visual-check">✓</div>
                  <h3>Proof, not promises.</h3>
                  <p>Every challenge is an opportunity to demonstrate.</p>
                  <div className="visual-progress">
                    <span></span>
                  </div>
                  <div className="visual-footer">
                    <span>KEEP BUILDING</span>
                    <span>↗</span>
                  </div>
                </div>
                <div className="floating-symbol">&lt;/&gt;</div>
              </div>
            </section>

            <section className="stats-grid">
              <div className="stat-card">
                <span className="stat-icon">◈</span>
                <div>
                  <p>Total challenges</p>
                  <h2>{challenges.length}</h2>
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-icon">◎</span>
                <div>
                  <p>Easy challenges</p>
                  <h2>
                    {challenges.filter((c) => c.difficulty === "Easy").length}
                  </h2>
                </div>
              </div>

              <div className="stat-card">
                <span className="stat-icon">⚡</span>
                <div>
                  <p>Advanced challenges</p>
                  <h2>
                    {challenges.filter((c) => c.difficulty === "Hard").length}
                  </h2>
                </div>
              </div>
            </section>

            <section className="workspace">
              <div className="challenge-section" id="challenges">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">
                      {activeView === "admin-challenges"
                        ? "ADMINISTRATION"
                        : "LEVEL UP"}
                    </span>
                    <h2>
                      {activeView === "admin-challenges"
                        ? "Manage challenges"
                        : "Explore challenges"}
                    </h2>
                    <p>
                      {activeView === "admin-challenges"
                        ? "Create, update, and remove community challenges."
                        : "Choose a challenge and put your skills to the test."}
                    </p>
                  </div>
                  <span className="result-count">
                    {filteredChallenges.length} results
                  </span>
                </div>

                <div className="filters">
                  <input
                    type="search"
                    placeholder="Search challenges..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    aria-label="Search challenges"
                  />

                  <select
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                    aria-label="Filter by difficulty"
                  >
                    <option value="All">All levels</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                {loading ? (
                  <div className="empty-state">
                    <p>Loading challenges...</p>
                  </div>
                ) : filteredChallenges.length > 0 ? (
                  <div className="challenge-grid">
                    {filteredChallenges.map((challenge) => (
                      <ChallengeCard
                        key={challenge._id}
                        challenge={challenge}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                        onViewDetails={handleOpenChallenge}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">&lt;/&gt;</div>
                    <h3>No challenges found</h3>
                    <p>
                      Create your first challenge using the form, or try
                      changing your search.
                    </p>
                  </div>
                )}
              </div>

              <div id="account" ref={formRef}>
                {authLoading ? (
                  <section className="auth-card">
                    <h2>Restoring your session...</h2>
                  </section>
                ) : isAuthenticated && user?.role === "admin" ? (
                  <ChallengeForm
                    form={form}
                    editingId={editingId}
                    submitting={submitting}
                    error={error}
                    message={message}
                    formRef={formRef}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                  />
                ) : !isAuthenticated && authView === "register" ? (
                  <Register onSwitchToLogin={() => setAuthView("login")} />
                ) : !isAuthenticated && authView === "login" ? (
                  <Login
                    onSwitchToRegister={() => setAuthView("register")}
                    onLoginSuccess={() => {
                      setAuthView(null);
                      setMessage("Logged in successfully!");
                    }}
                  />
                ) : !isAuthenticated ? (
                  <section className="auth-card">
                    <span className="eyebrow">YOUR NEXT STEP</span>
                    <h2>Ready to prove your skills?</h2>
                    <p className="auth-description">
                      Create an account to publish challenges and manage your
                      own work.
                    </p>

                    <button
                      type="button"
                      className="auth-submit"
                      onClick={() => setAuthView("login")}
                    >
                      Log in
                    </button>

                    <button
                      type="button"
                      className="auth-nav-button auth-nav-primary"
                      onClick={() => setAuthView("register")}
                    >
                      Create an account
                    </button>
                  </section>
                ) : null}
              </div>
            </section>

            <footer className="footer">
              <a href="/" className="footer-brand">
                ProofPulse<span>.</span>
              </a>
              <p>Built to turn claimed skills into demonstrated skills.</p>
              <span>Proof of Concept · MERN Stack</span>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
