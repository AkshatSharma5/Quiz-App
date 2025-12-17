import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, Legend
} from 'recharts';
import { FaChartLine, FaBrain, FaTrophy, FaFire, FaArrowLeft } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { QUIZ_CATEGORIES } from '@/data/quizData';

export default function Analytics() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [quizHistory, setQuizHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchQuizHistory();
  }, [user]);

  const fetchQuizHistory = async () => {
    try {
      console.log('[Analytics] Fetching quiz history for user:', user.uid);
      const historyRef = collection(db, 'quizHistory');
      // Remove orderBy to avoid composite index requirement
      const q = query(
        historyRef,
        where('userId', '==', user.uid),
        limit(50)
      );
      const snapshot = await getDocs(q);
      
      const history = [];
      snapshot.forEach((doc) => {
        history.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort in memory instead
      history.sort((a, b) => {
        const aTime = a.completedAt?.toMillis?.() || 0;
        const bTime = b.completedAt?.toMillis?.() || 0;
        return bTime - aTime; // Descending order
      });
      
      console.log('[Analytics] Fetched quiz history count:', history.length);
      console.log('[Analytics] First quiz:', history[0]);
      setQuizHistory(history);
    } catch (error) {
      console.error('Error fetching quiz history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !userProfile) {
    return null;
  }

  // Calculate stats
  const accuracy = userProfile.totalQuestions > 0
    ? ((userProfile.correctAnswers / userProfile.totalQuestions) * 100).toFixed(1)
    : 0;

  // Prepare chart data
  const performanceData = quizHistory.slice(0, 10).reverse().map((quiz, index) => ({
    name: `Quiz ${index + 1}`,
    score: quiz.score || 0,
    accuracy: quiz.totalQuestions > 0 ? ((quiz.correctAnswers / quiz.totalQuestions) * 100).toFixed(0) : 0
  }));

  const pieData = [
    { name: 'Correct', value: userProfile.correctAnswers || 0, color: '#10B981' },
    { name: 'Incorrect', value: (userProfile.totalQuestions || 0) - (userProfile.correctAnswers || 0), color: '#EF4444' }
  ];

  // Calculate category performance from quiz history
  const categoryPerformanceMap = {};
  quizHistory.forEach(quiz => {
    if (quiz.category) {
      const categoryName = QUIZ_CATEGORIES.find(c => c.id === quiz.category)?.name || 'Other';
      if (!categoryPerformanceMap[categoryName]) {
        categoryPerformanceMap[categoryName] = { total: 0, correct: 0 };
      }
      categoryPerformanceMap[categoryName].total += quiz.totalQuestions || 0;
      categoryPerformanceMap[categoryName].correct += quiz.correctAnswers || 0;
    }
  });

  const categoryData = Object.entries(categoryPerformanceMap).map(([category, data]) => ({
    category,
    score: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
  }));

  // If no data, show placeholder
  if (categoryData.length === 0) {
    categoryData.push(
      { category: 'No Data Yet', score: 0 }
    );
  }

  // XP Progression Chart - show XP gained over last 10 quizzes
  const xpProgressionData = quizHistory.slice(0, 10).reverse().map((quiz, index) => {
    const xpGained = (quiz.score || 0) + ((quiz.correctAnswers || 0) * 10);
    return {
      name: `Q${index + 1}`,
      xp: xpGained
    };
  });

  // If no XP data, show placeholder
  if (xpProgressionData.length === 0) {
    xpProgressionData.push({ name: 'No Data', xp: 0 });
  }

  const stats = [
    { 
      icon: <FaTrophy className="text-yellow-500" />,
      label: 'Total Score',
      value: userProfile.totalScore || 0,
      bg: 'from-yellow-50 to-amber-50'
    },
    {
      icon: <FaChartLine className="text-green-500" />,
      label: 'Accuracy',
      value: `${accuracy}%`,
      bg: 'from-green-50 to-emerald-50'
    },
    {
      icon: <FaBrain className="text-purple-500" />,
      label: 'Questions Answered',
      value: userProfile.totalQuestions || 0,
      bg: 'from-purple-50 to-violet-50'
    },
    {
      icon: <FaFire className="text-orange-500" />,
      label: 'Best Streak',
      value: `${userProfile.longestStreak || 0} days`,
      bg: 'from-orange-50 to-red-50'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-purple-100 to-pink-100 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
              📊 Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Track your learning progress</p>
          </div>
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FaArrowLeft /> Back
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gradient-to-br ${stat.bg} rounded-xl p-4 md:p-6 shadow-lg border border-white/50`}
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl md:text-3xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-[300px] rounded-2xl" />
            <Skeleton className="h-[300px] rounded-2xl" />
            <Skeleton className="h-[300px] rounded-2xl" />
            <Skeleton className="h-[300px] rounded-2xl" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Performance Over Time */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20">
              <h2 className="text-xl font-bold mb-4 text-gray-800">📈 Performance Over Time</h2>
              {performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="name" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255,255,255,0.9)', 
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#6366F1" 
                      strokeWidth={3}
                      dot={{ fill: '#6366F1', strokeWidth: 2 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="accuracy" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      dot={{ fill: '#10B981', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500">
                  Complete quizzes to see your progress!
                </div>
              )}
            </div>

            {/* Answer Distribution */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20">
              <h2 className="text-xl font-bold mb-4 text-gray-800">🎯 Answer Distribution</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category Performance */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20">
              <h2 className="text-xl font-bold mb-4 text-gray-800">🧠 Category Performance</h2>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={categoryData}>
                  <PolarGrid stroke="#e0e0e0" />
                  <PolarAngleAxis dataKey="category" stroke="#666" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#666" />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    fillOpacity={0.5}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* XP Progression */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white/20">
              <h2 className="text-xl font-bold mb-4 text-gray-800">⚡ XP Progression</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={xpProgressionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="xp" 
                    fill="url(#xpGradient)" 
                    radius={[4, 4, 0, 0]}
                  />
                  <defs>
                    <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#EF4444" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FaBrain /> AI Learning Recommendations
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-lg font-semibold mb-2">🎯 Focus Area</div>
              <p className="text-white/80 text-sm">
                Based on your performance, consider practicing <strong>Sports</strong> quizzes to improve your weakest category.
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-lg font-semibold mb-2">⚡ Quick Win</div>
              <p className="text-white/80 text-sm">
                You're doing great in <strong>Geography</strong>! Try harder difficulty to earn more XP.
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-lg font-semibold mb-2">🔥 Streak Goal</div>
              <p className="text-white/80 text-sm">
                Play {7 - (userProfile.currentStreak || 0)} more days to unlock the "Week Warrior" achievement!
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
