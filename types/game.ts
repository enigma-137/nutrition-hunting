export interface HunterState {
    x: number;
    y: number;
    speed: number;
    weight: number;
    muscle: number;
    isJumping: boolean;
    jumpVelocity: number;
}

export interface FoodItem {
    x: number;
    y: number;
    type: 'protein' | 'carb' | 'fat' | 'sugar';
    points: number;
    effect: 'muscle' | 'speed' | 'weight';
    value: number;
}

export interface BeastState {
    x: number;
    speed: number;
}