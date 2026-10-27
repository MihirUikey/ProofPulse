import { useAuth } from "../context/AuthContext";

function ChallengeCard({ challenge, onDelete, onEdit, onViewDetails }) {
  const { user, isAuthenticated } = useAuth();

  const isOwner =
    isAuthenticated &&
    user?.id &&
    challenge.createdBy &&
    String(user.id) === String(challenge.createdBy);

  return (
    <article className="challenge-card">
      <div className="challenge-card-top">
        <span className="category-badge">{challenge.category}</span>

        <span
          className={`difficulty-badge ${challenge.difficulty.toLowerCase()}`}
        >
          {challenge.difficulty}
        </span>
      </div>

      <h3>{challenge.title}</h3>

      <p className="challenge-description">{challenge.description}</p>

      <div className="criteria-section">
        <p className="criteria-heading">Evaluation criteria</p>

        {challenge.evaluationCriteria?.length > 0 ? (
          <ul>
            {challenge.evaluationCriteria.map((criterion, index) => (
              <li key={index}>{criterion}</li>
            ))}
          </ul>
        ) : (
          <p className="muted-text">No criteria specified</p>
        )}
      </div>

      <div className="challenge-card-footer">
        <span className="challenge-date">
          {new Date(challenge.createdAt).toLocaleDateString("en-IN")}
        </span>

        <div className="card-actions">
          {isOwner ? (
            <>
              <button className="edit-button" onClick={() => onEdit(challenge)}>
                Edit
              </button>

              <button
                className="delete-button"
                onClick={() => onDelete(challenge._id)}
              >
                Delete
              </button>
            </>
          ) : (
            <span className="muted-text">
              {isAuthenticated
                ? "Created by another user"
                : "Log in to manage your challenges"}
            </span>
          )}
        </div>
        <button
          type="button"
          className="view-details-button"
          onClick={() => onViewDetails(challenge)}
        >
          View Details →
        </button>
      </div>
    </article>
  );
}

export default ChallengeCard;
