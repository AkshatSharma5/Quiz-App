import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import { AuthProvider } from "@/context/AuthContext";
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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

