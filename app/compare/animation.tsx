import React, { useState, useEffect } from 'react';
import { Github, Code } from 'lucide-react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  opacity: number;
  color: string;
}

// Animated background particles (floating GitHub icons)
export function BackgroundParticles() {
  const [particles, setParticles] = React.useState<Particle[]>([]);
  useEffect(() => {
    // Generate random particles on mount
    const count = 18;
    const arr = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random(),
      y: Math.random(),
      size: 28 + Math.random() * 24,
      speed: 0.15 + Math.random() * 0.25,
      drift: Math.random() * 0.5,
      opacity: 0.12 + Math.random() * 0.18,
      color: [
        '#f1e05a', // JS
        '#2b7489', // TS
        '#b07219', // Java
        '#f34b7d', // C++
        '#00ADD8', // Go
        '#dea584', // Rust
        '#4F5D95', // PHP
        '#701516', // Ruby
        '#ffac45', // Swift
        '#fff', // White
      ][Math.floor(Math.random() * 11)]
    }));
    setParticles(arr);
  }, []);

  React.useEffect(() => {
    let running = true;
    function animate() {
      setParticles(prev => prev.map(p => {
        const y = p.y + p.speed * 0.0025;
        const x = p.x + Math.sin(Date.now() / 800 + p.id) * 0.0007 * p.drift;
        return { ...p, y: y > 1.1 ? -0.12 : y, x };
      }));
      if (running) requestAnimationFrame(animate);
    }
    animate();
    return () => { running = false; };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 10,
        overflow: 'hidden',
      }}
    >
      {particles.map((p, i) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: `calc(${p.x * 100}vw - ${p.size / 2}px)`,
            top: `calc(${p.y * 100}vh - ${p.size / 2}px)`,
            opacity: p.opacity,
            filter: 'blur(0.5px)',
            zIndex: 10,
            transition: 'opacity 0.3s',
          }}
        >
          {i % 2 === 0 ? (
            <Github style={{ color: p.color, width: p.size, height: p.size }} />
          ) : (
            <Code style={{ color: p.color, width: p.size, height: p.size }} />
          )}
        </span>
      ))}
    </div>
  );
}

// Animated glass shine overlay component
export default function GlassShineAnimation() {
  const [shinePos, setShinePos] = useState(0);
  useEffect(() => {
    let running = true;
    function animate() {
      setShinePos(prev => {
        let next = prev + 0.0025; // much slower
        if (next > 1) {
          next = 0;
        }
        return next;
      });
      if (running) requestAnimationFrame(animate);
    }
    animate();
    return () => { running = false; };
  }, []);
  // The gradient moves left-to-right and right-to-left in a loop
  return (
    <div
      className="absolute inset-0 rounded-2xl pointer-events-none"
      style={{
        zIndex: 1,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: 'inherit',
          pointerEvents: 'none',
          background: `linear-gradient(120deg, rgba(255,255,255,0.18) 30%, rgba(255,255,255,0.38) 50%, rgba(255,255,255,0.18) 70%)`,
          opacity: 0.7,
          transform: `translateX(${shinePos * 100 - 20}%) translateY(${shinePos * 40 - 8}%) rotate(-8deg)`,
          filter: 'blur(10px)',
          transition: 'opacity 0.2s',
        }}
      />
    </div>
  );
}
