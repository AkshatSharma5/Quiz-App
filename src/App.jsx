import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import Navbar from "./page/Navbar";
import Home from "./page/Home";
import Quiz from "./page/Quiz";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quiz" element={<Quiz />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
