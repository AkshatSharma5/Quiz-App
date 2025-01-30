import React from "react";

export default function Quiz() {
  return (
    <div>
      <div>
        <Toaster position="bottom-center" />
      </div>
      <div className="border-2 border-[#0066ff6a] hover:border-[#17671c91] w-[50vw] h-[50vh] backdrop-blur-3xl flex justify-center bg-[#ffffff29] items-center rounded-xl hover:bg-[#7dc9d10b]">
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
            <button
              className="hover:scale-110 bg-blue-700 hover:bg-green-600 transition-all px-5 py-2 rounded-full text-white "
              onClick={confettiKaro}
            >
              Go Now! 🚀
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
