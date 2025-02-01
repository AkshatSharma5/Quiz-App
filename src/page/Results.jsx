import { Doughnut } from "react-chartjs-2";
import { useRef } from "react";

export default function Results({
  score,
  totalQuestions,
  correctAnswers,
  timeTaken,
}) {
  // Capture the initial timeTaken value only once using useRef
  const finalTime = useRef(timeTaken);
  const mins = finalTime.current / 60;
  const secs = finalTime.current % 60;

  const accuracy = (correctAnswers / totalQuestions) * 100;
  const data = {
    labels: ["Correct", "Incorrect"],
    datasets: [
      {
        data: [correctAnswers, totalQuestions - correctAnswers],
        backgroundColor: ["#10B981", "#EF4444"],
      },
    ],
  };

  return (
    <div className=" h-[100vh] bg-gradient-to-r from-indigo-200 from-10% via-sky-100 via-30% to-emerald-100 to-90%">
      <div className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-200 from-10% via-sky-100 via-30% to-emerald-100 to-90% rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center mb-16">Quiz Results</h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4 font-bold">
            <div className="flex justify-between mr-8 lg:mr-0 animate__animated animate__backInLeft text-blue-700">
              <span>Total Score:</span>
              <span className="font-bold">{score}</span>
            </div>
            <div className="flex justify-between mr-8 lg:mr-0 animate__animated animate__backInRight text-green-700">
              <span>Correct Answers:</span>
              <span className="font-bold">
                {correctAnswers}/{totalQuestions}
              </span>
            </div>
            <div className="flex justify-between mr-8 lg:mr-0 animate__animated animate__backInLeft text-purple-700">
              <span>Accuracy:</span>
              <span className="font-bold">{accuracy}%</span>
            </div>
            <div className="flex justify-between mr-8 lg:mr-0 animate__animated animate__backInRight text-red-700">
              <span>Time Taken:</span>
              <span className="font-bold">{finalTime.current}s</span>
            </div>
          </div>

          <div className="animate__animated 
                  animate__bounceIn max-w-[250px] mx-auto my-10 lg:ml-40 lg:mt-[-1.5vw]">
            <Doughnut data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
