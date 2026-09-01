import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createInterview } from '../services/interviewApi.js';
import { Alert, ButtonSpinner, Icon, PageHeader } from '../components/ui.jsx';
import { FadeIn, AnimatedPresenceWrapper } from '../components/motion.jsx';

const JOB_ROLES = ['Software Developer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Analyst', 'Data Scientist', 'QA Engineer'];
const INTERVIEW_TYPES = [{ value: 'technical', label: 'Technical', icon: 'code' }, { value: 'behavioral', label: 'Behavioral', icon: 'user' }, { value: 'mixed', label: 'Mixed', icon: 'spark' }];
const ALL_SKILLS = ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'SQL', 'Python', 'Java', 'C++', 'DSA', 'DBMS', 'Operating Systems', 'Computer Networks', 'Software Engineering'];
const DIFFICULTIES = [{ value: 'adaptive', label: 'Adaptive', desc: 'Adjusts after every answer', icon: 'spark' }, { value: 'easy', label: 'Easy', desc: 'Foundational questions', icon: 'book' }, { value: 'medium', label: 'Medium', desc: 'Intermediate concepts', icon: 'bar' }, { value: 'hard', label: 'Hard', desc: 'Advanced challenges', icon: 'target' }];
const QUESTION_COUNTS = [5, 10, 15];

export default function InterviewSetupPage() {
  const navigate = useNavigate();
  const [jobRole, setJobRole] = useState(JOB_ROLES[0]);
  const [interviewType, setInterviewType] = useState('technical');
  const [skills, setSkills] = useState([]);
  const [difficulty, setDifficulty] = useState('adaptive');
  const [questionCount, setQuestionCount] = useState(5);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function toggleSkill(skill) {
    setSkills((previous) => previous.includes(skill) ? previous.filter((item) => item !== skill) : [...previous, skill]);
  }
  function selectAll() { setSkills([...ALL_SKILLS]); }
  function clearAll() { setSkills([]); }

  async function onSubmit(event) {
    event.preventDefault();
    if (skills.length === 0) { setError('Select at least one skill to continue.'); return; }
    setBusy(true);
    setError('');
    try {
      const { data } = await createInterview({ jobRole, interviewType, skills, initialDifficulty: difficulty, questionCount: Number(questionCount) });
      navigate(`/interview/${data.interview._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create interview.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        <PageHeader eyebrow="New practice session" title="Design your interview" description="Choose what you want to practice. Your session will adapt as you work through it." actions={<Link to="/dashboard" className="btn-secondary"><Icon name="arrow" size={16} className="rotate-180" /> Back to dashboard</Link>} />
      </FadeIn>
      <form onSubmit={onSubmit} className="grid items-start gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card-panel space-y-8">
          <fieldset><legend className="text-sm font-bold text-ink-900">Target role</legend><p className="mt-1 text-sm text-ink-700">Questions will be framed for this role.</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{JOB_ROLES.map((role) => <ChoiceButton key={role} label={role} selected={jobRole === role} onClick={() => setJobRole(role)} />)}</div></fieldset>

          <fieldset><legend className="text-sm font-bold text-ink-900">Interview format</legend><div className="mt-4 grid gap-3 sm:grid-cols-3">{INTERVIEW_TYPES.map((item) => <button key={item.value} type="button" onClick={() => setInterviewType(item.value)} aria-pressed={interviewType === item.value} className={`rounded-2xl border p-4 text-left transition-all ${interviewType === item.value ? 'border-accent bg-accent-soft/70 text-accent-dark' : 'border-ink-200 bg-white text-ink-700 hover:bg-ink-50'}`}><span className="grid size-9 place-items-center rounded-xl bg-white shadow-sm"><Icon name={item.icon} size={17} /></span><span className="mt-3 block text-sm font-bold">{item.label}</span></button>)}</div></fieldset>

          <fieldset><legend className="text-sm font-bold text-ink-900">Skills to assess</legend><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="mt-1 text-sm text-ink-700">Select one or more focus areas.</p></div><div className="flex items-center gap-2 text-xs font-bold"><button type="button" onClick={selectAll} className="text-accent-dark hover:underline">Select all</button><span className="text-ink-200">/</span><button type="button" onClick={clearAll} className="text-accent-dark hover:underline">Clear</button></div></div><div className="mt-4 flex flex-wrap gap-2">{ALL_SKILLS.map((skill) => <button key={skill} type="button" onClick={() => toggleSkill(skill)} aria-pressed={skills.includes(skill)} className={`rounded-xl border px-3 py-2 text-sm font-medium transition-all ${skills.includes(skill) ? 'border-accent bg-accent-soft text-accent-dark' : 'border-ink-200 bg-white text-ink-700 hover:border-accent/40 hover:bg-ink-50'}`}>{skills.includes(skill) && <Icon name="check" size={14} className="mr-1 inline" />}{skill}</button>)}</div><p className="mt-3 text-xs font-semibold text-ink-700">{skills.length ? `${skills.length} skill${skills.length === 1 ? '' : 's'} selected` : 'No skills selected yet'}</p></fieldset>

          <fieldset><legend className="text-sm font-bold text-ink-900">Starting difficulty</legend><div className="mt-4 grid gap-3 sm:grid-cols-2">{DIFFICULTIES.map((item) => <button key={item.value} type="button" onClick={() => setDifficulty(item.value)} aria-pressed={difficulty === item.value} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${difficulty === item.value ? 'border-accent bg-accent-soft/70' : 'border-ink-200 bg-white hover:bg-ink-50'}`}><span className={`grid size-10 place-items-center rounded-xl ${difficulty === item.value ? 'bg-white text-accent-dark' : 'bg-ink-50 text-ink-700'}`}><Icon name={item.icon} size={18} /></span><span><span className={`block text-sm font-bold ${difficulty === item.value ? 'text-accent-dark' : 'text-ink-900'}`}>{item.label}</span><span className="mt-0.5 block text-xs text-ink-700">{item.desc}</span></span></button>)}</div></fieldset>

          <fieldset><legend className="text-sm font-bold text-ink-900">Number of questions</legend><div className="mt-4 flex gap-3">{QUESTION_COUNTS.map((count) => <button key={count} type="button" onClick={() => setQuestionCount(count)} aria-pressed={questionCount === count} className={`grid size-14 place-items-center rounded-2xl border text-sm font-bold transition-all ${questionCount === count ? 'border-accent bg-accent text-white shadow-sm' : 'border-ink-200 bg-white text-ink-700 hover:bg-ink-50'}`}>{count}</button>)}</div></fieldset>

          <AnimatedPresenceWrapper show={!!error}>
            {error && <Alert>{error}</Alert>}
          </AnimatedPresenceWrapper>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-6"><p className="text-xs text-ink-700">You can leave the session and return to it from History.</p><button type="submit" className="btn-primary min-w-44" disabled={busy || skills.length === 0}>{busy ? <><ButtonSpinner /> Preparing…</> : <>Begin interview <Icon name="arrow" size={16} /></>}</button></div>
        </div>

        <FadeIn delay={0.2}>
          <aside className="card-panel sticky top-24 h-fit overflow-hidden bg-ink-900 text-white">
            <div className="pointer-events-none absolute" />
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-soft">Session preview</p>
            <h2 className="mt-3 font-display text-2xl font-semibold">A focused practice block.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">You will receive one question at a time, with difficulty adapting to your recent performance.</p>
            <div className="mt-8 space-y-4 border-t border-white/10 pt-6"><SummaryRow label="Role" value={jobRole} /><SummaryRow label="Format" value={INTERVIEW_TYPES.find((item) => item.value === interviewType)?.label} /><SummaryRow label="Focus" value={skills.length ? `${skills.length} selected` : 'Choose skills'} /><SummaryRow label="Difficulty" value={DIFFICULTIES.find((item) => item.value === difficulty)?.label} /><SummaryRow label="Questions" value={`${questionCount} questions`} /></div>
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.07] p-4"><div className="flex items-center gap-2 text-sm font-semibold"><Icon name="shield" size={17} className="text-accent-soft" /> Your answers stay in your workspace</div><p className="mt-2 text-xs leading-5 text-slate-400">Use the session to think clearly, then review your insights when you finish.</p></div>
          </aside>
        </FadeIn>
      </form>
    </div>
  );
}

function ChoiceButton({ label, selected, onClick }) { return <button type="button" onClick={onClick} aria-pressed={selected} className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all active:scale-[0.97] ${selected ? 'border-accent bg-accent-soft/70 text-accent-dark' : 'border-ink-200 bg-white text-ink-700 hover:bg-ink-50'}`}>{selected && <Icon name="check" size={14} className="mr-1.5 inline" />}{label}</button>; }
function SummaryRow({ label, value }) { return <div className="flex items-center justify-between gap-4 text-sm"><span className="text-slate-400">{label}</span><span className="max-w-[10rem] truncate text-right font-semibold">{value}</span></div>; }
