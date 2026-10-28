import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, BadgeCheck, Code2 } from "lucide-react";
import api from "../api/api";

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

function PublicDeveloperProfile({ userId, onBack }) {
  const [profile, setProfile] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(`/profiles/${userId}`);

        if (!cancelled) {
          setProfile(response.data.data.profile);
          setSubmissions(response.data.data.submissions || []);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load this developer portfolio.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const skills = new Map();
  for (const submission of submissions) {
    const category = submission.challenge?.category;
    if (category) {
      skills.set(category, (skills.get(category) || 0) + 1);
    }
  }

  const completedChallenges = new Set(
    submissions
      .filter((submission) => submission.challenge?._id)
      .map((submission) => submission.challenge._id),
  );

  return (
    <section className="developer-profile public-developer-profile">
      <button
        type="button"
        className="public-profile-back"
        onClick={onBack}
      >
        <ArrowLeft size={17} />
        Back to ProofPulse
      </button>

      {loading ? (
        <div className="empty-state">
          <p>Loading developer portfolio...</p>
        </div>
      ) : error ? (
        <div className="empty-state" role="alert">
          <h1>Portfolio unavailable</h1>
          <p>{error}</p>
        </div>
      ) : (
        <>
          <header className="profile-page-heading">
            <div>
              <span className="eyebrow">PROOFPULSE DEVELOPER PORTFOLIO</span>
              <h1>{profile.name}</h1>
              <p>Skills and projects backed by accepted challenge submissions.</p>
            </div>
            <span className="profile-member-badge">
              <BadgeCheck size={16} />
              Verified evidence
            </span>
          </header>

          <article className="profile-hero-card public-profile-hero">
            <div className="profile-avatar">{getInitials(profile.name)}</div>
            <div className="profile-identity">
              <span className="eyebrow">PROOFPULSE DEVELOPER</span>
              <h2>{profile.name}</h2>
              <p className="profile-bio">
                This portfolio shows projects accepted by ProofPulse reviewers.
              </p>
            </div>
            <div className="profile-github">
              <BadgeCheck size={20} />
              <span>Evidence-backed skills</span>
              <small>
                Only accepted projects are shown. Personal account details and
                other submission statuses are not public.
              </small>
            </div>
          </article>

          <div className="profile-stats-grid public-profile-stats">
            <article className="profile-stat-card">
              <div className="profile-stat-icon">
                <Code2 size={21} />
              </div>
              <span>Accepted projects</span>
              <strong>{submissions.length}</strong>
              <small>Reviewed and accepted by an administrator</small>
            </article>
            <article className="profile-stat-card">
              <div className="profile-stat-icon">
                <BadgeCheck size={21} />
              </div>
              <span>Verified skills</span>
              <strong>{skills.size}</strong>
              <small>Challenge categories with accepted evidence</small>
            </article>
            <article className="profile-stat-card">
              <div className="profile-stat-icon">
                <Code2 size={21} />
              </div>
              <span>Challenges completed</span>
              <strong>{completedChallenges.size}</strong>
              <small>Distinct challenges with accepted work</small>
            </article>
          </div>

          <div className="profile-content-grid public-profile-content">
            <article className="profile-panel">
              <div className="profile-panel-heading">
                <div>
                  <span className="eyebrow">ACCEPTED WORK</span>
                  <h3>Project portfolio</h3>
                </div>
                <Code2 size={20} />
              </div>

              {submissions.length === 0 ? (
                <div className="profile-empty-state">
                  <h4>No accepted projects yet.</h4>
                  <p>
                    This developer's portfolio will show projects after
                    ProofPulse review.
                  </p>
                </div>
              ) : (
                <div className="profile-project-list">
                  {submissions.map((submission) => (
                    <article
                      className="profile-project-card"
                      key={submission._id}
                    >
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
              {skills.size === 0 ? (
                <div className="profile-empty-state">
                  <h4>No verified skills yet.</h4>
                  <p>
                    Skills are listed when an associated challenge project has
                    been accepted.
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
            </article>
          </div>
        </>
      )}
    </section>
  );
}

export default PublicDeveloperProfile;
