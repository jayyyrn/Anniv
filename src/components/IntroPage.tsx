import React from 'react';
import { motion } from 'motion/react';
import { Heart } from 'lucide-react';
import { useGameConfig } from '../context/GameConfigContext';

interface IntroPageProps {
  onBegin: () => void;
}

export default function IntroPage({ onBegin }: IntroPageProps) {
  const { config } = useGameConfig();
  const { playerName, coupleNames, anniversaryDate } = config;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="w-full max-w-xl text-center"
      >
        {/* Glowing Hearts surrounding centered card */}
        <div className="relative flex justify-center mb-8">
          <div className="absolute inset-0 bg-rose-gold blur-3xl opacity-25 rounded-full scale-110 pointer-events-none" />
          <motion.div
            animate={{ 
              scale: [1, 1.15, 1],
              filter: ["drop-shadow(0 0 15px rgba(201, 149, 108, 0.7))", "drop-shadow(0 0 30px rgba(201, 149, 108, 0.9))", "drop-shadow(0 0 15px rgba(201, 149, 108, 0.7))"]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2.5, 
              ease: "easeInOut" 
            }}
            className="p-6 rounded-full bg-navy/60 border border-rose-gold/30 relative z-10"
          >
            <Heart className="w-16 h-16 text-rose-gold fill-rose-gold" />
          </motion.div>
          
          {/* Decorative small heart rings */}
          <span className="absolute text-rose-gold/60 text-sm animate-ping top-4 right-1/3 z-20">♥</span>
          <span className="absolute text-gold-accent/60 text-lg animate-bounce bottom-2 left-1/3 z-20">♥</span>
        </div>

        {/* The Card Container */}
        <div id="intro-card" className="bg-black/40 border border-rose-gold/30 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-md rounded-3xl p-8 md:p-16 mb-8 text-center max-w-2xl mx-auto">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="font-serif text-4xl md:text-6xl text-gold-accent tracking-widest uppercase font-light leading-snug mb-6"
          >
            A Journey For You
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="w-24 h-[1px] bg-gradient-to-r from-transparent via-rose-gold to-transparent mx-auto mb-8"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="font-serif text-xl md:text-2xl text-soft-white italic mb-4 tracking-wide"
          >
            Dearest {playerName},
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="font-serif text-base md:text-lg text-soft-white/80 leading-relaxed max-w-lg mx-auto mb-12"
          >
            Every moment we've shared is a page in the most beautiful story ever told. Let's relive the chapters that brought us here, celebrating our history with sweet secret challenges.
          </motion.p>

          {/* Glowing Action Button with Group Relative style */}
          <motion.button
            onClick={onBegin}
            id="begin-story-button"
            className="group glowing-btn rounded-full px-12 py-4 text-xs md:text-sm font-semibold tracking-[0.2em] uppercase cursor-pointer select-none active:translate-y-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            Begin Our Story
          </motion.button>
        </div>

        {/* Footer info representing names & dates */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 1.4, duration: 1 }}
            className="text-[10px] md:text-xs font-sans tracking-[0.3em] font-semibold text-rose-gold uppercase flex items-center justify-center gap-2"
          >
            <span>{coupleNames}</span>
            <span>•</span>
            <span>{anniversaryDate}</span>
          </motion.div>
          
          {/* Aesthetic stage progress nodes representation in page margin */}
          <div className="flex gap-4">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-gold"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-rose-gold/30"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-rose-gold/30"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-rose-gold/30"></div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
