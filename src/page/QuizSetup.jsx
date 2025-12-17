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
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-sky-100 to-emerald-100 p-4 md:p-8">
      <Toaster position="top-center" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-transparent bg-clip-text mb-2">
            Quiz Setup
          </h1>
          <p className="text-gray-600">Customize your quiz experience</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Category Selection */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-white/20">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📚 Category
            </h2>
            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2">
              {QUIZ_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setConfig(prev => ({ ...prev, category: category.id }))}
                  className={`p-3 rounded-lg text-left transition-all text-sm ${
                    config.category === category.id
                      ? 'bg-indigo-500 text-white shadow-lg scale-[1.02]'
                      : 'bg-gray-50 hover:bg-indigo-50'
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-white/20">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              🎯 Difficulty
            </h2>
            <div className="space-y-3">
              {DIFFICULTY_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setConfig(prev => ({ ...prev, difficulty: level.id }))}
                  className={`w-full p-4 rounded-lg text-left transition-all flex items-center justify-between ${
                    config.difficulty === level.id
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'bg-gray-50 hover:bg-indigo-50'
                  }`}
                >
                  <span className="font-medium">{level.name}</span>
                  {level.points && (
                    <span className={`px-2 py-1 rounded text-xs ${
                      config.difficulty === level.id ? 'bg-white/20' : level.color + ' text-white'
                    }`}>
                      +{level.points} pts
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-white/20">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              🔢 Number of Questions
            </h2>
            <div className="flex flex-wrap gap-3">
              {[5, 10, 15, 20, 25].map((num) => (
                <button
                  key={num}
                  onClick={() => setConfig(prev => ({ ...prev, amount: num }))}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    config.amount === num
                      ? 'bg-indigo-500 text-white shadow-lg scale-105'
                      : 'bg-gray-50 hover:bg-indigo-50'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            <h2 className="text-xl font-semibold mt-6 mb-4 flex items-center gap-2">
              ⏱️ Time Per Question
            </h2>
            <div className="flex flex-wrap gap-3">
              {[10, 15, 20, 30].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setConfig(prev => ({ ...prev, timePerQuestion: sec }))}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                    config.timePerQuestion === sec
                      ? 'bg-indigo-500 text-white shadow-lg scale-105'
                      : 'bg-gray-50 hover:bg-indigo-50'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* Quiz Mode */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-white/20">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              🎮 Quiz Mode
            </h2>
            <div className="space-y-3">
              {QUIZ_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setConfig(prev => ({ ...prev, mode: mode.id }))}
                  className={`w-full p-4 rounded-lg text-left transition-all ${
                    config.mode === mode.id
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'bg-gray-50 hover:bg-indigo-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{mode.icon}</span>
                    <span className="font-semibold">{mode.name}</span>
                  </div>
                  <p className={`text-sm mt-1 ${
                    config.mode === mode.id ? 'text-white/80' : 'text-gray-500'
                  }`}>
                    {mode.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary & Start Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-white/20"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                {getCategoryIcon(config.category)} {QUIZ_CATEGORIES.find(c => c.id === config.category)?.name}
              </span>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">
                {config.difficulty || 'Any'} Difficulty
              </span>
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                {config.amount} Questions
              </span>
              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
                {config.timePerQuestion}s per question
              </span>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                {QUIZ_MODES.find(m => m.id === config.mode)?.icon} {QUIZ_MODES.find(m => m.id === config.mode)?.name}
              </span>
            </div>

            <Button
              onClick={handleStartQuiz}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:scale-105 transition-all"
            >
              Start Quiz! 🚀
            </Button>
          </div>
        </motion.div>

        {!user && (
          <p className="text-center text-gray-500 mt-4 text-sm">
            💡 Sign in to save your progress and compete on the leaderboard!
          </p>
        )}
      </motion.div>
    </div>
  );
}
