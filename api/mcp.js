import { handleMcpRequest, scoreTopics, AdaptiveError } from '../src/lib/adaptiveCore.js';
import { LOCAL_QUESTIONS } from '../src/data/localLearning.js';
import { env } from 'node:process';
import { generateGeminiText } from './gemini.js';

const json = (res, status, value) => { res.statusCode = status; res.setHeader('content-type', 'application/json; charset=utf-8'); res.end(JSON.stringify(value)); };

function decodeValue(value) {
  if (!value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in value) return decodeFields(value.mapValue.fields || {});
  return null;
}

function decodeFields(fields = {}) { return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)])); }
function encodeValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (Number.isInteger(value)) return { integerValue: String(value) };
  if (typeof value === 'number') return { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  if (typeof value === 'object') return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, encodeValue(item)])) } };
  throw new AdaptiveError('INVALID_ARGUMENTS', 'Unsupported Firestore value.');
}

function getConfig() {
  const projectId = env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID;
  const apiKey = env.FIREBASE_API_KEY || env.VITE_FIREBASE_API_KEY;
  if (!projectId || !apiKey) throw new AdaptiveError('SERVER_NOT_CONFIGURED', 'Firebase MCP endpoint is not configured.');
  return { projectId, apiKey, base: `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents` };
}

async function verifyToken(token, apiKey) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idToken: token }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.users?.[0]?.localId) throw new AdaptiveError('UNAUTHENTICATED', 'Firebase sign-in is required for learner data.');
  return body.users[0].localId;
}

async function firestoreFetch(url, token, init = {}) {
  const response = await fetch(url, { ...init, headers: { authorization: `Bearer ${token}`, ...(init.body ? { 'content-type': 'application/json' } : {}), ...init.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new AdaptiveError(response.status === 403 ? 'PERMISSION_DENIED' : response.status === 404 ? 'NOT_FOUND' : 'FIRESTORE_FAILED', body.error?.message || `Firestore request failed (${response.status}).`);
  return body;
}

async function readProfile(base, uid, token) {
  try { return decodeFields((await firestoreFetch(`${base}/users/${encodeURIComponent(uid)}`, token)).fields); }
  catch (error) { if (error.code === 'NOT_FOUND') return {}; throw error; }
}

async function readHistory(base, uid, token) {
  const result = await firestoreFetch(`${base}:runQuery`, token, {
    method: 'POST', body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'quizHistory' }], where: { fieldFilter: { field: { fieldPath: 'userId' }, op: 'EQUAL', value: { stringValue: uid } } }, limit: 100 } }),
  });
  return (Array.isArray(result) ? result : []).filter((row) => row.document).map((row) => ({ id: row.document.name.split('/').pop(), ...decodeFields(row.document.fields) }));
}

async function learnerData(base, uid, token) {
  const [profile, history] = await Promise.all([readProfile(base, uid, token), readHistory(base, uid, token)]);
  const attempts = [...(profile.adaptiveAttempts || [])];
  const ids = new Set(attempts.map((attempt) => attempt.attemptId));
  for (const row of history) if (Array.isArray(row.questionAnswers)) {
    const attemptId = row.adaptiveAttemptId || row.id;
    if (!ids.has(attemptId)) { attempts.push({ attemptId, answers: row.questionAnswers }); ids.add(attemptId); }
  }
  return { profile, history, attempts, answers: attempts.flatMap((attempt) => attempt.answers || []) };
}

async function runTool({ base, uid, token }, name, args) {
  if (name === 'retrieve_attempt_history') {
    const data = await learnerData(base, uid, token);
    const attempts = data.attempts.slice(-Math.min(args.limit || 20, 20)).reverse();
    return { attempts, answers: attempts.flatMap((attempt) => attempt.answers || []), revisionPlan: data.profile.revisionPlan || [], topicMastery: data.profile.topicMastery || {} };
  }
  if (name === 'identify_weak_topics') {
    const profile = await readProfile(base, uid, token);
    const savedMastery = args.answers.length ? {} : profile.topicMastery || {};
    return { topics: scoreTopics(args.answers, args.minimumAttempts || 1, savedMastery) };
  }
  if (name === 'generate_targeted_quiz') {
    const data = await learnerData(base, uid, token);
    const old = data.answers.filter((answer) => answer.topic.toLowerCase() === args.topic.toLowerCase() && answer.question && answer.correctAnswer && Array.isArray(answer.options));
    const reviews = [...new Map(old.map((answer) => [answer.question, answer])).values()].map((answer, id) => ({ id, topic: answer.topic, description: answer.question, difficulty_level: 'medium', options: answer.options.map((description, optionId) => ({ id: optionId, description, is_correct: description === answer.correctAnswer })) }));
    const local = LOCAL_QUESTIONS.filter((question) => question.topic.toLowerCase() === args.topic.toLowerCase());
    try {
      const amount = Math.min(args.amount || 10, 10);
      const context = old.slice(-3).map((answer) => `Question: ${answer.question}\nCorrect answer: ${answer.correctAnswer}`).join('\n\n');
      const prompt = `Create ${amount} original multiple-choice questions for a learner practicing "${args.topic}". Use medium difficulty and avoid repeating these prior mistakes when supplied:\n${context || 'No prior mistakes supplied.'}\nReturn only a JSON array. Every item must have description, topic, difficulty_level, and options. Each options array must contain exactly four objects with description and is_correct, with exactly one is_correct true. Keep questions and choices concise.`;
      const generated = JSON.parse(await generateGeminiText({ prompt, responseMimeType: 'application/json', maxOutputTokens: 2048 }));
      if (Array.isArray(generated) && generated.length === amount && generated.every((question) =>
        typeof question.description === 'string' && Array.isArray(question.options) && question.options.length === 4 &&
        question.options.filter((option) => option.is_correct === true).length === 1 &&
        question.options.every((option) => typeof option.description === 'string' && typeof option.is_correct === 'boolean')
      )) {
        return { topic: args.topic, questions: generated.map((question, id) => ({ ...question, id, topic: args.topic, difficulty_level: question.difficulty_level || 'medium', options: question.options.map((option, optionId) => ({ ...option, id: optionId })) })), source: 'gemini' };
      }
    } catch (error) {
      // A missing key, quota response, or malformed model answer falls back to existing local practice.
      console.info('Gemini practice generation unavailable; using stored questions.', error.code || error.message);
    }
    const pool = reviews.length ? reviews : local;
    if (!pool.length) throw new AdaptiveError('NO_TOPIC_QUESTIONS', `No focused questions are available for ${args.topic} yet.`);
    const questions = Array.from({ length: Math.min(args.amount || 10, pool.length) }, (_, index) => ({ ...pool[index % pool.length], id: index }));
    if (questions.some((question) => !question.options?.some((option) => option.is_correct))) throw new AdaptiveError('INCONSISTENT_QUIZ_OUTPUT', 'Practice questions failed consistency checks.');
    return { topic: args.topic, questions, source: reviews.length ? 'previous-mistakes' : 'built-in-question-bank' };
  }
  if (name === 'record_answers') {
    const current = { attemptId: args.attemptId, answers: args.answers, recordedAt: new Date().toISOString() };
    const profile = await readProfile(base, uid, token);
    const attempts = [...(profile.adaptiveAttempts || []).filter((attempt) => attempt.attemptId !== args.attemptId), current].slice(-20);
    await firestoreFetch(`${base}/users/${encodeURIComponent(uid)}?updateMask.fieldPaths=adaptiveAttempts`, token, { method: 'PATCH', body: JSON.stringify({ fields: { adaptiveAttempts: encodeValue(attempts) } }) });
    return { attemptId: args.attemptId, saved: true, answerCount: args.answers.length };
  }
  if (name === 'update_revision_plan') {
    const { profile, answers } = await learnerData(base, uid, token);
    const source = answers.length ? answers : args.answers;
    const topics = scoreTopics(source, 1);
    const now = Date.now();
    const revisionPlan = topics.map((topic) => ({ topic: topic.topic, mastery: topic.mastery, dueAt: now + (topic.mastery < 50 ? 1 : topic.mastery < 80 ? 3 : 7) * 86400000, intervalDays: topic.mastery < 50 ? 1 : topic.mastery < 80 ? 3 : 7 }));
    const topicMastery = Object.fromEntries(topics.map(({ topic, correct, total, mastery }) => [topic, { correct, total, mastery }]));
    await firestoreFetch(`${base}/users/${encodeURIComponent(uid)}?updateMask.fieldPaths=topicMastery&updateMask.fieldPaths=revisionPlan`, token, { method: 'PATCH', body: JSON.stringify({ fields: { topicMastery: encodeValue(topicMastery), revisionPlan: encodeValue(revisionPlan) } }) });
    return { topicMastery, revisionPlan, updatedAt: now, previousRevisionPlan: profile.revisionPlan || [] };
  }
  throw new AdaptiveError('UNKNOWN_TOOL', `Unknown adaptive tool: ${name}`);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('allow', 'POST'); return json(res, 405, { error: 'Method not allowed.' }); }
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json(res, 400, { error: 'A JSON-RPC object is required.' });
  if (body.jsonrpc !== '2.0' || typeof body.method !== 'string') return json(res, 400, { jsonrpc: '2.0', id: body.id ?? null, error: { code: -32600, message: 'Invalid JSON-RPC request.' } });
  if (body.method === 'notifications/initialized') { res.statusCode = 202; return res.end(); }
  if (body.method !== 'tools/call') {
    try { return json(res, 200, await handleMcpRequest(body, { callTool: async () => { throw new AdaptiveError('UNSUPPORTED', 'This method is not supported.'); } })); }
    catch { return json(res, 500, { error: 'MCP request failed.' }); }
  }
  try {
    const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return json(res, 401, { jsonrpc: '2.0', id: body.id ?? null, error: { code: -32001, message: 'Bearer Firebase ID token required.', data: { code: 'UNAUTHENTICATED' } } });
    const { apiKey, base } = getConfig();
    const uid = await verifyToken(token, apiKey);
    return json(res, 200, await handleMcpRequest(body, { callTool: (name, args) => runTool({ base, uid, token }, name, args) }));
  } catch (error) {
    const status = error.code === 'UNAUTHENTICATED' ? 401 : error.code === 'PERMISSION_DENIED' ? 403 : error.code === 'SERVER_NOT_CONFIGURED' ? 503 : 200;
    return json(res, status, { jsonrpc: '2.0', id: body.id ?? null, error: { code: -32000, message: error.message || 'MCP tool execution failed.', data: { code: error.code || 'INTERNAL_ERROR' } } });
  }
}
