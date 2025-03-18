'use client';

import Image from 'next/image';
import { FoodItem as FoodItemType } from '../types/game';

const foodImages: Record<string, string> = {
  'protein': '/food-item/chicken..png',
  'carb': '/food-item/bread..png',
  'fat': '/food-item/junks..png',
  'sugar': '/food-item/sugar..png',
};

export default function FoodItem({ x, y, type }: FoodItemType) {
  // Fallback to sugar image if type isn't found
  const imageSrc = foodImages[type] || foodImages['sugar'];

  return (
    <div
      className="absolute animate-fall"
      style={{ left: `${x}px`, top: `${y}px` }}
    >
      <Image
        src={imageSrc}
        alt={type}
        width={30}
        height={30}
        className="object-contain"
      />
    </div>
  );
}