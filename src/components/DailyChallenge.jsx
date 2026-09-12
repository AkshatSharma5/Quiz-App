import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { FaStar, FaLock, FaClock } from 'react-icons/fa';

export default function DailyChallenge() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkDailyChallenge();
    } else {
      setLoading(false);
    }
    
    // Update countdown every minute
    const interval = setInterval(updateCountdown, 60000);
    updateCountdown();
    return () => clearInterval(interval);
  }, [user]);

  const updateCountdown = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = tomorrow - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    setTimeUntilReset(`${hours}h ${minutes}m`);
  };

  const checkDailyChallenge = async () => {
    try {
      const today = new Date().toDateString();
      const challengeRef = doc(db, 'dailyChallenges', `${user.uid}_${today}`);
      const docSnap = await getDoc(challengeRef);
      
      if (docSnap.exists()) {
        setChallengeCompleted(true);
      }
    } catch (error) {
      console.error('Error checking daily challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const startDailyChallenge = () => {
    sessionStorage.setItem('quizConfig', JSON.stringify({
      category: 0, // Random category
      difficulty: 'medium',
      amount: 10,
      mode: 'classic',
      timePerQuestion: 15,
      isDaily: true
    }));
    navigate('/quiz');
  };

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-[var(--border-color)] rounded w-1/2 mb-3"></div>
        <div className="h-4 bg-[var(--border-color)] rounded w-3/4"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="glass-panel rounded-2xl p-8 shadow-xl relative overflow-hidden"
    >
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <FaStar className="text-[#00A63E] dark:text-[#39FF14] text-2xl" />
            <h3 className="text-2xl font-bold tracking-tight text-[var(--text-main)]">Daily Challenge</h3>
          </div>

          <p className="text-[var(--text-muted)] font-medium mb-4 text-base">
            Complete the daily challenge for bonus XP and streak points!
          </p>

          {challengeCompleted ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-[var(--bg-base)] border border-[var(--border-color)] text-[var(--text-main)] rounded-lg px-4 py-2 font-medium">
                <FaLock className="text-[var(--text-muted)]" />
                <span>Completed today! 🎉</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] font-medium">
                <FaClock />
                <span>New challenge in: {timeUntilReset}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 text-sm font-bold">
              <span className="bg-[var(--bg-base)] border border-[var(--border-color)] text-[var(--text-main)] px-4 py-1.5 rounded-full">+50 XP</span>
              <span className="bg-[var(--bg-base)] border border-[var(--border-color)] text-[var(--text-main)] px-4 py-1.5 rounded-full">+🔥 Streak</span>
              <span className="bg-[var(--bg-base)] border border-[var(--border-color)] text-[var(--text-main)] px-4 py-1.5 rounded-full">10 Questions</span>
            </div>
          )}
        </div>

        {!challengeCompleted && (
          <div className="w-full md:w-auto mt-4 md:mt-0">
            <Button
              onClick={user ? startDailyChallenge : () => navigate('/login')}
              className="w-full md:w-auto btn-primary px-8 py-4 text-base h-auto"
            >
              {user ? 'Start Challenge' : 'Sign in to Play'}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
