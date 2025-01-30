import { Doughnut } from 'react-chartjs-2';

export default function Results({ score, totalQuestions, correctAnswers, timeTaken }) {
  const data = {
    labels: ['Correct', 'Incorrect'],
    datasets: [{
      data: [correctAnswers, totalQuestions - correctAnswers],
      backgroundColor: ['#10B981', '#EF4444'],
    }]
  };

  return (
    <div className="max-w-2xl mx-auto bg-gradient-to-r from-indigo-200 from-10% via-sky-100 via-30% to-emerald-100 to-90% rounded-xl shadow-lg p-8">
      <h2 className="text-3xl font-bold text-center mb-8">Quiz Results</h2>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between">
            <span>Total Score:</span>
            <span className="font-bold">{score}</span>
          </div>
          <div className="flex justify-between">
            <span>Correct Answers:</span>
            <span className="font-bold">{correctAnswers}/{totalQuestions}</span>
          </div>
          <div className="flex justify-between">
            <span>Time Taken:</span>
            <span className="font-bold">{timeTaken}s</span>
          </div>
        </div>
        
        <div className="max-w-[200px] mx-auto">
          <Doughnut data={data} />
        </div>
      </div>
    </div>
  );
}
