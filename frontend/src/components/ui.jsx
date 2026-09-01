import { useEffect, useRef, useState } from 'react';
import { m, AnimatePresence, useIsReducedMotion } from './motion.jsx';

export function Icon({ name, size = 18, className = '' }) {
  const paths = {
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    arrowUp: <path d="m5 15 7-7 7 7M12 8v11" />,
    bar: <path d="M5 20V10m7 10V4m7 16v-7" />,
    book: <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Zm0 0V21" />,
    chart: <path d="M4 19V5m0 14h16M7 16l3-4 3 2 5-7" />,
    check: <path d="m5 12 4 4L19 6" />,
    code: <><path d="m9 7-5 5 5 5M15 7l5 5-5 5" /><path d="m13 4-2 16" /></>,
    chevron: <path d="m6 9 6 6 6-6" />,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    dashboard: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    file: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5M9 13h6m-6 4h6" /></>,
    history: <><path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.5" /><path d="M4 4v4.5h4.5M12 7v5l3 2" /></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" /></>,
    logout: <><path d="M10 17 15 12 10 7M15 12H3" /><path d="M21 3v18" /></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    play: <path d="m9 6 9 6-9 6z" />,
    plus: <path d="M12 5v14M5 12h14" />,
    shield: <><path d="M12 3 19 6v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6z" /><path d="m9 12 2 2 4-4" /></>,
    spark: <path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5zm6 12 .6 2.4L21 18l-2.4.6L18 21l-.6-2.4L15 18l2.4-.6z" />,
    target: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" /></>,
    user: <><circle cx="12" cy="8" r="3.2" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.8M16 14.5a5.5 5.5 0 0 1 4.5 5.5" /></>,
    warning: <><path d="m12 4 8 15H4z" /><path d="M12 9v4m0 3h.01" /></>,
    pencil: <path d="M4 20h4.5L19 9.5 14.5 5 4 15.5V20zM13 6.5l4.5 4.5" />,
    trash: <><path d="M5 7h14M10 7V5h4v2m-7 0 1 13h8l1-13" /><path d="M10 11v6M14 11v6" /></>,
  };

  return (
    <svg
      aria-hidden="true"
      className={`shrink-0 ${className}`}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
        {paths[name] || paths.spark}
      </g>
    </svg>
  );
}

export function Logo({ compact = false, inverse = false }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-accent text-white shadow-sm">
        <Icon name="spark" size={18} />
      </span>
      {!compact && (
        <span className={`font-display text-[1.15rem] font-semibold tracking-[-0.02em] ${inverse ? 'text-white' : 'text-ink-900'}`}>
          Adaptive<span className={inverse ? 'text-accent-soft' : 'text-accent'}>Interview</span>
        </span>
      )}
    </span>
  );
}

export function Alert({ children, tone = 'error', className = '' }) {
  const styles = {
    error: 'border-red-200 bg-red-50 text-red-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
  };
  const icon = tone === 'success' ? 'check' : tone === 'warning' || tone === 'error' ? 'warning' : 'spark';

  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm leading-5 ${styles[tone] || styles.error} ${className}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon name={icon} size={17} className="mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <span aria-hidden="true" className={`block animate-pulse rounded-lg bg-ink-100 skeleton-shimmer ${className}`} />;
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-accent-dark">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-semibold tracking-[-0.025em] text-ink-900 sm:text-[2.15rem]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[0.95rem] leading-6 text-ink-700">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon = 'file', title, description, action }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-ink-50/60 px-6 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-white text-accent shadow-sm transition-transform duration-500 hover:scale-110">
        <Icon name={icon} size={22} />
      </span>
      {title && <h3 className="mt-4 font-semibold text-ink-900">{title}</h3>}
      {description && <p className="mt-1 max-w-sm text-sm leading-6 text-ink-700">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* Animated score ring — SVG stroke fills in smoothly on mount */
export function ScoreRing({ score = 0, size = 152, label = 'Overall score', dark = false }) {
  const numericScore = Number(score);
  const safeScore = Number.isFinite(numericScore) ? Math.max(0, Math.min(100, numericScore)) : 0;
  const radius = 47;
  const circumference = 2 * Math.PI * radius;
  const tier = scoreTier(safeScore);
  const stroke = tier === 'strong' ? '#0f766e' : tier === 'average' ? '#d97706' : '#dc5a5a';
  const reduced = useIsReducedMotion();

  /* Animate the offset from full (empty) to the target value */
  const targetOffset = circumference - (safeScore / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ height: size, width: size }} aria-label={`${label}: ${Math.round(safeScore)} out of 100`} role="img">
      <svg className="-rotate-90" height={size} viewBox="0 0 120 120" width={size}>
        <circle cx="60" cy="60" fill="none" r={radius} stroke="#e6edf7" strokeWidth="9" />
        {reduced ? (
          <circle cx="60" cy="60" fill="none" r={radius} stroke={stroke} strokeDasharray={circumference} strokeDashoffset={targetOffset} strokeLinecap="round" strokeWidth="9" />
        ) : (
          <m.circle
            cx="60" cy="60" fill="none" r={radius}
            stroke={stroke}
            strokeDasharray={circumference}
            strokeLinecap="round"
            strokeWidth="9"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: targetOffset }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          />
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <AnimatedNumber value={Math.round(safeScore)} className={`font-display text-3xl font-semibold ${dark ? 'text-white' : 'text-ink-900'}`} />
          <p className={`text-[0.65rem] font-bold uppercase tracking-[0.14em] ${dark ? 'text-slate-400' : 'text-ink-700'}`}>/ 100</p>
        </div>
      </div>
    </div>
  );
}

/* Animated number counter — counts up from 0 to target */
export function AnimatedNumber({ value, className = '' }) {
  const reduced = useIsReducedMotion();
  const [display, setDisplay] = useState(0);
  const numVal = Number(value);
  const isNum = Number.isFinite(numVal);

  useEffect(() => {
    if (!isNum || reduced) {
      setDisplay(numVal || 0);
      return;
    }

    let start = 0;
    const end = numVal;
    const stepDuration = Math.max(10, Math.min(30, 800 / Math.abs(end - start || 1)));
    const step = end > start ? 1 : -1;

    const timer = setInterval(() => {
      start += step;
      setDisplay(start);
      if (start === end) clearInterval(timer);
    }, stepDuration);

    return () => clearInterval(timer);
  }, [numVal, isNum, reduced]);

  if (!isNum) return <p className={className}>{value}</p>;
  return <p className={className}>{display}</p>;
}

export function ScoreBadge({ score }) {
  const tier = scoreTier(score);
  const config = {
    strong: { label: 'Strong', className: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
    average: { label: 'Average', className: 'bg-amber-50 text-amber-900 ring-amber-200' },
    needs: { label: 'Needs improvement', className: 'bg-red-50 text-red-800 ring-red-200' },
  }[tier];
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${config.className}`}><span className="size-1.5 rounded-full bg-current" />{config.label}</span>;
}

function scoreTier(score) {
  const numericScore = Number(score);
  if (numericScore >= 80) return 'strong';
  if (numericScore >= 50) return 'average';
  return 'needs';
}

export function ButtonSpinner() {
  return <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />;
}

/* Animated ConfirmDialog — backdrop fades, dialog scales in */
export function ConfirmDialog({
  open,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Yes',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  busy = false,
}) {
  const cancelRef = useRef(null);
  const reduced = useIsReducedMotion();

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    cancelRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !busy) {
        onCancel();
        return;
      }

      if (event.key !== 'Tab') return;
      const dialog = event.currentTarget;
      const focusable = dialog.querySelectorAll('button:not([disabled])');
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    const dialog = document.getElementById('confirmation-dialog');
    dialog?.addEventListener('keydown', handleKeyDown);

    return () => {
      dialog?.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [busy, onCancel, open]);

  /* Static rendering for reduced motion */
  if (reduced) {
    if (!open) return null;
    return (
      <div
        className="fixed inset-0 z-50 grid place-items-center bg-ink-900/45 px-4 py-8 backdrop-blur-[2px]"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !busy) onCancel();
        }}
      >
        <DialogContent
          title={title}
          description={description}
          confirmLabel={confirmLabel}
          cancelLabel={cancelLabel}
          onConfirm={onConfirm}
          onCancel={onCancel}
          busy={busy}
          cancelRef={cancelRef}
        />
      </div>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 grid place-items-center bg-ink-900/45 px-4 py-8 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) onCancel();
          }}
        >
          <m.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <DialogContent
              title={title}
              description={description}
              confirmLabel={confirmLabel}
              cancelLabel={cancelLabel}
              onConfirm={onConfirm}
              onCancel={onCancel}
              busy={busy}
              cancelRef={cancelRef}
            />
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

/* Extracted dialog content to avoid duplication between animated/static */
function DialogContent({ title, description, confirmLabel, cancelLabel, onConfirm, onCancel, busy, cancelRef }) {
  return (
    <div
      id="confirmation-dialog"
      className="w-full max-w-md rounded-3xl border border-ink-200 bg-white p-6 shadow-2xl sm:p-7"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-dialog-title"
      aria-describedby={description ? 'confirmation-dialog-description' : undefined}
    >
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent-dark">
          <Icon name="logout" size={20} />
        </span>
        <div>
          <p className="eyebrow">Confirm action</p>
          <h2 id="confirmation-dialog-title" className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em] text-ink-900">
            {title}
          </h2>
          {description && (
            <p id="confirmation-dialog-description" className="mt-2 text-sm leading-6 text-ink-700">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button ref={cancelRef} type="button" className="btn-secondary justify-center" onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </button>
        <button type="button" className="btn-primary justify-center" onClick={onConfirm} disabled={busy}>
          {busy ? <><ButtonSpinner /> Logging out…</> : confirmLabel}
        </button>
      </div>
    </div>
  );
}
