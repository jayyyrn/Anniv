import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Timer, RefreshCw, Sparkles } from 'lucide-react';
import { useGameConfig } from '../context/GameConfigContext';

interface MemoryCard {
  uniqueId: number;
  photoIdx: number;
  src: string;
  caption: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface HeartParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  angle: number;
  speed: number;
}

interface Level1MemoryProps {
  onComplete: () => void;
}

export default function Level1Memory({ onComplete }: Level1MemoryProps) {
  const { config } = useGameConfig();
  const { photos, playerName } = config;
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isWon, setIsWon] = useState(false);
  const [particles, setParticles] = useState<HeartParticle[]>([]);
  const intervalRef = useRef<number | null>(null);

  // Initialize and shuffle cards
  const initializeGame = () => {
    // Take exactly 8 photos and duplicate them to make 16 cards (4x4)
    const cardData = photos.slice(0, 8).flatMap((photo, index) => [
      {
        uniqueId: index * 2,
        photoIdx: index,
        src: photo.src,
        caption: photo.caption,
        isFlipped: false,
        isMatched: false
      },
      {
        uniqueId: index * 2 + 1,
        photoIdx: index,
        src: photo.src,
        caption: photo.caption,
        isFlipped: false,
        isMatched: false
      }
    ]);

    // Fisher-Yates shuffle
    const shuffled = [...cardData];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setCards(shuffled);
    setSelectedIds([]);
    setMoves(0);
    setTimer(0);
    setIsWon(false);
    setIsActive(true);
  };

  // Run on mount or when photos change
  useEffect(() => {
    initializeGame();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [photos]);

  // Timer logic
  useEffect(() => {
    if (isActive && !isWon) {
      intervalRef.current = window.setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else if (isWon && intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, isWon]);

  // Handle Match heart burst animation
  const spawnMatchParticles = (cardIndex: number) => {
    // Generate 12 temporary bursting hearts around screen
    const newParticles: HeartParticle[] = Array.from({ length: 15 }).map((_, i) => ({
      id: Date.now() + i,
      x: 40 + Math.random() * 20, // percentage x
      y: 40 + Math.random() * 20, // percentage y
      color: i % 2 === 0 ? '#ff4d6d' : '#e8c97e',
      angle: Math.random() * Math.PI * 2,
      speed: Math.random() * 3 + 2
    }));
    
    setParticles((prev) => [...prev, ...newParticles]);
    
    // Clear particles after 1.2s
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 1200);
  };

  // Card click logic
  const handleCardClick = (uniqueId: number) => {
    if (!isActive || isWon) return;
    
    // Ignore clicks if 2 cards are already flipped but waiting matching evaluation,
    // or if card is already active
    if (selectedIds.length >= 2) return;
    
    const clickedCard = cards.find((c) => c.uniqueId === uniqueId);
    if (!clickedCard || clickedCard.isFlipped || clickedCard.isMatched) return;

    // Flip card
    const updatedCards = cards.map((c) => 
      c.uniqueId === uniqueId ? { ...c, isFlipped: true } : c
    );
    setCards(updatedCards);

    const newSelected = [...selectedIds, uniqueId];
    setSelectedIds(newSelected);

    if (newSelected.length === 2) {
      setMoves((prev) => prev + 1);
      const [firstId, secondId] = newSelected;
      const firstCard = updatedCards.find((c) => c.uniqueId === firstId)!;
      const secondCard = updatedCards.find((c) => c.uniqueId === secondId)!;

      if (firstCard.photoIdx === secondCard.photoIdx) {
        // MATCH FOUND
        setTimeout(() => {
          setCards((prevCards) => 
            prevCards.map((c) => 
              c.uniqueId === firstId || c.uniqueId === secondId 
                ? { ...c, isMatched: true } 
                : c
            )
          );
          setSelectedIds([]);
          spawnMatchParticles(firstCard.photoIdx);
          
          // Check win condition
          setTimeout(() => {
            setCards((currCards) => {
              const allMatched = currCards.every((c) => c.isMatched);
              if (allMatched) {
                setIsWon(true);
              }
              return currCards;
            });
          }, 400);

        }, 400);
      } else {
        // NO MATCH - FLIP BACK DOWN
        setTimeout(() => {
          setCards((prevCards) => 
            prevCards.map((c) => 
              c.uniqueId === firstId || c.uniqueId === secondId 
                ? { ...c, isFlipped: false } 
                : c
            )
          );
          setSelectedIds([]);
        }, 1100);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="relative min-h-screen z-10 flex flex-col items-center justify-center px-4 py-20 max-w-5xl mx-auto">
      {/* Level Header / Info */}
      <div className="text-center mb-6 w-full max-w-lg">
        <span className="font-sans text-xs tracking-[0.25em] text-rose-gold uppercase font-semibold">
          Challenge I • Sincerity Match
        </span>
        <h2 className="font-display text-2xl md:text-3xl text-soft-white tracking-widest mt-1 mb-2">
          Memory of Us
        </h2>
        <p className="font-serif text-sm md:text-base text-soft-white/70 italic max-w-md mx-auto">
          Match the scattered memory snapshots of our times together. Match them perfectly to unlock the next letter.
        </p>
      </div>

      {/* HUD Bar */}
      <div className="flex justify-between items-center w-full max-w-md bg-navy/60 border border-rose-gold/20 rounded-xl px-5 py-3 mb-6 backdrop-blur-md">
        <div className="flex items-center gap-2 text-soft-white/80 font-serif">
          <Sparkles className="w-4 h-4 text-rose-gold" />
          <span>Moves: <strong className="text-gold-accent font-sans">{moves}</strong></span>
        </div>
        
        <div className="flex items-center gap-2 text-soft-white/80 font-serif">
          <Timer className="w-4 h-4 text-rose-gold" />
          <span>Time: <strong className="text-gold-accent font-sans">{formatTime(timer)}</strong></span>
        </div>

        <button 
          onClick={initializeGame}
          id="memory-reset-button"
          className="p-1.5 text-soft-white/60 hover:text-rose-gold hover:rotate-180 transition-all duration-500 rounded-md hover:bg-white/5 active:scale-95 cursor-pointer"
          title="Reset puzzle board"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 4x4 Grid Board */}
      <div className="grid grid-cols-4 gap-2.5 md:gap-4 w-full max-w-[480px] aspect-square p-2 bg-navy/60 glowing-card rounded-2xl relative">
        {cards.map((card) => {
          const isFlipped = card.isFlipped || card.isMatched;
          return (
            <div
              key={card.uniqueId}
              onClick={() => handleCardClick(card.uniqueId)}
              id={`memory-card-${card.uniqueId}`}
              className="card-perspective relative cursor-pointer aspect-square rounded-lg overflow-hidden border border-rose-gold/10 hover:border-rose-gold/40 transition-all duration-300"
            >
              <div className={`card-inner w-full h-full relative duration-500 is-back-facing ${isFlipped ? 'is-flipped' : ''}`}>
                {/* Back of Card: Gold Romantic Pattern */}
                <div className="card-back absolute inset-0 bg-gradient-to-br from-[#1b1c35] to-[#0a0a1a] flex flex-col items-center justify-center p-1 border border-rose-gold/20 rounded-lg">
                  <div className="w-5/6 h-5/6 border border-dashed border-rose-gold/10 rounded-md flex items-center justify-center">
                    <Heart className="w-5 h-5 md:w-8 md:h-8 text-rose-gold/30 stroke-[1.5]" />
                  </div>
                </div>

                {/* Front of Card: Photo memory */}
                <div className="card-front absolute inset-0 bg-navy overflow-hidden rounded-lg">
                  <img
                    src={card.src}
                    alt="Memory"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-all duration-300 transform hover:scale-105"
                  />
                  {card.isMatched && (
                    <div className="absolute inset-0 bg-rose-gold/25 flex items-center justify-center backdrop-blur-[1px]">
                      <Heart className="w-8 h-8 text-gold-accent fill-gold-accent animate-ping absolute" />
                      <Heart className="w-8 h-8 text-gold-accent fill-gold-accent" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confetti Particle Overlay for instant visual gratification */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, scale: 0.5, x: `${p.x}%`, y: `${p.y}%` }}
            animate={{ 
              opacity: 0, 
              scale: 1.5,
              x: `${p.x + Math.cos(p.angle) * p.speed * 10}%`, 
              y: `${p.y + Math.sin(p.angle) * p.speed * 10}%` 
            }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute z-40 text-xl"
            style={{ color: p.color }}
          >
            ♥
          </motion.div>
        ))}
      </div>

      {/* Completion Modal */}
      <AnimatePresence>
        {isWon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glowing-card w-full max-w-md rounded-2xl p-8 text-center backdrop-blur-2xl relative overflow-hidden"
            >
              {/* Heart sparkle badge */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <Heart className="w-16 h-16 text-rose-gold fill-rose-gold scale-110" />
                  <Sparkles className="w-6 h-6 text-gold-accent absolute top-0 -right-2 animate-bounce" />
                </div>
              </div>

              <h3 className="font-display text-xl md:text-2xl text-rose-gold tracking-widest mb-4">
                Memory Un locked!
              </h3>
              
              <p className="font-serif text-lg text-soft-white italic mb-4 leading-relaxed">
                &ldquo;Just like this puzzle, every scattered piece of my life fell beautifully into place the moments I matched with you.&rdquo;
              </p>

              <div className="text-sm font-sans text-soft-white/60 mb-8 max-w-xs mx-auto">
                Completed in <strong className="text-rose-gold">{moves} moves</strong> over <strong className="text-rose-gold">{formatTime(timer)}</strong>. Let's head to the next stage of our story, {playerName}!
              </div>

              <button
                onClick={onComplete}
                id="memory-next-level-btn"
                className="glowing-btn w-full rounded-xl py-4 font-semibold text-sm cursor-pointer"
              >
                Next Challenge →
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
