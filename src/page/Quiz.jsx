import { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import useSound from 'use-sound';
import { motion } from 'framer-motion';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import Results from './Results';

ChartJS.register(ArcElement, Tooltip, Legend);

// Helper function to decode HTML entities from OpenTDB strings
function decodeHTML(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

export default function Quiz() {
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState(null);
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
  const [playCorrect] = useSound('../assets/success.mp3');
  const [playWrong] = useSound('../assets/error.mp3');

  // Load saved progress from localStorage (if any)
  useEffect(() => {
    const savedProgress = localStorage.getItem('quizProgress');
    if (savedProgress) {
      const { quizData, currentQuestionIndex, score, lives, hintsRemaining, expiry } = JSON.parse(savedProgress);
      const now = Date.now();
      if (now > expiry) {
        localStorage.removeItem('quizProgress');
        fetchQuizData();
      } else {
        setQuizData(quizData);
        setCurrentQuestionIndex(currentQuestionIndex);
        setScore(score);
        setLives(lives);
        setHintsRemaining(hintsRemaining);
      }
    } else {
      fetchQuizData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch quiz questions from OpenTDB and transform the data structure
  const fetchQuizData = async () => {
    try {
      const res = await fetch('https://opentdb.com/api.php?amount=10&difficulty=medium');
      const data = await res.json();

      // Check API response code; 0 means success.
      if (data.response_code !== 0) {
        throw new Error('API returned an error response');
      }

      // Transform each question from OpenTDB into the expected format.
      const transformedData = data.results.map((q, index) => {
        // Decode the HTML-encoded strings.
        const questionText = decodeHTML(q.question);
        const correctAnswer = decodeHTML(q.correct_answer);
        const incorrectAnswers = q.incorrect_answers.map(ans => decodeHTML(ans));

        // Map incorrect answers into option objects.
        const incorrectOptions = incorrectAnswers.map((ans, idx) => ({
          id: idx + 1,
          description: ans,
          is_correct: false
        }));

        // Create option object for the correct answer.
        const correctOption = {
          id: incorrectOptions.length + 1,
          description: correctAnswer,
          is_correct: true
        };

        // Combine and shuffle the options.
        const options = [...incorrectOptions, correctOption];
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

      localStorage.setItem('quizProgress', JSON.stringify({
        quizData: transformedData,
        currentQuestionIndex: 0,
        score: 0,
        lives: 5,
        hintsRemaining: 3,
        expiry: Date.now() + 3 * 60 * 1000 // Expires in 3 minutes
      }));
    } catch (err) {
      toast.error('Failed to load questions');
      console.error('Fetch error:', err);
    }
  };

  // Handle transition to next question or completion of quiz
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < quizData.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
      setTimeLeft(15);
      setSelectedOption(null);
    } else {
      setTimeTaken(Math.floor((Date.now() - startTime) / 1000));
      setQuizCompleted(true);
      localStorage.removeItem('quizProgress');
    }
  }, [currentQuestionIndex, quizData, startTime]);

  // Redirect if lives run out
  useEffect(() => {
    if (lives <= 0) {
      toast.error('You lost! 0 Lives Left!');
      toast.error('Redirecting to home... Wait for 3 mins. before playing!');
      navigate('/');
    }
  }, [lives, navigate]);

  // Timer countdown effect
  useEffect(() => {
    if (!quizData) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleNextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, quizData, handleNextQuestion]);

  // Handle answer selection and update score/lives accordingly
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
      setLives(l => l - 1);
      playWrong();
      toast.error('Wrong Answer! 😐');
    }

    setTimeout(handleNextQuestion, 1500);
  };

  // Provide a hint by showing the correct answer
  const showHint = () => {
    if (hintsRemaining > 0) {
      setHintsRemaining(h => h - 1);
      const correctOption = quizData[currentQuestionIndex].options.find(opt => opt.is_correct);
      if (correctOption) {
        toast(`Correct Answer: ${correctOption.description}`, { icon: '💡' });
      }
    }
  };

  // Save quiz progress to localStorage on every state change
  useEffect(() => {
    if (quizData) {
      localStorage.setItem('quizProgress', JSON.stringify({
        quizData,
        currentQuestionIndex,
        score,
        lives,
        hintsRemaining,
        expiry: Date.now() + 3 * 60 * 1000 // Update expiry on every save
      }));
    }
  }, [currentQuestionIndex, score, lives, hintsRemaining, quizData]);

  // When quiz is completed, show the results screen.
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

  // Show skeleton loader when quiz data is not loaded
  if (!quizData) return (
    <div className="bg-gradient-to-r from-indigo-200 via-sky-100 to-emerald-100 min-h-screen p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <Skeleton className="h-8 w-1/2 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-r from-indigo-200 from-10% via-sky-100 via-30% to-emerald-100 to-90% min-h-screen p-8">
      <Toaster position="top-right" className="font-spaceGrotesk" />
      
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 mb-6 font-poppins">
        <div className="flex justify-between items-center mb-6 md:flex-row flex-col">
          <div className="flex items-center gap-4">
            <div className="bg-red-100 lg:px-4 lg:py-2 p-2 rounded-lg text-sm">
              ❤️ {lives}
            </div>
            <div className="bg-blue-100 lg:px-4 lg:py-2 p-2 rounded-lg text-sm">
              ⏳ {timeLeft}s
            </div>
            <button 
              onClick={showHint}
              className="bg-purple-100 lg:px-4 lg:py-2 p-2 rounded-lg hover:bg-purple-200 text-sm"
              disabled={hintsRemaining <= 0}
            >
              Hints: {hintsRemaining} 💡
            </button>
          </div>
          
          <div className="space-y-2 mt-5 lg:mt-0 text-sm">
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
              Topic: {quizData[currentQuestionIndex].topic}
            </span>
            <span className="bg-green-100 px-2 py-1 rounded text-sm">
              Difficulty: {quizData[currentQuestionIndex].difficulty_level || 'Medium'}
            </span>
          </div>

          <h2 className="text-[17px] md:text-xl font-semibold text-gray-800 font-spaceGrotesk animate__animated animate__bounceIn">
            {quizData[currentQuestionIndex].description}
          </h2>
          
          <div className="grid gap-4 font-josefinSans text-sm md:text-[16px]">
            {quizData[currentQuestionIndex].options.map(option => (
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

      {currentQuestionIndex > 0 && (
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <button
            onClick={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))}
            className="bg-sky-600 px-6 py-2 rounded-lg text-white font-bold hover:bg-sky-500"
          >
            Previous ⬅️
          </button>
        </div>
      )}
    </div>
  );
}
