import { Link } from 'react-router-dom';

export default function PlaceholderPage({ title, description, children }) {
  return (
    <section className="card-panel space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-dark">
        Phase 1 shell
      </p>
      <h1 className="font-display text-3xl font-semibold text-ink-900">{title}</h1>
      <p className="max-w-2xl text-ink-700">
        {description || 'UI for this route will be implemented in a later phase.'}
      </p>
      {children}
      <div className="pt-2">
        <Link to="/" className="text-sm font-semibold text-accent-dark">
          Back to home
        </Link>
      </div>
    </section>
  );
}
