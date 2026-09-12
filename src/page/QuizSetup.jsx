import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Toaster, toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { QUIZ_CATEGORIES, DIFFICULTY_LEVELS, QUIZ_MODES } from '@/data/quizData';
import { useAuth } from '@/context/AuthContext';

export default function QuizSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [config, setConfig] = useState({
    category: 0,
    difficulty: '',
    amount: 10,
    mode: 'classic',
    timePerQuestion: 15
  });

  const handleStartQuiz = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    toast.success("Let's go! 🚀");
    
    // Store config in sessionStorage for the Quiz page
    sessionStorage.setItem('quizConfig', JSON.stringify(config));
    navigate('/quiz');
  };

  const getCategoryIcon = (id) => {
    const category = QUIZ_CATEGORIES.find(c => c.id === id);
    return category ? category.icon : '🎲';
  };

  return (
    <div className="min-h-[92vh] p-4 md:p-8">
      <Toaster position="top-center" toastOptions={{ style: { background: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-color)' } }} />
      
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--text-main)] mb-2 title-glow">
            QUIZ SETUP.
          </h1>
          <p className="text-[var(--text-muted)] font-medium">Customize your quiz experience</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Category Selection */}
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
              📚 Category
            </h2>
            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
              {QUIZ_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setConfig(prev => ({ ...prev, category: category.id }))}
                  className={`p-4 rounded-xl text-left transition-all text-sm font-bold flex items-center border ${
                    config.category === category.id
                      ? 'bg-[var(--text-main)] text-[var(--bg-surface)] border-[var(--text-main)] scale-[1.02]'
                      : 'bg-[var(--bg-base)] text-[var(--text-main)] border-[var(--border-color)] hover:border-[#00A63E] dark:hover:border-[#39FF14]'
                  }`}
                >
                  <span className="mr-2 text-lg">{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
              🎯 Difficulty
            </h2>
            <div className="space-y-3">
              {DIFFICULTY_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setConfig(prev => ({ ...prev, difficulty: level.id }))}
                  className={`w-full p-4 rounded-xl text-left transition-all flex items-center justify-between border font-bold ${
                    config.difficulty === level.id
                      ? 'bg-[var(--text-main)] text-[var(--bg-surface)] border-[var(--text-main)] scale-[1.02]'
                      : 'bg-[var(--bg-base)] text-[var(--text-main)] border-[var(--border-color)] hover:border-[#00A63E] dark:hover:border-[#39FF14]'
                  }`}
                >
                  <span>{level.name}</span>
                  {level.points && (
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      config.difficulty === level.id ? 'bg-[var(--bg-surface)] text-[var(--text-main)]' : 'bg-[var(--text-main)] text-[var(--bg-surface)]'
                    }`}>
                      +{level.points} pts
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
              🔢 Number of Questions
            </h2>
            <div className="flex flex-wrap gap-3">
              {[5, 10, 15, 20, 25].map((num) => (
                <button
                  key={num}
                  onClick={() => setConfig(prev => ({ ...prev, amount: num }))}
                  className={`px-5 py-3 rounded-xl font-bold transition-all border ${
                    config.amount === num
                      ? 'bg-[var(--text-main)] text-[var(--bg-surface)] border-[var(--text-main)] scale-105'
                      : 'bg-[var(--bg-base)] text-[var(--text-main)] border-[var(--border-color)] hover:border-[#00A63E] dark:hover:border-[#39FF14]'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            <h2 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mt-8 mb-4 flex items-center gap-2">
              ⏱️ Time Per Question
            </h2>
            <div className="flex flex-wrap gap-3">
              {[10, 15, 20, 30].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setConfig(prev => ({ ...prev, timePerQuestion: sec }))}
                  className={`px-5 py-3 rounded-xl font-bold transition-all border ${
                    config.timePerQuestion === sec
                      ? 'bg-[var(--text-main)] text-[var(--bg-surface)] border-[var(--text-main)] scale-105'
                      : 'bg-[var(--bg-base)] text-[var(--text-main)] border-[var(--border-color)] hover:border-[#00A63E] dark:hover:border-[#39FF14]'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* Quiz Mode */}
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
              🎮 Quiz Mode
            </h2>
            <div className="space-y-3">
              {QUIZ_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setConfig(prev => ({ ...prev, mode: mode.id }))}
                  className={`w-full p-4 rounded-xl text-left transition-all border ${
                    config.mode === mode.id
                      ? 'bg-[var(--text-main)] text-[var(--bg-surface)] border-[var(--text-main)] scale-[1.02]'
                      : 'bg-[var(--bg-base)] text-[var(--text-main)] border-[var(--border-color)] hover:border-[#00A63E] dark:hover:border-[#39FF14]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{mode.icon}</span>
                    <div>
                      <div className="font-bold">{mode.name}</div>
                      <div className={`text-xs mt-1 font-medium ${
                        config.mode === mode.id ? 'text-[var(--bg-surface)] opacity-80' : 'text-[var(--text-muted)]'
                      }`}>
                        {mode.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary & Start Button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 glass-panel rounded-3xl p-6 border border-[#00A63E] dark:border-[#39FF14]"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 text-sm font-bold">
              <span className="bg-[var(--text-main)] text-[var(--bg-surface)] px-3 py-1.5 rounded-full">
                {getCategoryIcon(config.category)} {QUIZ_CATEGORIES.find(c => c.id === config.category)?.name}
              </span>
              <span className="bg-[var(--bg-base)] border border-[var(--border-color)] text-[var(--text-main)] px-3 py-1.5 rounded-full">
                {config.difficulty || 'Any'} Diff
              </span>
              <span className="bg-[var(--bg-base)] border border-[var(--border-color)] text-[var(--text-main)] px-3 py-1.5 rounded-full">
                {config.amount} Qs
              </span>
              <span className="bg-[var(--bg-base)] border border-[var(--border-color)] text-[var(--text-main)] px-3 py-1.5 rounded-full">
                {config.timePerQuestion}s/Q
              </span>
              <span className="bg-[var(--bg-base)] border border-[var(--border-color)] text-[#00A63E] dark:text-[#39FF14] px-3 py-1.5 rounded-full">
                {QUIZ_MODES.find(m => m.id === config.mode)?.icon} {QUIZ_MODES.find(m => m.id === config.mode)?.name}
              </span>
            </div>

            <button
              onClick={handleStartQuiz}
              className="btn-primary px-10 py-4 text-lg w-full md:w-auto flex items-center justify-center gap-2 font-extrabold"
            >
              START QUIZ 🚀
            </button>
          </div>
        </motion.div>

        {!user && (
          <p className="text-center text-[var(--text-muted)] font-medium mt-6 text-sm">
            Sign in to save your progress and compete on the leaderboard.
          </p>
        )}
      </motion.div>
    </div>
  );
}
