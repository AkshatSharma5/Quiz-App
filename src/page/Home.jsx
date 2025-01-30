import React, { useState } from "react";
import { Typewriter } from "react-simple-typewriter";
import { Toaster, toast } from "react-hot-toast";
import confetti from "canvas-confetti";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Home() {
  const confettiKaro = () => {
    confetti({
      particleCount: 100,
      spread: 50,
      origin: { x: 0.5, y: 1 },
    });
    toast("Let's begin!", { icon: "🚀" });
  };
  return (
    <div className="bg-gradient-to-r from-indigo-200 from-10% via-sky-100 via-30% to-emerald-100 to-90% h-[92vh] w-[100vw] flex flex-col items-center justify-center">
      <div>
        <Toaster position="top-center" />
      </div>
      <div className="border-2 border-[#0066ffa7] hover:border-[#17671ccf] w-[40vw] h-[50vh] backdrop-blur-3xl flex justify-center bg-[#ffffff6e] items-center rounded-xl hover:bg-[#a3e0e25a]">
        <div className="flex flex-col justify-center items-center gap-8">
          <div className="text-3xl underline underline-offset-8 font-bold text-gray-700">
            Start Quiz Now
          </div>
          <div className="text-md  text-sky-600">
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
          <div>
            <Link to="/quiz">
              <Button
                className="hover:scale-110 bg-blue-700 hover:bg-green-600 transition-all px-5 py-2 rounded-full text-white "
                onClick={confettiKaro}
              >
                Go Now! 🚀
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
