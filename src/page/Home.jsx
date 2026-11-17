import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Typewriter } from "react-simple-typewriter";
import { Toaster, toast } from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import DailyChallenge from "@/components/DailyChallenge";
import StreakTracker from "@/components/StreakTracker";
import FeatureAccordion from "@/components/FeatureAccordion";
import { getLocalTutorReply } from "@/data/localLearning";
import { requestGeminiText } from "@/lib/geminiClient";
import chatbot from "../assets/chatbot.gif";
import { FaBook, FaUsers, FaTrophy, FaPlus, FaRobot, FaPaperPlane, FaLightbulb } from "react-icons/fa";

const tutorSuggestions = [
  'Help me build a study plan',
  'How can I build better focus?',
  'Explain a difficult topic simply',
  'Quiz me on what I just studied',
];

export default function Home() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [topUsers, setTopUsers] = useState([]);
  const [topUsersLoading, setTopUsersLoading] = useState(true);
  const [showStar, setShowStar] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);

  useEffect(() => {
    if (!sessionStorage.getItem("starShown")) {
      setShowStar(true);
      sessionStorage.setItem("starShown", "true");
      setTimeout(() => setShowStar(false), 6000);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  useEffect(() => {
    const interval = setInterval(() => setSuggestionIndex((index) => (index + 1) % tutorSuggestions.length), 4200);
    return () => clearInterval(interval);
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
      } finally {
        setTopUsersLoading(false);
      }
    };
    fetchTopUsers();
  }, []);

  const handleSuggestionClick = () => {
    const question = tutorSuggestions[suggestionIndex];
    setInput(question);
    handleSubmit({ preventDefault: () => {}, currentTarget: { elements: { question } } }, question);
  };

  const handleSubmit = async (e, submittedQuestion) => {
    e.preventDefault();
    const question = submittedQuestion || input.trim();
    if (!question || loading) return;

    try {
      setLoading(true);
      const userMessage = { role: "user", content: question };
      setMessages((prev) => [...prev, userMessage]);

      const text = await requestGeminiText(question);

      setMessages((prev) => [...prev, { role: "bot", content: text }]);
      setInput("");
      toast.success("Response received!");
    } catch (error) {
      console.error("Gemini API Error:", error);
      setMessages((prev) => [...prev, { role: "bot", content: getLocalTutorReply(question) }]);
      toast("AI is unavailable; showing built-in study guidance instead.");

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
            <button
              onClick={() => navigate('/adaptive')}
              className="btn-secondary adaptive-home-cta text-lg px-7 py-4 h-auto"
            >
              <span aria-hidden="true">✦</span> <span className="adaptive-gradient-text">Meet your learning agent</span>
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="adaptive-home-feature glass-panel mx-auto mb-12 max-w-5xl overflow-hidden rounded-3xl text-left"
          >
            <Link to="/adaptive" className="adaptive-home-feature-link group">
              <div className="adaptive-home-agent-art" aria-hidden="true">
                <span className="agent-orbit agent-orbit-one" />
                <span className="agent-orbit agent-orbit-two" />
                <span className="agent-core"><span>✦</span></span>
                <span className="agent-spark agent-spark-one">✧</span>
                <span className="agent-spark agent-spark-two">✦</span>
              </div>
              <div className="relative z-10 flex-1 py-7 pr-8 md:py-9">
                <p className="text-xs font-black uppercase tracking-[.18em] text-[#00A63E] dark:text-[#39FF14]">New · Adaptive learning agent</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--text-main)] md:text-3xl">Practice what you need next.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)] md:text-base">The agent reviews your quiz history, picks a topic to revisit, creates focused practice, and updates your review plan.</p>
                <span className="mt-4 inline-flex items-center gap-2 font-bold text-[#00A63E] transition-transform group-hover:translate-x-1 dark:text-[#39FF14]">Explore adaptive practice <span aria-hidden="true">→</span></span>
              </div>
              <div className="adaptive-home-steps hidden md:flex" aria-hidden="true">
                <span>Review</span><i /><span>Focus</span><i /><span>Practice</span><i /><span>Improve</span>
              </div>
            </Link>
          </motion.div>

          {/* Testimonies / Trusted By section */}
          <div className="pt-8 border-t border-[var(--border-color)] max-w-4xl mx-auto">
            <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-8">
              Join top learners climbing the leaderboard
            </p>
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12">
              {topUsers.length > 0 ? topUsers.map((u, i) => (
                <div key={u.id || i} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[var(--border-color)] shadow-md grayscale">
                    <img src={u.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${u.displayName || 'User'}&backgroundColor=000000`} alt="User avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-[var(--text-main)]">
                      {u.displayName?.split(' ')[0] || 'Learner'}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] font-semibold">Lvl {u.level || 1}</div>
                  </div>
                </div>
              )) : (
                topUsersLoading ? <div className="text-[var(--text-muted)] text-sm font-medium animate-pulse">Loading the leaderboard…</div> : <Link to="/quiz-setup" className="text-sm font-semibold text-[var(--text-muted)] transition-colors hover:text-[#00A63E] dark:hover:text-[#39FF14]">Be one of the first learners on the leaderboard <span aria-hidden="true">→</span></Link>
              )}
            </div>
          </div>

          {/* What We Provide Section */}
          <div className="mt-32 mb-20 text-left max-w-7xl mx-auto px-4 md:px-8">
            <motion.h2 
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-black tracking-tight text-[var(--text-main)] mb-10 text-center"
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
            className="mb-8 text-center"
          >
            <h2 className="text-2xl font-bold tracking-tight text-[var(--text-main)] mb-1">
              Welcome back, <span className="text-[#00A63E] dark:text-[#39FF14]">{userProfile.displayName?.split(' ')[0]}</span>.
            </h2>
          </motion.div>
        )}

        {/* Top Stats Row for Logged In Users */}
        {user && userProfile && (
          <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-5 mb-12 md:gap-7">
            <motion.div 
              className="h-full"
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
              className="glass-panel min-h-[205px] rounded-2xl p-5 md:p-7 flex flex-col justify-between"
            >
              <div className="text-sm md:text-base font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4">Level Progress</div>
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
                  <div className="text-sm font-medium text-[var(--text-muted)] mt-2">{userProfile.xp || 0} XP earned</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="glass-panel min-h-[205px] rounded-2xl p-5 md:p-7 flex flex-col justify-between"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">Your stats</div>
                <FaTrophy className="text-amber-500" aria-hidden="true" />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div><div className="text-2xl font-bold text-[var(--text-main)]">{userProfile.totalQuizzes || 0}</div><div className="text-base font-medium text-[var(--text-muted)]">Quizzes</div></div>
                <div><div className="text-2xl font-bold text-emerald-500">{userProfile.correctAnswers || 0}</div><div className="text-base font-medium text-[var(--text-muted)]">Correct</div></div>
                <div><div className="text-2xl font-bold text-violet-500">{userProfile.totalScore || 0}</div><div className="text-base font-medium text-[var(--text-muted)]">Score</div></div>
                <div><div className="text-2xl font-bold text-sky-500">{userProfile.xp || 0}</div><div className="text-base font-medium text-[var(--text-muted)]">XP earned</div></div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ delay: 0.3, duration: 0.6 }} className="min-h-[205px] min-w-0">
              <DailyChallenge compact />
            </motion.div>
          </div>
        )}

        {/* Daily Challenge */}
        {!(user && userProfile) && <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <DailyChallenge />
        </motion.div>}

        <div className="grid items-start lg:grid-cols-2 gap-8 mb-24">
          {/* AI Chat Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="tutor-panel glass-panel flex min-h-[520px] flex-col overflow-hidden rounded-3xl lg:min-h-[560px]"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-color)] px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="tutor-avatar"><FaRobot aria-hidden="true" /></span>
                <div>
                  <h2 className="text-base font-bold text-[var(--text-main)]">Study with AI</h2>
                  <p className="text-xs text-[var(--text-muted)]">Your quiz and study companion</p>
                </div>
              </div>
              <span className="tutor-status"><i /> Gemini tutor</span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col px-4 pb-2 pt-3 sm:px-5">
              <div className="tutor-messages flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="tutor-empty-state flex h-full min-h-[300px] flex-col items-center justify-center text-center">
                    <img src={chatbot} alt="" aria-hidden="true" className="h-48 w-48 object-contain opacity-90 drop-shadow-xl mix-blend-multiply dark:mix-blend-screen" />
                    <p className="mt-2 font-semibold text-[var(--text-main)]">What are you working on?</p>
                    <p className="mt-1 max-w-xs text-xs leading-5 text-[var(--text-muted)]">Ask for an explanation, an example, or a quick way to remember a concept.</p>
                  </div>
                ) : (
                  <div className="space-y-3 py-2">
                    {messages.map((message, index) => (
                      <motion.div key={index} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`tutor-message ${message.role === 'user' ? 'tutor-message-user' : 'tutor-message-assistant'}`}>
                        {message.role !== 'user' && <span className="tutor-message-icon"><FaRobot aria-hidden="true" /></span>}
                        <div className="tutor-message-bubble">
                          <ReactMarkdown className="prose dark:prose-invert whitespace-pre-wrap break-words text-sm font-medium">{message.content}</ReactMarkdown>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
                <AnimatePresence>
                  {loading && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="tutor-message tutor-message-assistant mt-3" role="status" aria-live="polite">
                      <span className="tutor-message-icon"><FaRobot aria-hidden="true" /></span>
                      <div className="tutor-thinking-bubble"><span>Thinking</span><i /><i /><i /></div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {messages.length === 0 && <div className="mb-2 mt-1">
                <button
                  onClick={handleSuggestionClick}
                  disabled={loading}
                  className="tutor-suggestion"
                  aria-live="polite"
                >
                  <FaLightbulb aria-hidden="true" />
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span key={suggestionIndex} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>
                      {tutorSuggestions[suggestionIndex]}
                    </motion.span>
                  </AnimatePresence>
                </button>
              </div>}

              <form onSubmit={handleSubmit} className="tutor-composer flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a study question..."
                  disabled={loading}
                  className="tutor-input h-10 min-w-0 flex-1 border-0 bg-transparent px-3 text-sm shadow-none focus-visible:ring-0"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  aria-label={loading ? 'Waiting for AI response' : 'Send study question'}
                  className="tutor-send-button disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <FaPaperPlane aria-hidden="true" />
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
            className="w-full self-center px-4 pb-16 pt-0"
          >
            <div className="relative w-full max-w-4xl mx-auto aspect-square md:aspect-[16/10] my-0">
              
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
                    <FaBook className="text-2xl md:text-3xl text-sky-500" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm md:text-base lg:text-lg mb-1 text-[var(--text-main)]">1. Learn</h3>
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
                    <FaPlus className="text-2xl md:text-3xl text-violet-500" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm md:text-base lg:text-lg mb-1 text-[var(--text-main)]">2. Build</h3>
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
                    <FaTrophy className="text-2xl md:text-3xl text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm md:text-base lg:text-lg mb-1 text-[var(--text-main)]">3. Compete</h3>
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
                    <FaUsers className="text-2xl md:text-3xl text-pink-500" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm md:text-base lg:text-lg mb-1 text-[var(--text-main)]">4. Connect</h3>
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
