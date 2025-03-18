'use client';

import { useState, useEffect, useCallback } from 'react';
import Hunter from '../components/Hunter';
import FoodItem from '../components/FoodItem';
import Beast from '../components/Beast';
import Scoreboard from '../components/Scoreboard';
import Leaderboard from '@/components/LeadershipBoard';
import { HunterState, FoodItem as FoodItemType, BeastState } from '../types/game';

export default function Game() {
  const [hunter, setHunter] = useState<HunterState>({
    x: 50,
    y: 20,  // Base height from ground
    speed: 5,
    weight: 0,
    muscle: 0,
    isJumping: false,
    jumpVelocity: 0
  });
  const [foodItems, setFoodItems] = useState<FoodItemType[]>([]);
  const [beast, setBeast] = useState<BeastState>({ x: -100, speed: 3 });
  const [score, setScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false); // Track client mount

  // Mark component as mounted on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const checkCollision = useCallback((obj1: HunterState, obj2: FoodItemType): boolean => {
    return Math.abs(obj1.x - obj2.x) < 50 && Math.abs(obj1.y - obj2.y) < 50;
  }, []);

  const updateHunterStats = useCallback((food: FoodItemType) => {
    setHunter((prev) => ({
      ...prev,
      speed:
        food.effect === 'speed'
          ? prev.speed + food.value
          : food.effect === 'weight'
          ? Math.max(2, prev.speed - 2)
          : prev.speed,
      weight: food.effect === 'weight' ? prev.weight + food.value : prev.weight,
      muscle: food.effect === 'muscle' ? prev.muscle + food.value : prev.muscle,
    }));
    setScore((prev) => prev + food.points);
  }, []);

  const updateJump = useCallback(() => {
    if (hunter.isJumping || hunter.y > 20) {
      setHunter((prev) => {
        const gravity = 0.8;
        const newVelocity = prev.jumpVelocity - gravity;
        const newY = Math.max(20, prev.y + newVelocity);
        
        return {
          ...prev,
          y: newY,
          jumpVelocity: newVelocity,
          isJumping: newY > 20 || newVelocity > 0
        };
      });
    }
  }, [hunter.isJumping, hunter.y, hunter.jumpVelocity]);

  const updateGame = useCallback(() => {
    // Update beast position
    setBeast((prev) => {
      const newX = prev.x + prev.speed;
      // Check if hunter is jumping over the beast
      const isJumpingOverBeast = hunter.y > 70 && Math.abs(hunter.x - newX) < 50;
      
      if (isJumpingOverBeast) {
        // Reward for jumping over beast
        setScore(prevScore => prevScore + 50);
        return { ...prev, x: -100 }; // Reset beast position
      }
      return { ...prev, x: newX };
    });
    
    // Check food collisions
    foodItems.forEach((food, index) => {
      if (checkCollision(hunter, food)) {
        updateHunterStats(food);
        setFoodItems((prev) => prev.filter((_, i) => i !== index));
      }
    });

    // Check game over - only if not jumping over beast
    if (beast.x >= hunter.x - 50 && hunter.y <= 70) {
      setGameOver(true);
    }
  }, [hunter.x, hunter.y, foodItems, beast.x, checkCollision, updateHunterStats]);

  // Game loop
  useEffect(() => {
    if (!isMounted) return;
    const gameLoop = setInterval(() => {
      if (!gameOver) {
        updateGame();
        spawnFood();
        updateJump();
      }
    }, 1000 / 60);
    return () => clearInterval(gameLoop);
  }, [isMounted, gameOver, updateGame, updateJump]);

  // Keyboard controls
  useEffect(() => {
    if (!isMounted) return;
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hunter.x > 0) {
        setHunter((prev) => ({ ...prev, x: prev.x - prev.speed }));
      }
      if (e.key === 'ArrowRight' && hunter.x < 750) {
        setHunter((prev) => ({ ...prev, x: prev.x + prev.speed }));
      }
      if (e.key === ' ' || e.key === 'ArrowUp') {
        // Only allow jumping if not already jumping
        if (!hunter.isJumping) {
          setHunter((prev) => ({
            ...prev,
            isJumping: true,
            jumpVelocity: 15 + prev.muscle / 10 - prev.weight / 20 // Jump height affected by stats
          }));
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [hunter, isMounted]);

  const spawnFood = () => {
    if (Math.random() < 0.02) {
      const foodTypes: FoodItemType[] = [
        { type: 'protein', points: 20, effect: 'muscle', value: 5, x: 0, y: -20 },
        { type: 'carb', points: 15, effect: 'speed', value: 2, x: 0, y: -20 },
        { type: 'fat', points: 10, effect: 'weight', value: 5, x: 0, y: -20 },
        { type: 'sugar', points: 5, effect: 'weight', value: 10, x: 0, y: -20 },
      ];
      const food = {
        ...foodTypes[Math.floor(Math.random() * foodTypes.length)],
        x: Math.random() * 750,
      };
      setFoodItems((prev) => [...prev, food]);
    }
  };

  // Render nothing or a loading state until mounted
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-400 to-sky-600 flex items-center justify-center">
        <div className="animate-pulse text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-sky-600 p-4">
      {/* Game Title */}
      <h1 className="text-4xl font-bold text-white text-center mb-8 text-shadow">
        Nutrition Hunter
      </h1>

      {/* Game Container */}
      <div className="max-w-4xl mx-auto relative">
        {/* Game Canvas */}
        <div className="h-[600px] bg-gradient-to-b from-sky-300/50 to-sky-400/50 rounded-lg backdrop-blur-sm border border-white/20 shadow-2xl overflow-hidden relative">
          {/* Game Stats */}
          <Scoreboard score={score} weight={hunter.weight} muscle={hunter.muscle} />
          
          {/* Game Elements */}
          <div className="relative w-full h-full">
            {/* Ground */}
            <div 
              className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-green-800 to-green-600"
              style={{
                boxShadow: '0 -4px 16px rgba(0,0,0,0.2)',
                borderTop: '2px solid rgba(255,255,255,0.2)'
              }}
            />
            
            {/* Game Characters */}
            <Hunter x={hunter.x} y={hunter.y} weight={hunter.weight} muscle={hunter.muscle} />
            {foodItems.map((food, i) => (
              <FoodItem key={i} {...food} />
            ))}
            <Beast x={beast.x} />
          </div>

          {/* Controls Guide */}
          <div className="absolute bottom-4 left-4 text-white/80 text-sm">
            <p>← → : Move</p>
            <p>Space/↑ : Jump</p>
          </div>
        </div>

        {/* Game Over Modal */}
        {gameOver && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white rounded-xl p-8 shadow-2xl max-w-md w-full mx-4">
              <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Game Over!</h2>
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <p className="text-xl text-gray-600">Final Score</p>
                  <p className="text-4xl font-bold text-blue-600">{score}</p>
                </div>
                <Leaderboard score={score} />
                <button
                  className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                  onClick={() => window.location.reload()}
                >
                  Play Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Game Stats Display */}
      <div className="max-w-4xl mx-auto mt-4 grid grid-cols-3 gap-4">
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
          <p className="text-white/80 text-sm">Speed</p>
          <p className="text-white text-2xl font-bold">{hunter.speed.toFixed(1)}</p>
        </div>
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
          <p className="text-white/80 text-sm">Muscle</p>
          <p className="text-white text-2xl font-bold">{hunter.muscle}</p>
        </div>
        <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
          <p className="text-white/80 text-sm">Weight</p>
          <p className="text-white text-2xl font-bold">{hunter.weight}</p>
        </div>
      </div>
    </div>
  );
}