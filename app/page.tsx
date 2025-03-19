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
  const [isMounted, setIsMounted] = useState<boolean>(false); // Track client mount
  const [isMobile, setIsMobile] = useState(false);
  const [activeControls, setActiveControls] = useState<{
    left: boolean;
    right: boolean;
  }>({ left: false, right: false });
  const [countdown, setCountdown] = useState<number>(3);
  const [lives, setLives] = useState<number>(3);
  const [gameState, setGameState] = useState<'instructions' | 'countdown' | 'playing' | 'gameover'>('instructions');
  const [activeTab, setActiveTab] = useState<'summary' | 'leaderboard'>('summary');
  const [consumedItems, setConsumedItems] = useState<{
    protein: number;
    carbs: number;
    fats: number;
    calories: number;
  }>({ protein: 0, carbs: 0, fats: 0, calories: 0 });

  // Function declarations
  const handleFoodCollection = useCallback((foodType: FoodItemType['type']) => {
    setScore(prevScore => {
      let newScore = prevScore;
      switch (foodType) {
        case 'protein':
          newScore += 10;
          setConsumedItems(prev => ({ ...prev, protein: prev.protein + 1 }));
          break;
        case 'carb':
          newScore -= 5;
          setConsumedItems(prev => ({ ...prev, carbs: prev.carbs + 1 }));
          break;
        case 'fat':
          newScore += 0;
          setConsumedItems(prev => ({ ...prev, fats: prev.fats + 1 }));
          break;
        case 'sugar':
          newScore -= 8;
          setConsumedItems(prev => ({ ...prev, carbs: prev.carbs + 1 }));
          break;
      }
      return newScore;
    });
  }, []);

  const checkCollision = useCallback((obj1: HunterState, obj2: FoodItemType): boolean => {
    return Math.abs(obj1.x - obj2.x) < 50 && Math.abs(obj1.y - obj2.y) < 50;
  }, []);

  const addRandomFoodItem = useCallback(() => {
    const generateRandomPosition = (min: number, max: number) => {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    const types = ['protein', 'carb', 'fat', 'sugar'] as const;
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    const effectMap = {
      'protein': 'muscle',
      'carb': 'weight',
      'fat': 'speed',
      'sugar': 'weight'
    } as const;
    
    const pointsMap = {
      'protein': 10,
      'carb': -5,
      'fat': 0,
      'sugar': -8
    } as const;
    
    const newItem: FoodItemType = {
      type: randomType,
      points: pointsMap[randomType],
      effect: effectMap[randomType],
      value: 1,
      x: generateRandomPosition(0, window.innerWidth - 50),
      y: generateRandomPosition(0, window.innerHeight - 50)
    };
    
    setFoodItems(prev => [...prev, newItem]);
  }, []);

  // Mark component as mounted on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Detect mobile device
  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Countdown effect
  useEffect(() => {
    if (!isMounted || gameState !== 'countdown') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          setTimeout(() => {
            setGameState('playing');
          }, 1000); // Show "GO!" for 1 second
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [isMounted, gameState]);

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
  }, [hunter.isJumping, hunter.y]);

  const updateGame = useCallback(() => {
    const { x: hunterX, y: hunterY } = hunter;
    
    // Update beast position
    setBeast((prev) => {
      const newX = prev.x + prev.speed;
      // Check if hunter is jumping over the beast
      const isJumpingOverBeast = hunterY > 70 && Math.abs(hunterX - newX) < 50;
      
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
        handleFoodCollection(food.type);
        setFoodItems((prev) => prev.filter((_, i) => i !== index));
        // Add a new food item to replace the collected one
        addRandomFoodItem();
      }
    });

    // Check collision with beast - only if not jumping over beast
    if (beast.x >= hunterX - 50 && hunterY <= 70) {
      if (lives > 1) {
        setLives(prev => prev - 1);
        setBeast(prev => ({ ...prev, x: -100 })); // Reset beast position
      } else {
        setGameState('gameover');
      }
    }
  }, [hunter, foodItems, beast.x, checkCollision, handleFoodCollection, lives, addRandomFoodItem]);

  // Game loop
  useEffect(() => {
    if (!isMounted || gameState !== 'playing') return;
    
    const gameLoop = setInterval(() => {
      updateGame();
      // Random chance to spawn food
      if (Math.random() < 0.02) {
        addRandomFoodItem();
      }
      updateJump();
    }, 1000 / 60);
    
    return () => clearInterval(gameLoop);
  }, [isMounted, gameState, updateGame, updateJump, addRandomFoodItem]);

  // Continuous movement for mobile
  useEffect(() => {
    if (!isMounted || gameState !== 'playing') return;

    const moveInterval = setInterval(() => {
      if (activeControls.left && hunter.x > 0) {
        setHunter(prev => ({ ...prev, x: prev.x - prev.speed }));
      }
      if (activeControls.right && hunter.x < 750) {
        setHunter(prev => ({ ...prev, x: prev.x + prev.speed }));
      }
    }, 1000 / 60); // 60fps

    return () => clearInterval(moveInterval);
  }, [isMounted, gameState, activeControls, hunter.x, hunter.speed]);

  // Keyboard controls
  useEffect(() => {
    if (!isMounted) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setActiveControls(prev => ({ ...prev, left: true }));
      }
      if (e.key === 'ArrowRight') {
        setActiveControls(prev => ({ ...prev, right: true }));
      }
      if ((e.key === ' ' || e.key === 'ArrowUp') && !hunter.isJumping) {
        setHunter((prev) => ({
          ...prev,
          isJumping: true,
          jumpVelocity: 15 + prev.muscle / 10 - prev.weight / 20
        }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setActiveControls(prev => ({ ...prev, left: false }));
      }
      if (e.key === 'ArrowRight') {
        setActiveControls(prev => ({ ...prev, right: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isMounted, hunter.isJumping, hunter.muscle, hunter.weight]);

  // Touch controls handler
  const handleControlStart = useCallback((action: 'left' | 'right' | 'jump') => {
    if (action === 'left') {
      setActiveControls(prev => ({ ...prev, left: true }));
    } else if (action === 'right') {
      setActiveControls(prev => ({ ...prev, right: true }));
    } else if (action === 'jump' && !hunter.isJumping) {
      setHunter((prev) => ({
        ...prev,
        isJumping: true,
        jumpVelocity: 15 + prev.muscle / 10 - prev.weight / 20
      }));
    }
  }, [hunter.isJumping]);

  const handleControlEnd = useCallback((action: 'left' | 'right') => {
    if (action === 'left') {
      setActiveControls(prev => ({ ...prev, left: false }));
    } else if (action === 'right') {
      setActiveControls(prev => ({ ...prev, right: false }));
    }
  }, []);

  const handlePlayAgain = () => {
    setScore(0);
    setLives(3);
    setConsumedItems({ protein: 0, carbs: 0, fats: 0, calories: 0 });
    setCountdown(3);
    setGameState('countdown');
    setBeast({ x: -100, speed: 3 });
    setHunter({
      x: 50,
      y: 20,
      speed: 5,
      weight: 0,
      muscle: 0,
      isJumping: false,
      jumpVelocity: 0
    });
    setFoodItems([]);
    // Add initial food items
    for (let i = 0; i < 5; i++) {
      addRandomFoodItem();
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
          <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 bg-black/20 backdrop-blur-sm border-b border-white/10">
            <Scoreboard score={score} weight={hunter.weight} muscle={hunter.muscle} />
            <div className="flex items-center gap-2">
              {[...Array(lives)].map((_, i) => (
                <div key={i} className="w-6 h-6 bg-red-500 rounded-full pulse-glow" />
              ))}
            </div>
          </div>
          
          {/* Countdown Overlay */}
          {gameState === 'countdown' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="text-center">
                <div className="text-8xl font-bold text-white animate-countdown mb-4">
                  {countdown === 0 ? "GO!" : countdown}
                </div>
                <div className="text-xl text-white/80">Get Ready!</div>
              </div>
            </div>
          )}
          
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

          {/* Mobile Controls */}
          {isMobile && (
            <div className="absolute bottom-24 left-0 right-0 flex justify-between px-6">
              <div className="flex gap-4">
                <button
                  className="w-16 h-16 bg-white/20 rounded-full backdrop-blur-sm border-2 border-white/40 flex items-center justify-center active:bg-white/30 touch-none"
                  onTouchStart={() => handleControlStart('left')}
                  onTouchEnd={() => handleControlEnd('left')}
                  onMouseDown={() => handleControlStart('left')}
                  onMouseUp={() => handleControlEnd('left')}
                  onMouseLeave={() => handleControlEnd('left')}
                >
                  <span className="text-2xl text-white">←</span>
                </button>
                <button
                  className="w-16 h-16 bg-white/20 rounded-full backdrop-blur-sm border-2 border-white/40 flex items-center justify-center active:bg-white/30 touch-none"
                  onTouchStart={() => handleControlStart('right')}
                  onTouchEnd={() => handleControlEnd('right')}
                  onMouseDown={() => handleControlStart('right')}
                  onMouseUp={() => handleControlEnd('right')}
                  onMouseLeave={() => handleControlEnd('right')}
                >
                  <span className="text-2xl text-white">→</span>
                </button>
              </div>
              <button
                className="w-20 h-20 bg-white/20 rounded-full backdrop-blur-sm border-2 border-white/40 flex items-center justify-center active:bg-white/30 touch-none"
                onTouchStart={() => handleControlStart('jump')}
                onMouseDown={() => handleControlStart('jump')}
              >
                <span className="text-2xl text-white">↑</span>
              </button>
            </div>
          )}

          {/* Controls Guide - Show only on desktop */}
          {!isMobile && (
            <div className="absolute bottom-4 left-4 text-white/80 text-sm">
              <p>← → : Move</p>
              <p>Space/↑ : Jump</p>
            </div>
          )}
        </div>

        {/* Game Over Modal */}
        {gameState === 'gameover' && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
              <h2 className="text-3xl font-bold text-center mb-4 text-gray-800">Game Over!</h2>
              
              <div className="flex border-b border-gray-200">
                <button
                  className={`px-4 py-2 ${activeTab === 'summary' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
                  onClick={() => setActiveTab('summary')}
                >
                  Nutrition Summary
                </button>
                <button
                  className={`px-4 py-2 ${activeTab === 'leaderboard' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
                  onClick={() => setActiveTab('leaderboard')}
                >
                  Leaderboard
                </button>
              </div>

              <div className="mt-4">
                {activeTab === 'summary' ? (
                  <div className="space-y-4">
                    <div className="text-2xl font-bold text-center text-black mb-4">Final Score: {score}</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-100 p-4 rounded-lg">
                        <h3 className="font-bold text-blue-800">Protein Collected</h3>
                        <p className="text-2xl font-bold text-blue-600">{consumedItems.protein}</p>
                        <p className="text-sm text-blue-700">Great source of energy!</p>
                      </div>
                      <div className="bg-red-100 p-4 rounded-lg">
                        <h3 className="font-bold text-red-800">Carbs & Sugar</h3>
                        <p className="text-2xl font-bold text-red-600">{consumedItems.carbs}</p>
                        <p className="text-sm text-red-700">Watch out for excess!</p>
                      </div>
                      <div className="bg-yellow-100 p-4 rounded-lg">
                        <h3 className="font-bold text-yellow-800">Fats Collected</h3>
                        <p className="text-2xl font-bold text-yellow-600">{consumedItems.fats}</p>
                        <p className="text-sm text-yellow-700">Remember moderation!</p>
                      </div>
                      <div className="bg-purple-100 p-4 rounded-lg">
                        <h3 className="font-bold text-purple-800">Nutritional Balance</h3>
                        <p className="text-sm text-purple-700">
                          {score > 50 
                            ? "Excellent balance! You focused on proteins!"
                            : score > 0 
                              ? "Good effort! Keep avoiding sugars and excess carbs!"
                              : "Remember to prioritize proteins and watch those sugars and carbs!"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <p className="text-gray-600 mb-2">
                        {score > 50 
                          ? "Amazing job! You've maintained a great nutritional balance!"
                          : score > 0 
                            ? "Good effort! Keep focusing on proteins and avoiding sugars!"
                            : "Remember to prioritize proteins and watch those sugars and carbs!"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-96">
                    <Leaderboard score={score} />
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-center space-x-4">
                <button
                  onClick={handlePlayAgain}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors"
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

      {/* Instructions Screen */}
      {gameState === 'instructions' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Welcome to Nutrition Hunter!</h2>
            <div className="space-y-4 text-left mb-6">
              <p className="text-gray-700"><span className="font-bold text-green-600">Goal:</span> Collect healthy foods and maintain a balanced diet!</p>
              <div className="space-y-2">
                <p className="font-semibold text-gray-800">Food Guide:</p>
                <ul className="list-disc pl-5 text-gray-700">
                  <li><span className="text-blue-600 font-bold">Protein</span>: +10 points (Aim for these!)</li>
                  <li><span className="text-red-600 font-bold">Carbs</span>: -5 points (Avoid excess!)</li>
                  <li><span className="text-yellow-600 font-bold">Fats</span>: 0 points (Moderation is key)</li>
                  <li><span className="text-purple-600 font-bold">Sugar</span>: -8 points (Watch out!)</li>
                </ul>
              </div>
              <p className="text-gray-700"><span className="font-bold text-purple-600">Strategy:</span> Focus on proteins while avoiding sugars and excess carbs!</p>
            </div>
            <button
              onClick={() => setGameState('countdown')}
              className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors"
            >
              Start Game!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}