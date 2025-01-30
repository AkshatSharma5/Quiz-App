import React, { useState } from "react";
import { Typewriter } from "react-simple-typewriter";
import { Toaster, toast } from "react-hot-toast";
import confetti from "canvas-confetti";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Home() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);

  const confettiKaro = () => {
    confetti({
      particleCount: 100,
      spread: 50,
      origin: { x: 0.5, y: 1 },
    });
    toast("Let's begin!", { icon: "🚀" });
  };

  const handleProceed = () => {
    confettiKaro();
    setDialogOpen(false);
    navigate("/quiz");
  };

  return (
    <div className="relative h-[92vh] w-[100vw] flex flex-col items-center justify-center bg-gradient-to-r from-indigo-200 from-10% via-sky-100 via-30% to-emerald-100 to-90%">
      <div className="absolute inset-0 bg-[url('../assets/bg1.jpg')] bg-cover bg-center opacity-10"></div>
      <Toaster position="top-center" />

      <div className="relative z-10 border-2 border-[#0066ffa7] hover:border-[#17671ccf] w-[40vw] h-[50vh] backdrop-blur-3xl flex justify-center bg-[#ffffff39] items-center rounded-xl hover:bg-[#a3e0e220]">
        <div className="flex flex-col justify-center items-center gap-8 font-spaceGrotesk">
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
          <div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="hover:scale-110 bg-blue-700 hover:bg-green-600 transition-all px-5 py-2 rounded-full text-white"
                >
                  Start! 🚀
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl mb-4">Quiz Rules</DialogTitle>
                  <DialogDescription className="text-left space-y-3">
                    <ul className="list-disc list-inside space-y-2">
                      <li>5 Lives available - game over when they reach 0</li>
                      <li className="text-red-700">3 minute cooldown after game over</li>
                      <li>15 seconds per question limit</li>
                      <li>3 hints available throughout the quiz</li>
                      <li>Scoring:
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
  );
}