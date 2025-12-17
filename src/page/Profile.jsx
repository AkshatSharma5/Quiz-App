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
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-purple-100 to-pink-100 p-4 md:p-8">
      <Toaster position="top-center" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Profile Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 md:p-8 border border-white/20 mb-6">
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
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                    {userProfile.displayName}
                  </h1>
                  <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-gray-600">
                    <FaEdit />
                  </button>
                </div>
              )}
              <p className="text-gray-500">{userProfile.email}</p>
              
              {/* XP Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-indigo-600 font-semibold">{userProfile.xp} XP</span>
                  <span className="text-gray-500">{nextLevelXP} XP to Level {userProfile.level + 1}</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
                  />
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
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
              className="bg-white/80 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-white/20"
            >
              <div className={`text-2xl mb-2 ${stat.color}`}>{stat.icon}</div>
              <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Achievements Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FaTrophy className="text-yellow-500" />
            Achievements ({unlockedAchievements.length}/{ACHIEVEMENTS.filter(a => a.condition).length})
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ACHIEVEMENTS.filter(a => a.condition).map((achievement) => {
              const isUnlocked = achievement.condition(userProfile);
              return (
                <motion.div
                  key={achievement.id}
                  whileHover={{ scale: 1.05 }}
                  className={`p-4 rounded-xl text-center transition-all ${
                    isUnlocked
                      ? 'bg-gradient-to-br from-yellow-100 to-orange-100 shadow-lg'
                      : 'bg-gray-100 opacity-50'
                  }`}
                >
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <div className={`font-semibold text-sm ${isUnlocked ? 'text-gray-800' : 'text-gray-500'}`}>
                    {achievement.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{achievement.description}</div>
                  {isUnlocked && (
                    <div className="text-xs text-green-600 font-semibold mt-2">
                      +{achievement.xp} XP
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Button
            onClick={() => navigate('/quiz-setup')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            🎮 Start Quiz
          </Button>
          <Button
            onClick={() => navigate('/leaderboard')}
            variant="outline"
          >
            🏆 Leaderboard
          </Button>
          <Button
            onClick={() => navigate('/analytics')}
            variant="outline"
          >
            📊 Analytics
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
