'use client';

import Image from 'next/image';

interface BeastProps {
  x: number;
}

export default function Beast({ x }: BeastProps) {
  return (
    <div
      className="absolute transition-all duration-100"
      style={{
        left: `${x}px`,
        bottom: '20px',
      }}
    >
      <Image src="/beast.png" alt="Beast" width={50} height={50} />
    </div>
  );
}