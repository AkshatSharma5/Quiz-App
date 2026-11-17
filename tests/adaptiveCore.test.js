import test from 'node:test';
import assert from 'node:assert/strict';
import { AdaptiveError, handleMcpRequest, runAdaptiveWorkflow, scoreTopics, validateToolInput } from '../src/lib/adaptiveCore.js';

const answer = (topic, correct) => ({ topic, correct });
const question = (topic) => ({ topic, description: `${topic} practice`, options: [{ description: 'Correct', is_correct: true }, { description: 'Wrong', is_correct: false }] });

function mockMcp({ answers = [], onGenerate } = {}) {
  return async (request) => {
    const { name, arguments: args } = request.params;
    let value;
    if (name === 'retrieve_attempt_history') value = { answers, attempts: [], revisionPlan: [] };
    if (name === 'identify_weak_topics') value = { topics: scoreTopics(args.answers) };
    if (name === 'generate_targeted_quiz') value = onGenerate ? onGenerate(args) : { topic: args.topic, questions: [question(args.topic)] };
    if (name === 'record_answers') value = { saved: true, answerCount: args.answers.length };
    if (name === 'update_revision_plan') value = { revisionPlan: [] };
    return { jsonrpc: '2.0', id: request.id, result: { structuredContent: value, isError: false } };
  };
}

test('missing history gives a safe empty adaptive result', async () => {
  const result = await runAdaptiveWorkflow({ callMcp: mockMcp() });
  assert.equal(result.selectedTopic, null);
  assert.deepEqual(result.quiz, []);
  assert.equal(result.toolCalls, 2);
});

test('malformed tool arguments fail schema validation', () => {
  assert.throws(() => validateToolInput('record_answers', { attemptId: '', answers: [{ topic: 'Science', correct: 'false' }] }), { code: 'INVALID_ARGUMENTS' });
  assert.throws(() => validateToolInput('identify_weak_topics', { answers: [{ topic: '', correct: false }] }), { code: 'INVALID_ARGUMENTS' });
});

test('failed tool execution retains a diagnosable workflow trace', async () => {
  const callMcp = async (request) => {
    if (request.params.name === 'retrieve_attempt_history') return { result: { structuredContent: { answers: [] } } };
    throw new AdaptiveError('SIMULATED_FAILURE', 'simulated tool outage');
  };
  await assert.rejects(runAdaptiveWorkflow({ callMcp }), (error) => {
    assert.equal(error.code, 'SIMULATED_FAILURE');
    assert.equal(error.workflow.steps[1].status, 'failed');
    assert.equal(error.workflow.steps[1].error.code, 'SIMULATED_FAILURE');
    return true;
  });
});

test('repeated incorrect answers lower mastery without producing invalid values', () => {
  const topics = scoreTopics([answer('Mathematics', false), answer('Mathematics', false), answer('Mathematics', false)]);
  assert.equal(topics[0].topic, 'Mathematics');
  assert.equal(topics[0].mastery, 0);
  assert.equal(topics[0].total, 3);
});

test('inconsistent generated questions are rejected before workflow completion', async () => {
  const callMcp = mockMcp({ answers: [answer('Science', false)], onGenerate: () => ({ questions: [{ options: [{ description: 'a', is_correct: true }, { description: 'b', is_correct: true }] }] }) });
  await assert.rejects(runAdaptiveWorkflow({ callMcp }), { code: 'INCONSISTENT_QUIZ_OUTPUT' });
});

test('retry limit is bounded and reported when tool calls keep failing', async () => {
  let calls = 0;
  await assert.rejects(runAdaptiveWorkflow({ callMcp: async () => { calls += 1; throw new AdaptiveError('OUTAGE', 'offline'); }, limits: { retries: 1 } }), (error) => {
    assert.equal(error.code, 'OUTAGE');
    assert.equal(error.workflow.steps[0].retries, 1);
    assert.equal(calls, 2);
    return true;
  });
});

test('MCP JSON-RPC exposes the declared tools and returns structured validation errors', async () => {
  const listed = await handleMcpRequest({ jsonrpc: '2.0', id: 1, method: 'tools/list' }, {});
  assert.deepEqual(listed.result.tools.map((tool) => tool.name), ['retrieve_attempt_history', 'identify_weak_topics', 'generate_targeted_quiz', 'record_answers', 'update_revision_plan']);
  const badCall = await handleMcpRequest({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'record_answers', arguments: {} } }, { callTool: async () => null });
  assert.equal(badCall.result.isError, true);
  assert.equal(badCall.result.error.code, 'INVALID_ARGUMENTS');
});
