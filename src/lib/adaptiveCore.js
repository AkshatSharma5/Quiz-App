/** @typedef {{ topic: string, correct: boolean, answeredAt?: number }} TopicAnswer */
/** @typedef {{ topic: string, correct: number, total: number, mastery: number }} TopicMastery */

export const ADAPTIVE_LIMITS = Object.freeze({ toolCalls: 6, steps: 4, retries: 1, history: 20, questions: 10 });

const stringSchema = { type: 'string', minLength: 1, maxLength: 120 };
const answerSchema = {
  type: 'object',
  properties: {
    topic: stringSchema,
    correct: { type: 'boolean' },
    questionId: { type: 'string', maxLength: 160 },
    question: { type: 'string', maxLength: 300 },
    correctAnswer: { type: 'string', maxLength: 300 },
    options: { type: 'array', maxItems: 4, items: { type: 'string', maxLength: 200 } },
  },
  required: ['topic', 'correct'],
  additionalProperties: false,
};
export const MCP_TOOLS = Object.freeze([
  { name: 'retrieve_attempt_history', description: 'Retrieve recent quiz attempts for the signed-in learner.', inputSchema: { type: 'object', properties: { limit: { type: 'integer', minimum: 1, maximum: 20 } }, additionalProperties: false } },
  { name: 'identify_weak_topics', description: 'Rank topics by observed accuracy and mastery.', inputSchema: { type: 'object', properties: { answers: { type: 'array', maxItems: 1000, items: answerSchema }, minimumAttempts: { type: 'integer', minimum: 1, maximum: 20 } }, required: ['answers'], additionalProperties: false } },
  { name: 'generate_targeted_quiz', description: 'Create focused practice questions for a weak topic.', inputSchema: { type: 'object', properties: { topic: stringSchema, amount: { type: 'integer', minimum: 1, maximum: 10 } }, required: ['topic'], additionalProperties: false } },
  { name: 'record_answers', description: 'Persist an attempt and its per-question outcomes.', inputSchema: { type: 'object', properties: { attemptId: { type: 'string', minLength: 1, maxLength: 100 }, answers: { type: 'array', minItems: 1, maxItems: 25, items: answerSchema } }, required: ['attemptId', 'answers'], additionalProperties: false } },
  { name: 'update_revision_plan', description: 'Update topic mastery and schedule review for weak topics.', inputSchema: { type: 'object', properties: { answers: { type: 'array', maxItems: 500, items: answerSchema } }, required: ['answers'], additionalProperties: false } },
]);

export function validateToolInput(name, input) {
  const tool = MCP_TOOLS.find((entry) => entry.name === name);
  if (!tool) throw new AdaptiveError('UNKNOWN_TOOL', `Unknown tool: ${name}`);
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new AdaptiveError('INVALID_ARGUMENTS', 'Tool arguments must be an object.');
  const { properties, required = [], additionalProperties } = tool.inputSchema;
  for (const key of required) if (!(key in input)) throw new AdaptiveError('INVALID_ARGUMENTS', `Missing required argument: ${key}`);
  if (!additionalProperties) for (const key of Object.keys(input)) if (!(key in properties)) throw new AdaptiveError('INVALID_ARGUMENTS', `Unexpected argument: ${key}`);
  for (const [key, value] of Object.entries(input)) {
    const schema = properties[key];
    if (!schema) continue;
    if (schema.type === 'string' && (typeof value !== 'string' || value.trim().length < (schema.minLength || 0) || value.length > (schema.maxLength || Infinity))) throw new AdaptiveError('INVALID_ARGUMENTS', `${key} must be a string within the allowed length.`);
    if (schema.type === 'integer' && (!Number.isInteger(value) || value < (schema.minimum ?? -Infinity) || value > (schema.maximum ?? Infinity))) throw new AdaptiveError('INVALID_ARGUMENTS', `${key} must be an integer within the allowed range.`);
    if (schema.type === 'array' && (!Array.isArray(value) || value.length < (schema.minItems || 0) || value.length > (schema.maxItems ?? Infinity))) throw new AdaptiveError('INVALID_ARGUMENTS', `${key} must be an array within the allowed size.`);
    if (schema.type === 'array' && schema.items?.type === 'object' && value.some((item) => !item || typeof item !== 'object' || Array.isArray(item) || (schema.items.additionalProperties === false && Object.keys(item).some((field) => !(field in schema.items.properties))) || Object.entries(schema.items.properties || {}).some(([field, fieldSchema]) => field in item && fieldSchema.type === 'string' && (typeof item[field] !== 'string' || item[field].length > fieldSchema.maxLength)))) throw new AdaptiveError('INVALID_ARGUMENTS', `${key} contains a malformed item or text value that is too long.`);
    if (schema.type === 'array' && schema.items?.type === 'object' && value.some((item) => item.options && (!Array.isArray(item.options) || item.options.length > schema.items.properties.options.maxItems || item.options.some((option) => typeof option !== 'string' || option.length > 200)))) throw new AdaptiveError('INVALID_ARGUMENTS', `${key} contains invalid answer options.`);
  }
  if (name === 'identify_weak_topics' || name === 'update_revision_plan') {
    const answers = input.answers;
    if (answers && answers.some((answer) => !isValidAnswer(answer))) throw new AdaptiveError('INVALID_ARGUMENTS', 'Each answer needs a topic and a boolean correct value.');
  }
  if (name === 'record_answers' && input.answers.some((answer) => !isValidAnswer(answer))) throw new AdaptiveError('INVALID_ARGUMENTS', 'Each answer needs a topic and a boolean correct value.');
  return input;
}

function isValidAnswer(answer) {
  return answer && typeof answer === 'object' && typeof answer.topic === 'string' && answer.topic.trim().length > 0 && answer.topic.length <= 120 && typeof answer.correct === 'boolean';
}

export function scoreTopics(answers, minimumAttempts = 1, existingMastery = {}) {
  if (!Array.isArray(answers)) throw new AdaptiveError('INVALID_ARGUMENTS', 'Answers must be an array.');
  const stats = new Map();
  for (const answer of answers) {
    if (!isValidAnswer(answer)) throw new AdaptiveError('INVALID_ARGUMENTS', 'Malformed topic answer.');
    const topic = answer.topic.trim();
    const row = stats.get(topic) || { topic, correct: 0, total: 0 };
    row.total += 1;
    if (answer.correct) row.correct += 1;
    stats.set(topic, row);
  }
  for (const [topic, saved] of Object.entries(existingMastery || {})) {
    if (!saved || !Number.isFinite(saved.correct) || !Number.isFinite(saved.total) || saved.total <= 0) continue;
    const row = stats.get(topic) || { topic, correct: 0, total: 0 };
    row.correct += saved.correct;
    row.total += saved.total;
    stats.set(topic, row);
  }
  return [...stats.values()].map((row) => ({ ...row, mastery: Math.round((row.correct / row.total) * 100) }))
    .filter((row) => row.total >= minimumAttempts)
    .sort((a, b) => a.mastery - b.mastery || b.total - a.total || a.topic.localeCompare(b.topic));
}

export class AdaptiveError extends Error {
  constructor(code, message, cause) { super(message, { cause }); this.name = 'AdaptiveError'; this.code = code; }
}

/** MCP-compatible JSON-RPC request handler, used by the app's adaptive workflow. */
export async function handleMcpRequest(request, context) {
  if (!request || request.jsonrpc !== '2.0' || !('method' in request)) return rpcError(request?.id ?? null, -32600, 'Invalid JSON-RPC request.');
  if (request.method !== 'notifications/initialized' && !('id' in request)) return rpcError(null, -32600, 'JSON-RPC requests require an id.');
  if (request.method === 'initialize') return { jsonrpc: '2.0', id: request.id, result: { protocolVersion: '2024-11-05', capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'quizup-adaptive-learning', version: '1.0.0' } } };
  if (request.method === 'notifications/initialized') return null;
  if (request.method === 'ping') return { jsonrpc: '2.0', id: request.id, result: {} };
  if (request.method === 'tools/list') return { jsonrpc: '2.0', id: request.id, result: { tools: MCP_TOOLS } };
  if (request.method !== 'tools/call') return rpcError(request.id ?? null, -32601, 'Method not found.');
  try {
    const { name, arguments: args = {} } = request.params || {};
    validateToolInput(name, args);
    const result = await context.callTool(name, args);
    return { jsonrpc: '2.0', id: request.id, result: { content: [{ type: 'text', text: JSON.stringify(result) }], structuredContent: result, isError: false } };
  } catch (error) {
    return { jsonrpc: '2.0', id: request.id, result: { content: [{ type: 'text', text: error.message || 'Tool execution failed.' }], isError: true, error: { code: error.code || 'TOOL_EXECUTION_FAILED' } } };
  }
}

function rpcError(id, code, message) { return { jsonrpc: '2.0', id, error: { code, message } }; }

/** Run a bounded four-stage workflow through the MCP JSON-RPC tool surface. */
export async function runAdaptiveWorkflow({ request, callMcp, targetTopic, attemptAnswers, limits: requestedLimits = ADAPTIVE_LIMITS }) {
  const limits = {
    toolCalls: Math.max(1, Math.min(ADAPTIVE_LIMITS.toolCalls, requestedLimits.toolCalls || ADAPTIVE_LIMITS.toolCalls)),
    steps: Math.max(1, Math.min(ADAPTIVE_LIMITS.steps, requestedLimits.steps || ADAPTIVE_LIMITS.steps)),
    retries: Math.max(0, Math.min(ADAPTIVE_LIMITS.retries, requestedLimits.retries ?? ADAPTIVE_LIMITS.retries)),
  };
  const steps = [];
  let calls = 0;
  const logicalStages = new Set();
  const invoke = async (name, args, stage) => {
    if (calls >= limits.toolCalls) throw new AdaptiveError('TOOL_BUDGET_EXHAUSTED', 'Adaptive workflow reached its tool-call limit.');
    const stageNumber = stage === 'inspect_history' ? 1 : stage === 'identify_weak_topic' ? 2 : stage === 'generate_focused_practice' ? 3 : 4;
    if (!logicalStages.has(stageNumber) && logicalStages.size >= limits.steps) throw new AdaptiveError('STEP_LIMIT_EXHAUSTED', 'Adaptive workflow reached its step limit.');
    logicalStages.add(stageNumber);
    steps.push({ stage, tool: name, status: 'running' });
    for (let retry = 0; retry <= limits.retries; retry += 1) {
      if (calls >= limits.toolCalls) throw new AdaptiveError('TOOL_BUDGET_EXHAUSTED', 'Adaptive workflow reached its tool-call limit.');
      calls += 1;
      try {
        const response = await callMcp({ jsonrpc: '2.0', id: calls, method: 'tools/call', params: { name, arguments: args } });
        if (response?.result?.isError) throw new AdaptiveError(response.result.error?.code || 'TOOL_EXECUTION_FAILED', response.result.content?.[0]?.text || 'Tool execution failed.');
        steps[steps.length - 1].status = 'completed';
        steps[steps.length - 1].retries = retry;
        return response.result.structuredContent;
      } catch (error) {
        if (retry < limits.retries && calls < limits.toolCalls) continue;
        steps[steps.length - 1].status = 'failed';
        steps[steps.length - 1].retries = retry;
        steps[steps.length - 1].error = { code: error.code || 'TOOL_EXECUTION_FAILED', message: error.message };
        throw error;
      }
    }
  };
  try {
    const history = await invoke('retrieve_attempt_history', { limit: ADAPTIVE_LIMITS.history }, 'inspect_history');
    const observed = [...(history.answers || []), ...(attemptAnswers || [])];
    const analysis = await invoke('identify_weak_topics', { answers: observed, minimumAttempts: 1 }, 'identify_weak_topic');
    const weak = Array.isArray(analysis?.topics) ? analysis.topics : [];
    const selected = targetTopic ? (weak.find((topic) => topic.topic === targetTopic) || { topic: targetTopic, mastery: 0, total: 0, correct: 0 }) : weak[0] || null;
    if (!selected) return { history, weakTopics: weak, quiz: [], selectedTopic: null, revisionPlan: history.revisionPlan || [], steps, toolCalls: calls };
    const quiz = await invoke('generate_targeted_quiz', { topic: selected.topic, amount: ADAPTIVE_LIMITS.questions }, 'generate_focused_practice');
    if (!Array.isArray(quiz?.questions) || !quiz.questions.length || quiz.questions.some((question) => !Array.isArray(question.options) || question.options.filter((option) => option.is_correct === true).length !== 1)) {
      const error = new AdaptiveError('INCONSISTENT_QUIZ_OUTPUT', 'Generated practice questions must each contain exactly one correct option.');
      steps[steps.length - 1].status = 'failed';
      steps[steps.length - 1].error = { code: error.code, message: error.message };
      throw error;
    }
    let revisionPlan = history.revisionPlan || [];
    if (Array.isArray(attemptAnswers) && attemptAnswers.length) {
      await invoke('record_answers', { attemptId: request?.attemptId, answers: attemptAnswers }, 'record_submitted_answers');
      revisionPlan = await invoke('update_revision_plan', { answers: [...observed] }, 'update_mastery_and_revision');
    }
    return { history, weakTopics: weak, selectedTopic: selected.topic, quiz, revisionPlan, steps, toolCalls: calls };
  } catch (error) {
    error.workflow = { toolCalls: calls, steps: [...steps] };
    throw error;
  }
}
