import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import chatbot from "../assets/chatbot.gif";
import study from "../assets/study.gif";
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export default function Home() {
  console.log(import.meta.env.VITE_GEMINI_API_KEY); // use VIT_.... is imptt
  const navigate = useNavigate();
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
    navigate("/quiz");
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

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });
      const result = await model.generateContent(input);
      const text = await result.response.text();

      setMessages((prev) => [...prev, { role: "bot", content: text }]);
      setInput("");
      toast.success("Response received!");
    } catch (error) {
      toast.error("Failed to get response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="relative lg:h-[92vh] w-[100vw] flex flex-col items-center justify-center bg-gradient-to-r from-indigo-200 from-10% via-sky-100 via-30% to-emerald-100 to-90%">
      <Toaster position="top-center" />
      
      <div className="flex gap-8 w-full max-w-6xl px-4 z-10 flex-col md:flex-row">
        {/* AI Chat Card */}
        <div className="relative py-2 border border-[#0000001f] lg:w-[40vw] lg:h-[70vh] backdrop-blur-3xl rounded-xl bg-[#a3e0e220] flex flex-col mb-5 mt-10 lg:my-0 ">
          <div className="p-6 flex flex-col flex-1">
            <div className="text-3xl underline underline-offset-8 font-bold bg-gradient-to-r from-indigo-700 via-sky-600 to-purple-700 text-transparent bg-clip-text mb-6 text-center">
              LEARN NOW
            </div>
            {messages.length === 0 && (
              <div className="flex justify-center items-center">
                <img src={chatbot} alt="Welcome" className="w-[50%] h-[100%]" />
              </div>
            )}
            {/* Scrollable message area */}
            <div className="flex-1 overflow-y-auto max-h-[300px] rounded-lg mb-4 ">
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
        </div>
        {/* Quiz Card */}
        <div className="relative py-2 border border-[#0000001f] md:w-[40vw] h-[70vh] backdrop-blur-3xl rounded-xl bg-[#a3e0e220] flex flex-col mt-5 mb-10 lg:my-0 ">
          <div className="flex flex-col justify-center items-center gap-8 h-full">
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
              <img src={study} alt="Study" className="" />
            </div>
            <div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="hover:scale-110 bg-blue-700 hover:bg-green-600 transition-all px-5 py-2 rounded-full text-white">
                    Start! 🚀
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
                      Proceed to Quiz ➡️
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
