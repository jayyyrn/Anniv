import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Timer, RefreshCw, Eye, Sparkles, Wand2 } from 'lucide-react';
import { useGameConfig } from '../context/GameConfigContext';

interface Tile {
  id: number; // 0 to 8. 8 is the blank tile.
  correctRow: number;
  correctCol: number;
  currentPosition: number; // current flat index in 1D array (0 to 8)
}

interface Level3SlidingProps {
  onComplete: () => void;
}

export default function Level3Sliding({ onComplete }: Level3SlidingProps) {
  const { config } = useGameConfig();
  const { slidingPuzzlePhoto, playerName } = config;
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [blankPos, setBlankPos] = useState(8);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isSolved, setIsSolved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [rainingHearts, setRainingHearts] = useState<{ id: number; left: string; delay: string; scale: number }[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  // Initialize Solvable sliding board
  const initializeBoard = () => {
    setIsSolved(false);
    setMoves(0);
    setTimer(0);
    setIsActive(true);

    // Solve State Initial list
    let tempTiles: Tile[] = Array.from({ length: 9 }).map((_, i) => ({
      id: i,
      correctRow: Math.floor(i / 3),
      correctCol: i % 3,
      currentPosition: i
    }));

    // Scramble by making 40-50 random valid slides to guarantee solvability
    let crrBlankPos = 8;
    const getRandomValidMove = (blank: number) => {
      const row = Math.floor(blank / 3);
      const col = blank % 3;
      const validIndices: number[] = [];

      if (row > 0) validIndices.push(blank - 3); // Up
      if (row < 2) validIndices.push(blank + 3); // Down
      if (col > 0) validIndices.push(blank - 1); // Left
      if (col < 2) validIndices.push(blank + 1); // Right

      return validIndices[Math.floor(Math.random() * validIndices.length)];
    };

    // Make 60 valid swaps to shuffle
    for (let loop = 0; loop < 60; loop++) {
      const targetPos = getRandomValidMove(crrBlankPos);
      
      // Swap tiles
      const tileA = tempTiles.find(t => t.currentPosition === crrBlankPos)!;
      const tileB = tempTiles.find(t => t.currentPosition === targetPos)!;
      
      tileA.currentPosition = targetPos;
      tileB.currentPosition = crrBlankPos;
      
      crrBlankPos = targetPos;
    }

    setTiles(tempTiles);
    setBlankPos(crrBlankPos);
  };

  useEffect(() => {
    initializeBoard();
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [slidingPuzzlePhoto]);

  // Timer counter
  useEffect(() => {
    if (isActive && !isSolved) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isActive, isSolved]);

  const handleTileClick = (clickedTile: Tile) => {
    if (isSolved || !isActive) return;

    const clickedPos = clickedTile.currentPosition;
    const clickRow = Math.floor(clickedPos / 3);
    const clickCol = clickedPos % 3;

    const blankRow = Math.floor(blankPos / 3);
    const blankCol = blankPos % 3;

    // Check if clicked tile is adjacent to blank spot
    const isAdjacent = 
      (Math.abs(clickRow - blankRow) === 1 && clickCol === blankCol) ||
      (Math.abs(clickCol - blankCol) === 1 && clickRow === blankRow);

    if (isAdjacent) {
      // Swap positions
      const updatedTiles = tiles.map(t => {
        if (t.id === clickedTile.id) {
          return { ...t, currentPosition: blankPos };
        }
        if (t.id === 8) { // The blank tile
          return { ...t, currentPosition: clickedPos };
        }
        return t;
      });

      setTiles(updatedTiles);
      setBlankPos(clickedPos);
      setMoves(prev => prev + 1);

      // Check if solved
      const solved = updatedTiles.every(t => t.id === t.currentPosition);
      if (solved) {
        setIsSolved(true);
        triggerHeartRain();
      }
    }
  };

  // Instant solve logic (Cheat / helper for absolute romantic accessibility so they never get angry at the puzzle!)
  const triggerInstantSolve = () => {
    const solvedTiles = tiles.map(t => ({
      ...t,
      currentPosition: t.id
    }));
    setTiles(solvedTiles);
    setBlankPos(8);
    setIsSolved(true);
    triggerHeartRain();
  };

  // Raining Hearts visual feedback on correct solving
  const triggerHeartRain = () => {
    const rain = Array.from({ length: 25 }).map((_, i) => ({
      id: Date.now() + i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
      scale: Math.random() * 0.8 + 0.4
    }));
    setRainingHearts(rain);
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // Sorting tiles for rendering 0-8 in linear sequence based on current position
  const sortedTilesForRendering = [...tiles].sort((a, b) => a.currentPosition - b.currentPosition);

  return (
    <div className="relative min-h-screen z-10 flex flex-col items-center justify-center px-4 py-20 max-w-5xl mx-auto">
      
      {/* Level Header/Topic info */}
      <div className="text-center mb-6 w-full max-w-lg">
        <span className="font-sans text-xs tracking-[0.25em] text-rose-gold uppercase font-semibold">
          Challenge III • Sliding Splendour
        </span>
        <h2 className="font-display text-2xl md:text-3xl text-soft-white tracking-widest mt-1 mb-2">
          Restore Our Picture
        </h2>
        <p className="font-serif text-sm md:text-base text-soft-white/70 italic max-w-md mx-auto">
          Our memories sometimes get a bit jumbled, but when they slide together, everything fits perfectly. Slide tiles to complete the image!
        </p>
      </div>

      {/* Controller HUD bar */}
      <div className="flex justify-between items-center w-full max-w-md bg-navy/60 border border-rose-gold/20 rounded-xl px-5 py-3 mb-6 backdrop-blur-md">
        <div className="flex items-center gap-2 text-soft-white/80 font-serif">
          <Sparkles className="w-4 h-4 text-rose-gold" />
          <span>Moves: <strong className="text-gold-accent font-sans">{moves}</strong></span>
        </div>
        
        <div className="flex items-center gap-2 text-soft-white/80 font-serif">
          <Timer className="w-4 h-4 text-rose-gold" />
          <span>Time: <strong className="text-gold-accent font-sans">{formatTime(timer)}</strong></span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onMouseDown={() => setShowPreview(true)}
            onMouseUp={() => setShowPreview(false)}
            onMouseLeave={() => setShowPreview(false)}
            onTouchStart={() => setShowPreview(true)}
            onTouchEnd={() => setShowPreview(false)}
            id="sliding-preview-button"
            className="p-1.5 text-soft-white/60 hover:text-rose-gold transition-colors rounded-md hover:bg-white/5 active:scale-95 cursor-pointer"
            title="Hold to preview reference image"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button 
            onClick={initializeBoard}
            id="sliding-reset-button"
            className="p-1.5 text-soft-white/60 hover:text-rose-gold hover:rotate-180 transition-all duration-500 rounded-md hover:bg-white/5 active:scale-95 cursor-pointer"
            title="Suffle puzzle"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main game board */}
      <div className="relative w-full max-w-[340px] md:max-w-[380px] aspect-square p-3 glowing-card rounded-2xl bg-navy/80 flex flex-col justify-center items-center">
        
        {/* The 3x3 Sliding Puzzle Grid */}
        <div className="grid grid-cols-3 gap-1.5 w-full h-full relative">
          {sortedTilesForRendering.map((tile) => {
            const isBlank = tile.id === 8;
            
            // If the blank tile is here, show a sweet soft heart outline placeholder
            if (isBlank && !isSolved) {
              return (
                <div 
                  key={tile.id}
                  className="bg-navy/90 border border-dashed border-rose-gold/20 rounded-lg flex items-center justify-center aspect-square"
                >
                  <Heart className="w-6 h-6 text-rose-gold/25 stroke-[1]" />
                </div>
              );
            }

            // Normal tiles render background offsets
            return (
              <motion.div
                key={tile.id}
                layoutId={`tile-${tile.id}`}
                onClick={() => handleTileClick(tile)}
                className={`cursor-pointer rounded-lg border border-rose-gold/10 overflow-hidden aspect-square select-none hover:border-gold-accent transition-colors duration-300 relative ${isSolved ? 'pointer-events-none border-transparent' : ''}`}
                style={{
                  backgroundImage: `url(${slidingPuzzlePhoto})`,
                  backgroundSize: '300% 300%',
                  backgroundPosition: `${tile.correctCol * 50}% ${tile.correctRow * 50}%`
                }}
              >
                {/* Thin overlay coordinates representing fine romantic craftsmanship */}
                {!isSolved && (
                  <div className="absolute top-1.5 left-1.5 w-4 h-4 rounded bg-black/60 text-[10px] font-sans flex items-center justify-center text-rose-gold/80 border border-rose-gold/20">
                    {tile.id + 1}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Temporary Reference Image Preview Overlay */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-3 z-30 bg-navy/95 border border-rose-gold/40 rounded-xl overflow-hidden p-2"
            >
              <img
                src={slidingPuzzlePhoto}
                alt="Full reference"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm p-2 rounded-lg text-center text-xs font-serif text-rose-gold border border-rose-gold/20">
                Reference Image
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Auto solver Helper tool shortcut */}
      {!isSolved && (
        <button
          onClick={triggerInstantSolve}
          id="sliding-bypass-button"
          className="mt-6 flex items-center gap-1 text-xs font-serif text-rose-gold/40 hover:text-rose-gold/80 transition-all cursor-pointer focus:outline-none"
        >
          <Wand2 className="w-3 h-3" />
          <span>Solve Puzzle for Me ♥</span>
        </button>
      )}

      {/* Hearts celebration rain on solve completion */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        {rainingHearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ y: "-10vh", x: heart.left, opacity: 0 }}
            animate={{ y: "110vh", opacity: [0, 1, 1, 0] }}
            transition={{ duration: 3.5, delay: parseFloat(heart.delay), ease: "linear" }}
            className="absolute text-rose-gold text-2xl"
            style={{ transform: `scale(${heart.scale})` }}
          >
            ♥
          </motion.div>
        ))}
      </div>

      {/* Bloom layout transition modal when solved */}
      <AnimatePresence>
        {isSolved && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="glowing-card w-full max-w-md rounded-2xl p-8 text-center backdrop-blur-2xl"
            >
              <div className="mb-6 flex justify-center">
                <div className="p-4 rounded-full bg-rose-gold/10 border border-rose-gold/30">
                  <Heart className="w-12 h-12 text-rose-gold fill-rose-gold animate-beat" />
                </div>
              </div>

              <h3 className="font-display text-xl md:text-2xl text-rose-gold tracking-widest mb-4">
                Full Picture Complete!
              </h3>

              <div className="w-full h-44 rounded-xl overflow-hidden mb-6 border border-rose-gold/30 relative">
                <img
                  src={slidingPuzzlePhoto}
                  alt="Completed Memory"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover shadow-[0_0_20px_var(--glow)]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              
              <p className="font-serif text-lg text-soft-white italic mb-4 leading-relaxed">
                &ldquo;Our image is restored. Every fine detail is back to where it belongs, radiating with gorgeous warmth. You've cleared the entire trail!&rdquo;
              </p>

              <div className="text-xs font-sans text-soft-white/60 mb-8 max-w-xs mx-auto">
                Solved puzzle in <strong className="text-rose-gold">{moves} slides</strong>. You have unlocked your ultimate reward gift, {playerName}!
              </div>

              <button
                onClick={onComplete}
                id="sliding-final-reward-btn"
                className="glowing-btn w-full rounded-xl py-4 font-semibold text-xs cursor-pointer"
              >
                Claim Your Gift →
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
