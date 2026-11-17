import { collection, doc, getDoc, getDocs, limit, query, runTransaction, setDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LOCAL_QUESTIONS } from '@/data/localLearning';
import { AdaptiveError, MCP_TOOLS, handleMcpRequest, scoreTopics, validateToolInput } from './adaptiveCore';

const ATTEMPTS_KEY = 'quizup.adaptiveAttempts';
const PROFILE_KEY = 'quizup.adaptiveProfile';
const initializedRemoteUsers = new Set();
const localRead = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
};
const localWrite = (key, value) => localStorage.setItem(key, JSON.stringify(value));

function flattenAttempts(attempts) {
  return attempts.flatMap((attempt) => Array.isArray(attempt.answers) ? attempt.answers : []);
}

async function loadLearnerData(userId) {
  const localAttempts = localRead(ATTEMPTS_KEY, []);
  const localProfile = localRead(PROFILE_KEY, {});
  if (!userId) return { attempts: localAttempts, profile: localProfile };
  try {
    const [profileSnap, historySnap] = await Promise.all([
      getDoc(doc(db, 'users', userId)),
      getDocs(query(collection(db, 'quizHistory'), where('userId', '==', userId), limit(100))),
    ]);
    const profile = profileSnap.exists() ? profileSnap.data() : {};
    const attempts = [...new Map([...(profile.adaptiveAttempts || []), ...localAttempts].map((attempt, index) => [attempt.attemptId || `legacy-${index}`, attempt])).values()];
    const existingIds = new Set(attempts.map((attempt) => attempt.attemptId));
    historySnap.forEach((entry) => {
      const data = entry.data();
      if (Array.isArray(data.questionAnswers)) {
        const attemptId = data.adaptiveAttemptId || entry.id;
        if (!existingIds.has(attemptId)) attempts.push({ attemptId, answers: data.questionAnswers });
      }
    });
    return { attempts, profile: { ...localProfile, ...profile } };
  } catch (error) {
    console.warn('Adaptive data is using this device because Firebase could not be reached.', error);
    return { attempts: localAttempts, profile: localProfile };
  }
}

async function persistLearnerData(userId, patch) {
  const profile = { ...localRead(PROFILE_KEY, {}), ...patch, updatedAt: Date.now() };
  localWrite(PROFILE_KEY, profile);
  if (userId) {
    try { await setDoc(doc(db, 'users', userId), patch, { merge: true }); }
    catch (error) { console.warn('Adaptive profile sync failed; saved on this device.', error); }
  }
  return profile;
}

async function executeTool(userId, name, args) {
  validateToolInput(name, args);
  if (name === 'retrieve_attempt_history') {
    const { attempts, profile } = await loadLearnerData(userId);
    const recent = attempts.slice(-Math.min(args.limit || 20, 20)).reverse();
    return { attempts: recent, answers: flattenAttempts(recent), revisionPlan: profile.revisionPlan || [], topicMastery: profile.topicMastery || {} };
  }
  if (name === 'identify_weak_topics') {
    const { profile } = await loadLearnerData(userId);
    const savedMastery = args.answers.length ? {} : profile.topicMastery || {};
    return { topics: scoreTopics(args.answers, args.minimumAttempts || 1, savedMastery) };
  }
  if (name === 'generate_targeted_quiz') {
    const { attempts } = await loadLearnerData(userId);
    const priorAnswers = flattenAttempts(attempts);
    const priorQuestions = priorAnswers.filter((answer) => answer.topic.toLowerCase() === args.topic.toLowerCase() && answer.question && answer.correctAnswer && Array.isArray(answer.options));
    const reviewQuestions = [...new Map(priorQuestions.map((answer) => [answer.question, answer])).values()]
      .map((answer, id) => ({
        id,
        topic: answer.topic,
        description: answer.question,
        difficulty_level: 'medium',
        options: answer.options.map((description, optionId) => ({ id: optionId, description, is_correct: description === answer.correctAnswer })),
      }));
    const matching = LOCAL_QUESTIONS.filter((question) => question.topic.toLowerCase() === args.topic.toLowerCase());
    const pool = reviewQuestions.length ? reviewQuestions : matching;
    if (!pool.length) throw new AdaptiveError('NO_TOPIC_QUESTIONS', `No focused questions are available for ${args.topic} yet.`);
    const questions = Array.from({ length: Math.min(args.amount || 10, pool.length) }, (_, index) => ({ ...pool[index % pool.length], id: index }));
    if (!questions.length || questions.some((question) => !question.options?.some((option) => option.is_correct))) throw new AdaptiveError('INCONSISTENT_QUIZ_OUTPUT', 'Generated practice questions failed validation.');
    return { topic: args.topic, questions, source: 'built-in-question-bank' };
  }
  if (name === 'record_answers') {
    const attempts = localRead(ATTEMPTS_KEY, []);
    const current = { attemptId: args.attemptId, answers: args.answers, recordedAt: Date.now() };
    const next = [...attempts.filter((attempt) => attempt.attemptId !== args.attemptId), current].slice(-100);
    localWrite(ATTEMPTS_KEY, next);
    if (userId) {
      try {
        const ref = doc(db, 'users', userId);
        await runTransaction(db, async (transaction) => {
          const snapshot = await transaction.get(ref);
          const saved = snapshot.exists() ? snapshot.data().adaptiveAttempts || [] : [];
          const bounded = [...saved.filter((attempt) => attempt.attemptId !== args.attemptId), current].slice(-20);
          transaction.set(ref, { adaptiveAttempts: bounded }, { merge: true });
        });
      }
      catch (error) { console.warn('Attempt sync failed; saved on this device.', error); }
    }
    return { attemptId: args.attemptId, saved: true, answerCount: args.answers.length };
  }
  if (name === 'update_revision_plan') {
    const { profile, attempts } = await loadLearnerData(userId);
    const allAnswers = flattenAttempts(attempts);
    if (!allAnswers.length) allAnswers.push(...args.answers);
    const topics = scoreTopics(allAnswers, 1, {});
    const now = Date.now();
    const revisionPlan = topics.map((topic) => ({
      topic: topic.topic,
      mastery: topic.mastery,
      dueAt: now + (topic.mastery < 50 ? 1 : topic.mastery < 80 ? 3 : 7) * 86400000,
      intervalDays: topic.mastery < 50 ? 1 : topic.mastery < 80 ? 3 : 7,
    }));
    const topicMastery = Object.fromEntries(topics.map(({ topic, correct, total, mastery }) => [topic, { correct, total, mastery }]));
    await persistLearnerData(userId, { topicMastery, revisionPlan });
    return { topicMastery, revisionPlan, updatedAt: now, previousRevisionPlan: profile.revisionPlan || [] };
  }
  throw new AdaptiveError('UNKNOWN_TOOL', `Unknown adaptive tool: ${name}`);
}

/** Invoke one of the five declared MCP tools. */
export async function callAdaptiveTool(user, name, args) {
  return executeTool(user?.uid || null, name, args);
}

/** In-app JSON-RPC client for the MCP tool surface. */
export async function callAdaptiveMcp(user, request) {
  if (user?.getIdToken) {
    try {
      const token = await user.getIdToken();
      if (!initializedRemoteUsers.has(user.uid)) {
        const initializeResponse = await fetch('/api/mcp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'quizup-web', version: '1.0.0' } } }) });
        const initializePayload = await initializeResponse.json().catch(() => null);
        if (!initializeResponse.ok || !initializePayload?.result?.capabilities?.tools) throw new Error('Remote MCP initialization failed.');
        await fetch('/api/mcp', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) });
        initializedRemoteUsers.add(user.uid);
      }
      const response = await fetch('/api/mcp', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify(request) });
      const payload = await response.json().catch(() => null);
      if (response.ok && payload?.jsonrpc === '2.0') return payload;
      if ([401, 403].includes(response.status)) throw new AdaptiveError('MCP_AUTH_FAILED', payload?.error?.message || 'The MCP service could not verify your sign-in.');
    } catch (error) {
      if (error.code === 'MCP_AUTH_FAILED') throw error;
      // A local Vite dev server or an unconfigured Vercel function can still use the in-app MCP adapter.
      console.info('Remote MCP endpoint unavailable; using the local MCP tool adapter.');
    }
  }
  return handleMcpRequest(request, { callTool: (name, args) => executeTool(user?.uid || null, name, args) });
}

export async function invokeAdaptiveTool(user, name, args, id = Date.now()) {
  const response = await callAdaptiveMcp(user, { jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } });
  if (response?.error) throw new AdaptiveError(response.error.data?.code || 'MCP_REQUEST_FAILED', response.error.message || 'MCP request failed.');
  if (response?.result?.isError) throw new AdaptiveError(response.result.error?.code || 'TOOL_EXECUTION_FAILED', response.result.content?.[0]?.text || 'MCP tool execution failed.');
  return response?.result?.structuredContent;
}

export { MCP_TOOLS };
