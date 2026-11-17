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
import { getLocalQuestions } from '@/data/localLearning';

const decodeHTML = (value) => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = value;
  return textarea.value;
};

async function fetchOpenTdbQuestions(config) {
  const amount = Math.min(25, Math.max(1, Number(config.amount) || 10));
  const makeUrl = (includeDifficulty) => {
    const params = new URLSearchParams({ amount: String(amount), type: 'multiple' });
    if (Number(config.category) > 0) params.set('category', String(config.category));
    if (includeDifficulty && config.difficulty) params.set('difficulty', config.difficulty);
    return `https://opentdb.com/api.php?${params.toString()}`;
  };

  const request = async (includeDifficulty) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(makeUrl(includeDifficulty), { signal: controller.signal });
      if (!response.ok) throw new Error(`Question service returned ${response.status}`);
      const payload = await response.json();
      if (payload.response_code !== 0 || !Array.isArray(payload.results) || payload.results.length === 0) return null;
      return payload.results.map((question, index) => {
        const options = [
          { description: decodeHTML(question.correct_answer), is_correct: true },
          ...question.incorrect_answers.map((answer) => ({ description: decodeHTML(answer), is_correct: false })),
        ];
        for (let i = options.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [options[i], options[j]] = [options[j], options[i]];
        }
        return {
          id: index,
          topic: decodeHTML(question.category),
          difficulty_level: question.difficulty || config.difficulty || 'medium',
          description: decodeHTML(question.question),
          options: options.map((option, optionId) => ({ ...option, id: optionId })),
        };
      });
    } finally {
      clearTimeout(timeout);
    }
  };

  const matchingDifficulty = await request(true);
  if (matchingDifficulty?.length) return matchingDifficulty;
  if (config.difficulty) {
    const anyDifficulty = await request(false);
    if (anyDifficulty?.length) return anyDifficulty;
  }
  return null;
}

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
  const answerLockedRef = useRef(false);
  const advanceLockedRef = useRef(false);
  const finishLockedRef = useRef(false);
  const advanceTimeoutRef = useRef(null);
  const hasLoadedQuiz = useRef(false); // Prevent double-loading in Strict Mode
  const initializationStartedRef = useRef(false);
  const [playCorrect] = useSound('../assets/success.mp3');
  const [playWrong] = useSound('../assets/error.mp3');

  // Load quiz questions from the original public quiz source, with an offline fallback.
  const fetchQuizData = useCallback(async (config) => {
    setIsLoading(true);
    setLoadingMessage('Preparing your quiz...');
    try {
      let questions = null;
      try {
        questions = await fetchOpenTdbQuestions(config);
      } catch (error) {
        console.warn('Online question loading failed; switching to the offline question set.', error?.name || 'request failed');
      }

      if (!questions?.length) {
        questions = getLocalQuestions(config.category, config.amount);
      }
      if (!Array.isArray(questions) || questions.length === 0 || questions.some((question) => !question.description || !Array.isArray(question.options) || question.options.length !== 4 || question.options.filter((option) => option.is_correct).length !== 1)) {
        throw new Error('Could not prepare a valid quiz. Please try again.');
      }

      const initialTime = config.mode === 'speed' ? 5 : Number(config.timePerQuestion) || 15;
      setQuizData(questions);
      setCurrentQuestionIndex(0);
      setScore(0);
      setCorrectAnswersCount(0);
      setLives(config.mode === 'survival' ? 1 : 5);
      setHintsRemaining(3);
      setSelectedOption(null);
      setTimeLeft(initialTime);
      setIsLoading(false);

      localStorage.setItem('quizProgress', JSON.stringify({
        quizData: questions,
        currentQuestionIndex: 0,
        score: 0,
        lives: config.mode === 'survival' ? 1 : 5,
        hintsRemaining: 3,
        config,
      }));
    } catch (error) {
      console.error('Quiz could not be prepared:', error?.message || error);
      setIsLoading(false);
      toast.error(error?.message || 'Could not load a quiz. Please try again.');
      navigate('/quiz-setup');
    }
  }, [navigate]);
  // Load quiz configuration and data
  useEffect(() => {
    if (initializationStartedRef.current) return;
    initializationStartedRef.current = true;
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
            const { quizData: savedQuizData, currentQuestionIndex: savedIndex, score: savedScore, lives: savedLives, hintsRemaining: savedHints, config } = JSON.parse(savedProgress);
            setQuizData(savedQuizData);
            setQuizConfig(config || { timePerQuestion: 15, mode: 'classic' });
            setCurrentQuestionIndex(savedIndex);
            setScore(savedScore);
            setLives(savedLives);
            setHintsRemaining(savedHints);
            setIsLoading(false);
          } catch {
            localStorage.removeItem('quizProgress');
            navigate('/quiz-setup');
          }
        } else {
          navigate('/quiz-setup');
        }
      }
    }
  }, [searchParams, navigate, fetchQuizData]);

  const finishQuiz = useCallback(async () => {
    if (!quizData?.length || finishLockedRef.current) return;
    finishLockedRef.current = true;
    advanceLockedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);

    const finalTime = Math.floor((Date.now() - startTime) / 1000);
    setTimeTaken(finalTime);
    setQuizCompleted(true);
    localStorage.removeItem('quizProgress');

    if (user) {
      try {
        const quizResult = { score, correctAnswers: correctAnswersCount, totalQuestions: quizData.length, timeTaken: finalTime };
        const statsUpdate = await updateQuizStats(quizResult);
        if (statsUpdate) {
          if (statsUpdate.newStreak > 1) toast.success(`🔥 ${statsUpdate.newStreak} day streak!`);
          toast.success(`+${statsUpdate.xpGained} XP earned!`);
        }
        await addDoc(collection(db, 'quizHistory'), {
          userId: user.uid,
          score,
          correctAnswers: correctAnswersCount,
          totalQuestions: quizData.length,
          timeTaken: finalTime,
          category: quizConfig?.category || 'science',
          difficulty: quizConfig?.difficulty || 'medium',
          mode: quizConfig?.mode || 'classic',
          isCommunity: quizConfig?.isCommunity || false,
          completedAt: serverTimestamp(),
        });
        if (quizConfig?.isDaily) {
          const today = new Date().toDateString();
          await setDoc(doc(db, 'dailyChallenges', `${user.uid}_${today}`), { completed: true, score, completedAt: serverTimestamp() });
        }
        if (quizConfig?.isCommunity && quizConfig?.quizId) {
          await updateDoc(doc(db, 'communityQuizzes', quizConfig.quizId), { plays: increment(1), totalScore: increment(score) });
        }
      } catch (error) {
        console.error('Error saving quiz result:', error);
      }
    }
  }, [quizData, startTime, user, score, correctAnswersCount, updateQuizStats, quizConfig]);

  const handleNextQuestion = useCallback(async () => {
    if (!quizData?.length) return;
    if (currentQuestionIndex >= quizData.length - 1) {
      await finishQuiz();
      return;
    }
    if (advanceLockedRef.current) return;
    advanceLockedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    setCurrentQuestionIndex((index) => index + 1);
    setTimeLeft(quizConfig?.mode === 'speed' ? 5 : Number(quizConfig?.timePerQuestion) || 15);
    setSelectedOption(null);
  }, [currentQuestionIndex, quizData, quizConfig, finishQuiz]);

  useEffect(() => {
    if (lives <= 0 && quizConfig?.mode !== 'practice') void finishQuiz();
  }, [lives, quizConfig, finishQuiz]);
  // Reset the per-question locks only after the next question has rendered.
  useEffect(() => {
    answerLockedRef.current = false;
    advanceLockedRef.current = false;
    if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
  }, [currentQuestionIndex]);

  // Keep one interval and advance only once when the timer expires.
  useEffect(() => {
    if (isLoading || !quizData || quizConfig?.mode === 'practice' || answerLockedRef.current || advanceLockedRef.current) return;
    let remaining = quizConfig?.mode === 'speed' ? 5 : Number(quizConfig?.timePerQuestion) || 15;
    setTimeLeft(remaining);
    timerRef.current = setInterval(() => {
      if (answerLockedRef.current || advanceLockedRef.current) return;
      remaining -= 1;
      setTimeLeft(Math.max(remaining, 0));
      if (remaining <= 0) {
        answerLockedRef.current = true;
        clearInterval(timerRef.current);
        void handleNextQuestion();
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestionIndex, quizData, handleNextQuestion, quizConfig, isLoading]);

  // Score an answer once, including options whose id is 0.
  const handleAnswer = (option) => {
    if (answerLockedRef.current || advanceLockedRef.current || selectedOption !== null) return;
    answerLockedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedOption(option.id);

    const currentQuestion = quizData[currentQuestionIndex];
    const difficulty = currentQuestion.difficulty_level?.toLowerCase();
    const points = difficulty === 'hard' ? 5 : difficulty === 'medium' ? 4 : 3;

    if (option.is_correct) {
      setScore((value) => value + points);
      setCorrectAnswersCount((value) => value + 1);
      confetti({ particleCount: 120, spread: 75, origin: { y: 0.65 } });
      playCorrect();
      toast.success('Correct Answer! 😄');
    } else {
      setScore((value) => value - 1);
      if (quizConfig?.mode !== 'practice') setLives((value) => value - 1);
      playWrong();
      toast.error('Wrong Answer! 😐');
    }

    advanceTimeoutRef.current = setTimeout(() => { void handleNextQuestion(); }, 1200);
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

  if (isLoading || !quizData) return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto glass-panel rounded-2xl p-6">
        <div className="text-center mb-6">
          <div className="text-2xl font-bold text-[var(--text-main)] mb-2">🧠 {loadingMessage}</div>
          <p className="text-[var(--text-muted)] font-medium">Please wait while we prepare your quiz...</p>
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
  const hintShining = timeLeft <= 5 && timeLeft > 0 && quizConfig?.mode !== 'practice' && hintsRemaining > 0 && selectedOption === null;

  const selectedAnswer = currentQuestion.options.find((option, index) => (option.id ?? index) === selectedOption);

  return (
    <main className="quiz-page min-h-screen px-4 pb-10 pt-6 md:px-8 md:pt-8">
      <Toaster position="top-right" />
      <section className="quiz-card glass-panel mx-auto mb-5 max-w-4xl rounded-3xl p-5 md:p-8">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-color)] pb-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="quiz-status-pill quiz-lives">Lives <strong>{lives}</strong></span>
            {quizConfig?.mode !== 'practice' && <span className={`quiz-status-pill quiz-timer ${timeWarning ? 'quiz-timer-warning' : ''}`}>Time <strong>{timeLeft}s</strong></span>}
            <button onClick={showHint} className={`quiz-status-pill quiz-hint transition-colors ${hintShining ? 'quiz-hint-urgent' : ''}`} disabled={hintsRemaining <= 0 || selectedOption !== null}>Hint <strong>{hintsRemaining}</strong></button>
            {quizConfig?.mode && <span className="quiz-mode-badge">{quizConfig.mode} mode</span>}
            {quizConfig?.isCommunity && <span className="quiz-community-badge">Community quiz</span>}
          </div>
          <div className="flex items-center gap-3">
            <span className="quiz-score-badge">Score <strong>{score}</strong></span>
            <span className="text-sm font-semibold text-[var(--text-muted)]">{currentQuestionIndex + 1} <span aria-hidden="true">/</span> {quizData.length}</span>
          </div>
        </header>
        <motion.div key={currentQuestionIndex} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="quiz-topic-badge">{currentQuestion.topic || 'General Knowledge'}</span>
            <span className={`quiz-difficulty-badge quiz-difficulty-${(currentQuestion.difficulty_level || 'medium').toLowerCase()}`}>
              {(currentQuestion.difficulty_level || 'medium').charAt(0).toUpperCase() + (currentQuestion.difficulty_level || 'medium').slice(1)}
            </span>
          </div>
          <h2 className="quiz-question-title text-xl font-bold leading-relaxed tracking-tight md:text-2xl">{currentQuestion.description}</h2>
          <div className="grid gap-3 font-medium text-sm md:text-base">
            {currentQuestion.options.map((option, index) => {
              const optionId = option.id ?? index;
              const isSelected = selectedOption === optionId;
              const revealCorrect = selectedOption !== null && option.is_correct;
              const optionState = isSelected ? (option.is_correct ? 'quiz-option-correct' : 'quiz-option-wrong') : revealCorrect ? 'quiz-option-correct' : '';
              return (
                <button key={`${currentQuestionIndex}-${optionId}`} type="button" onClick={() => handleAnswer({ ...option, id: optionId })} aria-pressed={isSelected} disabled={selectedOption !== null} className={`quiz-option flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${optionState}`}>
                  <span className="quiz-option-letter">{String.fromCharCode(65 + index)}</span>
                  <span className="min-w-0 flex-1">{option.description}</span>
                  {isSelected && <span className="quiz-answer-mark" aria-label={option.is_correct ? 'Correct answer' : 'Your answer'}>{option.is_correct ? '✓' : '×'}</span>}
                  {revealCorrect && !isSelected && <span className="quiz-answer-mark" aria-label="Correct answer">✓</span>}
                </button>
              );
            })}
          </div>
          {selectedOption !== null && <p className={`text-sm font-semibold ${selectedAnswer?.is_correct ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`} aria-live="polite">
            {selectedAnswer?.is_correct ? 'Correct. Moving to the next question…' : 'That answer was incorrect. The correct answer is highlighted.'}
          </p>}
        </motion.div>
      </section>
      <div className="mx-auto max-w-4xl" aria-label="Quiz progress">
        <div className="quiz-progress-track h-2.5 overflow-hidden rounded-full">
          <motion.div initial={{ width: 0 }} animate={{ width: `${((currentQuestionIndex + 1) / quizData.length) * 100}%` }} className="quiz-progress-fill h-full rounded-full" />
        </div>
        <p className="mt-2 text-right text-xs font-semibold text-[var(--text-muted)]">Question {currentQuestionIndex + 1} of {quizData.length}</p>
      </div>
    </main>
  );
}
