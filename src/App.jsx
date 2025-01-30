import { Button } from "./components/ui/button";
import "./index.css";
import Navbar from "./page/Navbar";

function App() {
  return (
    <div className="bg-gradient-to-r from-indigo-200 from-10% via-sky-100 via-30% to-emerald-100 to-90% h-[100vh] w-[100vw]">
      <Navbar />
    </div>
  );
}

export default App;
