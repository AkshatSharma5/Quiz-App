// Achievement definitions for the Quiz App
export const ACHIEVEMENTS = [
  // Beginner Achievements
  {
    id: 'first_quiz',
    name: 'First Steps',
    description: 'Complete your first quiz',
    icon: '🎯',
    xp: 50,
    condition: (profile) => profile.totalQuizzes >= 1
  },
  {
    id: 'quiz_5',
    name: 'Getting Started',
    description: 'Complete 5 quizzes',
    icon: '📚',
    xp: 100,
    condition: (profile) => profile.totalQuizzes >= 5
  },
  {
    id: 'quiz_25',
    name: 'Quiz Enthusiast',
    description: 'Complete 25 quizzes',
    icon: '🎓',
    xp: 250,
    condition: (profile) => profile.totalQuizzes >= 25
  },
  {
    id: 'quiz_100',
    name: 'Quiz Master',
    description: 'Complete 100 quizzes',
    icon: '👑',
    xp: 500,
    condition: (profile) => profile.totalQuizzes >= 100
  },

  // Score Achievements
  {
    id: 'score_50',
    name: 'Rising Star',
    description: 'Reach a total score of 50',
    icon: '⭐',
    xp: 75,
    condition: (profile) => profile.totalScore >= 50
  },
  {
    id: 'score_250',
    name: 'High Achiever',
    description: 'Reach a total score of 250',
    icon: '🌟',
    xp: 200,
    condition: (profile) => profile.totalScore >= 250
  },
  {
    id: 'score_1000',
    name: 'Score Legend',
    description: 'Reach a total score of 1000',
    icon: '💫',
    xp: 500,
    condition: (profile) => profile.totalScore >= 1000
  },

  // Accuracy Achievements
  {
    id: 'perfect_score',
    name: 'Perfectionist',
    description: 'Get 100% on any quiz',
    icon: '💯',
    xp: 200,
    requiresQuizResult: true
  },
  {
    id: 'accuracy_80',
    name: 'Sharp Mind',
    description: 'Maintain 80%+ overall accuracy',
    icon: '🧠',
    xp: 300,
    condition: (profile) => {
      if (profile.totalQuestions === 0) return false;
      return (profile.correctAnswers / profile.totalQuestions) * 100 >= 80;
    }
  },

  // Streak Achievements
  {
    id: 'streak_3',
    name: 'On Fire',
    description: 'Maintain a 3-day streak',
    icon: '🔥',
    xp: 100,
    condition: (profile) => profile.currentStreak >= 3
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    xp: 300,
    condition: (profile) => profile.currentStreak >= 7
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: '🏆',
    xp: 1000,
    condition: (profile) => profile.currentStreak >= 30
  },

  // Level Achievements
  {
    id: 'level_5',
    name: 'Leveling Up',
    description: 'Reach level 5',
    icon: '📈',
    xp: 150,
    condition: (profile) => profile.level >= 5
  },
  {
    id: 'level_10',
    name: 'Double Digits',
    description: 'Reach level 10',
    icon: '🚀',
    xp: 400,
    condition: (profile) => profile.level >= 10
  },
  {
    id: 'level_25',
    name: 'Elite Player',
    description: 'Reach level 25',
    icon: '💎',
    xp: 1000,
    condition: (profile) => profile.level >= 25
  },

  // Question Achievements
  {
    id: 'questions_100',
    name: 'Century',
    description: 'Answer 100 questions correctly',
    icon: '💪',
    xp: 200,
    condition: (profile) => profile.correctAnswers >= 100
  },
  {
    id: 'questions_500',
    name: 'Knowledge Seeker',
    description: 'Answer 500 questions correctly',
    icon: '📖',
    xp: 500,
    condition: (profile) => profile.correctAnswers >= 500
  },
  {
    id: 'questions_1000',
    name: 'Knowledge Master',
    description: 'Answer 1000 questions correctly',
    icon: '🎖️',
    xp: 1000,
    condition: (profile) => profile.correctAnswers >= 1000
  },

  // Creator Achievements
  {
    id: 'first_quiz_created',
    name: 'Quiz Creator',
    description: 'Create your first quiz',
    icon: '✏️',
    xp: 100,
    condition: (profile) => profile.quizzesCreated >= 1
  },
  {
    id: 'quiz_creator_5',
    name: 'Content Creator',
    description: 'Create 5 quizzes',
    icon: '🎨',
    xp: 300,
    condition: (profile) => profile.quizzesCreated >= 5
  },

  // Special Achievements
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete a quiz before 8 AM',
    icon: '🌅',
    xp: 150,
    requiresSpecialCheck: true
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Complete a quiz after 11 PM',
    icon: '🦉',
    xp: 150,
    requiresSpecialCheck: true
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete a quiz in under 60 seconds',
    icon: '⚡',
    xp: 200,
    requiresQuizResult: true
  }
];

// Category definitions for OpenTDB API
export const QUIZ_CATEGORIES = [
  { id: 0, name: 'Any Category', icon: '🎲' },
  { id: 9, name: 'General Knowledge', icon: '📚' },
  { id: 10, name: 'Books', icon: '📖' },
  { id: 11, name: 'Film', icon: '🎬' },
  { id: 12, name: 'Music', icon: '🎵' },
  { id: 13, name: 'Musicals & Theatres', icon: '🎭' },
  { id: 14, name: 'Television', icon: '📺' },
  { id: 15, name: 'Video Games', icon: '🎮' },
  { id: 16, name: 'Board Games', icon: '🎲' },
  { id: 17, name: 'Science & Nature', icon: '🔬' },
  { id: 18, name: 'Computers', icon: '💻' },
  { id: 19, name: 'Mathematics', icon: '🔢' },
  { id: 20, name: 'Mythology', icon: '🏛️' },
  { id: 21, name: 'Sports', icon: '⚽' },
  { id: 22, name: 'Geography', icon: '🌍' },
  { id: 23, name: 'History', icon: '📜' },
  { id: 24, name: 'Politics', icon: '🏛️' },
  { id: 25, name: 'Art', icon: '🎨' },
  { id: 26, name: 'Celebrities', icon: '⭐' },
  { id: 27, name: 'Animals', icon: '🐾' },
  { id: 28, name: 'Vehicles', icon: '🚗' },
  { id: 29, name: 'Comics', icon: '💥' },
  { id: 30, name: 'Gadgets', icon: '📱' },
  { id: 31, name: 'Anime & Manga', icon: '🎌' },
  { id: 32, name: 'Cartoon & Animations', icon: '🎪' }
];

// Difficulty levels
export const DIFFICULTY_LEVELS = [
  { id: '', name: 'Any Difficulty', color: 'bg-gray-500' },
  { id: 'easy', name: 'Easy', color: 'bg-green-500', points: 3 },
  { id: 'medium', name: 'Medium', color: 'bg-yellow-500', points: 4 },
  { id: 'hard', name: 'Hard', color: 'bg-red-500', points: 5 }
];

// Quiz modes
export const QUIZ_MODES = [
  { 
    id: 'classic', 
    name: 'Classic', 
    description: 'Standard quiz with lives and hints',
    icon: '🎮'
  },
  { 
    id: 'speed', 
    name: 'Speed Run', 
    description: 'Race against time - 5 seconds per question!',
    icon: '⚡'
  },
  { 
    id: 'survival', 
    name: 'Survival', 
    description: 'Only 1 life - how far can you go?',
    icon: '💀'
  },
  { 
    id: 'practice', 
    name: 'Practice', 
    description: 'No timer, no lives - just learning',
    icon: '📝'
  }
];
