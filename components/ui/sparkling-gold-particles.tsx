"use client";

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SparklingGoldParticlesProps {
  className?: string;
  particleCount?: number;
  size?: 'sm' | 'md' | 'lg';
  intensity?: 'low' | 'medium' | 'high';
  animationSpeed?: 'slow' | 'normal' | 'fast';
}

export const SparklingGoldParticles: React.FC<SparklingGoldParticlesProps> = ({
  className,
  particleCount = 50,
  size = 'md',
  intensity = 'medium',
  animationSpeed = 'normal'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle class
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      hue: number;
      saturation: number;
      lightness: number;
      sparkleIntensity: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * (size === 'sm' ? 2 : size === 'md' ? 4 : 6) + 1;
        this.speedX = (Math.random() - 0.5) * (animationSpeed === 'slow' ? 0.5 : animationSpeed === 'normal' ? 1 : 2);
        this.speedY = (Math.random() - 0.5) * (animationSpeed === 'slow' ? 0.5 : animationSpeed === 'normal' ? 1 : 2);
        this.opacity = Math.random() * 0.8 + 0.2;
        this.hue = Math.random() * 60 + 30; // Gold to amber range
        this.saturation = Math.random() * 30 + 70; // High saturation
        this.lightness = Math.random() * 30 + 50; // Medium to high lightness
        this.sparkleIntensity = intensity === 'low' ? 0.3 : intensity === 'medium' ? 0.6 : 1;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Wrap around edges
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;

        // Add some sparkle effect
        this.opacity = Math.sin(Date.now() * 0.001 + this.x * 0.01) * 0.3 + 0.7;
      }

      draw() {
        if (!ctx) return;

        ctx.save();
        ctx.globalAlpha = this.opacity * this.sparkleIntensity;
        
        // Create gradient for each particle
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2);
        gradient.addColorStop(0, `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, 1)`);
        gradient.addColorStop(0.5, `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, 0.8)`);
        gradient.addColorStop(1, `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, 0)`);

        // Draw particle with glow effect
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Add sparkle lines for high intensity
        if (this.sparkleIntensity > 0.7) {
          ctx.strokeStyle = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.opacity * 0.6})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(this.x - this.size * 2, this.y);
          ctx.lineTo(this.x + this.size * 2, this.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(this.x, this.y - this.size * 2);
          ctx.lineTo(this.x, this.y + this.size * 2);
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    // Create particles
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Animation loop
    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background gradient
      const bgGradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
      );
      bgGradient.addColorStop(0, 'rgba(255, 215, 0, 0.05)');
      bgGradient.addColorStop(0.5, 'rgba(218, 165, 32, 0.03)');
      bgGradient.addColorStop(1, 'rgba(205, 127, 50, 0.01)');
      
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [particleCount, size, intensity, animationSpeed]);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "fixed inset-0 pointer-events-none -z-10",
        className
      )}
    />
  );
};

// Floating golden orbs component
export const FloatingGoldenOrbs: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("fixed inset-0 pointer-events-none -z-10", className)}>
      {/* Large central orb */}
      <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.15),rgba(218,165,32,0.08)_45%,transparent_70%)] blur-3xl animate-pulse" />
      
      {/* Smaller floating orbs */}
      <div className="absolute left-[20%] top-[25%] h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,193,7,0.12),transparent_60%)] blur-2xl animate-bounce" style={{ animationDelay: '0.5s' }} />
      <div className="absolute left-[80%] top-[70%] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(205,127,50,0.10),transparent_60%)] blur-2xl animate-bounce" style={{ animationDelay: '1s' }} />
      <div className="absolute left-[60%] top-[20%] h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.08),transparent_60%)] blur-2xl animate-bounce" style={{ animationDelay: '1.5s' }} />
      <div className="absolute left-[15%] top-[75%] h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(218,165,32,0.06),transparent_60%)] blur-2xl animate-bounce" style={{ animationDelay: '2s' }} />
    </div>
  );
};

// Golden sparkle trail component
export const GoldenSparkleTrail: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("fixed inset-0 pointer-events-none -z-10", className)}>
      <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(255,215,0,0.03)_90deg,transparent_180deg,rgba(218,165,32,0.02)_270deg,transparent_360deg)] animate-spin" style={{ animationDuration: '20s' }} />
      <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_50%_50%,transparent_0deg,rgba(205,127,50,0.02)_90deg,transparent_180deg,rgba(255,193,7,0.03)_270deg,transparent_360deg)] animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
    </div>
  );
};

export default SparklingGoldParticles;
