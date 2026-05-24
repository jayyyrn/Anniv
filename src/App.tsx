import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Trophy, Compass, Award, ShieldAlert, Sparkles } from 'lucide-react';

// Custom component imports
import BackgroundElements from './components/BackgroundElements';
import IntroPage from './components/IntroPage';
import Level1Memory from './components/Level1Memory';
import Level2Quiz from './components/Level2Quiz';
import Level3Sliding from './components/Level3Sliding';
import FinalReward from './components/FinalReward';

import { GameConfigProvider, useGameConfig } from './context/GameConfigContext';
import EditPanel from './components/EditPanel';

export default function App() {
  return (
    <GameConfigProvider>
      <AppContent />
    </GameConfigProvider>
  );
}

function AppContent() {
  const { isLoading } = useGameConfig();
  /**
   * Game State Hierarchy
   * 0: Intro Page
   * 1: Level 1 - Memory Matching
   * 2: Level 2 - Love Quiz
   * 3: Level 3 - Sliding Photo Puzzle
   * 4: Final Reward Envelope & Slideshow Slides
   */
  const [step, setStep] = useState(0);

  // Allow traversing back to previously unlocked stages easily
  const [maxUnlockedStep, setMaxUnlockedStep] = useState(0);

  const handleNextStep = () => {
    const nextStep = step + 1;
    setStep(nextStep);
    if (nextStep > maxUnlockedStep) {
      setMaxUnlockedStep(nextStep);
    }
  };

  const handleNavigateStep = (targetStep: number) => {
    if (targetStep <= maxUnlockedStep) {
      setStep(targetStep);
    }
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-navy text-soft-white flex flex-col items-center justify-center">
        <BackgroundElements />
        <div className="relative text-center space-y-4">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="flex justify-center"
          >
            <Heart className="w-16 h-16 text-rose-gold fill-rose-gold" />
          </motion.div>
          <p className="font-serif text-lg text-gold-accent italic tracking-wider animate-pulse">
            Carving your personalized story...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-navy text-soft-white select-none">
      {/* 1. Global Twinkling Stars & synthesized audio chiptunes */}
      <BackgroundElements />

      {/* 2. Embedded in-game editor Workspace overlay */}
      <EditPanel />

      {/* 3. Unified Levels Progress Bar (Renders above components when active, starting from Level 1) */}
      <AnimatePresence>
        {step > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-sm sm:max-w-md px-4 pointer-events-auto"
          >
            <div className="bg-navy/80 border border-rose-gold/20 rounded-full px-4 py-2 flex items-center justify-between backdrop-blur-md shadow-2xl relative">
              {/* Connector line */}
              <div className="absolute top-1/2 left-[12%] right-[12%] h-[1px] bg-rose-gold/20 -translate-y-1/2 z-0" />
              
              {/* Highlight line for completed stages */}
              <div 
                className="absolute top-1/2 left-[12%] h-[1.5px] bg-gradient-to-r from-rose-gold to-gold-accent -translate-y-1/2 z-0 transition-all duration-800" 
                style={{
                  width: `${step === 1 ? '0%' : step === 2 ? '38%' : step === 3 ? '76%' : '100%'}`,
                  maxWidth: '76%'
                }}
              />

              {/* Progress Milestones buttons */}
              {[1, 2, 3, 4].map((sIndex) => {
                const isCurrent = step === sIndex;
                const isCompleted = step > sIndex;
                const isUnlocked = sIndex <= maxUnlockedStep;

                let stateClass = "border-rose-gold/10 bg-navy/90 text-soft-white/30 cursor-not-allowed";
                if (isCurrent) {
                  stateClass = "border-gold-accent bg-gold-accent text-navy animate-pulse shadow-[0_0_12px_var(--glow)]";
                } else if (isCompleted) {
                  stateClass = "border-rose-gold bg-rose-gold text-navy cursor-pointer";
                } else if (isUnlocked) {
                  stateClass = "border-rose-gold/60 text-rose-gold/80 cursor-pointer hover:border-rose-gold hover:text-rose-gold";
                }

                return (
                  <button
                    key={sIndex}
                    onClick={() => handleNavigateStep(sIndex)}
                    disabled={!isUnlocked}
                    id={`progress-node-${sIndex}`}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center text-[10px] sm:text-xs font-sans font-bold z-10 transition-all duration-300 transform active:scale-90 ${stateClass}`}
                    title={`Go back to stage ${sIndex}`}
                  >
                    {isCompleted ? (
                      <Heart className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <span>{sIndex}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Render Screens based on active level state */}
      <main className="relative z-10 w-full min-h-screen flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              <IntroPage onBegin={handleNextStep} />
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="level1"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5 }}
            >
              <Level1Memory onComplete={handleNextStep} />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="level2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
            >
              <Level2Quiz onComplete={handleNextStep} />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="level3"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5 }}
            >
              <Level3Sliding onComplete={handleNextStep} />
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="final"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <FinalReward />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
