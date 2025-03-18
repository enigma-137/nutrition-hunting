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
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fetch('/api/leaderboard');
      if (!response.ok) {
        throw new Error('Failed to fetch scores');
      }
      const data = await response.json();
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format from server');
      }
      
      setScores(data);
    } catch (err) {
      console.error('Error fetching scores:', err);
      setError('Failed to load leaderboard');
      setScores([]);
    } finally {
      setIsLoading(false);
    }
  };

  const submitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      setError('');
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, name: playerName.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit score');
      }

      setPlayerName('');
      await fetchScores();
    } catch (err) {
      console.error('Error submitting score:', err);
      setError('Failed to submit score');
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={submitScore} className="mb-6">
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name"
          className="w-full p-3 mb-3 border rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength={20}
        />
        <button
          type="submit"
          className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200"
          disabled={!playerName.trim()}
        >
          Submit Score
        </button>
      </form>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Top Scores</h3>
        {isLoading ? (
          <div className="text-center py-4 text-gray-500">Loading scores...</div>
        ) : scores.length > 0 ? (
          <ul className="space-y-3">
            {scores.map((entry) => (
              <li 
                key={entry._id} 
                className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center">
                  <span className="font-medium text-gray-800">{entry.name}</span>
                </div>
                <span className="text-blue-600 font-bold">{entry.score}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-4 text-gray-500">No scores yet</div>
        )}
      </div>
    </div>
  );
}