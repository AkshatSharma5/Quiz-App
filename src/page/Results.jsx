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
    <div className="min-h-screen p-4 md:p-8">
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
          <h2 className="text-2xl font-semibold text-[var(--text-main)]">{gradeInfo.message}</h2>
        </div>

        {/* Main Results Card */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 mb-6">
          <h2 className="text-3xl font-black text-center mb-8 text-[var(--text-main)]">
            Quiz Results
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Stats */}
            <div className="space-y-4">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex justify-between items-center p-5 glass-panel border-l-4 border-blue-500 shadow-md"
              >
                <span className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-sm">Total Score</span>
                <span className="text-2xl font-black text-blue-500">{score}</span>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex justify-between items-center p-5 glass-panel border-l-4 border-green-500 shadow-md"
              >
                <span className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-sm">Correct Answers</span>
                <span className="text-2xl font-black text-green-500">
                  {correctAnswers}/{totalQuestions}
                </span>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex justify-between items-center p-5 glass-panel border-l-4 border-purple-500 shadow-md"
              >
                <span className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-sm">Accuracy</span>
                <span className="text-2xl font-black text-purple-500">{accuracy}%</span>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex justify-between items-center p-5 glass-panel border-l-4 border-orange-500 shadow-md"
              >
                <span className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-sm">Time Taken</span>
                <span className="text-2xl font-black text-orange-500">
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
            className="glass-panel border-t-4 border-[#00A63E] rounded-xl p-5 mb-8 text-center shadow-[0_0_15px_rgba(0,166,62,0.2)]"
          >
            <p className="text-lg font-bold text-[var(--text-main)]">
              🎉 You earned <span className="font-black text-[#00A63E] dark:text-[#39FF14] text-xl">+{score + (correctAnswers * 10)} XP</span>!
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
            className="btn-secondary flex items-center gap-2"
          >
            <FaHome /> Home
          </Button>
          
          <Button
            onClick={() => navigate('/quiz-setup')}
            className="btn-primary flex items-center gap-2"
          >
            <FaRedo /> Play Again
          </Button>

          {user && (
            <Button
              onClick={() => navigate('/analytics')}
              className="btn-secondary flex items-center gap-2"
            >
              <FaChartLine /> Analytics
            </Button>
          )}

          <Button
            onClick={() => navigate('/leaderboard')}
            className="btn-secondary flex items-center gap-2"
          >
            <FaTrophy /> Leaderboard
          </Button>

          <Button
            onClick={shareResults}
            className="btn-secondary flex items-center gap-2"
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
            <p className="text-[var(--text-muted)] font-medium mb-4">
              Sign in to save your progress and compete on the leaderboard!
            </p>
            <Button onClick={() => navigate('/register')} className="btn-secondary">
              Create Account
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
