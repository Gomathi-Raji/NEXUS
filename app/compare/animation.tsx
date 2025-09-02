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
      opacity: 0.08 + Math.random() * 0.12, // Reduced opacity for better text visibility
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
      ][Math.floor(Math.random() * 10)]
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
            filter: 'blur(0.3px)', // Reduced blur
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

// Improved animated glass shine overlay component
export default function GlassShineAnimation() {
  const [shinePos, setShinePos] = useState(-0.2);
  
  useEffect(() => {
    let running = true;
    let lastTime = 0;
    
    function animate(currentTime) {
      if (currentTime - lastTime > 16) { // ~60fps
        setShinePos(prev => {
          let next = prev + 0.008; // Smoother, more noticeable speed
          if (next > 1.2) {
            // Add a pause before restarting
            setTimeout(() => {
              if (running) setShinePos(-0.2);
            }, 2000);
            return 1.2;
          }
          return next;
        });
        lastTime = currentTime;
      }
      if (running) requestAnimationFrame(animate);
    }
    animate();
    return () => { running = false; };
  }, []);

  return (
    <>
      {/* Main shine effect */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
        style={{ zIndex: 1 }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-20%',
            width: '40%',
            height: '140%',
            background: `linear-gradient(90deg, 
              transparent 0%, 
              rgba(255,255,255,0.1) 40%, 
              rgba(255,255,255,0.3) 50%, 
              rgba(255,255,255,0.1) 60%, 
              transparent 100%)`,
            transform: `translateX(${shinePos * 120}%) skewX(-20deg)`,
            filter: 'blur(1px)',
            transition: shinePos >= 1.2 ? 'none' : 'transform 0.1s ease-out',
          }}
        />
      </div>
      
      {/* Subtle glass reflection effect */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: `linear-gradient(135deg, 
            rgba(255,255,255,0.1) 0%, 
            transparent 20%, 
            transparent 80%, 
            rgba(255,255,255,0.05) 100%)`,
          zIndex: 0,
        }}
      />
    </>
  );
}

// Demo card component to show the effect
export function DemoCard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 flex items-center justify-center">
      <BackgroundParticles />
      
      <div className="relative max-w-md w-full">
        {/* Card with glass effect */}
        <div 
          className="relative bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl"
          style={{ 
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <GlassShineAnimation />
          
          {/* Card content */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Github className="w-8 h-8 text-white/90" />
              <h1 className="text-2xl font-bold text-white">GitHub Profile</h1>
            </div>
            
            <p className="text-white/80 mb-6 leading-relaxed">
              Welcome to my coding portfolio. Here you'll find my latest projects, 
              contributions, and technical expertise across various programming languages.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">Repositories</span>
                <span className="text-white/90 font-semibold">42</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">Followers</span>
                <span className="text-white/90 font-semibold">1.2k</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">Following</span>
                <span className="text-white/90 font-semibold">89</span>
              </div>
            </div>
            
            <button className="w-full mt-6 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg py-3 px-4 font-medium transition-all duration-200 backdrop-blur-sm">
              View Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}