import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getInterview, getInterviewQuestions, startInterview, submitAnswer } from '../services/interviewApi.js';
import { difficultyLabel } from '../utils/format.js';
import { Alert, ButtonSpinner, Icon, Skeleton } from '../components/ui.jsx';

export default function InterviewSessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [lastEvaluation, setLastEvaluation] = useState(null);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function loadInterview() {
      setLoading(true);
      setError('');
      try {
        const detailResponse = await getInterview(id);
        const currentInterview = detailResponse.data.interview;
        if (currentInterview.status === 'completed') { navigate(`/interview/${id}/result`, { replace: true }); return; }
        const response = currentInterview.status === 'in_progress' ? await getInterviewQuestions(id) : await startInterview(id);
        const data = response.data;
        if (data.completed || data.interview?.status === 'completed') { navigate(`/interview/${id}/result`, { replace: true }); return; }
        if (!cancelled) { setInterview(data.interview || currentInterview); setQuestion(data.currentQuestion || data.question); }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load your interview.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadInterview();
    return () => { cancelled = true; };
  }, [id, navigate]);

  async function onSubmit(event) {
    event.preventDefault();
    const trimmedAnswer = answer.trim();
    if (!trimmedAnswer) { setValidationError('Please enter an answer before submitting.'); return; }
    if (!question || submittingRef.current) return;
    setValidationError('');
    setError('');
    setSubmitting(true);
    submittingRef.current = true;
    try {
      const { data } = await submitAnswer(question._id, { interviewId: id, userAnswer: trimmedAnswer });
      if (data.completed) { navigate(`/interview/${id}/result`, { replace: true }); return; }
      setLastEvaluation(data.evaluation || null);
      setInterview((previous) => ({ ...previous, currentDifficulty: data.nextDifficulty, completedQuestions: (previous?.completedQuestions || 0) + 1 }));
      setQuestion(data.nextQuestion);
      setAnswer('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit your answer.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  if (loading) return <SessionSkeleton />;
  if (error && !question) return <SessionError message={error} onRetry={() => window.location.reload()} />;
  if (!question || !interview) return <SessionError message="No interview question is available right now." onRetry={() => window.location.reload()} />;

  const totalQuestions = interview.questionCount || 1;
  const questionNumber = question.order || 1;
  const progress = Math.round((questionNumber / totalQuestions) * 100);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div><p className="eyebrow">{interview.jobRole}</p><h1 className="mt-2 font-display text-2xl font-semibold tracking-[-0.02em] text-ink-900 sm:text-3xl">Stay with the question.</h1></div>
        <p className="shrink-0 text-sm font-bold text-ink-700">Question <span className="text-ink-900">{questionNumber}</span> / {totalQuestions}</p>
      </header>

      <div aria-label={`Interview progress: ${progress}%`} role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
        <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.1em] text-ink-700"><span>Progress</span><span>{progress}%</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-ink-100"><div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${progress}%` }} /></div>
      </div>

      {error && <Alert>{error}</Alert>}

      <main className="card-panel border-ink-200 p-6 shadow-panel sm:p-9">
        <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-bold text-accent-dark"><Icon name="book" size={14} /> {question.topic}</span><span className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-3 py-1.5 text-xs font-bold text-ink-700"><Icon name="target" size={14} /> {difficultyLabel(question.difficulty)} difficulty</span></div>
        <div className="mt-8"><p className="text-xs font-bold uppercase tracking-[0.13em] text-ink-700">Question {questionNumber}</p><h2 className="mt-3 font-display text-3xl font-semibold leading-[1.18] tracking-[-0.025em] text-ink-900 sm:text-4xl">{question.questionText}</h2></div>
        <div className="mt-8 border-t border-ink-100 pt-7"><form onSubmit={onSubmit} className="space-y-4"><label htmlFor="interview-answer" className="flex items-center justify-between gap-3 text-sm font-bold text-ink-900"><span>Your answer</span><span className="text-xs font-medium text-ink-700">Explain your reasoning clearly</span></label><textarea id="interview-answer" className="input-field min-h-56 resize-y leading-6" placeholder="Write your answer here…" value={answer} onChange={(event) => { setAnswer(event.target.value); if (validationError) setValidationError(''); }} disabled={submitting} aria-invalid={Boolean(validationError)} aria-describedby={validationError ? 'answer-error' : undefined} autoFocus />{validationError && <p id="answer-error" className="flex items-center gap-1.5 text-sm font-semibold text-red-700" role="alert"><Icon name="warning" size={15} /> {validationError}</p>}<div className="flex flex-col-reverse items-stretch justify-between gap-3 pt-2 sm:flex-row sm:items-center"><p className="text-xs leading-5 text-ink-700">Your answer will be evaluated before the next question is selected.</p><button type="submit" className="btn-primary min-w-48 py-3" disabled={submitting || !answer.trim()}>{submitting ? <><ButtonSpinner /> Evaluating…</> : <>{questionNumber === totalQuestions ? 'Submit & finish' : 'Submit answer'} <Icon name="arrow" size={16} /></>}</button></div></form></div>
      </main>

      {lastEvaluation && <EvaluationPanel evaluation={lastEvaluation} />}
    </div>
  );
}

function EvaluationPanel({ evaluation }) {
  const strengths = Array.isArray(evaluation.strengths) ? evaluation.strengths : [];
  const weaknesses = Array.isArray(evaluation.weaknesses) ? evaluation.weaknesses : [];
  return <section className="rounded-2xl border border-accent/25 bg-accent-soft/45 p-5 sm:p-6" aria-live="polite"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">Evaluation ready</p><h2 className="mt-2 font-display text-3xl font-semibold text-ink-900">{evaluation.score == null ? 'Pending' : `${evaluation.score}/100`}</h2></div>{evaluation.status === 'failed' && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900 ring-1 ring-amber-200">Fallback evaluation</span>}</div>{evaluation.safeMessage && <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">{evaluation.safeMessage}</p>}{evaluation.feedback && <div className="mt-5"><h3 className="text-sm font-bold text-ink-900">Feedback</h3><p className="mt-1 text-sm leading-6 text-ink-800">{evaluation.feedback}</p></div>}<div className="mt-5 grid gap-4 sm:grid-cols-2">{strengths.length > 0 && <div><h3 className="text-sm font-bold text-ink-900">What worked</h3><ul className="mt-2 space-y-1 text-sm text-ink-800">{strengths.map((item) => <li key={item} className="flex gap-2"><Icon name="check" size={15} className="mt-0.5 text-accent-dark" />{item}</li>)}</ul></div>}{weaknesses.length > 0 && <div><h3 className="text-sm font-bold text-ink-900">Next focus</h3><ul className="mt-2 space-y-1 text-sm text-ink-800">{weaknesses.map((item) => <li key={item} className="flex gap-2"><Icon name="arrowUp" size={15} className="mt-0.5 text-amber-700" />{item}</li>)}</ul></div>}</div>{evaluation.improvementSuggestion && <div className="mt-5 rounded-xl bg-white/75 p-4"><h3 className="text-sm font-bold text-accent-dark">Improvement suggestion</h3><p className="mt-1 text-sm leading-6 text-ink-800">{evaluation.improvementSuggestion}</p></div>}</section>;
}

function SessionSkeleton() { return <div className="mx-auto max-w-3xl space-y-6" role="status"><div className="flex justify-between"><div><Skeleton className="h-3 w-28" /><Skeleton className="mt-3 h-9 w-72 max-w-full" /></div><Skeleton className="h-5 w-28" /></div><Skeleton className="h-2 w-full" /><Skeleton className="h-[36rem] w-full" /></div>; }
function SessionError({ message, onRetry }) { return <div className="mx-auto max-w-xl"><Alert>{message}</Alert><div className="mt-4 text-center"><button type="button" className="btn-secondary" onClick={onRetry}>Try again</button></div></div>; }
