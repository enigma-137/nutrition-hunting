'use client';

interface ScoreboardProps {
  score: number;
  weight: number;
  muscle: number;
}

export default function Scoreboard({ score, weight, muscle }: ScoreboardProps) {
  return (
    <div className="flex items-center space-x-6">
      <div className="flex items-center space-x-2">
        <span className="text-white/80">Score</span>
        <span className="text-2xl font-bold text-white">{score}</span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-white/80">Weight</span>
        <span className="text-xl font-semibold text-white">{weight}</span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-white/80">Muscle</span>
        <span className="text-xl font-semibold text-white">{muscle}</span>
      </div>
    </div>
  );
}