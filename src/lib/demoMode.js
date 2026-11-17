export const DEMO_SESSION_KEY = 'quizup.demoSession';
const DEMO_PROFILE_KEY = 'quizup.demoProfile';
const DEMO_HISTORY_KEY = 'quizup.demoQuizHistory';
const DEMO_QUIZZES_KEY = 'quizup.demoCommunityQuizzes';
const DEMO_CHALLENGES_KEY = 'quizup.demoDailyChallenges';

export const DEMO_USER = Object.freeze({
  uid: 'quizup-demo-local',
  email: 'user',
  displayName: 'Demo User',
  photoURL: null,
  isDemo: true,
});

export function matchesDemoCredentials(username, password) {
  return typeof username === 'string' && username.trim().toLowerCase() === 'user' && password === '1234';
}

export function createDemoProfile() {
  return {
    displayName: 'Demo User', email: 'user', photoURL: null,
    totalQuizzes: 0, totalScore: 0, correctAnswers: 0, totalQuestions: 0,
    currentStreak: 0, longestStreak: 0, lastPlayedAt: null,
    xp: 0, level: 1, achievements: [], badges: [], quizzesCreated: 0,
    favoriteCategories: [],
  };
}

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
  catch { return fallback; }
}

function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

export function getDemoProfile() { return { ...createDemoProfile(), ...read(DEMO_PROFILE_KEY, {}) }; }
export function saveDemoProfile(profile) { write(DEMO_PROFILE_KEY, profile); }
export function getDemoQuizHistory() { return read(DEMO_HISTORY_KEY, []); }
export function saveDemoQuizResult(result) {
  const history = getDemoQuizHistory();
  history.unshift({ ...result, id: result.id || `demo-${Date.now()}`, completedAt: Date.now() });
  write(DEMO_HISTORY_KEY, history.slice(0, 100));
}
export function getDemoCommunityQuizzes() { return read(DEMO_QUIZZES_KEY, []); }
export function saveDemoCommunityQuiz(quiz) {
  const quizzes = getDemoCommunityQuizzes();
  quizzes.unshift(quiz);
  write(DEMO_QUIZZES_KEY, quizzes.slice(0, 100));
}
export function deleteDemoCommunityQuiz(id) { write(DEMO_QUIZZES_KEY, getDemoCommunityQuizzes().filter((quiz) => quiz.id !== id)); }
export function updateDemoCommunityQuiz(id, update) {
  write(DEMO_QUIZZES_KEY, getDemoCommunityQuizzes().map((quiz) => quiz.id === id ? { ...quiz, ...update } : quiz));
}
export function incrementDemoQuizPlay(id, score) {
  write(DEMO_QUIZZES_KEY, getDemoCommunityQuizzes().map((quiz) => quiz.id === id ? { ...quiz, plays: (quiz.plays || 0) + 1, totalScore: (quiz.totalScore || 0) + score } : quiz));
}
export function isDemoDailyChallengeComplete(date = new Date().toDateString()) {
  return Boolean(read(DEMO_CHALLENGES_KEY, {})[date]);
}
export function completeDemoDailyChallenge(date = new Date().toDateString(), details = {}) {
  write(DEMO_CHALLENGES_KEY, { ...read(DEMO_CHALLENGES_KEY, {}), [date]: { completed: true, ...details } });
}
