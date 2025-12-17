import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="relative min-h-[92vh] w-full bg-gradient-to-r from-indigo-200 from-10% via-sky-100 via-30% to-emerald-100 to-90%">
      <Toaster position="top-center" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section for logged in users */}
        {user && userProfile && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h1 className="text-3xl font-bold text-gray-800">
              Welcome back, <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">{userProfile.displayName?.split(' ')[0]}</span>! 👋
            </h1>
            <p className="text-gray-600 mt-1">Ready to continue your learning journey?</p>
          </motion.div>
        )}

        {/* Top Stats Row for Logged In Users */}
        {user && userProfile && (
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <StreakTracker />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg p-4 border border-white/20"
            >
              <div className="text-sm text-gray-500 mb-1">Level Progress</div>
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-indigo-600">Lvl {userProfile.level || 1}</div>
                <div className="flex-1">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((userProfile.xp || 0) % 500) / 5}%` }}
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{userProfile.xp || 0} XP</div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg p-4 border border-white/20"
            >
              <div className="text-sm text-gray-500 mb-1">Stats</div>
              <div className="flex justify-between text-sm">
                <div>
                  <div className="text-xl font-bold text-gray-800">{userProfile.totalQuizzes || 0}</div>
                  <div className="text-gray-500">Quizzes</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-green-600">{userProfile.correctAnswers || 0}</div>
                  <div className="text-gray-500">Correct</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-yellow-600">{userProfile.totalScore || 0}</div>
                  <div className="text-gray-500">Score</div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Daily Challenge */}
        <div className="mb-8">
          <DailyChallenge />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* AI Chat Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative py-2 border border-[#0000001f] backdrop-blur-3xl rounded-xl bg-[#a3e0e220] flex flex-col"
          >
            <div className="p-6 flex flex-col flex-1">
              <div className="text-3xl underline underline-offset-8 font-bold bg-gradient-to-r from-indigo-700 via-sky-600 to-purple-700 text-transparent bg-clip-text mb-6 text-center">
                LEARN NOW
              </div>
              {messages.length === 0 && (
                <div className="flex justify-center items-center">
                  <img src={chatbot} alt="Welcome" className="w-[50%] h-[100%]" />
                </div>
              )}
              <div className="flex-1 overflow-y-auto max-h-[300px] rounded-lg mb-4">
                <ScrollArea className="flex-1">
                  <AnimatePresence>
                    {messages.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`mb-3 p-3 rounded-lg max-w-[90%] ${
                          message.role === "user"
                            ? "bg-blue-200 ml-auto"
                            : "bg-gray-100 mr-auto"
                        }`}
                      >
                        <ReactMarkdown className="prose whitespace-pre-wrap break-words text-sm">
                          {message.content}
                        </ReactMarkdown>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </ScrollArea>
              </div>

              <div className="mb-2">
                <button
                  onClick={handleSuggestionClick}
                  className="text-sm text-blue-600 hover:text-blue-800 italic cursor-pointer"
                >
                  "How to upskill myself by evaluating through quizzes"
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  disabled={loading}
                  className="flex-1 bg-white/70 backdrop-blur-sm"
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-700 hover:bg-green-600"
                >
                  {loading ? "..." : "Send"}
                </Button>
              </form>
            </div>
          </motion.div>

          {/* Quiz Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative py-2 border border-[#0000001f] backdrop-blur-3xl rounded-xl bg-[#a3e0e220] flex flex-col"
          >
            <div className="flex flex-col justify-center items-center gap-6 h-full p-6">
              <div className="text-3xl underline underline-offset-8 font-bold bg-gradient-to-r from-indigo-700 via-sky-600 to-purple-700 text-transparent bg-clip-text">
                Get set, it's quiz time!
              </div>
              <div className="text-md text-sky-600">
                <Typewriter
                  words={[
                    "Boost knowledge, enhance skills! 📚💡",
                    "Sharpen focus, ace exams 🎯📖",
                    "Engage minds, build confidence 💪🧠",
                  ]}
                  loop={0}
                  cursor
                  cursorStyle="|"
                  typeSpeed={70}
                  deleteSpeed={50}
                  delaySpeed={1000}
                />
              </div>
              <div className="flex justify-center items-center">
                <img src={study} alt="Study" className="max-h-[180px]" />
              </div>
              
              <div className="flex flex-wrap justify-center gap-3">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="hover:scale-105 bg-blue-700 hover:bg-green-600 transition-all px-6 py-3 rounded-full text-white font-semibold">
                      <FaPlay className="mr-2" /> Start Quiz 🚀
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-2xl mb-4">
                        Quiz Rules
                      </DialogTitle>
                      <DialogDescription className="text-left space-y-3">
                        <ul className="list-disc list-inside space-y-2">
                          <li>5 Lives available - game over when they reach 0</li>
                          <li className="text-red-700">
                            3 minute cooldown after game over
                          </li>
                          <li>15 seconds per question limit</li>
                          <li>3 hints available throughout the quiz</li>
                          <li>
                            Scoring:
                            <ul className="list-[circle] list-inside ml-4">
                              <li>Hard questions: 5 points</li>
                              <li>Medium questions: 4 points</li>
                              <li>Easy questions: 3 points</li>
                            </ul>
                          </li>
                          <li>1 point deduction for wrong answers</li>
                        </ul>
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={handleProceed}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Proceed to Setup ➡️
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  onClick={() => navigate('/study')}
                  className="hover:scale-105 transition-all px-6 py-3 rounded-full"
                >
                  <FaBook className="mr-2" /> Study Mode
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
        >
          <Link to="/browse-quizzes">
            <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg p-4 border border-white/20 hover:shadow-xl hover:scale-105 transition-all cursor-pointer">
              <FaUsers className="text-2xl text-purple-600 mb-2" />
              <h3 className="font-semibold text-gray-800">Community Quizzes</h3>
              <p className="text-sm text-gray-500">Play user-created quizzes</p>
            </div>
          </Link>
          <Link to="/leaderboard">
            <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg p-4 border border-white/20 hover:shadow-xl hover:scale-105 transition-all cursor-pointer">
              <FaTrophy className="text-2xl text-yellow-500 mb-2" />
              <h3 className="font-semibold text-gray-800">Leaderboard</h3>
              <p className="text-sm text-gray-500">See top players</p>
            </div>
          </Link>
          <Link to="/create-quiz">
            <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg p-4 border border-white/20 hover:shadow-xl hover:scale-105 transition-all cursor-pointer">
              <FaPlus className="text-2xl text-green-600 mb-2" />
              <h3 className="font-semibold text-gray-800">Create Quiz</h3>
              <p className="text-sm text-gray-500">Share your knowledge</p>
            </div>
          </Link>
          <Link to="/study">
            <div className="bg-white/80 backdrop-blur-xl rounded-xl shadow-lg p-4 border border-white/20 hover:shadow-xl hover:scale-105 transition-all cursor-pointer">
              <FaBook className="text-2xl text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-800">Study Mode</h3>
              <p className="text-sm text-gray-500">AI-powered flashcards</p>
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
