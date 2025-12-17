import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { FaTrophy, FaMedal, FaFire, FaStar, FaCrown } from 'react-icons/fa';

export default function Leaderboard() {
  const { user, userProfile } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('totalScore');
  const [userRank, setUserRank] = useState(null);

  const filters = [
    { id: 'totalScore', label: 'Total Score', icon: <FaTrophy /> },
    { id: 'currentStreak', label: 'Current Streak', icon: <FaFire /> },
    { id: 'xp', label: 'XP', icon: <FaStar /> },
    { id: 'totalQuizzes', label: 'Quizzes Played', icon: <FaMedal /> },
  ];

  useEffect(() => {
    fetchLeaderboard();
  }, [filter]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy(filter, 'desc'), limit(100));
      const snapshot = await getDocs(q);
      
      const leaderboardData = [];
      snapshot.forEach((doc) => {
        leaderboardData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setLeaders(leaderboardData);

      // Find user's rank
      if (user) {
        const rank = leaderboardData.findIndex(l => l.id === user.uid);
        setUserRank(rank >= 0 ? rank + 1 : null);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <FaCrown className="text-yellow-500 text-2xl" />;
      case 2:
        return <FaMedal className="text-gray-400 text-xl" />;
      case 3:
        return <FaMedal className="text-amber-600 text-xl" />;
      default:
        return <span className="text-gray-500 font-bold">#{rank}</span>;
    }
  };

  const getRankStyle = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-300';
      case 2:
        return 'bg-gradient-to-r from-gray-100 to-slate-100 border-gray-300';
      case 3:
        return 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300';
      default:
        return 'bg-white/60 border-gray-200';
    }
  };

  const getFilterValue = (userData) => {
    switch (filter) {
      case 'currentStreak':
        return `${userData.currentStreak || 0} days`;
      case 'xp':
        return `${userData.xp || 0} XP`;
      case 'totalQuizzes':
        return `${userData.totalQuizzes || 0} quizzes`;
      default:
        return userData.totalScore || 0;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-purple-100 to-pink-100 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 via-orange-500 to-red-500 text-transparent bg-clip-text mb-2">
            🏆 Leaderboard
          </h1>
          <p className="text-gray-600">See how you stack up against other players!</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
                filter === f.id
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white/70 text-gray-600 hover:bg-white'
              }`}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>

        {/* User's Rank Card */}
        {user && userProfile && userRank && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 mb-6 text-white shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                  {userProfile.displayName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold">{userProfile.displayName}</div>
                  <div className="text-white/80 text-sm">Your Rank</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">#{userRank}</div>
                <div className="text-white/80 text-sm">{getFilterValue(userProfile)}</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Leaderboard List */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-4 md:p-6 border border-white/20">
          {loading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : leaders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FaTrophy className="text-5xl mx-auto mb-4 opacity-30" />
              <p>No players on the leaderboard yet.</p>
              <p className="text-sm">Be the first to play!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaders.map((leader, index) => {
                const rank = index + 1;
                const isCurrentUser = user && leader.id === user.uid;
                
                return (
                  <motion.div
                    key={leader.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      getRankStyle(rank)
                    } ${isCurrentUser ? 'ring-2 ring-indigo-500' : ''}`}
                  >
                    {/* Rank */}
                    <div className="w-10 flex justify-center">
                      {getRankIcon(rank)}
                    </div>

                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                      rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                      rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                      rank === 3 ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                      'bg-gradient-to-br from-indigo-400 to-purple-500'
                    }`}>
                      {leader.photoURL ? (
                        <img 
                          src={leader.photoURL} 
                          alt={leader.displayName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        leader.displayName?.charAt(0).toUpperCase() || '?'
                      )}
                    </div>

                    {/* Name & Level */}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 flex items-center gap-2">
                        {leader.displayName}
                        {isCurrentUser && (
                          <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        Level {leader.level || 1} • {leader.totalQuizzes || 0} quizzes
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-800">
                        {getFilterValue(leader)}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
