import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listInterviews } from '../services/interviewApi.js';
import { formatDate } from '../utils/format.js';
import { Alert, EmptyState, Icon, PageHeader, ScoreBadge, Skeleton } from '../components/ui.jsx';
import { FadeIn, StaggerList, StaggerItem } from '../components/motion.jsx';

export default function HistoryPage() {
  const [interviews, setInterviews] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function loadHistory() {
    setLoading(true);
    setError('');
    listInterviews()
      .then(({ data }) => setInterviews(data.interviews || []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load history'))
      .finally(() => setLoading(false));
  }
  useEffect(() => { loadHistory(); }, []);

  if (loading) return <HistorySkeleton />;

  return (
    <div className="space-y-8">
      <FadeIn>
        <PageHeader eyebrow="Your practice archive" title="Interview history" description="Review completed reports and continue sessions that are still in progress." actions={<Link to="/interview/setup" className="btn-primary transition-all active:scale-[0.97]"><Icon name="plus" size={16} /> New interview</Link>} />
      </FadeIn>
      
      {error && <div className="flex flex-wrap items-center justify-between gap-3"><Alert className="flex-1">{error}</Alert><button type="button" className="btn-secondary transition-all active:scale-[0.97]" onClick={loadHistory}>Try again</button></div>}
      
      {!error && interviews.length === 0 ? (
        <FadeIn delay={0.1}>
          <EmptyState icon="history" title="Your history is empty" description="Complete your first interview to see scores, feedback, and progression here." action={<Link to="/interview/setup" className="btn-primary transition-all active:scale-[0.97]">Start your first interview <Icon name="arrow" size={16} /></Link>} />
        </FadeIn>
      ) : (
        <section className="card-panel overflow-hidden p-0">
          <div className="border-b border-ink-100 bg-ink-50/60 px-6 py-5">
            <h2 className="section-title">All sessions <span className="ml-1 text-base font-medium text-ink-700">({interviews.length})</span></h2>
            <p className="mt-1 text-sm text-ink-700">Your most recent activity appears first.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-ink-100 text-xs uppercase tracking-[0.1em] text-ink-700">
                <tr>
                  <th className="px-6 py-3 font-bold">Date</th>
                  <th className="px-4 py-3 font-bold">Role</th>
                  <th className="px-4 py-3 font-bold">Skills</th>
                  <th className="px-4 py-3 font-bold">Questions</th>
                  <th className="px-4 py-3 font-bold">Score</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-6 py-3 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                <StaggerList>
                  {interviews.map((item) => (
                    <StaggerItem key={item._id}>
                      <tr className="transition-colors hover:bg-ink-50/60 flex w-full table-row">
                        <td className="whitespace-nowrap px-6 py-4 text-ink-700">{formatDate(item.date || item.completedAt || item.createdAt)}</td>
                        <td className="px-4 py-4 font-bold text-ink-900">{item.jobRole}</td>
                        <td className="max-w-72 px-4 py-4 text-ink-700">{item.skills?.join(', ') || '—'}</td>
                        <td className="px-4 py-4">{item.numberOfQuestions ?? item.questionCount ?? '—'}</td>
                        <td className="px-4 py-4">{item.scoreAverage == null ? '—' : <span className="font-bold">{Math.round(item.scoreAverage)}%</span>}</td>
                        <td className="px-4 py-4"><StatusBadge status={item.status} score={item.scoreAverage} /></td>
                        <td className="px-6 py-4 text-right"><Link className="inline-flex items-center gap-1 font-bold text-accent-dark hover:underline transition-all active:scale-[0.97]" to={item.status === 'completed' ? `/interview/${item._id}/result` : `/interview/${item._id}`}>{item.status === 'completed' ? 'View report' : 'Continue'} <Icon name="arrow" size={14} /></Link></td>
                      </tr>
                    </StaggerItem>
                  ))}
                </StaggerList>
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function StatusBadge({ status, score }) {
  if (status === 'completed') return <ScoreBadge score={score} />;
  const label = status === 'in_progress' ? 'In progress' : status === 'created' ? 'Set up' : String(status || '').replace('_', ' ');
  return <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900 ring-1 ring-amber-200">{label}</span>;
}

function HistorySkeleton() {
  return <div className="space-y-8" role="status"><div><Skeleton className="h-3 w-32" /><Skeleton className="mt-4 h-10 w-64" /><Skeleton className="mt-3 h-5 w-96 max-w-full" /></div><Skeleton className="h-[28rem] w-full" /></div>;
}
