import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Navbar from "./page/Navbar";
import Home from "./page/Home";
import Quiz from "./page/Quiz";
import QuizSetup from "./page/QuizSetup";
import Login from "./page/Login";
import Register from "./page/Register";
import Profile from "./page/Profile";
import Leaderboard from "./page/Leaderboard";
import Analytics from "./page/Analytics";
import CreateQuiz from "./page/CreateQuiz";
import MyQuizzes from "./page/MyQuizzes";
import BrowseQuizzes from "./page/BrowseQuizzes";
import StudyMode from "./page/StudyMode";
import NetworkBackground from "./components/NetworkBackground";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="app-container font-sans bg-[var(--bg-base)] text-[var(--text-main)] transition-colors duration-300">
            <div className="gladia-bg"></div>
            <div className="neon-smoke-bubble"></div>
            <div className="shooting-star"></div>
            <div className="shooting-star delayed"></div>
            {/* Only show NetworkBackground on Home page for performance/clarity, or keep it global if desired. I'll keep it global but faded. */}
            <div className="fixed inset-0 z-[-1] opacity-40 mix-blend-screen pointer-events-none">
              <NetworkBackground />
            </div>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/quiz-setup" element={<QuizSetup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/create-quiz" element={<CreateQuiz />} />
              <Route path="/my-quizzes" element={<MyQuizzes />} />
              <Route path="/browse-quizzes" element={<BrowseQuizzes />} />
              <Route path="/study" element={<StudyMode />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
