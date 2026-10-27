function ChallengeForm({
  form,
  editingId,
  submitting,
  error,
  message,
  formRef,
  onChange,
  onSubmit,
}) {
  return (
    <aside className="form-panel" ref={formRef}>
      <div className="form-heading">
        <span className="eyebrow">CONTRIBUTE</span>
        <h2>{editingId ? "Edit challenge" : "Create a challenge"}</h2>
        <p>Add a practical task for the developer community.</p>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="success-message" role="status">
          {message}
        </div>
      )}

      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="title">Challenge title</label>
          <input
            id="title"
            type="text"
            name="title"
            value={form.title}
            onChange={onChange}
            placeholder="e.g. Build a REST API"
            required
            minLength={3}
            maxLength={100}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={onChange}
            placeholder="Describe what the developer needs to build..."
            required
            minLength={10}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={onChange}
            >
              <option>JavaScript</option>
              <option>React</option>
              <option>Node.js</option>
              <option>MongoDB</option>
              <option>C++</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="difficulty">Difficulty</label>
            <select
              id="difficulty"
              name="difficulty"
              value={form.difficulty}
              onChange={onChange}
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="evaluationCriteria">Evaluation criteria</label>
          <textarea
            id="evaluationCriteria"
            name="evaluationCriteria"
            value={form.evaluationCriteria}
            onChange={onChange}
            placeholder={"Input validation\nCorrect logic\nError handling"}
            rows={3}
          />
          <small>Enter one criterion per line.</small>
        </div>

        <button className="submit-button" type="submit" disabled={submitting}>
          {submitting
            ? editingId
              ? "Saving..."
              : "Creating..."
            : editingId
              ? "Save changes"
              : "＋ Create challenge"}
        </button>
      </form>
    </aside>
  );
}

export default ChallengeForm;
