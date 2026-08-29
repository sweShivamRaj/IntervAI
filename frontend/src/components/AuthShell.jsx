import { Link } from 'react-router-dom';
import { Icon, Logo } from './ui.jsx';

export default function AuthShell({ eyebrow, title, description, footer, children }) {
  return (
    <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-panel lg:grid-cols-[0.85fr_1.15fr]">
      <aside className="relative hidden overflow-hidden bg-ink-900 p-10 text-white lg:block">
        <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-accent/25 blur-3xl" />
        <div className="relative flex h-full flex-col">
          <Link to="/" aria-label="AdaptiveInterview home"><Logo inverse /></Link>
          <div className="mt-auto">
            <span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-accent-soft"><Icon name="target" size={24} /></span>
            <h2 className="mt-6 max-w-xs font-display text-4xl font-semibold leading-tight">Make every answer count.</h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">Practice in a structured environment designed to help you think clearly under interview pressure.</p>
            <div className="mt-8 flex items-center gap-2 text-xs font-semibold text-slate-300"><span className="size-2 rounded-full bg-emerald-400" /> Private candidate workspace</div>
          </div>
        </div>
      </aside>
      <main className="p-6 sm:p-10 lg:p-14">
        <div className="mb-8 lg:hidden"><Link to="/" aria-label="AdaptiveInterview home"><Logo /></Link></div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em] text-ink-900 sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-ink-700">{description}</p>
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-7 border-t border-ink-100 pt-5 text-sm text-ink-700">{footer}</div>}
      </main>
    </div>
  );
}
