import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster, toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { 
  FaBrain, FaLightbulb, FaArrowRight, FaArrowLeft, 
  FaCheck, FaTimes, FaRedo, FaStar
} from 'react-icons/fa';
import { QUIZ_CATEGORIES } from '@/data/quizData';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export default function StudyMode() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(9);
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState(new Set());
  const [studyComplete, setStudyComplete] = useState(false);

  // AI Explanation state
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  useEffect(() => {
    if (flashcards.length > 0 && knownCards.size === flashcards.length) {
      setStudyComplete(true);
    }
  }, [knownCards, flashcards]);

  const generateFlashcards = async () => {
    const category = QUIZ_CATEGORIES.find(c => c.id === selectedCategory);
    
    try {
      setGenerating(true);
      setFlashcards([]);
      setCurrentIndex(0);
      setKnownCards(new Set());
      setStudyComplete(false);

      const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
      
      const prompt = `Generate 10 educational flashcards for studying ${category?.name || 'General Knowledge'}.
      
      Return ONLY a JSON array with this exact format (no markdown, no code blocks):
      [
        {
          "front": "Question or term to learn",
          "back": "Answer or definition",
          "difficulty": 1
        }
      ]
      
      Make the cards educational, interesting, and progressively harder (difficulty 1-3).
      Keep answers concise but informative.`;

      const result = await model.generateContent(prompt);
      const text = await result.response.text();
      
      // Parse the JSON response
      const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
      const cards = JSON.parse(cleanText);
      
      if (Array.isArray(cards) && cards.length > 0) {
        setFlashcards(cards);
        toast.success('Flashcards generated! 📚');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
      let errorMessage = 'Failed to generate flashcards.';
      
      if (error.message?.includes("429")) {
        errorMessage = "Error 429: Too many requests. Please try again later.";
      } else if (error.message?.includes("500")) {
        errorMessage = "Error 500: Internal server error. Please try again later.";
      } else if (error.message?.includes("404")) {
        errorMessage = `Error 404: Model not found. (${error.message})`;
      } else if (error.message) {
        errorMessage = `API Error: ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const getAIExplanation = async () => {
    if (!flashcards[currentIndex]) return;
    
    try {
      setLoadingExplanation(true);
      setShowExplanation(true);
      
      const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
      const card = flashcards[currentIndex];
      
      const prompt = `Explain this topic in more detail for a student:
      
      Topic: ${card.front}
      Answer: ${card.back}
      
      Provide a helpful, educational explanation with examples if relevant. Keep it concise (2-3 paragraphs max).`;

      const result = await model.generateContent(prompt);
      const text = await result.response.text();
      setExplanation(text);
    } catch (error) {
      console.error('Error getting explanation:', error);
      toast.error('Failed to get explanation');
      setShowExplanation(false);
    } finally {
      setLoadingExplanation(false);
    }
  };

  const markAsKnown = () => {
    setKnownCards(prev => new Set([...prev, currentIndex]));
    nextCard();
  };

  const markAsUnknown = () => {
    nextCard();
  };

  const nextCard = () => {
    setIsFlipped(false);
    setShowExplanation(false);
    setExplanation('');
    
    // Find next unknown card
    let next = currentIndex + 1;
    while (next < flashcards.length && knownCards.has(next)) {
      next++;
    }
    
    if (next >= flashcards.length) {
      // Wrap around to find any remaining unknown cards
      next = 0;
      while (next < currentIndex && knownCards.has(next)) {
        next++;
      }
    }
    
    if (knownCards.size < flashcards.length) {
      setCurrentIndex(next);
    }
  };

  const prevCard = () => {
    setIsFlipped(false);
    setShowExplanation(false);
    setExplanation('');
    
    let prev = currentIndex - 1;
    if (prev < 0) prev = flashcards.length - 1;
    setCurrentIndex(prev);
  };

  const resetStudy = () => {
    setKnownCards(new Set());
    setCurrentIndex(0);
    setIsFlipped(false);
    setStudyComplete(false);
    setShowExplanation(false);
    setExplanation('');
  };

  const getDifficultyStars = (difficulty) => {
    return Array(difficulty || 1).fill('⭐').join('');
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <Toaster position="top-center" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-transparent bg-clip-text mb-2">
            🧠 Study Mode
          </h1>
          <p className="text-[var(--text-muted)] font-medium">AI-powered flashcards for effective learning</p>
        </div>

        {flashcards.length === 0 ? (
          // Category Selection
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel rounded-2xl p-8"
          >
            <h2 className="text-xl font-bold mb-6 text-center text-[var(--text-main)]">Choose a topic to study</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {QUIZ_CATEGORIES.filter(c => c.id !== 0).slice(0, 12).map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-4 rounded-xl text-center transition-all border ${
                    selectedCategory === category.id
                      ? 'bg-indigo-500 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-105'
                      : 'bg-[var(--bg-base)] border-[var(--border-color)] text-[var(--text-main)] hover:bg-[var(--bg-surface)] hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                  }`}
                >
                  <span className="text-2xl block mb-1">{category.icon}</span>
                  <span className="text-sm">{category.name}</span>
                </button>
              ))}
            </div>

            <Button
              onClick={generateFlashcards}
              disabled={generating}
              className="w-full btn-primary py-6 text-lg font-black tracking-wide"
            >
              {generating ? (
                <>Generating flashcards with AI...</>
              ) : (
                <>
                  <FaBrain className="mr-2" /> Generate Flashcards
                </>
              )}
            </Button>
          </motion.div>
        ) : studyComplete ? (
          // Completion Screen
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel rounded-2xl p-8 text-center"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-black text-[var(--text-main)] mb-2">Study Complete!</h2>
            <p className="text-[var(--text-muted)] font-medium mb-6">
              You've learned all {flashcards.length} flashcards!
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={resetStudy} className="btn-secondary">
                <FaRedo className="mr-2" /> Study Again
              </Button>
              <Button 
                onClick={() => setFlashcards([])}
                className="btn-primary"
              >
                New Topic
              </Button>
            </div>
          </motion.div>
        ) : (
          // Flashcard Study View
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="glass-panel rounded-xl p-4">
              <div className="flex justify-between text-sm text-[var(--text-muted)] font-bold uppercase tracking-wider mb-2">
                <span>Progress</span>
                <span>{knownCards.size}/{flashcards.length} learned</span>
              </div>
              <div className="h-3 bg-[var(--bg-base)] border border-[var(--border-color)] rounded-full overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(knownCards.size / flashcards.length) * 100}%` }}
                  className="h-full bg-[#00A63E] shadow-[0_0_10px_rgba(0,166,62,0.8)]"
                />
              </div>
            </div>

            {/* Flashcard */}
            <div 
              className="relative h-[300px] cursor-pointer perspective-1000"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isFlipped ? 'back' : 'front'}
                  initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`absolute inset-0 glass-panel rounded-2xl p-8 border-2 flex flex-col items-center justify-center ${
                    isFlipped ? 'border-[#00A63E] shadow-[0_0_15px_rgba(0,166,62,0.2)]' : 'border-[#39FF14] shadow-[0_0_15px_rgba(57,255,20,0.1)]'
                  } ${knownCards.has(currentIndex) ? 'opacity-50' : ''}`}
                >
                  <div className="absolute top-4 left-4 text-sm font-bold text-[var(--text-muted)]">
                    Card {currentIndex + 1}/{flashcards.length}
                  </div>
                  <div className="absolute top-4 right-4 text-sm">
                    {getDifficultyStars(flashcards[currentIndex]?.difficulty)}
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs font-bold text-[var(--text-muted)] tracking-widest mb-2">{isFlipped ? 'ANSWER' : 'QUESTION'}</p>
                    <p className="text-xl md:text-2xl font-black text-[var(--text-main)]">
                      {isFlipped 
                        ? flashcards[currentIndex]?.back 
                        : flashcards[currentIndex]?.front
                      }
                    </p>
                  </div>

                  <p className="absolute bottom-4 text-sm font-bold text-[var(--text-muted)]">
                    {isFlipped ? 'Click to see question' : 'Click to reveal answer'}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
              <Button onClick={prevCard} className="btn-secondary px-6">
                <FaArrowLeft className="mr-2" /> Previous
              </Button>
              
              {isFlipped && (
                <>
                  <Button 
                    onClick={markAsUnknown} 
                    className="btn-secondary px-6 text-red-500 border-red-500/20 hover:bg-red-500/10"
                  >
                    <FaTimes className="mr-2" /> Still Learning
                  </Button>
                  <Button 
                    onClick={markAsKnown}
                    className="px-6 bg-[#00A63E] text-[var(--bg-base)] hover:bg-[#39FF14] transition-colors shadow-[0_0_10px_rgba(0,166,62,0.3)] border-none"
                  >
                    <FaCheck className="mr-2" /> Got It!
                  </Button>
                </>
              )}

              <Button onClick={nextCard} className="btn-secondary px-6">
                Next <FaArrowRight className="ml-2" />
              </Button>
            </div>

            {/* AI Explanation */}
            {isFlipped && (
              <div className="mt-4">
                <Button
                  onClick={getAIExplanation}
                  className="btn-secondary w-full"
                  disabled={loadingExplanation}
                >
                  <FaLightbulb className="mr-2 text-yellow-500" />
                  {loadingExplanation ? 'Getting explanation...' : 'Explain with AI'}
                </Button>

                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 glass-panel border-t-4 border-[#F59E0B] rounded-xl p-6 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                  >
                    <h3 className="font-bold text-yellow-500 mb-3 flex items-center gap-2">
                      <FaLightbulb /> AI Explanation
                    </h3>
                    {loadingExplanation ? (
                      <Skeleton className="h-24 bg-[var(--bg-surface)]" />
                    ) : (
                      <div className="prose prose-sm text-[var(--text-main)] prose-invert">
                        <ReactMarkdown>{explanation}</ReactMarkdown>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex justify-center gap-4 mt-6">
              <Button
                onClick={() => setFlashcards([])}
                className="btn-secondary"
                size="sm"
              >
                Change Topic
              </Button>
              <Button
                onClick={resetStudy}
                className="btn-secondary"
                size="sm"
              >
                <FaRedo className="mr-1" /> Reset Progress
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
