import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../context/AuthContext.jsx';
import { getDashboard } from '../services/interviewApi.js';
import { formatDate } from '../utils/format.js';
import { Alert, EmptyState, Icon, PageHeader, ScoreBadge, Skeleton } from '../components/ui.jsx';
import { FadeIn, StaggerList, StaggerItem, ScrollReveal, AnimatedPresenceWrapper } from '../components/motion.jsx';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function loadDashboard() {
    setLoading(true);
    setError('');
    getDashboard()
      .then((response) => setData(response.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error} onRetry={loadDashboard} />;

  const stats = data?.stats || {};
  const performance = data?.performanceOverTime || [];
  const skills = data?.skillPerformance || [];
  const recentInterviews = data?.recentInterviews || [];
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-8">
      <FadeIn>
        <PageHeader
          eyebrow="Candidate dashboard"
          title={`Good to see you, ${firstName}.`}
          description="A clear view of your preparation, progress, and what to work on next."
          actions={<Link to="/interview/setup" className="btn-primary transition-all active:scale-[0.97]"><Icon name="plus" size={17} /> Start new interview</Link>}
        />
      </FadeIn>

      <FadeIn delay={0.1}>
        <section className="relative overflow-hidden rounded-3xl bg-ink-900 p-6 text-white shadow-panel sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-accent-soft"><Icon name="spark" size={15} /> Practice session</div>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">Ready for one more focused attempt?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">Choose a skill to practice and let the session adapt as you answer.</p>
            </div>
            <Link to="/interview/setup" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-ink-900 transition-all active:scale-[0.97] hover:bg-accent-soft">Configure interview <Icon name="arrow" size={16} /></Link>
          </div>
        </section>
      </FadeIn>

      <section aria-labelledby="stats-heading">
        <div className="mb-3 flex items-center justify-between"><h2 id="stats-heading" className="section-title">At a glance</h2><Link to="/analytics" className="text-sm font-bold text-accent-dark hover:underline transition-all active:scale-[0.97]">Full analytics <Icon name="arrow" size={14} className="inline" /></Link></div>
        <StaggerList delay={0.15}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StaggerItem><StatCard icon="file" label="Total interviews" value={stats.totalInterviews ?? 0} /></StaggerItem>
            <StaggerItem><StatCard icon="target" label="Average score" value={stats.completedInterviews ? `${Math.round(stats.averageScore)}%` : '—'} tone="teal" /></StaggerItem>
            <StaggerItem><StatCard icon="chart" label="Best score" value={stats.completedInterviews ? `${Math.round(stats.bestScore)}%` : '—'} /></StaggerItem>
            <StaggerItem><StatCard icon="arrowUp" label="Improvement" value={formatTrend(stats.improvementTrend)} tone={stats.improvementTrend?.direction === 'down' ? 'amber' : 'teal'} /></StaggerItem>
          </div>
        </StaggerList>
        <StaggerList delay={0.2}>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StaggerItem><MiniInsight label="Completed interviews" value={stats.completedInterviews ?? 0} note="Sessions with a final report" /></StaggerItem>
            <StaggerItem><MiniInsight label="Strongest skill" value={stats.strongestSkill || '—'} note="Highest historical average" tone="success" /></StaggerItem>
            <StaggerItem><MiniInsight label="Focus next" value={stats.weakestSkill || '—'} note="Skill with the most room to grow" tone="warning" /></StaggerItem>
          </div>
        </StaggerList>
      </section>

      <ScrollReveal>
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <ChartCard title="Performance over time" subtitle="Your completed interview scores">
            {performance.length > 1 ? <ResponsiveContainer width="100%" height={280}><LineChart data={performance} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e6edf7" vertical={false} /><XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} tick={{ fontSize: 12 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 12 }} /><Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} formatter={(value) => [`${value}%`, 'Score']} /><Line type="monotone" dataKey="score" stroke="#0d9488" strokeWidth={3} dot={{ fill: '#0d9488', r: 4 }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer> : <EmptyState icon="chart" title="Your trend starts here" description="Complete at least two interviews to see how your score changes over time." action={<Link to="/interview/setup" className="btn-secondary transition-all active:scale-[0.97]">Start practice</Link>} />}
          </ChartCard>
          <ChartCard title="Skill performance" subtitle="Average scores by assessed skill">
            {skills.length ? <ResponsiveContainer width="100%" height={280}><BarChart data={skills} layout="vertical" margin={{ top: 4, right: 12, left: 2, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e6edf7" horizontal={false} /><XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} /><YAxis dataKey="skill" type="category" width={105} tick={{ fontSize: 11 }} /><Tooltip formatter={(value) => [`${value}%`, 'Average']} /><Bar dataKey="averageScore" fill="#243b5a" radius={[0, 5, 5, 0]} barSize={18} /></BarChart></ResponsiveContainer> : <EmptyState icon="target" title="No skill data yet" description="Your skill breakdown will appear after your first completed interview." action={<Link to="/interview/setup" className="btn-secondary transition-all active:scale-[0.97]">Practice a skill</Link>} />}
          </ChartCard>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={0.1}>
        <section className="card-panel overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-6 py-5"><div><h2 className="section-title">Recent interviews</h2><p className="mt-1 text-sm text-ink-700">Your latest sessions and their current status.</p></div>{recentInterviews.length > 0 && <Link to="/history" className="btn-secondary px-3 py-2 text-xs transition-all active:scale-[0.97]">View history</Link>}</div>
          {recentInterviews.length ? <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-ink-50/70 text-xs uppercase tracking-[0.1em] text-ink-700"><tr><th className="px-6 py-3 font-bold">Role</th><th className="px-4 py-3 font-bold">Type</th><th className="px-4 py-3 font-bold">Status</th><th className="px-4 py-3 font-bold">Score</th><th className="px-4 py-3 font-bold">Date</th><th className="px-6 py-3 text-right font-bold">Open</th></tr></thead><tbody className="divide-y divide-ink-100">{recentInterviews.map((item) => <tr key={item._id} className="transition-colors hover:bg-ink-50/60"><td className="px-6 py-4 font-bold text-ink-900">{item.jobRole}</td><td className="px-4 py-4 capitalize text-ink-700">{item.interviewType}</td><td className="px-4 py-4"><StatusBadge status={item.status} /></td><td className="px-4 py-4 font-semibold">{item.scoreAverage == null ? '—' : `${Math.round(item.scoreAverage)}%`}</td><td className="px-4 py-4 text-ink-700">{formatDate(item.completedAt || item.createdAt)}</td><td className="px-6 py-4 text-right"><Link className="font-bold text-accent-dark hover:underline transition-all active:scale-[0.97]" to={item.status === 'completed' ? `/interview/${item._id}/result` : `/interview/${item._id}`}>{item.status === 'completed' ? 'Report' : 'Continue'} <Icon name="arrow" size={14} className="ml-1 inline" /></Link></td></tr>)}</tbody></table></div> : <div className="p-6"><EmptyState icon="file" title="No interviews yet" description="Start your first practice session to see your progress here." action={<Link to="/interview/setup" className="btn-primary transition-all active:scale-[0.97]">Start an interview <Icon name="arrow" size={16} /></Link>} /></div>}
        </section>
      </ScrollReveal>
    </div>
  );
}

function StatCard({ icon, label, value, tone = 'navy' }) {
  const iconClass = tone === 'teal' ? 'bg-accent-soft text-accent-dark' : tone === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-ink-50 text-ink-700';
  return <div className="card-panel flex items-start justify-between gap-3"><span className={`grid size-10 place-items-center rounded-xl ${iconClass}`}><Icon name={icon} size={19} /></span><div className="min-w-0 flex-1 text-right"><p className="text-xs font-bold uppercase tracking-[0.1em] text-ink-700">{label}</p><p className="mt-2 truncate font-display text-3xl font-semibold text-ink-900">{value}</p></div></div>;
}

function MiniInsight({ label, value, note, tone }) {
  return <div className="rounded-2xl border border-ink-100 bg-white px-5 py-4 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.1em] text-ink-700">{label}</p><p className={`mt-2 truncate text-lg font-bold ${tone === 'success' ? 'text-accent-dark' : tone === 'warning' ? 'text-amber-700' : 'text-ink-900'}`}>{value}</p><p className="mt-1 text-xs text-ink-700">{note}</p></div>;
}

function ChartCard({ title, subtitle, children }) {
  return <section className="card-panel"><div className="mb-5"><h2 className="section-title">{title}</h2><p className="mt-1 text-sm text-ink-700">{subtitle}</p></div>{children}</section>;
}

function StatusBadge({ status }) {
  const styles = { created: 'bg-blue-50 text-blue-800 ring-blue-200', setup: 'bg-blue-50 text-blue-800 ring-blue-200', in_progress: 'bg-amber-50 text-amber-900 ring-amber-200', completed: 'bg-emerald-50 text-emerald-800 ring-emerald-200' };
  const labels = { created: 'Created', setup: 'Set up', in_progress: 'In progress', completed: 'Completed' };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${styles[status] || 'bg-ink-50 text-ink-700 ring-ink-200'}`}>{labels[status] || status}</span>;
}

function formatTrend(trend) {
  if (!trend || !Number.isFinite(Number(trend.value)) || trend.value === 0) return '—';
  return `${trend.value > 0 ? '+' : ''}${trend.value} pts`;
}

function DashboardSkeleton() {
  return <div className="space-y-8" role="status"><div><Skeleton className="h-3 w-32 skeleton-shimmer" /><Skeleton className="mt-4 h-10 w-80 max-w-full skeleton-shimmer" /><Skeleton className="mt-3 h-5 w-96 max-w-full skeleton-shimmer" /></div><Skeleton className="h-36 w-full rounded-3xl skeleton-shimmer" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-32 skeleton-shimmer" />)}</div><div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-96 skeleton-shimmer" /><Skeleton className="h-96 skeleton-shimmer" /></div></div>;
}

function ErrorState({ message, onRetry }) {
  return <div className="mx-auto max-w-lg space-y-4"><AnimatedPresenceWrapper show={!!message}><Alert>{message}</Alert></AnimatedPresenceWrapper><div className="text-center"><button type="button" className="btn-secondary transition-all active:scale-[0.97]" onClick={onRetry}>Try again</button></div></div>;
}
