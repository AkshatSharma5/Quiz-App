import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, query, orderBy, getDocs, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { FaSearch, FaPlay, FaStar, FaUsers, FaFilter } from 'react-icons/fa';
import { QUIZ_CATEGORIES, DIFFICULTY_LEVELS } from '@/data/quizData';

export default function BrowseQuizzes() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  useEffect(() => {
    fetchQuizzes();
  }, [selectedCategory, selectedDifficulty]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const quizzesRef = collection(db, 'communityQuizzes');
      let q = query(quizzesRef, orderBy('plays', 'desc'), limit(50));

      // Note: Firestore requires composite indexes for multiple where clauses
      // For simplicity, we'll filter in memory after fetching
      
      const snapshot = await getDocs(q);
      
      let quizList = [];
      snapshot.forEach((doc) => {
        quizList.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Filter in memory
      if (selectedCategory !== 0) {
        quizList = quizList.filter(q => q.category === selectedCategory);
      }
      if (selectedDifficulty) {
        quizList = quizList.filter(q => q.difficulty === selectedDifficulty);
      }
      
      setQuizzes(quizList);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuizzes = quizzes.filter(quiz =>
    quiz.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryIcon = (categoryId) => {
    const cat = QUIZ_CATEGORIES.find(c => c.id === categoryId);
    return cat?.icon || '📚';
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handlePlayQuiz = (quiz) => {
    console.log('[BrowseQuizzes] handlePlayQuiz called');
    console.log('[BrowseQuizzes] Quiz:', quiz);
    console.log('[BrowseQuizzes] Quiz questions:', quiz.questions);
    
    try {
      const quizJson = JSON.stringify(quiz);
      console.log('[BrowseQuizzes] Stringified quiz length:', quizJson.length);
      sessionStorage.setItem('communityQuiz', quizJson);
      console.log('[BrowseQuizzes] Stored in sessionStorage');
      console.log('[BrowseQuizzes] Navigating to /quiz?mode=community');
      navigate('/quiz?mode=community');
      console.log('[BrowseQuizzes] Navigate called');
    } catch (error) {
      console.error('[BrowseQuizzes] Error:', error);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--text-main)] mb-2 title-glow">
            🌍 Community Quizzes
          </h1>
          <p className="text-gray-600">Discover and play quizzes created by the community</p>
        </div>

        {/* Search & Filters */}
        <div className="glass-panel rounded-2xl p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search quizzes..."
                className="pl-10 bg-[var(--bg-base)] text-[var(--text-main)] border-[var(--border-color)]"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(parseInt(e.target.value))}
              className="px-4 py-2 rounded-lg bg-[var(--bg-base)] text-[var(--text-main)] border-[var(--border-color)] font-medium"
            >
              <option value={0}>All Categories</option>
              {QUIZ_CATEGORIES.filter(c => c.id !== 0).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-2 rounded-lg bg-[var(--bg-base)] text-[var(--text-main)] border-[var(--border-color)] font-medium"
            >
              <option value="">All Difficulties</option>
              {DIFFICULTY_LEVELS.filter(d => d.id).map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quiz Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-[var(--text-main)] mb-2">No Quizzes Found</h2>
            <p className="text-[var(--text-muted)] mb-6">
              {searchTerm 
                ? 'Try a different search term'
                : 'Be the first to create a quiz in this category!'
              }
            </p>
            <Button
              onClick={() => navigate('/create-quiz')}
              className="btn-primary"
            >
              Create Quiz
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredQuizzes.map((quiz, index) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="glass-panel rounded-2xl p-6 cursor-pointer flex flex-col justify-between"
                onClick={() => handlePlayQuiz(quiz)}
              >
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-3xl">{getCategoryIcon(quiz.category)}</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-[var(--text-main)] line-clamp-1">{quiz.title}</h3>
                    <p className="text-sm text-[var(--text-muted)] font-medium">by {quiz.creatorName}</p>
                  </div>
                </div>

                <p className="text-[var(--text-muted)] text-sm mb-4 line-clamp-2">{quiz.description}</p>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${getDifficultyColor(quiz.difficulty)}`}>
                    {quiz.difficulty?.charAt(0).toUpperCase() + quiz.difficulty?.slice(1)}
                  </span>
                  <span className="text-xs font-medium text-[var(--text-muted)]">
                    {quiz.questionCount || quiz.questions?.length} Qs
                  </span>
                  <span className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1">
                    <FaUsers /> {quiz.plays || 0}
                  </span>
                  {quiz.averageRating > 0 && (
                    <span className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1">
                      <FaStar className="text-[#FFD700]" /> {quiz.averageRating.toFixed(1)}
                    </span>
                  )}
                </div>

                <Button
                  className="w-full btn-primary mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayQuiz(quiz);
                  }}
                >
                  <FaPlay className="mr-2" /> Play Quiz
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
