import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import useSound from 'use-sound';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc, serverTimestamp, doc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Results from './Results';
import { QUIZ_CATEGORIES } from '@/data/quizData';

// Helper function to decode HTML entities from OpenTDB strings
function decodeHTML(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

// Delay function for retry logic
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default function Quiz() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, updateQuizStats } = useAuth();
  
  const [quizData, setQuizData] = useState(null);
  const [quizConfig, setQuizConfig] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [timeLeft, setTimeLeft] = useState(15);
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [startTime] = useState(Date.now());
  const [timeTaken, setTimeTaken] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading quiz...');
  const timerRef = useRef(null);
  const hasLoadedQuiz = useRef(false); // Prevent double-loading in Strict Mode
  const [playCorrect] = useSound('../assets/success.mp3');
  const [playWrong] = useSound('../assets/error.mp3');

  // Load quiz configuration and data
  useEffect(() => {
    const mode = searchParams.get('mode');
    
    if (mode === 'community') {
      // Prevent double-loading in React Strict Mode
      if (hasLoadedQuiz.current) {
        console.log('[Community Quiz] Already loaded, skipping...');
        return;
      }
      
      // Load community quiz
      const communityQuiz = sessionStorage.getItem('communityQuiz');
      console.log('[Community Quiz] Raw sessionStorage:', communityQuiz);
      
      if (communityQuiz) {
        try {
          const quiz = JSON.parse(communityQuiz);
          console.log('[Community Quiz] Parsed quiz:', quiz);
          console.log('[Community Quiz] Questions:', quiz.questions);
          
          if (!quiz.questions || quiz.questions.length === 0) {
            console.error('[Community Quiz] No questions found');
            toast.error('This quiz has no questions');
            navigate('/browse-quizzes');
            return;
          }

          // Set config first
          const config = {
            amount: quiz.questions.length,
            timePerQuestion: 15,
            mode: 'classic',
            isDaily: false,
            isCommunity: true,
            quizId: quiz.id
          };
          
          console.log('[Community Quiz] Config:', config);
          setQuizConfig(config);
          setTimeLeft(15);
          console.log('[Community Quiz] Setting quiz data...');
          setQuizData(quiz.questions);
          setIsLoading(false);
          console.log('[Community Quiz] Quiz loaded successfully!');
          
          // Mark as loaded and remove from sessionStorage
          hasLoadedQuiz.current = true;
          sessionStorage.removeItem('communityQuiz');
        } catch (error) {
          console.error('[Community Quiz] Error parsing:', error);
          toast.error('Failed to load quiz');
          navigate('/browse-quizzes');
        }
      } else {
        console.error('[Community Quiz] No quiz in sessionStorage');
        navigate('/browse-quizzes');
      }
    } else {
      // Load regular quiz
      const savedConfig = sessionStorage.getItem('quizConfig');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        setQuizConfig(config);
        
        // Set initial values based on mode
        if (config.mode === 'survival') {
          setLives(1);
        }
        if (config.mode === 'practice') {
          setLives(999);
          setHintsRemaining(999);
        }
        if (config.mode === 'speed') {
          setTimeLeft(5);
        } else {
          setTimeLeft(config.timePerQuestion || 15);
        }
        
        fetchQuizData(config);
        sessionStorage.removeItem('quizConfig');
      } else {
        // Load saved progress or fetch new quiz
        const savedProgress = localStorage.getItem('quizProgress');
        if (savedProgress) {
          try {
            const { quizData: savedQuizData, currentQuestionIndex: savedIndex, score: savedScore, lives: savedLives, hintsRemaining: savedHints, expiry, config } = JSON.parse(savedProgress);
            const now = Date.now();
            if (now > expiry) {
              localStorage.removeItem('quizProgress');
              navigate('/quiz-setup');
            } else {
              setQuizData(savedQuizData);
              setQuizConfig(config || { timePerQuestion: 15, mode: 'classic' });
              setCurrentQuestionIndex(savedIndex);
              setScore(savedScore);
              setLives(savedLives);
              setHintsRemaining(savedHints);
              setIsLoading(false);
            }
          } catch (error) {
            localStorage.removeItem('quizProgress');
            navigate('/quiz-setup');
          }
        } else {
          navigate('/quiz-setup');
        }
      }
    }
  }, [searchParams, navigate]);

  // Generate quiz questions using Gemini API
  const fetchQuizData = async (config) => {
    try {
      setLoadingMessage('🧠 Generating quiz with AI...');
      
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      
      // Get category name
      const categoryName = QUIZ_CATEGORIES.find(c => c.id === config.category)?.name || 'General Knowledge';
      const difficulty = config.difficulty || 'medium';
      const amount = config.amount || 10;
      
      const prompt = `Generate ${amount} multiple choice quiz questions about ${categoryName} with ${difficulty} difficulty.

CRITICAL FORMAT REQUIREMENTS:
- Return ONLY a valid JSON array, no markdown, no explanations
- Each question must have exactly 4 options
- Mark the correct answer with "is_correct": true
- All other options must have "is_correct": false

Example format:
[
  {
    "description": "What is the capital of France?",
    "topic": "${categoryName}",
    "difficulty_level": "${difficulty}",
    "options": [
      {"id": 0, "description": "Paris", "is_correct": true},
      {"id": 1, "description": "London", "is_correct": false},
      {"id": 2, "description": "Berlin", "is_correct": false},
      {"id": 3, "description": "Madrid", "is_correct": false}
    ]
  }
]

Generate ${amount} questions now:`;

      const result = await model.generateContent(prompt);
      const text = await result.response.text();
      
      // Extract JSON from response (remove markdown code blocks if present)
      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }
      
      const questions = JSON.parse(jsonText);
      
      // Validate and transform data
      const transformedData = questions.map((q, index) => {
        // Ensure all required fields exist
        if (!q.options || !Array.isArray(q.options) || q.options.length !== 4) {
          throw new Error('Invalid question format: must have exactly 4 options');
        }
        
        // Ensure exactly one correct answer
        const correctCount = q.options.filter(opt => opt.is_correct).length;
        if (correctCount !== 1) {
          throw new Error('Invalid question format: must have exactly 1 correct answer');
        }
        
        return {
          id: index,
          topic: q.topic || categoryName,
          difficulty_level: q.difficulty_level || difficulty,
          description: q.description,
          options: q.options.map((opt, idx) => ({
            id: idx,
            description: opt.description,
            is_correct: opt.is_correct || false
          }))
        };
      });

      setQuizData(transformedData);
      setIsLoading(false);

      localStorage.setItem('quizProgress', JSON.stringify({
        quizData: transformedData,
        currentQuestionIndex: 0,
        score: 0,
        lives: config.mode === 'survival' ? 1 : 5,
        hintsRemaining: 3,
        expiry: Date.now() + 3 * 60 * 1000,
        config: config
      }));
    } catch (err) {
      console.error('Gemini API error:', err);
      
      let errorMessage = 'Failed to generate quiz.';
      if (err.message?.includes('429')) {
        errorMessage = 'API rate limited. Please wait a moment and try again.';
      } else if (err.message?.includes('404')) {
        errorMessage = 'AI model not found. Please check your API key.';
      } else if (err.message?.includes('Invalid question format')) {
        errorMessage = err.message + ' Retrying...';
        // Retry once on format error
        return fetchQuizData(config);
      } else if (err.message) {
        errorMessage = `Error: ${err.message}`;
      }
      
      toast.error(errorMessage);
      navigate('/quiz-setup');
    }
  };

  /* COMMENTED OUT - OpenTDB API (replaced with Gemini AI)
  const fetchQuizData = async (config, retryCount = 0) => {
    const maxRetries = 3;
    
    try {
      setLoadingMessage(retryCount > 0 ? `Retrying... (${retryCount}/${maxRetries})` : 'Fetching questions...');
      
      // Add delay between requests to avoid rate limiting
      if (retryCount > 0) {
        await delay(2000 * retryCount); // Exponential backoff
      }

      let url = `https://opentdb.com/api.php?amount=${config.amount || 10}`;
      if (config.category && config.category !== 0) {
        url += `&category=${config.category}`;
      }
      if (config.difficulty) {
        url += `&difficulty=${config.difficulty}`;
      }

      const res = await fetch(url);
      
      // Handle rate limiting
      if (res.status === 429) {
        if (retryCount < maxRetries) {
          setLoadingMessage('API rate limited. Waiting before retry...');
          await delay(5000);
          return fetchQuizData(config, retryCount + 1);
        } else {
          throw new Error('API rate limited. Please try again in a few seconds.');
        }
      }
      
      const data = await res.json();

      // Handle response codes
      // 0: Success, 1: No Results, 2: Invalid Parameter, 3: Token Not Found, 4: Token Empty
      if (data.response_code === 1) {
        toast.error('Not enough questions available for this category/difficulty. Try different settings.');
        navigate('/quiz-setup');
        return;
      }
      
      if (data.response_code !== 0) {
        if (retryCount < maxRetries) {
          return fetchQuizData(config, retryCount + 1);
        }
        throw new Error('Failed to fetch questions from API');
      }

      const transformedData = data.results.map((q, index) => {
        const questionText = decodeHTML(q.question);
        const correctAnswer = decodeHTML(q.correct_answer);
        const incorrectAnswers = q.incorrect_answers.map(ans => decodeHTML(ans));

        const incorrectOptions = incorrectAnswers.map((ans, idx) => ({
          id: idx + 1,
          description: ans,
          is_correct: false
        }));

        const correctOption = {
          id: incorrectOptions.length + 1,
          description: correctAnswer,
          is_correct: true
        };

        const options = [...incorrectOptions, correctOption];
        // Shuffle options
        for (let i = options.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [options[i], options[j]] = [options[j], options[i]];
        }

        return {
          id: index,
          topic: q.category,
          difficulty_level: q.difficulty,
          description: questionText,
          options: options
        };
      });

      setQuizData(transformedData);
      setIsLoading(false);

      localStorage.setItem('quizProgress', JSON.stringify({
        quizData: transformedData,
        currentQuestionIndex: 0,
        score: 0,
        lives: config.mode === 'survival' ? 1 : 5,
        hintsRemaining: 3,
        expiry: Date.now() + 3 * 60 * 1000,
        config: config
      }));
    } catch (err) {
      console.error('Fetch error:', err);
      
      if (retryCount < maxRetries) {
        return fetchQuizData(config, retryCount + 1);
      }
      
      toast.error(err.message || 'Failed to load questions. Please try again.');
      navigate('/quiz-setup');
    }
  };
  */

  // Handle transition to next question or completion of quiz
  const handleNextQuestion = useCallback(async () => {
    if (!quizData || quizData.length === 0) return;
    
    if (currentQuestionIndex < quizData.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setTimeLeft(quizConfig?.mode === 'speed' ? 5 : quizConfig?.timePerQuestion || 15);
      setSelectedOption(null);
    } else {
      const finalTime = Math.floor((Date.now() - startTime) / 1000);
      setTimeTaken(finalTime);
      setQuizCompleted(true);
      localStorage.removeItem('quizProgress');

      // Save quiz result to Firebase if user is logged in
      if (user) {
        try {
          const quizResult = {
            score,
            correctAnswers: correctAnswersCount,
            totalQuestions: quizData.length,
            timeTaken: finalTime
          };

          // Update user stats
          const statsUpdate = await updateQuizStats(quizResult);
          
          if (statsUpdate) {
            if (statsUpdate.newStreak > 1) {
              toast.success(`🔥 ${statsUpdate.newStreak} day streak!`);
            }
            toast.success(`+${statsUpdate.xpGained} XP earned!`);
          }

          // Save to quiz history
          await addDoc(collection(db, 'quizHistory'), {
            userId: user.uid,
            score,
            correctAnswers: correctAnswersCount,
            totalQuestions: quizData.length,
            timeTaken: finalTime,
            category: quizConfig?.category || "science",
            difficulty: quizConfig?.difficulty || 'medium',
            mode: quizConfig?.mode || 'classic',
            isCommunity: quizConfig?.isCommunity || false,
            completedAt: serverTimestamp()
          });

          // Mark daily challenge as complete
          if (quizConfig?.isDaily) {
            const today = new Date().toDateString();
            await setDoc(doc(db, 'dailyChallenges', `${user.uid}_${today}`), {
              completed: true,
              score,
              completedAt: serverTimestamp()
            });
          }

          // Update community quiz play count
          if (quizConfig?.isCommunity && quizConfig?.quizId) {
            await updateDoc(doc(db, 'communityQuizzes', quizConfig.quizId), {
              plays: increment(1),
              totalScore: increment(score)
            });
          }
        } catch (error) {
          console.error('Error saving quiz result:', error);
        }
      }
    }
  }, [currentQuestionIndex, quizData, startTime, user, score, correctAnswersCount, updateQuizStats, quizConfig]);

  // Redirect if lives run out (except in practice mode)
  useEffect(() => {
    if (lives <= 0 && quizConfig?.mode !== 'practice') {
      toast.error('You lost! 0 Lives Left!');
      toast.error('Redirecting to home... Wait for 3 mins. before playing!');
      navigate('/');
    }
  }, [lives, navigate, quizConfig]);

  // Timer countdown effect - only start when quiz is ready
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Don't start timer if loading, no quiz data, or practice mode
    if (isLoading || !quizData || quizConfig?.mode === 'practice') return;
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleNextQuestion();
          return quizConfig?.mode === 'speed' ? 5 : quizConfig?.timePerQuestion || 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentQuestionIndex, quizData, handleNextQuestion, quizConfig, isLoading]);

  // Handle answer selection
  const handleAnswer = (option) => {
    if (selectedOption) return;
    setSelectedOption(option.id);

    const currentQuestion = quizData[currentQuestionIndex];
    let points = 3;
    switch(currentQuestion.difficulty_level?.toLowerCase()) {
      case 'hard': points = 5; break;
      case 'medium': points = 4; break;
      default: points = 3;
    }

    if (option.is_correct) {
      setScore(s => s + points);
      setCorrectAnswersCount(c => c + 1);
      playCorrect();
      confetti({ particleCount: 100, spread: 70 });
      toast.success('Correct Answer! 😄');
    } else {
      setScore(s => s - 1);
      if (quizConfig?.mode !== 'practice') {
        setLives(l => l - 1);
      }
      playWrong();
      toast.error('Wrong Answer! 😐');
    }

    setTimeout(handleNextQuestion, 1500);
  };

  // Provide a hint
  const showHint = () => {
    if (hintsRemaining > 0) {
      setHintsRemaining(h => h - 1);
      const correctOption = quizData[currentQuestionIndex].options.find(opt => opt.is_correct);
      if (correctOption) {
        toast(`Correct Answer: ${correctOption.description}`, { icon: '💡' });
      }
    }
  };

  // Save quiz progress
  useEffect(() => {
    if (quizData && quizConfig && !quizConfig.isCommunity && !isLoading) {
      localStorage.setItem('quizProgress', JSON.stringify({
        quizData,
        currentQuestionIndex,
        score,
        lives,
        hintsRemaining,
        expiry: Date.now() + 3 * 60 * 1000,
        config: quizConfig
      }));
    }
  }, [currentQuestionIndex, score, lives, hintsRemaining, quizData, quizConfig, isLoading]);

  // Results screen
  if (quizCompleted) {
    return (
      <Results 
        score={score}
        totalQuestions={quizData?.length || 0}
        correctAnswers={correctAnswersCount}
        timeTaken={timeTaken}
      />
    );
  }

  // Loading screen
  if (isLoading || !quizData) return (
    <div className="bg-gradient-to-r from-indigo-200 via-sky-100 to-emerald-100 min-h-screen p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="text-2xl font-semibold text-gray-700 mb-2">🧠 {loadingMessage}</div>
          <p className="text-gray-500">Please wait while we prepare your quiz...</p>
        </div>
        <Skeleton className="h-8 w-1/2 mb-6 mx-auto" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );

  const currentQuestion = quizData[currentQuestionIndex];
  const timeWarning = timeLeft <= 5;

  return (
    <div className="bg-gradient-to-r from-indigo-200 from-10% via-sky-100 via-30% to-emerald-100 to-90% min-h-screen p-4 md:p-8">
      <Toaster position="top-right" className="font-spaceGrotesk" />
      
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 mb-6 font-poppins">
        <div className="flex justify-between items-center mb-6 md:flex-row flex-col gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="bg-red-100 lg:px-4 lg:py-2 p-2 rounded-lg text-sm">
              ❤️ {lives}
            </div>
            {quizConfig?.mode !== 'practice' && (
              <div className={`lg:px-4 lg:py-2 p-2 rounded-lg text-sm transition-colors ${
                timeWarning ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-100'
              }`}>
                ⏳ {timeLeft}s
              </div>
            )}
            <button 
              onClick={showHint}
              className="bg-purple-100 lg:px-4 lg:py-2 p-2 rounded-lg hover:bg-purple-200 text-sm disabled:opacity-50"
              disabled={hintsRemaining <= 0}
            >
              Hints: {hintsRemaining} 💡
            </button>
            {quizConfig?.mode && (
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                {quizConfig.mode.charAt(0).toUpperCase() + quizConfig.mode.slice(1)} Mode
              </span>
            )}
            {quizConfig?.isCommunity && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                Community Quiz
              </span>
            )}
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="bg-green-600 text-white lg:px-4 text-center lg:py-2 p-1 rounded-lg font-bold font-poppins text-sm">
              Score: {score}
            </div>
            <div className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1}/{quizData.length}
            </div>
          </div>
        </div>

        <motion.div 
          key={currentQuestionIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex gap-2 flex-wrap mb-4 font-poppins">
            <span className="bg-blue-100 px-2 py-1 rounded text-sm">
              Topic: {currentQuestion.topic}
            </span>
            <span className={`px-2 py-1 rounded text-sm ${
              currentQuestion.difficulty_level === 'hard' ? 'bg-red-100 text-red-700' :
              currentQuestion.difficulty_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {currentQuestion.difficulty_level?.charAt(0).toUpperCase() + currentQuestion.difficulty_level?.slice(1) || 'Medium'}
            </span>
          </div>

          <h2 className="text-[17px] md:text-xl font-semibold text-gray-800 font-spaceGrotesk animate__animated animate__bounceIn">
            {currentQuestion.description}
          </h2>
          
          <div className="grid gap-4 font-josefinSans text-sm md:text-[16px]">
            {currentQuestion.options.map(option => (
              <button
                key={option.id}
                onClick={() => handleAnswer(option)}
                className={`p-4 rounded-lg text-left animate__animated animate__bounceIn transition-all
                  ${selectedOption === option.id 
                    ? option.is_correct 
                      ? 'bg-green-100 border-2 border-green-500' 
                      : 'bg-red-100 border-2 border-red-500'
                    : 'bg-gray-50 hover:bg-blue-50'}
                  ${selectedOption && option.is_correct ? 'border-2 border-green-500' : ''}`}
                disabled={selectedOption !== null}
              >
                {option.description}
                {selectedOption === option.id && (
                  <span className="ml-2">
                    {option.is_correct ? '✅' : '❌'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Progress bar */}
      <div className="max-w-4xl mx-auto">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestionIndex + 1) / quizData.length) * 100}%` }}
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          />
        </div>
      </div>
    </div>
  );
}
