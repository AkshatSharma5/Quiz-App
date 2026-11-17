import { runAdaptiveWorkflow, scoreTopics } from '../src/lib/adaptiveCore.js';
import process from 'node:process';

const categoryNames = ['Science & Nature', 'Computers', 'Mathematics', 'Geography', 'History'];
const cases = categoryNames.map((weakTopic, scenarioIndex) => {
  const answers = [];
  for (const topic of categoryNames) {
    const correctCount = topic === weakTopic ? 1 : (scenarioIndex % 2 ? 3 : 4);
    for (let i = 0; i < 4; i += 1) answers.push({ topic, correct: i < correctCount });
  }
  return { id: `scenario-${scenarioIndex + 1}`, weakTopic, answers };
});

const results = [];
for (const scenario of cases) {
  let successfulCalls = 0;
  const callMcp = async (request) => {
    const { name, arguments: args } = request.params;
    let structuredContent;
    if (name === 'retrieve_attempt_history') structuredContent = { answers: scenario.answers, attempts: [], revisionPlan: [] };
    if (name === 'identify_weak_topics') structuredContent = { topics: scoreTopics(args.answers) };
    if (name === 'generate_targeted_quiz') structuredContent = { topic: args.topic, questions: [{ topic: args.topic, description: 'Evaluation practice question', options: [{ description: 'Correct', is_correct: true }, { description: 'Wrong', is_correct: false }] }] };
    successfulCalls += 1;
    return { jsonrpc: '2.0', id: request.id, result: { structuredContent, isError: false } };
  };
  try {
    const workflow = await runAdaptiveWorkflow({ callMcp, request: { attemptId: scenario.id }, attemptAnswers: [{ topic: scenario.weakTopic, correct: false }] });
    const fixedRuleTopic = 'Science & Nature';
    results.push({ scenario: scenario.id, expectedWeakTopic: scenario.weakTopic, adaptiveRecommendation: workflow.selectedTopic, baselineRecommendation: fixedRuleTopic, adaptiveRelevant: workflow.selectedTopic === scenario.weakTopic, baselineRelevant: fixedRuleTopic === scenario.weakTopic, toolCalls: workflow.toolCalls, successfulToolCalls: successfulCalls, completedStages: new Set(workflow.steps.map((step) => step.stageNumber || (step.stage === 'inspect_history' ? 1 : step.stage === 'identify_weak_topic' ? 2 : step.stage === 'generate_focused_practice' ? 3 : 4))).size });
  } catch (error) {
    results.push({ scenario: scenario.id, expectedWeakTopic: scenario.weakTopic, adaptiveRecommendation: null, adaptiveRelevant: false, toolCalls: successfulCalls, successfulToolCalls: successfulCalls, completedStages: 0, error: { code: error.code || 'UNEXPECTED_ERROR', message: error.message } });
  }
}

const count = results.length;
const totals = {
  scenarios: count,
  adaptiveTopicRelevance: results.filter((result) => result.adaptiveRelevant).length / count,
  fixedRuleTopicRelevance: results.filter((result) => result.baselineRelevant).length / count,
  toolCallSuccess: results.reduce((sum, result) => sum + result.successfulToolCalls, 0) / results.reduce((sum, result) => sum + result.toolCalls, 0),
  workflowCompletion: results.filter((result) => result.completedStages === 4).length / count,
};
process.stdout.write(`${JSON.stringify({ metrics: totals, results }, null, 2)}\n`);
if (totals.adaptiveTopicRelevance < 1 || totals.toolCallSuccess < 1 || totals.workflowCompletion < 1) process.exitCode = 1;
