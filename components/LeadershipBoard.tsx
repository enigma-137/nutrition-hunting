'use client';

import { useState, useEffect } from 'react';

interface LeaderboardProps {
  score: number;
}

interface ScoreEntry {
  _id?: string;
  name: string;
  score: number;
  date: string;
}

export default function Leaderboard({ score }: LeaderboardProps) {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [playerName, setPlayerName] = useState<string>('');

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    const response = await fetch('/api/leaderboard');
    const data = await response.json();
    setScores(data);
  };

  const submitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName) return;

    await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, name: playerName }),
    });
    
    setPlayerName('');
    await fetchScores();
  };

  return (
    <div className="w-64">
      <form onSubmit={submitScore} className="mb-4">
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name"
          className="w-full p-2 mb-2 border rounded text-black"
        />
        <button
          type="submit"
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Submit Score
        </button>
      </form>
      
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="text-lg font-bold mb-2 text-black">Top Scores</h3>
        <ul className="space-y-2">
          {scores.map((entry) => (
            <li key={entry._id} className="flex justify-between text-black">
              <span>{entry.name}</span>
              <span>{entry.score}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}