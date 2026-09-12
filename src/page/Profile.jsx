import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toaster, toast } from 'react-hot-toast';
import { 
  FaUser, FaTrophy, FaFire, FaChartLine, FaStar, 
  FaSignOutAlt, FaEdit, FaGamepad, FaCheck, FaTimes
} from 'react-icons/fa';
import { ACHIEVEMENTS } from '@/data/quizData';

export default function Profile() {
  const { user, userProfile, logout, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(userProfile?.displayName || '');

  if (!user || !userProfile) {
    navigate('/login');
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully!');
      navigate('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const handleUpdateName = async () => {
    if (newDisplayName.trim() && newDisplayName !== userProfile.displayName) {
      try {
        await updateUserProfile(user.uid, { displayName: newDisplayName });
        toast.success('Profile updated!');
        setIsEditing(false);
      } catch (error) {
        toast.error('Failed to update profile');
      }
    } else {
      setIsEditing(false);
    }
  };

  // Calculate accuracy
  const accuracy = userProfile.totalQuestions > 0
    ? ((userProfile.correctAnswers / userProfile.totalQuestions) * 100).toFixed(1)
    : 0;

  // Get unlocked achievements
  const unlockedAchievements = ACHIEVEMENTS.filter(
    a => a.condition && a.condition(userProfile)
  );

  // Calculate XP progress to next level
  const currentLevelXP = (userProfile.level - 1) * 500;
  const nextLevelXP = userProfile.level * 500;
  const xpProgress = ((userProfile.xp - currentLevelXP) / 500) * 100;

  const stats = [
    { icon: <FaGamepad />, label: 'Quizzes Played', value: userProfile.totalQuizzes, color: 'text-blue-600' },
    { icon: <FaTrophy />, label: 'Total Score', value: userProfile.totalScore, color: 'text-yellow-600' },
    { icon: <FaCheck />, label: 'Correct Answers', value: userProfile.correctAnswers, color: 'text-green-600' },
    { icon: <FaChartLine />, label: 'Accuracy', value: `${accuracy}%`, color: 'text-purple-600' },
    { icon: <FaFire />, label: 'Current Streak', value: `${userProfile.currentStreak} days`, color: 'text-orange-600' },
    { icon: <FaStar />, label: 'Longest Streak', value: `${userProfile.longestStreak} days`, color: 'text-pink-600' },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <Toaster position="top-center" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Profile Header */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl text-white font-bold shadow-lg">
                {userProfile.photoURL ? (
                  <img 
                    src={userProfile.photoURL} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  userProfile.displayName?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold shadow">
                Lvl {userProfile.level}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              {isEditing ? (
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <Input
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    className="max-w-[200px]"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleUpdateName}>
                    <FaCheck />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    <FaTimes />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--text-main)] mb-2 title-glow">
                    {userProfile.displayName}
                  </h1>
                  <button onClick={() => setIsEditing(true)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                    <FaEdit />
                  </button>
                </div>
              )}
              <p className="text-[var(--text-muted)] font-medium mt-1">{userProfile.email}</p>
              
              {/* XP Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#00A63E] dark:text-[#39FF14] font-bold">{userProfile.xp} XP</span>
                  <span className="text-[var(--text-muted)] font-medium">{nextLevelXP} XP to Level {userProfile.level + 1}</span>
                </div>
                <div className="h-3 bg-[var(--bg-base)] border border-[var(--border-color)] rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    className="h-full bg-[#00A63E]"
                  />
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              className="btn-secondary flex items-center gap-2 text-red-500 hover:bg-red-500/10 border-red-500/20"
            >
              <FaSignOutAlt />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-panel rounded-xl p-5"
            >
              <div className={`text-3xl mb-3 ${stat.color}`}>{stat.icon}</div>
              <div className="text-2xl font-black text-[var(--text-main)] mb-1">{stat.value}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Achievements Section */}
        <div className="glass-panel rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[var(--text-main)]">
            <FaTrophy className="text-yellow-500" />
            Achievements ({unlockedAchievements.length}/{ACHIEVEMENTS.filter(a => a.condition).length})
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ACHIEVEMENTS.filter(a => a.condition).map((achievement) => {
              const isUnlocked = achievement.condition(userProfile);
              return (
                <motion.div
                  key={achievement.id}
                  whileHover={{ scale: 1.05 }}
                  className={`p-5 rounded-2xl text-center transition-all ${
                    isUnlocked
                      ? 'glass-panel border-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.15)]'
                      : 'bg-[var(--bg-base)] border border-[var(--border-color)] opacity-50'
                  }`}
                >
                  <div className={`text-4xl mb-3 flex justify-center ${isUnlocked ? 'text-[#FFD700] drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]' : 'grayscale'}`}>{achievement.icon}</div>
                  <div className={`font-bold text-sm mb-1 ${isUnlocked ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                    {achievement.name}
                  </div>
                  <div className="text-xs font-medium text-[var(--text-muted)] leading-tight">{achievement.description}</div>
                  {isUnlocked && (
                    <div className="text-xs text-[#00A63E] dark:text-[#39FF14] font-bold mt-3 bg-[#00A63E]/10 py-1 rounded-full">
                      +{achievement.xp} XP
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button
            onClick={() => navigate('/quiz-setup')}
            className="btn-primary"
          >
            🎮 Start Quiz
          </Button>
          <Button
            onClick={() => navigate('/leaderboard')}
            className="btn-secondary"
          >
            🏆 Leaderboard
          </Button>
          <Button
            onClick={() => navigate('/analytics')}
            className="btn-secondary"
          >
            📊 Analytics
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
