import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBrain, FaPlay, FaRedo, FaCheckCircle } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { LOCAL_TOPICS } from '@/data/localLearning';
import { callAdaptiveMcp } from '@/lib/adaptiveTools';
import { runAdaptiveWorkflow } from '@/lib/adaptiveCore';

const availableTopics = LOCAL_TOPICS;

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
      if (response?.result?.isError) throw new Error(response.result.content?.[0]?.text || 'Could not load learning history.');
      const data = response.result.structuredContent;
      setHistory(data);
      setRevisionPlan(data.revisionPlan || []);
      const analysis = await callAdaptiveMcp(user, { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'identify_weak_topics', arguments: { answers: data.answers || [], minimumAttempts: 1 } } });
      if (analysis?.result?.isError) throw new Error(analysis.result.content?.[0]?.text || 'Could not analyze topics.');
      const topics = analysis.result.structuredContent.topics || [];
      setWeakTopics(topics);
      setSelectedTopic((current) => current || topics[0]?.topic || 'Science & Nature');
    } catch (err) {
      setError(err.message || 'Unable to load adaptive practice.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const startPractice = async () => {
    setLoading(true);
    setError('');
    try {
      const attemptId = globalThis.crypto?.randomUUID?.() || `attempt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const run = await runAdaptiveWorkflow({
        request: { attemptId },
        targetTopic: selectedTopic,
        callMcp: (rpcRequest) => callAdaptiveMcp(user, rpcRequest),
      });
      const quiz = run.quiz;
      if (!Array.isArray(quiz.questions) || !quiz.questions.length || quiz.questions.some((question) => !question.options?.some((option) => option.is_correct))) throw new Error('Practice questions failed consistency checks.');
      const flow = { attemptId, topic: run.selectedTopic, weakTopics: run.weakTopics, steps: run.steps.map((step) => step.stage), toolCalls: run.toolCalls, status: 'practice_running' };
      setWorkflow(flow);
      localStorage.setItem('quizup.adaptiveWorkflow', JSON.stringify(flow));
      sessionStorage.setItem('adaptivePractice', JSON.stringify({ ...quiz, attemptId, topic: run.selectedTopic, weakTopics: run.weakTopics }));
      sessionStorage.setItem('quizConfig', JSON.stringify({ amount: quiz.questions.length, mode: 'practice', timePerQuestion: 15, isAdaptive: true, adaptiveTopic: run.selectedTopic, attemptId }));
      navigate('/quiz');
    } catch (err) {
      setError(err.message || 'Could not start adaptive practice.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 pt-28">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="glass-panel rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-2"><FaBrain className="text-2xl text-[#00A63E] dark:text-[#39FF14]" /><h1 className="text-3xl font-bold text-[var(--text-main)]">Adaptive Practice</h1></div>
          <p className="text-[var(--text-muted)]">Review your attempts, focus on a topic that needs work, and update your revision plan as you answer.</p>
          <p className="mt-3 text-xs text-[var(--text-muted)]">Uses the built-in question bank; no AI key or paid service is required. {history?.attempts?.length || 0} saved attempts found{user ? ' (Firebase sync with local fallback)' : ' on this device'}.</p>
        </header>
        {error && <div role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-red-600">{error}</div>}
        {workflow && <div className="glass-panel p-4 rounded-xl text-sm" aria-live="polite">{workflow.status === 'complete' ? 'Adaptive workflow complete.' : workflow.status === 'failed' ? 'The last adaptive workflow needs attention.' : 'Focused practice is in progress.'} Topic: {workflow.topic}. Steps: {(workflow.steps || []).join(' → ')}{workflow.status === 'complete' ? ' → mastery and revision updated' : ' → answer the practice to update mastery and revision.'}</div>}
        {loading && !history ? <div className="glass-panel p-8 rounded-2xl animate-pulse">Inspecting your learning history…</div> : (
          <div className="grid lg:grid-cols-2 gap-6">
            <section className="glass-panel rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4 text-[var(--text-main)]">Topics to revisit</h2>
              {weakTopics.length ? <div className="space-y-2 mb-5">{weakTopics.slice(0, 8).map((topic) => <button key={topic.topic} onClick={() => setSelectedTopic(topic.topic)} className={`w-full text-left flex justify-between rounded-lg border p-3 ${selectedTopic === topic.topic ? 'border-[#00A63E] bg-green-500/10' : 'border-[var(--border-color)]'}`}><span>{topic.topic}</span><span>{topic.mastery}% · {topic.total} answers</span></button>)}</div> : <p className="text-[var(--text-muted)] mb-5">No past answers yet. Pick a starter topic; this practice will seed your history.</p>}
              <label className="block text-sm font-semibold mb-2" htmlFor="adaptive-topic">Practice topic</label>
              <select id="adaptive-topic" value={selectedTopic} onChange={(event) => setSelectedTopic(event.target.value)} className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-base)] p-3 text-[var(--text-main)] mb-4">
                {[...new Set([...weakTopics.map((topic) => topic.topic), ...availableTopics])].map((topic) => <option key={topic} value={topic}>{topic}</option>)}
              </select>
              <Button onClick={startPractice} disabled={loading || !selectedTopic} className="btn-primary w-full"><FaPlay className="mr-2" />{loading ? 'Preparing practice…' : 'Start focused practice'}</Button>
            </section>
            <section className="glass-panel rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4 text-[var(--text-main)]">Revision plan</h2>
              {revisionPlan.length ? <ul className="space-y-3">{revisionPlan.slice().sort((a, b) => a.dueAt - b.dueAt).slice(0, 8).map((entry) => <li key={entry.topic} className="flex justify-between items-center border-b border-[var(--border-color)] pb-3"><span><FaCheckCircle className="inline mr-2 text-[#00A63E]" />{entry.topic} · {entry.mastery}%</span><time className="text-sm text-[var(--text-muted)]">{new Date(entry.dueAt).toLocaleDateString()}</time></li>)}</ul> : <p className="text-[var(--text-muted)]">Finish a practice session to create your first review schedule.</p>}
              <Button variant="outline" onClick={refresh} disabled={loading} className="mt-5"><FaRedo className="mr-2" />Refresh history</Button>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
