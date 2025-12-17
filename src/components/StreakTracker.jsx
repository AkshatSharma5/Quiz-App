import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { FaFire, FaSnowflake } from 'react-icons/fa';

export default function StreakTracker({ size = 'normal' }) {
  const { userProfile } = useAuth();

  if (!userProfile) return null;

  const streak = userProfile.currentStreak || 0;
  const longestStreak = userProfile.longestStreak || 0;

  const getStreakColor = () => {
    if (streak >= 30) return 'from-red-500 to-orange-500';
    if (streak >= 7) return 'from-orange-500 to-yellow-500';
    if (streak >= 3) return 'from-yellow-500 to-amber-400';
    return 'from-gray-400 to-gray-500';
  };

  const getStreakEmoji = () => {
    if (streak >= 30) return '🔥🔥🔥';
    if (streak >= 7) return '🔥🔥';
    if (streak >= 3) return '🔥';
    return '❄️';
  };

  if (size === 'mini') {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={`bg-gradient-to-r ${getStreakColor()} text-white px-3 py-1 rounded-full flex items-center gap-1 text-sm font-semibold shadow-lg`}
      >
        {streak > 0 ? <FaFire className="animate-pulse" /> : <FaSnowflake />}
        {streak}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg p-4 border border-white/20"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={streak > 0 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className={`w-12 h-12 rounded-full bg-gradient-to-br ${getStreakColor()} flex items-center justify-center text-white text-xl shadow-lg`}
          >
            {streak > 0 ? <FaFire /> : <FaSnowflake />}
          </motion.div>
          <div>
            <div className="text-2xl font-bold text-gray-800">
              {streak} {getStreakEmoji()}
            </div>
            <div className="text-sm text-gray-500">Day Streak</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-500">Best</div>
          <div className="font-semibold text-gray-700">{longestStreak} days</div>
        </div>
      </div>

      {streak > 0 && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          className="mt-3"
        >
          <div className="text-xs text-gray-500 mb-1">
            {streak < 7 
              ? `${7 - streak} more days to unlock Week Warrior!`
              : streak < 30
                ? `${30 - streak} more days to unlock Monthly Master!`
                : '🎉 You are on fire!'
            }
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((streak / 30) * 100, 100)}%` }}
              className={`h-full bg-gradient-to-r ${getStreakColor()}`}
            />
          </div>
        </motion.div>
      )}

      {streak === 0 && (
        <p className="mt-3 text-sm text-gray-500 text-center">
          Play a quiz today to start your streak! 🎯
        </p>
      )}
    </motion.div>
  );
}
