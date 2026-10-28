import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Check,
  Code2,
  GitBranch,
  Share2,
  Target,
  Trophy,
} from "lucide-react";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

function getInitials(name) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "D"
  );
}

function DeveloperProfile() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [shareError, setShareError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSubmissions() {
      try {
        const response = await api.get("/submissions/mine");

        if (!cancelled) {
          setSubmissions(response.data.data || []);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load your portfolio data.",
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
  }, []);

  const name = user?.name || "Developer";
  const acceptedSubmissions = submissions.filter(
    (submission) => submission.status === "Accepted",
  );
  const completedChallengeIds = new Set(
    acceptedSubmissions
      .filter((submission) => submission.challenge?._id)
      .map((submission) => submission.challenge._id),
  );
  const skills = acceptedSubmissions.reduce((result, submission) => {
    const category = submission.challenge?.category;

    if (category) {
      result.set(category, (result.get(category) || 0) + 1);
    }

    return result;
  }, new Map());
  const awaitingReviewCount = submissions.filter((submission) =>
    ["Submitted", "In Review"].includes(submission.status),
  ).length;

  async function sharePortfolio() {
    setShareMessage("");
    setShareError("");

    if (!user?.id) {
      setShareError("Your account ID is unavailable. Please sign in again.");
      return;
    }

    if (!navigator.clipboard?.writeText) {
      setShareError("Clipboard access is unavailable in this browser.");
      return;
    }

    const profileUrl = new URL(window.location.href);
    profileUrl.searchParams.set("profile", user.id);

    try {
      await navigator.clipboard.writeText(profileUrl.toString());
      setShareMessage("Portfolio link copied.");
    } catch (copyError) {
      console.error("Copy portfolio link error:", copyError);
      setShareError("Unable to copy the link. Please check clipboard access.");
    }
  }

  return (
    <section className="developer-profile">
      <header className="profile-page-heading">
        <div>
          <span className="eyebrow">DEVELOPER WORKSPACE</span>
          <h1>My Profile</h1>
          <p>Your accepted projects and the skills they demonstrate.</p>
        </div>
        <button
          type="button"
          className="profile-member-badge profile-share-button"
          onClick={sharePortfolio}
        >
          <Share2 size={16} />
          Share portfolio
        </button>
      </header>

      {shareMessage && (
        <p className="profile-share-message" role="status">
          <Check size={16} />
          {shareMessage}
        </p>
      )}
      {shareError && (
        <p className="profile-share-error" role="alert">
          {shareError}
        </p>
      )}
      {error && (
        <p className="profile-share-error" role="alert">
          {error}
        </p>
      )}

      <article className="profile-hero-card">
        <div className="profile-avatar">{getInitials(name)}</div>

        <div className="profile-identity">
          <span className="eyebrow">PROOFPULSE DEVELOPER</span>
          <h2>{name}</h2>
          {user?.email && <p>{user.email}</p>}
          <p className="profile-bio">
            Building projects, developing skills, and turning knowledge into
            evidence.
          </p>
        </div>

        <div className="profile-github">
          <GitBranch size={20} />
          <span>Evidence-backed portfolio</span>
          <small>
            Shared profiles include accepted submissions only. Your email and
            other submission statuses stay private.
          </small>
        </div>
      </article>

      <div className="profile-stats-grid">
        <article className="profile-stat-card">
          <div className="profile-stat-icon">
            <Target size={21} />
          </div>
          <span>Challenges completed</span>
          <strong>{loading ? "…" : completedChallengeIds.size}</strong>
          <small>Distinct challenges with accepted work</small>
        </article>

        <article className="profile-stat-card">
          <div className="profile-stat-icon">
            <Trophy size={21} />
          </div>
          <span>Accepted projects</span>
          <strong>{loading ? "…" : acceptedSubmissions.length}</strong>
          <small>Reviewed and accepted by an administrator</small>
        </article>

        <article className="profile-stat-card">
          <div className="profile-stat-icon">
            <BadgeCheck size={21} />
          </div>
          <span>Verified skills</span>
          <strong>{loading ? "…" : skills.size}</strong>
          <small>Challenge categories with accepted evidence</small>
        </article>

        <article className="profile-stat-card">
          <div className="profile-stat-icon">
            <CalendarDays size={21} />
          </div>
          <span>Awaiting review</span>
          <strong>{loading ? "…" : awaitingReviewCount}</strong>
          <small>Submitted or currently being reviewed</small>
        </article>
      </div>

      <div className="profile-content-grid">
        <article className="profile-panel">
          <div className="profile-panel-heading">
            <div>
              <span className="eyebrow">ACCEPTED WORK</span>
              <h3>Project portfolio</h3>
            </div>
            <Code2 size={20} />
          </div>

          {loading ? (
            <p className="profile-loading">Loading your accepted projects...</p>
          ) : acceptedSubmissions.length === 0 ? (
            <div className="profile-empty-state">
              <div className="profile-empty-icon">
                <GitBranch size={25} />
              </div>
              <h4>Your first accepted project will show here.</h4>
              <p>
                Complete a challenge and get your submission accepted to start
                building your shareable portfolio.
              </p>
            </div>
          ) : (
            <div className="profile-project-list">
              {acceptedSubmissions.map((submission) => (
                <article className="profile-project-card" key={submission._id}>
                  <div className="profile-project-heading">
                    <span className="profile-verified-badge">
                      <BadgeCheck size={15} />
                      Accepted
                    </span>
                    <span className="profile-project-category">
                      {submission.challenge?.category || "Challenge"}
                    </span>
                  </div>
                  <h4>
                    {submission.challenge?.title || "Accepted challenge"}
                  </h4>
                  <p>{submission.description}</p>
                  <a
                    href={submission.repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View project <ArrowUpRight size={15} />
                  </a>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="profile-panel">
          <div className="profile-panel-heading">
            <div>
              <span className="eyebrow">PROOF, NOT CLAIMS</span>
              <h3>Verified skills</h3>
            </div>
            <BadgeCheck size={20} />
          </div>

          {loading ? (
            <p className="profile-loading">Calculating verified skills...</p>
          ) : skills.size === 0 ? (
            <div className="profile-empty-state">
              <div className="profile-empty-icon">
                <BadgeCheck size={25} />
              </div>
              <h4>Skills are earned through accepted work.</h4>
              <p>
                Once a project is accepted, its challenge category appears here
                as a verified skill with evidence.
              </p>
            </div>
          ) : (
            <div className="profile-skill-list">
              {[...skills.entries()].map(([skill, evidenceCount]) => (
                <div className="profile-skill-item" key={skill}>
                  <span className="profile-verified-badge">
                    <BadgeCheck size={16} />
                    {skill}
                  </span>
                  <small>
                    {evidenceCount} accepted project
                    {evidenceCount !== 1 ? "s" : ""}
                  </small>
                </div>
              ))}
            </div>
          )}

          <div className="profile-panel-footer">
            <span>Every verified skill links to accepted project evidence</span>
            <ArrowUpRight size={17} />
          </div>
        </article>
      </div>
    </section>
  );
}

export default DeveloperProfile;
