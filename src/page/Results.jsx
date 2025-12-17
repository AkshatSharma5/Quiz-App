import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { FaHome, FaRedo, FaChartLine, FaTrophy, FaShare } from "react-icons/fa";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

export default function Results({
  score,
  totalQuestions,
  correctAnswers,
  timeTaken,
}) {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const finalTime = useRef(timeTaken);
  const mins = Math.floor(finalTime.current / 60);
  const secs = finalTime.current % 60;

  const accuracy = totalQuestions > 0 
    ? ((correctAnswers / totalQuestions) * 100).toFixed(1) 
    : 0;

  const incorrectAnswers = totalQuestions - correctAnswers;

  useEffect(() => {
    // Celebrate if good score
    if (accuracy >= 70) {
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 }
      });
    }
  }, [accuracy]);

  const data = {
    labels: ["Correct", "Incorrect"],
    datasets: [
      {
        data: [correctAnswers, incorrectAnswers],
        backgroundColor: ["#10B981", "#EF4444"],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: {
        position: 'bottom',
      }
    },
    cutout: '60%'
  };

  const getGrade = () => {
    if (accuracy >= 90) return { grade: 'A+', color: 'text-green-600', message: 'Outstanding! 🌟' };
    if (accuracy >= 80) return { grade: 'A', color: 'text-green-500', message: 'Excellent! 🎉' };
    if (accuracy >= 70) return { grade: 'B', color: 'text-blue-600', message: 'Great job! 👏' };
    if (accuracy >= 60) return { grade: 'C', color: 'text-yellow-600', message: 'Good effort! 💪' };
    if (accuracy >= 50) return { grade: 'D', color: 'text-orange-600', message: 'Keep practicing! 📚' };
    return { grade: 'F', color: 'text-red-600', message: 'Don\'t give up! 🔥' };
  };

  const gradeInfo = getGrade();

  const shareResults = () => {
    const text = `🎯 I scored ${score} points on QuizUp!\n\n✅ ${correctAnswers}/${totalQuestions} correct (${accuracy}%)\n⏱️ Completed in ${mins}m ${secs}s\n\n🚀 Try it yourself!`;
    
    if (navigator.share) {
      navigator.share({
        title: 'My QuizUp Score',
        text: text,
      });
    } else {
      navigator.clipboard.writeText(text);
      alert('Results copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-sky-100 to-emerald-100 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className={`text-8xl font-bold ${gradeInfo.color} mb-2`}
          >
            {gradeInfo.grade}
          </motion.div>
          <h2 className="text-2xl font-semibold text-gray-800">{gradeInfo.message}</h2>
        </div>

        {/* Main Results Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 md:p-8 border border-white/20 mb-6">
          <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
            Quiz Results
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Stats */}
            <div className="space-y-4">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl"
              >
                <span className="font-semibold text-blue-700">Total Score</span>
                <span className="text-2xl font-bold text-blue-700">{score}</span>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl"
              >
                <span className="font-semibold text-green-700">Correct Answers</span>
                <span className="text-2xl font-bold text-green-700">
                  {correctAnswers}/{totalQuestions}
                </span>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl"
              >
                <span className="font-semibold text-purple-700">Accuracy</span>
                <span className="text-2xl font-bold text-purple-700">{accuracy}%</span>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl"
              >
                <span className="font-semibold text-orange-700">Time Taken</span>
                <span className="text-2xl font-bold text-orange-700">
                  {mins}m {secs}s
                </span>
              </motion.div>
            </div>

            {/* Chart */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center"
            >
              <div className="w-full max-w-[250px]">
                <Doughnut data={data} options={chartOptions} />
              </div>
            </motion.div>
          </div>
        </div>

        {/* XP Earned (if logged in) */}
        {user && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 mb-6 text-white text-center"
          >
            <p className="text-lg">
              🎉 You earned <span className="font-bold text-xl">+{score + (correctAnswers * 10)} XP</span>!
            </p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap justify-center gap-4"
        >
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FaHome /> Home
          </Button>
          
          <Button
            onClick={() => navigate('/quiz-setup')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 flex items-center gap-2"
          >
            <FaRedo /> Play Again
          </Button>

          {user && (
            <Button
              onClick={() => navigate('/analytics')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FaChartLine /> Analytics
            </Button>
          )}

          <Button
            onClick={() => navigate('/leaderboard')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FaTrophy /> Leaderboard
          </Button>

          <Button
            onClick={shareResults}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FaShare /> Share
          </Button>
        </motion.div>

        {/* Sign in prompt for guests */}
        {!user && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 text-center"
          >
            <p className="text-gray-600 mb-3">
              Sign in to save your progress and compete on the leaderboard!
            </p>
            <Button onClick={() => navigate('/register')} variant="outline">
              Create Account
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
