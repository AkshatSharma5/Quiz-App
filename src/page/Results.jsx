import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { FaHome, FaRedo, FaChartLine, FaTrophy, FaShare } from "react-icons/fa";
import PropTypes from 'prop-types';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

export default function Results({
  score,
  totalQuestions,
  correctAnswers,
  timeTaken,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const finalTime = useRef(timeTaken);
  const mins = Math.floor(finalTime.current / 60);
  const secs = finalTime.current % 60;

  const accuracy = totalQuestions > 0 
    ? ((correctAnswers / totalQuestions) * 100).toFixed(1) 
    : 0;

  const incorrectAnswers = totalQuestions - correctAnswers;

  const data = {
    labels: ["Correct", "Incorrect"],
    datasets: [
      {
        data: [correctAnswers, incorrectAnswers],
        backgroundColor: ["#287b63", "#d5ddd9"],
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
    if (accuracy >= 90) return { grade: 'A+', color: 'text-[var(--accent)]', message: 'Outstanding result' };
    if (accuracy >= 80) return { grade: 'A', color: 'text-[var(--accent)]', message: 'Excellent work' };
    if (accuracy >= 70) return { grade: 'B', color: 'text-[var(--accent)]', message: 'Strong result' };
    if (accuracy >= 60) return { grade: 'C', color: 'text-[var(--accent)]', message: 'Good progress' };
    if (accuracy >= 50) return { grade: 'D', color: 'text-[var(--text-muted)]', message: 'Keep practicing' };
    return { grade: 'F', color: 'text-[var(--text-muted)]', message: 'Review and try again' };
  };

  const gradeInfo = getGrade();

  const shareResults = () => {
    const text = `I scored ${score} points on QuizUp.\n\n${correctAnswers} of ${totalQuestions} correct (${accuracy}%).\nCompleted in ${mins}m ${secs}s.`;
    
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            className={`text-7xl font-semibold tracking-tight ${gradeInfo.color} mb-2`}
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
                className="flex justify-between items-center p-5 glass-panel border-l-4 border-[var(--accent)] shadow-sm"
              >
                <span className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-sm">Total Score</span>
                <span className="text-2xl font-semibold text-[var(--accent)]">{score}</span>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex justify-between items-center p-5 glass-panel border-l-4 border-[var(--accent)] shadow-sm"
              >
                <span className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-sm">Correct Answers</span>
                <span className="text-2xl font-semibold text-[var(--accent)]">
                  {correctAnswers}/{totalQuestions}
                </span>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex justify-between items-center p-5 glass-panel border-l-4 border-[var(--accent)] shadow-sm"
              >
                <span className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-sm">Accuracy</span>
                <span className="text-2xl font-semibold text-[var(--accent)]">{accuracy}%</span>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex justify-between items-center p-5 glass-panel border-l-4 border-[var(--accent)] shadow-sm"
              >
                <span className="font-bold text-[var(--text-muted)] uppercase tracking-wider text-sm">Time Taken</span>
                <span className="text-2xl font-semibold text-[var(--accent)]">
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
            className="glass-panel border-t-4 border-[#00A63E] rounded-2xl p-5 mb-8 text-center shadow-sm"
          >
            <p className="text-lg font-bold text-[var(--text-main)]">
              You earned <span className="font-black text-[#00A63E] dark:text-[#39FF14] text-xl">+{score + (correctAnswers * 10)} XP</span>.
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

Results.propTypes = {
  score: PropTypes.number.isRequired,
  totalQuestions: PropTypes.number.isRequired,
  correctAnswers: PropTypes.number.isRequired,
  timeTaken: PropTypes.number.isRequired,
};
