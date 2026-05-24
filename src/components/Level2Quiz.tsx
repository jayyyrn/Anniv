import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, HelpCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { useGameConfig } from '../context/GameConfigContext';

interface Level2QuizProps {
  onComplete: () => void;
}

export default function Level2Quiz({ onComplete }: Level2QuizProps) {
  const { config } = useGameConfig();
  const { quizQuestions, playerName } = config;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [shakeOption, setShakeOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);

  // Reset quiz if the editor customizations overwrite existing questions
  React.useEffect(() => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setShowFailedModal(false);
    setShowSuccessModal(false);
    setHintVisible(false);
  }, [quizQuestions]);

  const currentQuestion = quizQuestions[currentIndex] || quizQuestions[0] || {
    question: "Love Question",
    options: ["Option A", "Option B", "Option C", "Option D"],
    correctAnswer: "Option A",
    hint: "Think of your first meeting!"
  };

  const handleOptionClick = (option: string) => {
    if (isAnswered) return;
    
    setSelectedOption(option);
    setIsAnswered(true);

    if (option === currentQuestion.correctAnswer) {
      // CORRECT ANSWER
      setScore((prev) => prev + 1);
    } else {
      // WRONG ANSWER - Trigger button shake simulation
      setShakeOption(option);
      setTimeout(() => {
        setShakeOption(null);
      }, 500);
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setHintVisible(false);

    if (currentIndex < quizQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // QUIZ FINISHED - EVALUATE SCORE
      // Needs 4/5 correct to pass
      const passingScore = 4;
      if (score >= passingScore) {
        setShowSuccessModal(true);
      } else {
        setShowFailedModal(true);
      }
    }
  };

  const handleResetQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setShakeOption(null);
    setScore(0);
    setIsAnswered(false);
    setHintVisible(false);
    setShowFailedModal(false);
    setShowSuccessModal(false);
  };

  return (
    <div className="relative min-h-screen z-10 flex flex-col items-center justify-center px-4 py-20 max-w-4xl mx-auto">
      {/* Level Header Info */}
      <div className="text-center mb-6 w-full max-w-lg">
        <span className="font-sans text-xs tracking-[0.25em] text-rose-gold uppercase font-semibold">
          Challenge II • Synchronicity Quiz
        </span>
        <h2 className="font-display text-2xl md:text-3xl text-soft-white tracking-widest mt-1 mb-2">
          Shared Milestones
        </h2>
        <p className="font-serif text-sm md:text-base text-soft-white/70 italic max-w-md mx-auto">
          Let's test our memory rhythm of some of our sweet shared history! Will you remember the answers, my love?
        </p>
      </div>

      {/* Main Quiz Frame */}
      <div className="w-full max-w-xl glowing-card rounded-2xl p-6 md:p-8 backdrop-blur-md relative overflow-hidden">
        
        {/* Progress Bar inside Level 2 container */}
        <div className="w-full bg-navy/80 h-1 rounded-full mb-6 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-rose-gold to-gold-accent h-full transition-all duration-500" 
            style={{ width: `${((currentIndex + 1) / quizQuestions.length) * 100}%` }}
          />
        </div>

        {/* Question Counter / Navigation Indicators */}
        <div className="flex justify-between items-center mb-4 text-xs font-sans text-rose-gold uppercase tracking-wider">
          <span>Question {currentIndex + 1} of {quizQuestions.length}</span>
          <span>Score: <span className="text-gold-accent font-semibold">{score}/{quizQuestions.length}</span></span>
        </div>

        {/* Question text */}
        <h3 className="font-serif text-xl md:text-2xl text-soft-white leading-relaxed mb-6 font-semibold min-h-[56px] text-center md:text-left">
          {currentQuestion.question}
        </h3>

        {/* Option choices */}
        <div className="space-y-3 mb-6 relative">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedOption === option;
            const isCorrect = option === currentQuestion.correctAnswer;
            const isWrong = isSelected && !isCorrect;
            const isShaking = shakeOption === option;
            
            // Determine styling classes based on answered status
            let buttonClass = "bg-navy/50 border border-rose-gold/20 hover:border-rose-gold/60 text-soft-white/90";
            if (isAnswered) {
              if (isCorrect) {
                // Correct answer always glows gold on validation
                buttonClass = "bg-green-950/20 border-gold-accent text-gold-accent shadow-[0_0_15px_rgba(232,201,126,0.3)] font-semibold";
              } else if (isWrong) {
                // Wrong clicked option glows red
                buttonClass = "bg-red-950/20 border-red-500/80 text-red-400";
              } else {
                // Dim down non-selected options
                buttonClass = "bg-navy/30 border-rose-gold/10 text-soft-white/30 cursor-not-allowed";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleOptionClick(option)}
                id={`quiz-option-${idx}`}
                disabled={isAnswered}
                className={`w-full text-left font-serif p-4 rounded-xl border text-sm md:text-base transition-all duration-300 transform active:scale-98 select-none cursor-pointer flex justify-between items-center ${buttonClass} ${isShaking ? 'button-shake border-red-500 text-red-400 bg-red-950/25' : ''}`}
              >
                <span>{option}</span>
                {isAnswered && isCorrect && <Heart className="w-4 h-4 fill-gold-accent text-gold-accent" />}
                {isAnswered && isWrong && <AlertCircle className="w-4 h-4 text-red-400" />}
              </button>
            );
          })}
        </div>

        {/* Hint and Next Button row */}
        <div className="flex justify-between items-center pt-2">
          {/* Hint Trigger */}
          <button
            onClick={() => setHintVisible(!hintVisible)}
            id="quiz-hint-button"
            className="flex items-center gap-1.5 text-xs font-sans text-rose-gold/60 hover:text-rose-gold transition-colors focus:outline-none cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Need a hint?</span>
          </button>

          {/* Action indicator */}
          <AnimatePresence>
            {isAnswered && (
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onClick={handleNext}
                id="quiz-next-button"
                className="rounded-lg bg-rose-gold text-navy px-4 py-2 font-display text-xs font-semibold hover:bg-gold-accent transition-colors select-none cursor-pointer"
              >
                {currentIndex === quizQuestions.length - 1 ? "Check Results →" : "Next Milestone →"}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Hint Text Area */}
        <AnimatePresence>
          {hintVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-3 bg-rose-gold/5 border border-rose-gold/10 rounded-lg text-xs font-serif text-soft-white/60 italic"
            >
              <strong>Secret Clue:</strong> {currentQuestion.hint}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FAILED RETRY MODAL */}
      <AnimatePresence>
        {showFailedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glowing-card w-full max-w-sm rounded-2xl p-8 text-center backdrop-blur-2xl border border-red-500/20"
            >
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="font-display text-lg text-red-400 tracking-widest mb-3">
                Love in Dischord!
              </h3>
              <p className="font-serif text-base text-soft-white/80 italic mb-6 leading-relaxed">
                &ldquo;Oh, it looks like a few memories got a tiny bit mixed up! We scored <strong className="text-red-400 font-sans">{score}/{quizQuestions.length}</strong>. Shall we look back at our treasures once more, my love?&rdquo;
              </p>
              <button
                onClick={handleResetQuiz}
                id="quiz-failed-reset-btn"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 py-3.5 hover:bg-red-900/40 transition-all font-sans font-semibold text-xs cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Again ♥</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUCCESS WINNING MODAL */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glowing-card w-full max-w-md rounded-2xl p-8 text-center backdrop-blur-2xl"
            >
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <Heart className="w-16 h-16 text-rose-gold fill-rose-gold scale-110" />
                  <Sparkles className="w-6 h-6 text-gold-accent absolute top-0 -right-2" />
                </div>
              </div>

              <h3 className="font-display text-xl md:text-2xl text-rose-gold tracking-widest mb-4">
                Hearts Synchronized!
              </h3>
              
              <p className="font-serif text-lg text-soft-white italic mb-4 leading-relaxed">
                &ldquo;Perfect score! Your heart remembers our milestones exactly. It warms my soul to see how deeply these beautiful days are engraved in your memory.&rdquo;
              </p>

              <div className="text-xs font-sans text-soft-white/60 mb-8">
                You successfully passed with <strong className="text-rose-gold">{score}/{quizQuestions.length} correct</strong> answers. Let's start the Final Challenge of our trail, {playerName}!
              </div>

              <button
                onClick={onComplete}
                id="quiz-success-next-btn"
                className="glowing-btn w-full rounded-xl py-4 font-semibold text-xs cursor-pointer"
              >
                Final Challenge →
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
