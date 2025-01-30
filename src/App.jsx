import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import Navbar from "./page/Navbar";
import Home from "./page/Home";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
