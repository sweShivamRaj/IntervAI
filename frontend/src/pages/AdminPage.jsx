import { useEffect, useMemo, useState } from 'react';
import {
  adminCreateQuestion,
  adminDeleteQuestion,
  adminGetDashboard,
  adminListInterviews,
  adminListQuestions,
  adminListUsers,
  adminUpdateQuestion,
  fetchRolesSkills,
} from '../services/interviewApi.js';
import { difficultyLabel, formatDate } from '../utils/format.js';
import { Alert, ButtonSpinner, EmptyState, Icon, PageHeader, Skeleton } from '../components/ui.jsx';
import { FadeIn, StaggerList, StaggerItem, AnimatedTabContent, AnimatedPresenceWrapper } from '../components/motion.jsx';

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'users', label: 'Users', icon: 'users' },
  { id: 'interviews', label: 'Interviews', icon: 'file' },
  { id: 'questions', label: 'Questions', icon: 'book' },
];

const DEFAULT_SKILLS = [
  'JavaScript', 'React', 'Node.js', 'Express', 'MongoDB', 'SQL', 'Python', 'Java', 'C++',
  'DSA', 'DBMS', 'Operating Systems', 'Computer Networks', 'Software Engineering',
];

const EMPTY_QUESTION = {
  questionText: '',
  topic: 'JavaScript',
  difficulty: 2,
  questionType: 'conceptual',
  expectedConcepts: '',
};

export default function AdminPage() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [skills, setSkills] = useState([]);
  const [skillFilter, setSkillFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [form, setForm] = useState(EMPTY_QUESTION);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const previous = document.title;
    document.title = 'Admin dashboard · AdaptiveInterview';
    return () => {
      document.title = previous;
    };
  }, []);

  function loadCore() {
    setLoading(true);
    setError('');
    Promise.all([
      adminGetDashboard(),
      adminListUsers(),
      adminListInterviews(),
      fetchRolesSkills().catch(() => ({ data: { allSkills: [] } })),
    ])
      .then(([dashboardResponse, usersResponse, interviewsResponse, catalogResponse]) => {
        setStats(dashboardResponse.data.stats || {});
        setRecentInterviews(dashboardResponse.data.recentInterviews || []);
        setUsers(usersResponse.data.users || []);
        setInterviews(interviewsResponse.data.interviews || []);
        setSkills(catalogResponse.data.allSkills?.length ? catalogResponse.data.allSkills : DEFAULT_SKILLS);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load admin data.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCore();
  }, []);

  function loadQuestions() {
    const params = {};
    if (skillFilter) params.skill = skillFilter;
    if (difficultyFilter) params.difficulty = difficultyFilter;
    return adminListQuestions(params)
      .then((response) => setQuestions(response.data.questions || []))
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load fallback questions.');
      });
  }

  useEffect(() => {
    if (tab !== 'questions') return;
    loadQuestions();
  }, [tab, skillFilter, difficultyFilter]);

  const skillOptions = useMemo(() => {
    const fromQuestions = questions.map((item) => item.topic).filter(Boolean);
    return [...new Set([...skills, ...fromQuestions])].sort();
  }, [skills, questions]);

  async function onSaveQuestion(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    const payload = {
      questionText: form.questionText.trim(),
      topic: form.topic,
      difficulty: Number(form.difficulty),
      questionType: form.questionType,
      expectedConcepts: form.expectedConcepts,
    };
    try {
      if (editingId) {
        await adminUpdateQuestion(editingId, payload);
        setNotice('Fallback question updated.');
      } else {
        await adminCreateQuestion(payload);
        setNotice('Fallback question created.');
      }
      setForm({ ...EMPTY_QUESTION, topic: form.topic });
      setEditingId(null);
      await loadQuestions();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the fallback question.');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(question) {
    setTab('questions');
    setEditingId(question._id);
    setForm({
      questionText: question.questionText,
      topic: question.topic,
      difficulty: question.difficulty,
      questionType: question.questionType || 'conceptual',
      expectedConcepts: (question.expectedConcepts || []).join(', '),
    });
    setNotice('');
    setError('');
  }

  async function onDeleteQuestion(question) {
    const confirmed = window.confirm('Delete this fallback question? Interviews already created are not affected.');
    if (!confirmed) return;
    setError('');
    setNotice('');
    try {
      await adminDeleteQuestion(question._id);
      if (editingId === question._id) {
        setEditingId(null);
        setForm(EMPTY_QUESTION);
      }
      setNotice('Fallback question deleted.');
      await loadQuestions();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete the fallback question.');
    }
  }

  if (loading) return <AdminSkeleton />;

  return (
    <FadeIn className="space-y-8">
      <FadeIn>
        <PageHeader
          eyebrow="Platform control"
          title="Admin dashboard"
          description="Review platform activity, manage candidates, and maintain the fallback question bank."
        />
      </FadeIn>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Admin sections">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all active:scale-[0.97] ${
              tab === item.id ? 'bg-ink-900 text-white' : 'bg-white text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50'
            }`}
          >
            <Icon name={item.icon} size={16} />
            {item.label}
          </button>
        ))}
      </div>

      <AnimatedPresenceWrapper show={!!error}>
        {error && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Alert className="flex-1">{error}</Alert>
            <button type="button" className="btn-secondary transition-all active:scale-[0.97]" onClick={() => { loadCore(); if (tab === 'questions') loadQuestions(); }}>
              Try again
            </button>
          </div>
        )}
      </AnimatedPresenceWrapper>
      
      <AnimatedPresenceWrapper show={!!notice}>
        {notice && <Alert tone="success">{notice}</Alert>}
      </AnimatedPresenceWrapper>

      <AnimatedTabContent activeKey={tab}>
        {tab === 'overview' && (
          <OverviewPanel stats={stats} recentInterviews={recentInterviews} onOpen={(next) => setTab(next)} />
        )}
        {tab === 'users' && <UsersPanel users={users} />}
        {tab === 'interviews' && <InterviewsPanel interviews={interviews} />}
        {tab === 'questions' && (
          <QuestionsPanel
            questions={questions}
            skillOptions={skillOptions}
            skillFilter={skillFilter}
            difficultyFilter={difficultyFilter}
            onSkillFilter={setSkillFilter}
            onDifficultyFilter={setDifficultyFilter}
            form={form}
            setForm={setForm}
            editingId={editingId}
            saving={saving}
            onSave={onSaveQuestion}
            onEdit={startEdit}
            onDelete={onDeleteQuestion}
            onCancel={() => {
              setEditingId(null);
              setForm(EMPTY_QUESTION);
            }}
          />
        )}
      </AnimatedTabContent>
    </FadeIn>
  );
}

function OverviewPanel({ stats, recentInterviews, onOpen }) {
  const popular = stats?.mostPopularSkills || [];
  return (
    <div className="space-y-6">
      <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StaggerItem>
          <AdminMetric icon="users" label="Total users" value={stats?.totalUsers ?? 0} />
        </StaggerItem>
        <StaggerItem>
          <AdminMetric icon="file" label="Total interviews" value={stats?.totalInterviews ?? 0} />
        </StaggerItem>
        <StaggerItem>
          <AdminMetric
            icon="target"
            label="Average interview score"
            value={stats?.averageInterviewScore ? `${Math.round(stats.averageInterviewScore)}%` : '—'}
          />
        </StaggerItem>
      </StaggerList>

      <section className="card-panel">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="section-title">Most popular skills</h2>
            <p className="mt-1 text-sm text-ink-700">Skills selected most often in interview setup.</p>
          </div>
        </div>
        {popular.length ? (
          <ul className="flex flex-wrap gap-2">
            {popular.map((item) => (
              <li key={item.skill} className="rounded-full bg-accent-soft px-3 py-1.5 text-sm font-semibold text-accent-dark">
                {item.skill} <span className="font-medium text-ink-700">({item.count})</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon="chart" title="No skill data yet" description="Skills appear here after interviews are created." />
        )}
      </section>

      <section className="card-panel overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-ink-100 bg-ink-50/60 px-6 py-5">
          <div>
            <h2 className="section-title">Recent interviews</h2>
            <p className="mt-1 text-sm text-ink-700">Latest sessions across the platform.</p>
          </div>
          <button type="button" className="text-sm font-bold text-accent-dark hover:underline transition-all active:scale-[0.97]" onClick={() => onOpen('interviews')}>
            View all
          </button>
        </div>
        <InterviewTable interviews={recentInterviews} empty="No interview sessions yet." />
      </section>
    </div>
  );
}

function UsersPanel({ users }) {
  return (
    <section className="card-panel overflow-hidden p-0">
      <div className="border-b border-ink-100 bg-ink-50/60 px-6 py-5">
        <h2 className="section-title">Users</h2>
        <p className="mt-1 text-sm text-ink-700">{users.length} registered accounts.</p>
      </div>
      {users.length ? (
        <FadeIn>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-ink-100 text-xs uppercase tracking-[0.1em] text-ink-700">
                <tr>
                  <th className="px-6 py-3 font-bold">Name</th>
                  <th className="px-4 py-3 font-bold">Email</th>
                  <th className="px-4 py-3 font-bold">Role</th>
                  <th className="px-4 py-3 font-bold">Skills</th>
                  <th className="px-6 py-3 text-right font-bold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-ink-50/60">
                    <td className="px-6 py-4 font-bold text-ink-900">{user.name}</td>
                    <td className="px-4 py-4 text-ink-700">{user.email}</td>
                    <td className="px-4 py-4 capitalize">{user.role}</td>
                    <td className="max-w-xs px-4 py-4 text-ink-700">{user.skills?.length ? user.skills.join(', ') : '—'}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-xs text-ink-700">{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FadeIn>
      ) : (
        <div className="p-6">
          <EmptyState icon="users" title="No users yet" description="Registered accounts will appear here." />
        </div>
      )}
    </section>
  );
}

function InterviewsPanel({ interviews }) {
  return (
    <section className="card-panel overflow-hidden p-0">
      <div className="border-b border-ink-100 bg-ink-50/60 px-6 py-5">
        <h2 className="section-title">Interviews</h2>
        <p className="mt-1 text-sm text-ink-700">{interviews.length} sessions recorded.</p>
      </div>
      <InterviewTable interviews={interviews} empty="No interview sessions yet." />
    </section>
  );
}

function InterviewTable({ interviews, empty }) {
  if (!interviews?.length) {
    return (
      <div className="p-6">
        <EmptyState icon="file" title={empty} description="Platform interview activity will appear here." />
      </div>
    );
  }

  return (
    <FadeIn>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-ink-100 text-xs uppercase tracking-[0.1em] text-ink-700">
            <tr>
              <th className="px-6 py-3 font-bold">Candidate</th>
              <th className="px-4 py-3 font-bold">Job role</th>
              <th className="px-4 py-3 font-bold">Score</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-6 py-3 text-right font-bold">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {interviews.map((item) => (
              <tr key={item._id} className="hover:bg-ink-50/60">
                <td className="px-6 py-4">
                  <p className="font-bold text-ink-900">{item.user?.name || item.candidate || 'Candidate'}</p>
                  <p className="mt-0.5 text-xs text-ink-700">{item.user?.email || ''}</p>
                </td>
                <td className="px-4 py-4">{item.jobRole}</td>
                <td className="px-4 py-4 font-semibold">{item.scoreAverage == null && item.score == null ? '—' : `${Math.round(item.scoreAverage ?? item.score)}%`}</td>
                <td className="px-4 py-4"><StatusBadge status={item.status} /></td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-xs text-ink-700">{formatDate(item.date || item.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </FadeIn>
  );
}

function QuestionsPanel({
  questions,
  skillOptions,
  skillFilter,
  difficultyFilter,
  onSkillFilter,
  onDifficultyFilter,
  form,
  setForm,
  editingId,
  saving,
  onSave,
  onEdit,
  onDelete,
  onCancel,
}) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <FadeIn>
        <form onSubmit={onSave} className="card-panel space-y-4">
          <div>
            <h2 className="section-title">{editingId ? 'Edit fallback question' : 'Create fallback question'}</h2>
            <p className="mt-1 text-sm text-ink-700">These questions are used when AI generation is unavailable.</p>
          </div>
          <label className="block text-sm font-bold text-ink-900">
            Question text
            <textarea
              className="input-field mt-2 min-h-28 resize-y transition-all"
              required
              minLength={20}
              value={form.questionText}
              onChange={(event) => setForm({ ...form, questionText: event.target.value })}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold text-ink-900">
              Skill
              <select className="input-field mt-2 transition-all" value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })}>
                {skillOptions.map((skill) => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-bold text-ink-900">
              Difficulty
              <select className="input-field mt-2 transition-all" value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: Number(event.target.value) })}>
                <option value={1}>Easy</option>
                <option value={2}>Medium</option>
                <option value={3}>Hard</option>
              </select>
            </label>
          </div>
          <label className="block text-sm font-bold text-ink-900">
            Question type
            <select className="input-field mt-2 transition-all" value={form.questionType} onChange={(event) => setForm({ ...form, questionType: event.target.value })}>
              <option value="conceptual">Conceptual</option>
              <option value="scenario">Scenario</option>
              <option value="coding">Coding</option>
              <option value="design">Design</option>
            </select>
          </label>
          <label className="block text-sm font-bold text-ink-900">
            Expected concepts
            <input
              className="input-field mt-2 transition-all"
              required
              placeholder="closures, scope, hoisting"
              value={form.expectedConcepts}
              onChange={(event) => setForm({ ...form, expectedConcepts: event.target.value })}
            />
            <span className="mt-1 block text-xs font-medium text-ink-700">Separate with commas. Used only for evaluation, never shown to candidates.</span>
          </label>
          <div className="flex flex-wrap gap-2 pt-2">
            <button type="submit" className="btn-primary transition-all active:scale-[0.97]" disabled={saving}>
              {saving ? <><ButtonSpinner /> Saving…</> : editingId ? 'Save changes' : 'Create question'}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary transition-all active:scale-[0.97]" onClick={onCancel}>Cancel</button>
            )}
          </div>
        </form>
      </FadeIn>

      <FadeIn>
        <section className="card-panel overflow-hidden p-0">
          <div className="space-y-4 border-b border-ink-100 bg-ink-50/60 px-6 py-5">
            <div>
              <h2 className="section-title">Fallback question bank</h2>
              <p className="mt-1 text-sm text-ink-700">{questions.length} matching questions.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold uppercase tracking-[0.1em] text-ink-700">
                Filter by skill
                <select className="input-field mt-1.5 py-2 text-sm font-semibold normal-case tracking-normal transition-all" value={skillFilter} onChange={(event) => onSkillFilter(event.target.value)}>
                  <option value="">All skills</option>
                  {skillOptions.map((skill) => (
                    <option key={skill} value={skill}>{skill}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold uppercase tracking-[0.1em] text-ink-700">
                Filter by difficulty
                <select className="input-field mt-1.5 py-2 text-sm font-semibold normal-case tracking-normal transition-all" value={difficultyFilter} onChange={(event) => onDifficultyFilter(event.target.value)}>
                  <option value="">All levels</option>
                  <option value="1">Easy</option>
                  <option value="2">Medium</option>
                  <option value="3">Hard</option>
                </select>
              </label>
            </div>
          </div>
          {questions.length ? (
            <ul className="divide-y divide-ink-100">
              {questions.map((question) => (
                <li key={question._id} className="px-6 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent-dark">{question.topic}</span>
                        <span className="rounded-full bg-ink-50 px-2.5 py-1 text-xs font-bold text-ink-700">{question.difficultyLabel || difficultyLabel(question.difficulty)}</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold leading-6 text-ink-900">{question.questionText}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button type="button" className="btn-secondary px-3 py-2 transition-all active:scale-[0.97]" onClick={() => onEdit(question)} aria-label="Edit question">
                        <Icon name="pencil" size={15} /> Edit
                      </button>
                      <button type="button" className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 transition-all active:scale-[0.97]" onClick={() => onDelete(question)} aria-label="Delete question">
                        <Icon name="trash" size={15} /> Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6">
              <EmptyState icon="book" title="No matching questions" description="Adjust filters or create a new fallback question." />
            </div>
          )}
        </section>
      </FadeIn>
    </div>
  );
}

function AdminMetric({ icon, label, value }) {
  return (
    <div className="card-panel flex items-start gap-3">
      <span className="grid size-10 place-items-center rounded-xl bg-ink-50 text-ink-700">
        <Icon name={icon} size={18} />
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.1em] text-ink-700">{label}</p>
        <p className="mt-2 font-display text-3xl font-semibold text-ink-900">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    completed: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    in_progress: 'bg-amber-50 text-amber-900 ring-amber-200',
    created: 'bg-blue-50 text-blue-800 ring-blue-200',
    setup: 'bg-blue-50 text-blue-800 ring-blue-200',
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ring-1 ${styles[status] || 'bg-ink-50 text-ink-700 ring-ink-200'}`}>
      {String(status || '').replace('_', ' ')}
    </span>
  );
}

function AdminSkeleton() {
  return (
    <div className="space-y-8" role="status">
      <div>
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-4 h-10 w-64" />
        <Skeleton className="mt-3 h-5 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
