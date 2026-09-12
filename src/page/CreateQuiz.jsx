import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toaster, toast } from 'react-hot-toast';
import { FaPlus, FaTrash, FaSave, FaEye, FaArrowLeft, FaCheck } from 'react-icons/fa';
import { QUIZ_CATEGORIES, DIFFICULTY_LEVELS } from '@/data/quizData';

export default function CreateQuiz() {
  const { user, userProfile, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    category: 9,
    difficulty: 'medium',
    questions: [
      {
        question: '',
        options: ['', '', '', ''],
        correctIndex: 0
      }
    ]
  });

  const addQuestion = () => {
    setQuizData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question: '',
          options: ['', '', '', ''],
          correctIndex: 0
        }
      ]
    }));
  };

  const removeQuestion = (index) => {
    if (quizData.questions.length === 1) {
      toast.error('Quiz must have at least one question');
      return;
    }
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const updateQuestion = (index, field, value) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const updateOption = (qIndex, oIndex, value) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === qIndex ? {
          ...q,
          options: q.options.map((opt, j) => j === oIndex ? value : opt)
        } : q
      )
    }));
  };

  const validateQuiz = () => {
    if (!quizData.title.trim()) {
      toast.error('Please enter a quiz title');
      return false;
    }
    if (!quizData.description.trim()) {
      toast.error('Please enter a quiz description');
      return false;
    }
    for (let i = 0; i < quizData.questions.length; i++) {
      const q = quizData.questions[i];
      if (!q.question.trim()) {
        toast.error(`Question ${i + 1} is empty`);
        return false;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].trim()) {
          toast.error(`Option ${j + 1} in Question ${i + 1} is empty`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please sign in to create quizzes');
      navigate('/login');
      return;
    }

    if (!validateQuiz()) return;

    try {
      setLoading(true);

      // Format questions for storage
      const formattedQuestions = quizData.questions.map((q, idx) => ({
        id: idx,
        description: q.question,
        options: q.options.map((opt, i) => ({
          id: i,
          description: opt,
          is_correct: i === q.correctIndex
        })),
        topic: QUIZ_CATEGORIES.find(c => c.id === quizData.category)?.name || 'General',
        difficulty_level: quizData.difficulty
      }));

      const quizDoc = {
        title: quizData.title,
        description: quizData.description,
        category: quizData.category,
        categoryName: QUIZ_CATEGORIES.find(c => c.id === quizData.category)?.name || 'General',
        difficulty: quizData.difficulty,
        questions: formattedQuestions,
        questionCount: quizData.questions.length,
        createdBy: user.uid,
        creatorName: userProfile?.displayName || 'Anonymous',
        createdAt: serverTimestamp(),
        plays: 0,
        totalScore: 0,
        ratings: [],
        averageRating: 0
      };

      await addDoc(collection(db, 'communityQuizzes'), quizDoc);
      
      // Update user's quiz created count
      await updateUserProfile(user.uid, {
        quizzesCreated: (userProfile?.quizzesCreated || 0) + 1
      });

      toast.success('Quiz created successfully! 🎉');
      navigate('/my-quizzes');
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast.error('Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  // Preview Mode
  if (previewMode) {
    const currentQuestion = quizData.questions[currentPreviewIndex];
    
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <Button variant="outline" onClick={() => setPreviewMode(false)}>
              <FaArrowLeft className="mr-2" /> Exit Preview
            </Button>
            <span className="text-[var(--text-muted)] font-bold">
              Question {currentPreviewIndex + 1} of {quizData.questions.length}
            </span>
          </div>

          <motion.div
            key={currentPreviewIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold mb-6 text-[var(--text-main)]">{currentQuestion.question || 'Question text here...'}</h2>
            
            <div className="space-y-3">
              {currentQuestion.options.map((opt, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border-2 font-medium ${
                    idx === currentQuestion.correctIndex
                      ? 'border-[#00A63E] bg-[#00A63E]/10 text-[#00A63E]'
                      : 'border-[var(--border-color)] bg-[var(--bg-base)] text-[var(--text-main)]'
                  }`}
                >
                  {opt || `Option ${idx + 1}`}
                  {idx === currentQuestion.correctIndex && (
                    <span className="ml-2 font-bold">✓ Correct</span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                disabled={currentPreviewIndex === 0}
                onClick={() => setCurrentPreviewIndex(i => i - 1)}
              >
                Previous
              </Button>
              <Button
                disabled={currentPreviewIndex === quizData.questions.length - 1}
                onClick={() => setCurrentPreviewIndex(i => i + 1)}
              >
                Next
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <Toaster position="top-center" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--text-main)] mb-2 title-glow">
            ✏️ Create Quiz
          </h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => { setPreviewMode(true); setCurrentPreviewIndex(0); }}
            >
              <FaEye className="mr-2" /> Preview
            </Button>
            <Button onClick={() => navigate(-1)} variant="outline">
              Cancel
            </Button>
          </div>
        </div>

        {/* Quiz Details */}
        <div className="glass-panel rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold mb-4 text-[var(--text-main)]">Quiz Details</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Title</label>
              <Input
                value={quizData.title}
                onChange={(e) => setQuizData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Ultimate Science Challenge"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Category</label>
              <select
                value={quizData.category}
                onChange={(e) => setQuizData(prev => ({ ...prev, category: parseInt(e.target.value) }))}
                className="w-full p-2 border-[var(--border-color)] bg-[var(--bg-base)] text-[var(--text-main)] rounded-lg outline-none focus:border-[#00A63E]"
              >
                {QUIZ_CATEGORIES.filter(c => c.id !== 0).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Description</label>
              <Input
                value={quizData.description}
                onChange={(e) => setQuizData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of your quiz..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Difficulty</label>
              <div className="flex gap-2">
                {DIFFICULTY_LEVELS.filter(d => d.id).map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setQuizData(prev => ({ ...prev, difficulty: level.id }))}
                    className={`px-4 py-2 rounded-lg font-bold transition-all ${
                      quizData.difficulty === level.id
                        ? `${level.color} text-white shadow-lg`
                        : 'bg-[var(--bg-base)] text-[var(--text-main)] border border-[var(--border-color)] opacity-70 hover:opacity-100'
                    }`}
                  >
                    {level.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Questions */}
        <AnimatePresence>
          {quizData.questions.map((question, qIndex) => (
            <motion.div
              key={qIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="glass-panel rounded-2xl p-6 mb-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-lg text-[var(--text-main)]">Question {qIndex + 1}</h3>
                <button
                  onClick={() => removeQuestion(qIndex)}
                  className="text-red-500 hover:text-red-700 p-2 transition-colors"
                >
                  <FaTrash />
                </button>
              </div>

              <Input
                value={question.question}
                onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                placeholder="Enter your question..."
                className="mb-4"
              />

              <div className="grid md:grid-cols-2 gap-3">
                {question.options.map((option, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuestion(qIndex, 'correctIndex', oIndex)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border ${
                        question.correctIndex === oIndex
                          ? 'bg-[#00A63E] border-[#00A63E] text-white shadow-[0_0_10px_rgba(0,166,62,0.5)]'
                          : 'bg-[var(--bg-base)] border-[var(--border-color)] text-[var(--border-color)] hover:border-[#00A63E] hover:text-[#00A63E]'
                      }`}
                    >
                      {question.correctIndex === oIndex && <FaCheck />}
                    </button>
                    <Input
                      value={option}
                      onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                      placeholder={`Option ${oIndex + 1}`}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs font-bold text-[var(--text-muted)] mt-4 uppercase tracking-wider">Click the circle to mark the correct answer</p>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add Question Button */}
        <button
          onClick={addQuestion}
          className="w-full py-4 border-2 border-dashed border-[var(--border-color)] rounded-xl font-bold text-[var(--text-muted)] hover:border-[#00A63E] hover:text-[#00A63E] hover:bg-[#00A63E]/5 transition-all flex items-center justify-center gap-2 mb-8"
        >
          <FaPlus /> Add Question
        </button>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full btn-primary py-6 text-lg font-black tracking-wide"
        >
          {loading ? (
            'Creating...'
          ) : (
            <>
              <FaSave className="mr-2" /> Publish Quiz
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
