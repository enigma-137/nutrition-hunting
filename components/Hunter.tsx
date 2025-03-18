'use client';

import Image from 'next/image';

interface HunterProps {
  x: number;
  y: number;
  weight: number;
  muscle: number;
}

export default function Hunter({ x, y, weight, muscle }: HunterProps) {
  return (
    <div
      className="absolute transition-transform duration-100"
      style={{
        left: `${x}px`,
        bottom: `${y}px`,
        transform: `scale(${1 + muscle / 100 - weight / 200})`,
      }}
    >
      <Image
        src="/hunter.png"
        alt="Hunter"
        width={50}
        height={50}
        className="object-contain"
      />
    </div>
  );
}