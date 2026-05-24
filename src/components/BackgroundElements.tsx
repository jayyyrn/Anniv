import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Heart } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  fadeSpeed: number;
}

interface RosePetal {
  id: number;
  left: string;
  size: number;
  delay: string;
  duration: string;
  rotation: number;
  sway: number;
}

export default function BackgroundElements() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [petals, setPetals] = useState<RosePetal[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  
  // Web Audio Synth references
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthIntervalRef = useRef<number | null>(null);

  // Generate falling rose petals
  useEffect(() => {
    const generatedPetals: RosePetal[] = Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 12 + 8, // 8px to 20px
      delay: `${Math.random() * 15}s`,
      duration: `${Math.random() * 12 + 10}s`, // 10s to 22s
      rotation: Math.random() * 360,
      sway: Math.random() * 40 - 20
    }));
    setPetals(generatedPetals);
  }, []);

  // Animating canvas Starfield and interactive mouse twinkle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Star definitions
    const stars: { x: number; y: number; size: number; alpha: number; speed: number; phase: number }[] = [];
    const numStars = 100;
    
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random(),
        speed: Math.random() * 0.02 + 0.005,
        phase: Math.random() * Math.PI * 2
      });
    }

    // Interactive mouse particles
    let mouseParticles: Particle[] = [];
    const handleMouseMove = (e: MouseEvent) => {
      if (Math.random() < 0.2) {
        mouseParticles.push({
          x: e.clientX,
          y: e.clientY,
          size: Math.random() * 2 + 1,
          speedX: (Math.random() - 0.5) * 1.5,
          speedY: (Math.random() - 0.5) * 1.5,
          opacity: 0.8,
          fadeSpeed: Math.random() * 0.015 + 0.008
        });
      }
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    const draw = () => {
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, width, height);

      // Draw and twinkle stars
      for (let i = 0; i < numStars; i++) {
        const star = stars[i];
        star.alpha = Math.max(0.1, Math.min(1, Math.sin(star.phase) * 0.4 + 0.6));
        star.phase += star.speed;

        ctx.fillStyle = `rgba(245, 240, 235, ${star.alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Very slow drifting downwards
        star.y += 0.05;
        if (star.y > height) star.y = 0;
      }

      // Draw custom interactive light hearts / sparkles under the cursor
      mouseParticles = mouseParticles.filter(p => p.opacity > 0);
      for (const p of mouseParticles) {
        p.x += p.speedX;
        p.y += p.speedY;
        p.opacity -= p.fadeSpeed;
        
        ctx.fillStyle = `rgba(201, 149, 108, ${p.opacity})`;
        ctx.beginPath();
        // A simple tiny diamond/heart particle sparkle
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Web Audio Romantic Lullaby Synth Synthesizer
  const playLullabyTheme = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // A beautiful slow romantic progression in C Major / A Minor
    // Progression: Fmaj7 -> G6 -> Am7 -> Cmaj7
    const chords = [
      [174.61, 220.00, 261.63, 349.23], // F3, A3, C4, F4
      [196.00, 246.94, 293.66, 392.00], // G3, B3, D4, G4
      [220.00, 261.63, 329.63, 440.00], // A3, C4, E4, A4
      [261.63, 329.63, 392.00, 523.25]  // C4, E4, G4, C5
    ];

    let chordIdx = 0;
    let step = 0;

    const playTone = (freq: number, startTime: number, duration: number, volume = 0.05) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      // Cozy warm mellow sound
      osc.type = 'triangle'; 
      osc.frequency.setValueAtTime(freq, startTime);
      
      gainNode.gain.setValueAtTime(0, startTime);
      // Fade in to prevent clicking
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.1);
      // Smooth decay
      gainNode.gain.setValueAtTime(volume, startTime + duration - 0.2);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const triggerArpeggio = () => {
      const now = ctx.currentTime;
      const currentChord = chords[chordIdx];
      const tempo = 0.5; // 500ms per note

      // Play bass pedal note of current chord
      playTone(currentChord[0] / 2, now, tempo * 8, 0.06);

      // Play arpeggiated upper voicing
      currentChord.forEach((freq, idx) => {
        const delay = idx * tempo;
        playTone(freq, now + delay, tempo * 2, 0.04);
      });

      // Play a beautiful high-register counterpoint bell note
      if (step % 2 === 0) {
        const bellFreq = currentChord[3] * 1.5;
        playTone(bellFreq, now + (tempo * 2), tempo * 3, 0.02);
      }

      step++;
      chordIdx = (chordIdx + 1) % chords.length;
    };

    // Initial play
    triggerArpeggio();
    
    // Cycle chords every 4 seconds
    synthIntervalRef.current = window.setInterval(triggerArpeggio, 4000);
  };

  const stopLullabyTheme = () => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
  };

  const handleToggleSound = () => {
    const isNextMuted = !isMuted;
    setIsMuted(isNextMuted);
    
    if (!isNextMuted) {
      try {
        playLullabyTheme();
      } catch (err) {
        console.error("Synthesizer audio init failed: ", err);
      }
    } else {
      stopLullabyTheme();
    }
  };

  // Auto-start romantic music on very first user interaction (click or tap)
  useEffect(() => {
    let played = false;
    const startAudioOnGesture = () => {
      if (played) return;
      played = true;
      setIsMuted(false);
      try {
        playLullabyTheme();
      } catch (err) {
        console.error("Synthesizer auto-start failed: ", err);
      }
      
      document.removeEventListener('click', startAudioOnGesture);
      document.removeEventListener('touchstart', startAudioOnGesture);
    };

    document.addEventListener('click', startAudioOnGesture);
    document.addEventListener('touchstart', startAudioOnGesture);

    return () => {
      document.removeEventListener('click', startAudioOnGesture);
      document.removeEventListener('touchstart', startAudioOnGesture);
      if (synthIntervalRef.current) {
        clearInterval(synthIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* 1. Global deep dark background and interactive star canvas */}
      <canvas ref={canvasRef} className="starfield-canvas" />

      {/* 2. Sophisticated Dark Radial Ambient Glow layer */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(201,149,108,0.06)_0%,_transparent_75%)]" />

      {/* 3. Sophisticated Dark Romantic Blurred Ambient Nodes */}
      <div className="absolute top-20 left-12 md:left-24 w-8 h-12 bg-rose-gold opacity-20 rounded-full rotate-45 blur-[1px]" />
      <div className="absolute top-40 right-16 md:right-32 w-6 h-10 bg-rose-gold opacity-15 rounded-full -rotate-12 blur-[1px]" />
      <div className="absolute bottom-24 left-1/4 w-7 h-11 bg-rose-gold opacity-25 rounded-full rotate-[110deg] blur-[1px]" />
      <div className="absolute bottom-40 right-14 md:right-24 w-8 h-12 bg-rose-gold opacity-10 rounded-full -rotate-45 blur-[1px]" />

      {/* 4. Elegant top and bottom shadow fades to frame the interface */}
      <div className="absolute top-0 w-full h-32 bg-gradient-to-b from-navy to-transparent opacity-80" />
      <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-navy to-transparent opacity-80" />

      {/* Floating Falling Rose Petals */}
      {petals.map((petal) => (
        <div
          key={petal.id}
          className="petal"
          style={{
            left: petal.left,
            width: `${petal.size}px`,
            height: `${petal.size * 0.75}px`,
            animationDelay: petal.delay,
            animationDuration: petal.duration,
            transform: `rotate(${petal.rotation}deg)`,
            '--sway-x': `${petal.sway}px`
          } as React.CSSProperties}
        />
      ))}

      {/* Faint Floating Hearts in the background rising vertically */}
      <div className="absolute inset-0 z-0">
        {Array.from({ length: 6 }).map((_, i) => {
          const size = Math.random() * 20 + 10;
          return (
            <Heart
              key={i}
              className="floating-heart"
              style={{
                left: `${15 + i * 15 + Math.random() * 5}%`,
                width: `${size}px`,
                height: `${size}px`,
                animationDelay: `${i * 3.5}s`,
                animationDuration: `${12 + Math.random() * 6}s`,
                fill: 'currentColor'
              }}
            />
          );
        })}
      </div>

      {/* Music Toggle HUD (Top Right of screen) */}
      <div className="fixed top-4 right-4 z-50 pointer-events-auto">
        <button
          onClick={handleToggleSound}
          id="music-toggle-button"
          className="flex items-center gap-2 rounded-full px-4 py-2 border border-rose-gold/30 bg-navy/80 backdrop-blur-md text-xs text-soft-white hover:text-rose-gold transition-all duration-300 shadow-lg hover:border-rose-gold/60 focus:outline-none"
          title="Toggle Love Ambient Chiptune music"
        >
          {isMuted ? (
            <>
              <VolumeX className="w-4 h-4 text-rose-gold/60" />
              <span>Music: OFF</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-rose-gold animate-bounce" />
              <span className="text-rose-gold font-medium">Music: ON 🌸</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
