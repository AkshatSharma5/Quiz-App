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
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-white/20 rounded w-1/2 mb-3"></div>
        <div className="h-4 bg-white/20 rounded w-3/4"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white shadow-xl relative overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <FaStar className="text-yellow-300 text-xl" />
          <h3 className="text-xl font-bold">Daily Challenge</h3>
        </div>

        <p className="text-white/80 mb-4 text-sm">
          Complete the daily challenge for bonus XP and streak points!
        </p>

        {challengeCompleted ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-white/20 rounded-lg p-3">
              <FaLock className="text-white/60" />
              <span>Challenge completed today! 🎉</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <FaClock />
              <span>New challenge in: {timeUntilReset}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm">
              <span className="bg-white/20 px-3 py-1 rounded-full">+50 XP</span>
              <span className="bg-white/20 px-3 py-1 rounded-full">+🔥 Streak</span>
              <span className="bg-white/20 px-3 py-1 rounded-full">10 Questions</span>
            </div>
            
            <Button
              onClick={user ? startDailyChallenge : () => navigate('/login')}
              className="w-full bg-white text-indigo-600 hover:bg-white/90 font-semibold"
            >
              {user ? 'Start Challenge' : 'Sign in to Play'}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
