import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster, toast } from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaPlay, FaStar, FaUsers } from 'react-icons/fa';
import { QUIZ_CATEGORIES } from '@/data/quizData';

export default function MyQuizzes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchMyQuizzes();
  }, [user]);

  const fetchMyQuizzes = async () => {
    try {
      const quizzesRef = collection(db, 'communityQuizzes');
      const q = query(
        quizzesRef,
        where('createdBy', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      
      const quizList = [];
      snapshot.forEach((doc) => {
        quizList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort in memory instead
      quizList.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime; // Descending order
      });
      
      setQuizzes(quizList);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      
      // Show detailed error message
      let errorMessage = 'Failed to load quizzes';
      if (error.code === 'failed-precondition') {
        errorMessage = 'Database index required. Click the link in console to create it.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    
    try {
      await deleteDoc(doc(db, 'communityQuizzes', quizId));
      setQuizzes(prev => prev.filter(q => q.id !== quizId));
      toast.success('Quiz deleted');
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Failed to delete quiz');
    }
  };

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

  return (
    <div className="min-h-screen p-4 md:p-8">
      <Toaster position="top-center" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-[var(--text-main)] mb-2">
              📝 My Quizzes
            </h1>
            <p className="text-[var(--text-muted)] font-medium mt-1">Manage your created quizzes</p>
          </div>
          <Button
            onClick={() => navigate('/create-quiz')}
            className="btn-primary"
          >
            <FaPlus className="mr-2" /> Create Quiz
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel rounded-2xl p-12 text-center"
          >
            <div className="text-6xl mb-4">✏️</div>
            <h2 className="text-2xl font-bold text-[var(--text-main)] mb-2">No Quizzes Yet</h2>
            <p className="text-[var(--text-muted)] font-medium mb-6">Create your first quiz and share it with the community!</p>
            <Button
              onClick={() => navigate('/create-quiz')}
              className="btn-primary"
            >
              <FaPlus className="mr-2" /> Create Your First Quiz
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz, index) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-panel rounded-xl p-6 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getCategoryIcon(quiz.category)}</span>
                      <h3 className="text-xl font-bold text-[var(--text-main)]">{quiz.title}</h3>
                    </div>
                    <p className="text-[var(--text-muted)] text-sm mb-3">{quiz.description}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getDifficultyColor(quiz.difficulty)}`}>
                        {quiz.difficulty?.charAt(0).toUpperCase() + quiz.difficulty?.slice(1)}
                      </span>
                      <span className="text-xs font-medium text-[var(--text-muted)]">
                        {quiz.questionCount || quiz.questions?.length} questions
                      </span>
                      <span className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1">
                        <FaUsers /> {quiz.plays || 0} plays
                      </span>
                      {quiz.averageRating > 0 && (
                        <span className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1">
                          <FaStar className="text-[#FFD700]" /> {quiz.averageRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="btn-secondary"
                      onClick={() => {
                        console.log('[MyQuizzes] Play button clicked');
                        console.log('[MyQuizzes] Quiz object:', quiz);
                        console.log('[MyQuizzes] Quiz ID:', quiz.id);
                        console.log('[MyQuizzes] Questions:', quiz.questions);
                        
                        try {
                          const quizJson = JSON.stringify(quiz);
                          console.log('[MyQuizzes] Stringified quiz:', quizJson.substring(0, 200) + '...');
                          sessionStorage.setItem('communityQuiz', quizJson);
                          console.log('[MyQuizzes] Stored in sessionStorage');
                          console.log('[MyQuizzes] Navigating to /quiz?mode=community');
                          navigate('/quiz?mode=community');
                          console.log('[MyQuizzes] Navigate called');
                        } catch (error) {
                          console.error('[MyQuizzes] Error:', error);
                          toast.error('Failed to start quiz');
                        }
                      }}
                    >
                      <FaPlay className="mr-1" /> Play
                    </Button>
                    <Button
                      size="sm"
                      className="btn-secondary text-red-500 hover:bg-red-500/10 border-red-500/20"
                      onClick={() => handleDelete(quiz.id)}
                    >
                      <FaTrash />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
