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
        return 'glass-panel border-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.2)]';
      case 2:
        return 'glass-panel border-[#C0C0C0] shadow-[0_0_10px_rgba(192,192,192,0.2)]';
      case 3:
        return 'glass-panel border-[#CD7F32] shadow-[0_0_10px_rgba(205,127,50,0.2)]';
      default:
        return 'glass-panel border-[var(--border-color)]';
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
    <div className="min-h-screen p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-[var(--text-main)] mb-2">
            🏆 Leaderboard
          </h1>
          <p className="text-[var(--text-muted)] font-medium">See how you stack up against other players!</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
                filter === f.id
                  ? 'btn-primary'
                  : 'btn-secondary'
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
            className="glass-panel border-l-4 border-l-[#00A63E] rounded-xl p-4 mb-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--bg-base)] flex items-center justify-center text-xl font-bold border border-[#00A63E]">
                  {userProfile.displayName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-[var(--text-main)]">{userProfile.displayName}</div>
                  <div className="text-[var(--text-muted)] text-sm">Your Rank</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[#00A63E] dark:text-[#39FF14]">#{userRank}</div>
                <div className="text-[var(--text-muted)] text-sm font-semibold">{getFilterValue(userProfile)}</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Leaderboard List */}
        <div className="glass-panel rounded-2xl p-4 md:p-6 mb-12">
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
            <div className="text-center py-12 text-[var(--text-muted)]">
              <FaTrophy className="text-5xl mx-auto mb-4 opacity-30" />
              <p className="font-medium">No players on the leaderboard yet.</p>
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
                    className={`flex items-center gap-4 p-4 rounded-xl border-l-[6px] transition-all ${
                      getRankStyle(rank)
                    } ${isCurrentUser ? 'ring-2 ring-[#00A63E]' : ''}`}
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
                      <div className="font-bold text-[var(--text-main)] flex items-center gap-2">
                        {leader.displayName}
                        {isCurrentUser && (
                          <span className="text-xs bg-[#00A63E]/20 text-[#00A63E] dark:text-[#39FF14] px-2 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-[var(--text-muted)] font-medium mt-1">
                        Level {leader.level || 1} • {leader.totalQuizzes || 0} quizzes
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div className="text-xl font-black text-[var(--text-main)]">
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
