import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowRight, FaCheckCircle, FaPlay, FaRedo, FaRobot } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { LOCAL_TOPICS } from '@/data/localLearning';
import { callAdaptiveMcp } from '@/lib/adaptiveTools';
import { runAdaptiveWorkflow } from '@/lib/adaptiveCore';
import PropTypes from 'prop-types';

const learningStages = [
  { title: 'Review your attempts', detail: 'MCP retrieves your recent learning history.' },
  { title: 'Find a focus', detail: 'MCP ranks topics using your answer accuracy.' },
  { title: 'Create focused practice', detail: 'Gemini writes questions for the selected topic.' },
  { title: 'Update your study plan', detail: 'Your answers update mastery and schedule a review.' },
];

function LearningAgentProgress({ workflow }) {
  const completed = workflow.status === 'complete';
  const failed = workflow.status === 'failed';
  const source = workflow.source === 'gemini'
    ? 'Gemini-generated questions'
    : workflow.source === 'previous-mistakes'
      ? 'Questions from your past attempts'
      : 'Built-in practice questions';

  return (
    <section className="glass-panel rounded-3xl p-5 md:p-6" aria-label="Learning agent progress">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[var(--text-main)]">
            <FaRobot className="text-[var(--accent)]" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Your AI learning agent</h2>
          </div>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Working on {workflow.topic}</p>
        </div>
        <span className="rounded-full border border-[var(--border-color)] bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)]">MCP workflow</span>
      </div>
      <ol className="grid gap-3 sm:grid-cols-2">
        {learningStages.map((stage, index) => {
          const isComplete = index < 3 || completed;
          const isFailed = index === 3 && failed;
          const stateLabel = isFailed ? 'Needs update' : isComplete ? 'Complete' : 'Up next';
          return (
            <li key={stage.title} className={isComplete ? 'rounded-2xl border border-[var(--accent)]/35 bg-[var(--accent-soft)]/45 p-4' : 'rounded-2xl border border-[var(--border-color)] bg-[var(--bg-base)]/45 p-4'}>
              <div className="flex items-start gap-3">
                <span className={isComplete ? 'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-white' : 'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--border-color)] text-xs font-semibold text-[var(--text-muted)]'}>
                  {isComplete ? <FaCheckCircle aria-hidden="true" /> : index + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="text-sm font-semibold text-[var(--text-main)]">{stage.title}</h3>
                    <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">{stateLabel}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{stage.detail}</p>
                  {index === 2 && <p className="mt-2 text-xs font-semibold text-[var(--accent)]">{source}</p>}
                  {index === 3 && completed && <p className="mt-2 text-xs font-semibold text-[var(--accent)]">Mastery and review plan updated</p>}
                  {index === 3 && !completed && !failed && <p className="mt-2 text-xs text-[var(--text-muted)]">Finish the practice to complete your learning loop.</p>}
                  {isFailed && <p className="mt-2 text-xs text-[var(--text-muted)]">Your answers are saved. Try again to refresh the review plan.</p>}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

LearningAgentProgress.propTypes = {
  workflow: PropTypes.shape({
    status: PropTypes.string,
    source: PropTypes.string,
    topic: PropTypes.string,
  }).isRequired,
};

export default function AdaptivePractice() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState(null);
  const [weakTopics, setWeakTopics] = useState([]);
  const [revisionPlan, setRevisionPlan] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [workflow, setWorkflow] = useState(() => {
    try { return JSON.parse(localStorage.getItem('quizup.adaptiveWorkflow') || 'null'); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await callAdaptiveMcp(user, { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'retrieve_attempt_history', arguments: { limit: 20 } } });
      if (response?.result?.isError) throw new Error('history');
      const data = response.result.structuredContent;
      setHistory(data);
      setRevisionPlan(data.revisionPlan || []);
      const analysis = await callAdaptiveMcp(user, { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'identify_weak_topics', arguments: { answers: data.answers || [], minimumAttempts: 1 } } });
      if (analysis?.result?.isError) throw new Error('analysis');
      const topics = analysis.result.structuredContent.topics || [];
      setWeakTopics(topics);
      setSelectedTopic((current) => current || topics[0]?.topic || 'Science & Nature');
    } catch (err) {
      console.error('Adaptive learning data could not be loaded.', err);
      setError('Could not load your learning progress. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const startPractice = async () => {
    setLoading(true);
    setError('');
    try {
      const attemptId = globalThis.crypto?.randomUUID?.() || 'attempt-' + Date.now() + '-' + Math.random().toString(36).slice(2);
      const run = await runAdaptiveWorkflow({
        request: { attemptId },
        targetTopic: selectedTopic,
        callMcp: (rpcRequest) => callAdaptiveMcp(user, rpcRequest),
      });
      const quiz = run.quiz;
      if (!Array.isArray(quiz.questions) || !quiz.questions.length || quiz.questions.some((question) => !question.options?.some((option) => option.is_correct))) throw new Error('inconsistent-practice');
      const flow = { attemptId, topic: run.selectedTopic, source: quiz.source, status: 'practice_running' };
      setWorkflow(flow);
      localStorage.setItem('quizup.adaptiveWorkflow', JSON.stringify(flow));
      sessionStorage.setItem('adaptivePractice', JSON.stringify({ ...quiz, attemptId, topic: run.selectedTopic, weakTopics: run.weakTopics }));
      sessionStorage.setItem('quizConfig', JSON.stringify({ amount: quiz.questions.length, mode: 'practice', timePerQuestion: 15, isAdaptive: true, adaptiveTopic: run.selectedTopic, attemptId }));
      navigate('/quiz');
    } catch (err) {
      console.error('Adaptive practice could not be prepared.', err);
      setError('Could not prepare focused practice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const topics = [...new Set([...weakTopics.map((topic) => topic.topic), ...LOCAL_TOPICS])];

  return (
    <main className="min-h-screen p-4 pt-6 md:p-8 md:pt-6">
      <div className="mx-auto max-w-6xl space-y-5 md:space-y-6">
        <header className="adaptive-featured adaptive-practice-hero relative overflow-hidden rounded-3xl p-6 text-white md:p-8">
          <div className="relative z-10 max-w-3xl">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold tracking-[0.14em]">AI LEARNING AGENT · MCP TOOLS</span>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight md:text-5xl">Adaptive practice</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 md:text-base">Your agent reviews learning history, identifies topics to revisit, prepares focused practice, and updates your plan when you finish.</p>
            <p className="mt-5 text-xs font-medium text-emerald-200/90">History · Topic analysis · Gemini practice · Answer tracking · Revision plan</p>
          </div>
          <div className="adaptive-orb" aria-hidden="true" />
        </header>

        {error && <div role="alert" className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-600">{error}</div>}
        {workflow && <LearningAgentProgress workflow={workflow} />}

        {loading && !history ? (
          <div className="glass-panel animate-pulse rounded-3xl p-8 text-sm text-[var(--text-muted)]">Getting your learning progress ready…</div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="glass-panel rounded-3xl p-5 md:p-7">
              <p className="eyebrow">Your learning profile</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-main)]">Choose a focus</h2>
              <p className="mb-5 mt-2 text-sm text-[var(--text-muted)]">Topics are ranked from your past answers. You can change the focus before starting.</p>
              {weakTopics.length ? (
                <div className="mb-6 grid gap-2 sm:grid-cols-2">
                  {weakTopics.slice(0, 8).map((topic) => {
                    const isSelected = selectedTopic === topic.topic;
                    return (
                      <button key={topic.topic} type="button" aria-pressed={isSelected} onClick={() => setSelectedTopic(topic.topic)} className={isSelected ? 'rounded-2xl border border-[var(--accent)] bg-[var(--accent-soft)] p-4 text-left ring-1 ring-[var(--accent)]/20' : 'rounded-2xl border border-[var(--border-color)] bg-[var(--bg-base)]/50 p-4 text-left transition-colors hover:border-[var(--accent)]'}>
                        <span className="flex items-center justify-between gap-3"><span className="font-semibold text-[var(--text-main)]">{topic.topic}</span><span className="text-sm font-bold text-[var(--accent)]">{topic.mastery}%</span></span>
                        <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-[var(--border-color)]"><span className="block h-full rounded-full bg-[var(--accent)]" style={{ width: topic.mastery + '%' }} /></span>
                        <span className="mt-2 block text-xs text-[var(--text-muted)]">{topic.total} {topic.total === 1 ? 'answer' : 'answers'}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="mb-5 rounded-2xl border border-dashed border-[var(--border-color)] p-4 text-sm leading-6 text-[var(--text-muted)]">No practice history yet. Choose a starter topic; your first session will create your learning profile.</p>
              )}
              <label className="mb-2 block text-sm font-semibold text-[var(--text-main)]" htmlFor="adaptive-topic">Practice another topic</label>
              <select id="adaptive-topic" value={selectedTopic} onChange={(event) => setSelectedTopic(event.target.value)} className="mb-4 w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-base)] p-3 text-[var(--text-main)]">
                {topics.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
              </select>
              <Button onClick={startPractice} disabled={loading || !selectedTopic} className="btn-primary w-full justify-center py-3">
                <FaPlay className="mr-2" aria-hidden="true" />{loading ? 'Preparing your session…' : 'Start focused practice'}<FaArrowRight className="ml-2" aria-hidden="true" />
              </Button>
            </section>

            <section className="glass-panel rounded-3xl p-5 md:p-7">
              <p className="eyebrow">Keep the momentum</p>
              <h2 className="mb-5 mt-2 text-2xl font-semibold tracking-tight text-[var(--text-main)]">Review plan</h2>
              {revisionPlan.length ? (
                <ul className="space-y-2">
                  {revisionPlan.slice().sort((a, b) => a.dueAt - b.dueAt).slice(0, 8).map((entry) => (
                    <li key={entry.topic} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-base)]/50 p-4">
                      <span className="min-w-0"><span className="block truncate font-semibold text-[var(--text-main)]">{entry.topic}</span><span className="mt-1 block text-xs text-[var(--text-muted)]">{entry.mastery}% mastery</span></span>
                      <time className="shrink-0 rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)]">{new Date(entry.dueAt).toLocaleDateString()}</time>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-2xl border border-dashed border-[var(--border-color)] p-4 text-sm leading-6 text-[var(--text-muted)]">Your first completed session creates a review plan based on your answers.</p>
              )}
              <Button variant="outline" onClick={refresh} disabled={loading} className="mt-5 rounded-xl border-[var(--border-color)]">
                <FaRedo className="mr-2" aria-hidden="true" />Refresh progress
              </Button>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
