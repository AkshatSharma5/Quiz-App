import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Typewriter } from "react-simple-typewriter";
import confetti from "canvas-confetti";
import { Toaster, toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import DailyChallenge from "@/components/DailyChallenge";
import StreakTracker from "@/components/StreakTracker";
import FeatureAccordion from "@/components/FeatureAccordion";
import chatbot from "../assets/chatbot.gif";
import study from "../assets/study.gif";
import { FaPlay, FaBook, FaUsers, FaTrophy, FaPlus } from "react-icons/fa";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export default function Home() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [topUsers, setTopUsers] = useState([]);
  const [showStar, setShowStar] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem("starShown")) {
      setShowStar(true);
      sessionStorage.setItem("starShown", "true");
      setTimeout(() => setShowStar(false), 6000);
    }
  }, []);

  useEffect(() => {
    const fetchTopUsers = async () => {
      try {
        const q = query(collection(db, "users"), orderBy("totalScore", "desc"), limit(3));
        const snapshot = await getDocs(q);
        const users = [];
        snapshot.forEach(doc => {
          users.push({ id: doc.id, ...doc.data() });
        });
        setTopUsers(users);
      } catch (err) {
        console.error("Error fetching top users", err);
      }
    };
    fetchTopUsers();
  }, []);

  const confettiKaro = () => {
    confetti({ particleCount: 100, spread: 50, origin: { x: 0.5, y: 1 } });
    toast.success("Let's begin! 🚀");
  };

  const handleProceed = () => {
    confettiKaro();
    setDialogOpen(false);
    navigate("/quiz-setup");
  };

  const handleSuggestionClick = () => {
    setInput("How to upskill myself by evaluating through quizzes");
    handleSubmit({ preventDefault: () => {} });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      setLoading(true);
      const userMessage = { role: "user", content: input };
      setMessages((prev) => [...prev, userMessage]);

      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      const result = await model.generateContent(input);
      const text = await result.response.text();

      setMessages((prev) => [...prev, { role: "bot", content: text }]);
      setInput("");
      toast.success("Response received!");
    } catch (error) {
      console.error("Gemini API Error:", error);
      let errorMessage = "Failed to get response.";
      
      if (error.message?.includes("429")) {
        errorMessage = "Error 429: Too many requests. Please try again later.";
      } else if (error.message?.includes("500")) {
        errorMessage = "Error 500: Internal server error. Please try again later.";
      } else if (error.message?.includes("404")) {
        errorMessage = `Error 404: Model not found. (${error.message})`;
      } else if (error.message) {
        errorMessage = `API Error: ${error.message}`;
      }
      
      setMessages((prev) => [...prev, { role: "bot", content: `❌ ${errorMessage}` }]);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full pt-8 pb-16 px-4 md:px-6 relative overflow-hidden">
      <Toaster position="top-center" toastOptions={{ style: { background: 'var(--bg-surface)', color: 'var(--text-main)', border: '1px solid var(--border-color)' } }} />
      
      {showStar && (
        <div className="shooting-star-container">
          <div className="shooting-star-main"></div>
          <div className="shooting-star-child"></div>
          <div className="shooting-star-sparkle"></div>
        </div>
      )}

      {/* Massive Arc Background Element (Inverted) */}
      <div className="absolute top-[-2rem] md:top-[-4rem] left-1/2 -translate-x-1/2 w-[250vw] h-[250vw] md:w-[180vw] md:h-[180vw] rounded-full border-t-[1px] border-l-0 border-r-0 border-b-0 border-[var(--border-color)] dark:border-[#39FF14]/50 opacity-40 dark:opacity-100 pointer-events-none z-0 drop-shadow-[0_0_15px_rgba(57,255,20,0.3)] dark:drop-shadow-[0_0_25px_rgba(57,255,20,0.6)]"></div>
      
      {/* Massive Hero Section */}
      <div className="max-w-[1000px] mx-auto text-center mb-32 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-outfit font-bold tracking-tight text-[var(--text-main)] mb-6 leading-tight animate-tubelight opacity-0">
            Your one-stop solution to <br className="hidden md:block" />
            <span className="text-[#00A63E] dark:text-[#39FF14] font-medium drop-shadow-[0_0_15px_rgba(57,255,20,0.5)]">AI Powered Quizzes and Learning Platform</span>
          </h1>
          <p className="text-[var(--text-muted)] text-xl md:text-2xl font-semibold mb-12 max-w-2xl mx-auto leading-relaxed min-h-[60px] md:min-h-[80px]">
            <Typewriter
              words={[
                'Comprehensive evaluation architectures for knowledge validation.',
                'The ultimate platform to systematically transform study habits.',
                'Engage with algorithmic assessments and global rankings.',
                'Next-generation cognitive conditioning and retention pathways.'
              ]}
              loop={true}
              cursor
              cursorStyle='_'
              typeSpeed={40}
              deleteSpeed={20}
              delaySpeed={3000}
            />
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button 
              onClick={() => navigate('/quiz-setup')}
              className="btn-primary text-lg px-10 py-4 h-auto shadow-[0_0_30px_rgba(57,255,20,0.3)] hover:shadow-[0_0_50px_rgba(57,255,20,0.5)] transition-all"
            >
              Get started
            </button>
            <button 
              onClick={() => navigate('/browse-quizzes')}
              className="btn-secondary text-lg px-10 py-4 h-auto bg-[var(--bg-surface)] backdrop-blur-xl"
            >
              Explore community
            </button>
          </div>

          {/* Testimonies / Trusted By section */}
          <div className="pt-8 border-t border-[var(--border-color)] max-w-4xl mx-auto">
            <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-8">
              Join top learners climbing the leaderboard
            </p>
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12">
              {topUsers.length > 0 ? topUsers.map((u, i) => (
                <div key={u.id || i} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[var(--border-color)] shadow-md filter grayscale">
                    <img src={u.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${u.displayName || 'User'}&backgroundColor=000000`} alt="User avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-[var(--text-main)]">
                      {i === 2 ? 'LitUp' : (u.displayName?.split(' ')[0] || 'User')}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] font-semibold">Lvl {u.level || 1}</div>
                  </div>
                </div>
              )) : (
                <div className="text-[var(--text-muted)] text-sm font-medium animate-pulse">Loading top learners...</div>
              )}
            </div>
          </div>

          {/* What We Provide Section */}
          <div className="mt-32 mb-20 text-left max-w-7xl mx-auto px-4 md:px-8">
            <motion.h2 
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-black tracking-tight text-[var(--text-main)] mb-16 text-center"
            >
              What we provide
            </motion.h2>
            <FeatureAccordion />
          </div>
        </motion.div>
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10 mt-32">
        {/* Welcome Section for logged in users */}
        {user && userProfile && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold tracking-tight text-[var(--text-main)] mb-1">
              Welcome back, <span className="text-[#00A63E] dark:text-[#39FF14]">{userProfile.displayName?.split(' ')[0]}</span>.
            </h2>
          </motion.div>
        )}

        {/* Top Stats Row for Logged In Users */}
        {user && userProfile && (
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <motion.div 
              className="hidden md:block h-full"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <StreakTracker />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="glass-panel rounded-2xl p-6 flex flex-col justify-between"
            >
              <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4">Level Progress</div>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-[#00A63E] dark:text-[#39FF14]">Lvl {userProfile.level || 1}</div>
                <div className="flex-1">
                  <div className="h-1.5 w-full bg-[var(--border-color)] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((userProfile.xp || 0) % 500) / 5}%` }}
                      className="h-full bg-[#00A63E] dark:bg-[#39FF14]"
                    />
                  </div>
                  <div className="text-xs font-medium text-[var(--text-muted)] mt-2">{userProfile.xp || 0} XP</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="glass-panel rounded-2xl p-6 flex flex-col justify-between"
            >
              <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4">Global Stats</div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-2xl font-bold text-[var(--text-main)]">{userProfile.totalQuizzes || 0}</div>
                  <div className="text-xs font-medium text-[var(--text-muted)]">Quizzes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#00A63E] dark:text-[#39FF14]">{userProfile.correctAnswers || 0}</div>
                  <div className="text-xs font-medium text-[var(--text-muted)]">Correct</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[var(--text-main)]">{userProfile.totalScore || 0}</div>
                  <div className="text-xs font-medium text-[var(--text-muted)]">Score</div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Daily Challenge */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <DailyChallenge />
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 mb-24">
          {/* AI Chat Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="glass-panel rounded-3xl flex flex-col min-h-[500px]"
          >
            <div className="p-8 flex flex-col flex-1">
              <div className="text-2xl md:text-3xl font-bold tracking-tight mb-8 text-[var(--text-main)]">
                LEARN NOW
              </div>
              {messages.length === 0 && (
                <div className="flex justify-center items-center flex-1 py-2">
                  <img src={chatbot} alt="AI Chatbot" className="w-[80%] max-w-[350px] opacity-80 drop-shadow-2xl mix-blend-multiply dark:mix-blend-screen filter grayscale" />
                </div>
              )}
              <div className="flex-1 overflow-y-auto max-h-[300px] mb-4">
                <ScrollArea className="flex-1 pr-4">
                  <AnimatePresence>
                    {messages.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className={`mb-4 p-4 rounded-2xl max-w-[85%] shadow-sm ${
                          message.role === "user"
                            ? "bg-[var(--text-main)] text-[var(--bg-surface)] ml-auto rounded-tr-sm"
                            : "bg-[var(--bg-base)] border border-[var(--border-color)] text-[var(--text-main)] mr-auto rounded-tl-sm"
                        }`}
                      >
                        <ReactMarkdown className="prose dark:prose-invert whitespace-pre-wrap break-words text-sm font-medium">
                          {message.content}
                        </ReactMarkdown>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </ScrollArea>
              </div>

              <div className="mb-4">
                <button
                  onClick={handleSuggestionClick}
                  className="text-base font-medium text-[var(--text-muted)] hover:text-[#00A63E] dark:hover:text-[#39FF14] transition-colors"
                >
                  Suggestion: "How to upskill myself by evaluating through quizzes"
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  disabled={loading}
                  className="flex-1 bg-[var(--bg-base)] border-[var(--border-color)] h-12 rounded-full px-6 font-medium focus-visible:ring-[#00A63E] dark:focus-visible:ring-[#39FF14]"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary h-12 px-8 flex items-center justify-center min-w-[100px]"
                >
                  {loading ? "..." : "Send"}
                </button>
              </form>
            </div>
          </motion.div>

          {/* True Pipeline UI */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="w-full py-16 px-4"
          >
            <div className="relative w-full max-w-4xl mx-auto aspect-square md:aspect-[16/10] my-10">
              
              {/* SVG Track Layer */}
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ padding: '2px' }}>
                <path 
                  d="M 0 0 L 40 0 L 40 18 L 60 18 L 60 0 L 100 0 L 100 40 L 82 40 L 82 60 L 100 60 L 100 100 L 60 100 L 60 82 L 40 82 L 40 100 L 0 100 L 0 60 L 18 60 L 18 40 L 0 40 Z" 
                  fill="none" 
                  stroke="transparent" 
                  strokeWidth="2" 
                  vectorEffect="non-scaling-stroke" 
                />
                <path 
                  d="M 40 22 L 40 40 L 22 40 L 22 60 L 40 60 L 40 78 L 60 78 L 60 60 L 78 60 L 78 40 L 60 40 L 60 22 Z" 
                  fill="none" 
                  stroke="transparent" 
                  strokeWidth="2" 
                  vectorEffect="non-scaling-stroke" 
                />
                
                {/* The traveling electron */}
                <path 
                  d="M 0 0 L 40 0 L 40 18 L 60 18 L 60 0 L 100 0 L 100 40 L 82 40 L 82 60 L 100 60 L 100 100 L 60 100 L 60 82 L 40 82 L 40 100 L 0 100 L 0 60 L 18 60 L 18 40 L 0 40 Z" 
                  pathLength="100"
                  fill="none" 
                  stroke="#39FF14" 
                  strokeWidth="4" 
                  vectorEffect="non-scaling-stroke"
                  className="animate-electron drop-shadow-[0_0_10px_rgba(57,255,20,1)]"
                />
              </svg>

              {/* Box 1: Learn (Top Left) */}
              <div className="absolute top-0 left-0 w-[45%] h-[45%] flex items-center justify-center p-1 md:p-3 animate-float-1">
                <Link to="/study" className="block w-full h-full">
                  <div className="glass-panel border-[1px] border-[rgba(57,255,20,0.3)] bg-gradient-to-br from-[rgba(57,255,20,0.1)] to-transparent w-full h-full rounded-2xl md:rounded-3xl transition-transform duration-300 hover:scale-[1.03] flex flex-col items-center justify-center gap-2 md:gap-4 p-4 md:p-6 lg:p-8 text-center shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:shadow-[0_10px_40px_rgba(57,255,20,0.3)]">
                    <div className="p-3 bg-[var(--bg-base)] rounded-xl shadow-inner border border-[var(--border-color)]">
                      <FaBook className="text-2xl md:text-3xl text-[var(--text-main)]" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm md:text-xl lg:text-2xl mb-1 text-[var(--text-main)]">1. Learn</h3>
                      <p className="text-[10px] md:text-sm lg:text-base font-bold text-[var(--text-muted)] opacity-80 hidden md:block">AI-powered study</p>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Box 2: Build (Top Right) */}
              <div className="absolute top-0 right-0 w-[45%] h-[45%] flex items-center justify-center p-1 md:p-3 animate-float-2">
                <Link to="/create-quiz" className="block w-full h-full">
                  <div className="glass-panel border-[1px] border-[rgba(57,255,20,0.3)] bg-gradient-to-br from-[rgba(57,255,20,0.1)] to-transparent w-full h-full rounded-2xl md:rounded-3xl transition-transform duration-300 hover:scale-[1.03] flex flex-col items-center justify-center gap-2 md:gap-4 p-4 md:p-6 lg:p-8 text-center shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:shadow-[0_10px_40px_rgba(57,255,20,0.3)]">
                    <div className="p-3 bg-[var(--bg-base)] rounded-xl shadow-inner border border-[var(--border-color)]">
                      <FaPlus className="text-2xl md:text-3xl text-[var(--text-main)]" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm md:text-xl lg:text-2xl mb-1 text-[var(--text-main)]">2. Build</h3>
                      <p className="text-[10px] md:text-sm lg:text-base font-bold text-[var(--text-muted)] opacity-80 hidden md:block">Share knowledge</p>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Box 3: Compete (Bottom Right) */}
              <div className="absolute bottom-0 right-0 w-[45%] h-[45%] flex items-center justify-center p-1 md:p-3 animate-float-3">
                <Link to="/leaderboard" className="block w-full h-full">
                  <div className="glass-panel border-[1px] border-[rgba(57,255,20,0.3)] bg-gradient-to-br from-[rgba(57,255,20,0.1)] to-transparent w-full h-full rounded-2xl md:rounded-3xl transition-transform duration-300 hover:scale-[1.03] flex flex-col items-center justify-center gap-2 md:gap-4 p-4 md:p-6 lg:p-8 text-center shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:shadow-[0_10px_40px_rgba(57,255,20,0.3)]">
                    <div className="p-3 bg-[var(--bg-base)] rounded-xl shadow-inner border border-[var(--border-color)]">
                      <FaTrophy className="text-2xl md:text-3xl text-[var(--text-main)]" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm md:text-xl lg:text-2xl mb-1 text-[var(--text-main)]">3. Compete</h3>
                      <p className="text-[10px] md:text-sm lg:text-base font-bold text-[var(--text-muted)] opacity-80 hidden md:block">Climb rankings</p>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Box 4: Connect (Bottom Left) */}
              <div className="absolute bottom-0 left-0 w-[45%] h-[45%] flex items-center justify-center p-1 md:p-3 animate-float-4">
                <Link to="/browse-quizzes" className="block w-full h-full">
                  <div className="glass-panel border-[1px] border-[rgba(57,255,20,0.3)] bg-gradient-to-br from-[rgba(57,255,20,0.1)] to-transparent w-full h-full rounded-2xl md:rounded-3xl transition-transform duration-300 hover:scale-[1.03] flex flex-col items-center justify-center gap-2 md:gap-4 p-4 md:p-6 lg:p-8 text-center shadow-[0_10px_30px_rgba(0,0,0,0.1)] hover:shadow-[0_10px_40px_rgba(57,255,20,0.3)]">
                    <div className="p-3 bg-[var(--bg-base)] rounded-xl shadow-inner border border-[var(--border-color)]">
                      <FaUsers className="text-2xl md:text-3xl text-[var(--text-main)]" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm md:text-xl lg:text-2xl mb-1 text-[var(--text-main)]">4. Connect</h3>
                      <p className="text-[10px] md:text-sm lg:text-base font-bold text-[var(--text-muted)] opacity-80 hidden md:block">Play together</p>
                    </div>
                  </div>
                </Link>
              </div>

            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
