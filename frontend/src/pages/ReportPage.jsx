import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
import { getDashboard, getReport } from '../services/interviewApi.js';
import { difficultyLabel, formatDate } from '../utils/format.js';
import { Alert, Icon, ScoreBadge, ScoreRing, Skeleton } from '../components/ui.jsx';

export default function ReportPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    Promise.allSettled([getReport(id), getDashboard()])
      .then(([reportResult, dashboardResult]) => {
        if (cancelled) return;
        if (reportResult.status === 'fulfilled') {
          setReport(reportResult.value.data.report);
        } else {
          setError(
            reportResult.reason.response?.data?.message ||
              'Failed to load interview report.'
          );
        }
        if (dashboardResult.status === 'fulfilled') {
          setHistoricalData(dashboardResult.value.data);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <ReportSkeleton />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl text-center" role="alert">
        <Alert>{error}</Alert>
        <div className="mt-4 flex justify-center gap-2">
          <Link to="/history" className="btn-secondary">Back to history</Link>
          <Link to="/dashboard" className="btn-primary">Dashboard</Link>
        </div>
      </div>
    );
  }

  if (!report) {
    return <div className="card-panel text-center text-ink-700">No report data is available.</div>;
  }

  const skillAnalysis = report.skillAnalysis || [];
  const questionAnalysis = report.questionAnalysis || [];
  const difficultyProgression = report.difficultyProgression || [];
  const performanceOverTime = (historicalData?.performanceOverTime || []).map((item, index) => ({
    ...item,
    label: `I${index + 1}`,
  }));
  const strengths = report.strengths || report.summary?.strengths || [];
  const weaknesses = report.weaknesses || report.summary?.weaknesses || [];
  const recommendations = report.recommendedTopics || report.summary?.recommendedTopics || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="eyebrow">Completed interview</p><h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] text-ink-900 sm:text-4xl">Interview report</h1><p className="mt-2 text-sm text-ink-700">{report.jobRole} · {formatDate(report.completedAt)}</p></div>
        <div className="flex gap-2"><Link to="/history" className="btn-secondary"><Icon name="history" size={16} /> History</Link><Link to="/interview/setup" className="btn-primary"><Icon name="plus" size={16} /> New interview</Link></div>
      </div>

      <section aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="mb-3 font-display text-2xl font-semibold">Performance Summary</h2>
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="card-panel flex flex-col items-center justify-center bg-ink-900 text-center text-white sm:flex-row sm:gap-7 sm:text-left"><ScoreRing score={report.overallScore ?? report.scoreAverage} size={146} dark /><div className="mt-5 sm:mt-0"><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Overall result</p><h2 className="mt-2 font-display text-2xl font-semibold">{formatScore(report.overallScore ?? report.scoreAverage)} <span className="text-base font-medium text-slate-400">average</span></h2><div className="mt-3"><ScoreBadge score={report.overallScore ?? report.scoreAverage} /></div></div></div>
          <div className="card-panel"><p className="text-sm font-bold text-accent-dark">AI-generated overall feedback</p><p className="mt-3 leading-7 text-ink-800">{report.overallFeedback || report.summary?.overallFeedback || 'Overall feedback is not available for this report yet.'}</p>
          {report.summary?.overallFeedbackStatus === 'failed' && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-900"><Icon name="warning" size={14} /> A safe summary is shown because the feedback provider was unavailable.</p>
          )}
          {report.summary?.recommendation && (
            <p className="mt-5 rounded-xl bg-accent-soft px-4 py-3 text-sm text-ink-800">
              <span className="font-semibold text-accent-dark">Next session:</span> {report.summary.recommendation}
            </p>
          )}
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3"><MetricCard label="Average answer score" value={formatScore(report.averageScore ?? report.scoreAverage)} /><MetricCard label="Questions" value={report.numberOfQuestions ?? report.questionCount ?? 0} /><MetricCard label="Answered" value={report.completedQuestions ?? questionAnalysis.filter((item) => item.answered).length} /></div>
      </section>

      <section className="card-panel">
        <h2 className="font-display text-xl font-semibold">Performance over time</h2>
        {performanceOverTime.length ? (
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceOverTime} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6edf7" />
                <XAxis dataKey="label" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Score']} labelFormatter={(value) => `Interview ${String(value).replace('I', '')}`} />
                <Line type="monotone" dataKey="score" stroke="#0d9488" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState text="Historical performance will appear after completed interviews." />
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-2xl font-semibold">Skill Analysis</h2>
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="card-panel overflow-x-auto">
            {skillAnalysis.length ? (
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="border-b border-ink-100 text-ink-700">
                  <tr>
                    <th className="pb-3 font-medium">Skill</th>
                    <th className="pb-3 font-medium">Attempts</th>
                    <th className="pb-3 font-medium">Average</th>
                    <th className="pb-3 font-medium">Best</th>
                  </tr>
                </thead>
                <tbody>
                  {skillAnalysis.map((item) => (
                    <tr key={item.skill} className="border-b border-ink-50">
                      <td className="py-3 font-medium">{item.skill}</td>
                      <td className="py-3">{item.attempts}</td>
                      <td className="py-3">{formatScore(item.averageScore)}</td>
                      <td className="py-3">{formatScore(item.bestScore)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <EmptyState text="No skill scores are available." />}
          </div>
          <ChartPanel title="Skill-wise score" empty={!skillAnalysis.length} emptyText="Skill scores will appear after evaluation.">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillAnalysis} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6edf7" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="skill" width={110} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`${value}%`, 'Average']} />
                <Bar dataKey="averageScore" fill="#0d9488" radius={[0, 5, 5, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-2xl font-semibold">Question Analysis</h2>
        <ChartPanel title="Question-wise score" empty={!questionAnalysis.length} emptyText="Question scores will appear after the interview is completed.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={questionAnalysis} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6edf7" />
              <XAxis dataKey="order" tickFormatter={(value) => `Q${value}`} />
              <YAxis domain={[0, 100]} />
              <Tooltip labelFormatter={(value) => `Question ${value}`} formatter={(value) => [`${value}%`, 'Score']} />
              <Bar dataKey="score" fill="#243b5a" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <div className="card-panel mt-6">
          <div className="divide-y divide-ink-100">
            {(report.questions || []).map((question) => (
              <QuestionResult key={question.order} question={question} />
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-2xl font-semibold">Difficulty Progression</h2>
        <ChartPanel title="Difficulty progression" empty={!difficultyProgression.length} emptyText="Difficulty history is not available.">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={difficultyProgression} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6edf7" />
              <XAxis dataKey="order" tickFormatter={(value) => `Q${value}`} />
              <YAxis domain={[1, 3]} ticks={[1, 2, 3]} tickFormatter={difficultyLabel} />
              <Tooltip labelFormatter={(value) => `Question ${value}`} formatter={(value) => [difficultyLabel(value), 'Difficulty']} />
              <Line type="stepAfter" dataKey="difficulty" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>
        {difficultyProgression.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {difficultyProgression.map((step) => (
              <div key={step.order} className="rounded-xl bg-ink-50 p-3">
                <p className="text-xs font-medium text-ink-700">Question {step.order}</p>
                <p className="mt-1 font-semibold text-ink-900">{step.difficultyLabel || difficultyLabel(step.difficulty)}</p>
                <p className="mt-1 text-xs text-ink-700">{step.topic} · {formatScore(step.score)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        <ListBlock title="Strengths" items={strengths} empty="Strengths will appear after evaluation." />
        <ListBlock title="Weaknesses" items={weaknesses} empty="No major weaknesses were recorded." />
        <ListBlock title="Recommendations" items={recommendations} empty="Keep practicing the assessed topics." />
      </div>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.1em] text-ink-700">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-ink-900">{value}</p>
    </div>
  );
}

function ChartPanel({ title, empty, emptyText, children }) {
  return (
    <div className="card-panel h-80">
      <h3 className="mb-3 font-semibold">{title}</h3>
      {empty ? <EmptyState text={emptyText} /> : <div className="h-[calc(100%-2rem)] w-full">{children}</div>}
    </div>
  );
}

function EmptyState({ text }) {
  return <p className="flex h-full min-h-24 items-center justify-center text-center text-sm text-ink-700">{text}</p>;
}

function ListBlock({ title, items, empty }) {
  return (
    <div className="card-panel">
      <h3 className="font-semibold">{title}</h3>
      {items?.length ? (
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-ink-800">
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : <p className="mt-2 text-sm text-ink-700">{empty}</p>}
    </div>
  );
}

function QuestionResult({ question }) {
  const evaluation = question.evaluation || {};
  return (
    <article className="py-5 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-ink-900">
            Q{question.order}. {question.skill || question.topic} · {difficultyLabel(question.difficulty)}
          </p>
          <p className="mt-2 text-sm leading-6 text-ink-800">{question.questionText || question.text}</p>
        </div>
        <div className="flex flex-col items-end gap-2"><span className="whitespace-nowrap text-sm font-bold text-accent-dark">{formatScore(question.score)}</span>{question.score != null && <ScoreBadge score={question.score} />}</div>
      </div>
      {evaluation.status === 'failed' && (
        <p className="mt-3 inline-block rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">Fallback evaluation</p>
      )}
      {evaluation.feedback && <p className="mt-3 text-sm leading-6 text-ink-700"><span className="font-semibold text-ink-900">Feedback:</span> {evaluation.feedback}</p>}
      {evaluation.strengths?.length > 0 && <p className="mt-2 text-sm text-ink-700"><span className="font-semibold text-ink-900">Strengths:</span> {evaluation.strengths.join(' · ')}</p>}
      {evaluation.improvementSuggestion && <p className="mt-2 text-sm text-ink-700"><span className="font-semibold text-ink-900">Improve:</span> {evaluation.improvementSuggestion}</p>}
    </article>
  );
}

function formatScore(value) {
  const score = Number(value);
  return Number.isFinite(score) ? `${Math.round(score)}%` : '—';
}

function ReportSkeleton() {
  return <div className="space-y-8" role="status"><div><Skeleton className="h-3 w-32" /><Skeleton className="mt-4 h-10 w-64" /><Skeleton className="mt-3 h-5 w-96 max-w-full" /></div><div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-56" /><Skeleton className="h-56" /></div><Skeleton className="h-96" /><div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-96" /><Skeleton className="h-96" /></div></div>;
}
