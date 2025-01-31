import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import AnimatedCursor from "react-animated-cursor";


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AnimatedCursor
      innerSize={13}
      outerSize={13}
      color="0, 46, 231"
      outerStyle={{
        border: "5px solid #20A4F7",
        backgroundColor: "#20A4F7",
      }}
      innerScale={1.2}
      outerScale={1.9}
    />
    <App />
  </StrictMode>
);
