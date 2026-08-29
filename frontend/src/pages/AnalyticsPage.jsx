import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getDashboard } from '../services/interviewApi.js';
import { Alert, EmptyState, Icon, PageHeader, Skeleton } from '../components/ui.jsx';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function loadAnalytics() {
    setLoading(true);
    setError('');
    getDashboard().then((response) => setData(response.data)).catch((err) => setError(err.response?.data?.message || 'Failed to load analytics')).finally(() => setLoading(false));
  }
  useEffect(() => { loadAnalytics(); }, []);

  if (loading) return <AnalyticsSkeleton />;
  if (error) return <div className="mx-auto max-w-lg space-y-4"><Alert>{error}</Alert><div className="text-center"><button type="button" className="btn-secondary" onClick={loadAnalytics}>Try again</button></div></div>;

  const stats = data?.stats || {};
  const trend = (data?.performanceOverTime || []).map((item, index) => ({ ...item, label: `I${index + 1}` }));
  const skills = data?.skillPerformance || [];

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Measure what matters" title="Performance analytics" description="Use completed sessions to understand your progress and choose your next focus area." actions={<Link to="/history" className="btn-secondary"><Icon name="history" size={16} /> View history</Link>} />
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Metric icon="file" label="Total interviews" value={stats.totalInterviews ?? 0} />
        <Metric icon="target" label="Average score" value={stats.completedInterviews ? `${Math.round(stats.averageScore)}%` : '—'} />
        <Metric icon="chart" label="Best score" value={stats.completedInterviews ? `${Math.round(stats.bestScore)}%` : '—'} />
        <Metric icon="spark" label="Strongest skill" value={stats.strongestSkill || '—'} />
        <Metric icon="arrowUp" label="Focus next" value={stats.weakestSkill || '—'} tone="amber" />
        <Metric icon="history" label="Improvement trend" value={trendLabel(stats.improvementTrend)} tone={stats.improvementTrend?.direction === 'down' ? 'amber' : 'teal'} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Performance over time" subtitle="Score by completed interview" empty={!trend.length} emptyTitle="No completed sessions yet" emptyText="Finish an interview to see your score trend.">
          <ResponsiveContainer width="100%" height="100%"><LineChart data={trend} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e6edf7" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 12 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 12 }} /><Tooltip formatter={(value) => [`${value}%`, 'Score']} labelFormatter={(value) => `Interview ${String(value).replace('I', '')}`} /><Line type="monotone" dataKey="score" stroke="#0d9488" strokeWidth={3} dot={{ fill: '#0d9488', r: 4 }} /></LineChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Skill-wise score" subtitle="Historical average by skill" empty={!skills.length} emptyTitle="No skill data yet" emptyText="Skill analytics appear after your first completed interview.">
          <ResponsiveContainer width="100%" height="100%"><BarChart data={skills} layout="vertical" margin={{ top: 4, right: 12, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e6edf7" horizontal={false} /><XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} /><YAxis type="category" dataKey="skill" width={105} tick={{ fontSize: 11 }} /><Tooltip formatter={(value) => [`${value}%`, 'Average']} /><Bar dataKey="averageScore" fill="#243b5a" radius={[0, 5, 5, 0]} barSize={20} /></BarChart></ResponsiveContainer>
        </ChartCard>
      </div>

      {stats.completedInterviews === 0 && <EmptyState icon="chart" title="Analytics unlock after completion" description="Complete an interview to see historical performance, skill averages, and improvement trends." action={<Link to="/interview/setup" className="btn-primary">Start an interview <Icon name="arrow" size={16} /></Link>} />}
    </div>
  );
}

function ChartCard({ title, subtitle, empty, emptyTitle, emptyText, children }) {
  return <section className="card-panel"><div className="mb-5"><h2 className="section-title">{title}</h2><p className="mt-1 text-sm text-ink-700">{subtitle}</p></div>{empty ? <EmptyState icon="chart" title={emptyTitle} description={emptyText} /> : <div className="h-72 w-full">{children}</div>}</section>;
}

function Metric({ icon, label, value, tone = 'navy' }) {
  const iconClass = tone === 'teal' ? 'bg-accent-soft text-accent-dark' : tone === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-ink-50 text-ink-700';
  return <div className="card-panel flex items-start gap-3"><span className={`grid size-10 place-items-center rounded-xl ${iconClass}`}><Icon name={icon} size={18} /></span><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.1em] text-ink-700">{label}</p><p className="mt-2 truncate font-display text-2xl font-semibold text-ink-900">{value}</p></div></div>;
}

function trendLabel(trend) { if (!trend || !Number.isFinite(Number(trend.value)) || trend.value === 0) return '—'; return `${trend.value > 0 ? '+' : ''}${trend.value} pts`; }
function AnalyticsSkeleton() { return <div className="space-y-8" role="status"><div><Skeleton className="h-3 w-32" /><Skeleton className="mt-4 h-10 w-72" /><Skeleton className="mt-3 h-5 w-96 max-w-full" /></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((item) => <Skeleton key={item} className="h-32" />)}</div><div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-96" /><Skeleton className="h-96" /></div></div>; }
