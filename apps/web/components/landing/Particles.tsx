"use client";

import { useEffect, useState } from "react";

interface Particle {
  id: number;
  left: string;
  animationDelay: string;
  animationDuration: string;
  size: number;
}

export function Particles() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate particles only on client side
    const generated: Particle[] = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 20}s`,
      animationDuration: `${15 + Math.random() * 20}s`,
      size: 2 + Math.random() * 4,
    }));
    setParticles(generated);
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="particles" aria-hidden="true">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: particle.left,
            animationDelay: particle.animationDelay,
            animationDuration: particle.animationDuration,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
        />
      ))}
    </div>
  );
}
