import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Mail, ChevronLeft, ChevronRight, Play, Eye, Sparkles, Pause, Volume2, VolumeX, Mic, Music } from 'lucide-react';
import { useGameConfig } from '../context/GameConfigContext';

export default function FinalReward() {
  const { config } = useGameConfig();
  const { letters, photos, videoUrl, coupleNames, voiceMessageUrl, voiceMessageBase64, playerName } = config;
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [letterIndex, setLetterIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);

  // Audio Playback State
  const [voiceAudio, setVoiceAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Load and play audio when configuration changes
  useEffect(() => {
    const audioSource = voiceMessageBase64 || voiceMessageUrl;
    if (!audioSource) {
      setVoiceAudio(null);
      return;
    }

    try {
      const audio = new Audio(audioSource);
      
      const onPlay = () => setIsPlayingVoice(true);
      const onPause = () => setIsPlayingVoice(false);
      const onEnded = () => {
        setIsPlayingVoice(false);
        setVoiceProgress(0);
      };
      const onTimeUpdate = () => {
        if (audio.duration) {
          setVoiceProgress((audio.currentTime / audio.duration) * 100);
        }
      };
      const onLoadedMetadata = () => {
        setVoiceDuration(audio.duration || 0);
      };
      const onError = (e: any) => {
        console.error("Audio error: ", e);
        setVoiceError("Unable to play voice message. Format might be unsupported.");
      };

      audio.addEventListener('play', onPlay);
      audio.addEventListener('pause', onPause);
      audio.addEventListener('ended', onEnded);
      audio.addEventListener('timeupdate', onTimeUpdate);
      audio.addEventListener('loadedmetadata', onLoadedMetadata);
      audio.addEventListener('error', onError);

      setVoiceAudio(audio);
      setVoiceError(null);

      return () => {
        audio.pause();
        audio.removeEventListener('play', onPlay);
        audio.removeEventListener('pause', onPause);
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('timeupdate', onTimeUpdate);
        audio.removeEventListener('loadedmetadata', onLoadedMetadata);
        audio.removeEventListener('error', onError);
      };
    } catch (err) {
      console.error(err);
      setVoiceError("Unable to initialize audio system.");
    }
  }, [voiceMessageUrl, voiceMessageBase64]);

  // Trigger automatic voice message playback on envelope open
  useEffect(() => {
    if (envelopeOpen && voiceAudio) {
      const delayTimer = setTimeout(() => {
        voiceAudio.play().catch((err) => {
          console.warn("Autoplay was blocked by browser permissions, waiting for manual play click.", err);
        });
      }, 1000);

      return () => clearTimeout(delayTimer);
    }
  }, [envelopeOpen, voiceAudio]);

  const togglePlayVoice = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!voiceAudio) return;

    if (isPlayingVoice) {
      voiceAudio.pause();
    } else {
      voiceAudio.play().catch(err => {
        console.error("Manual audio play error: ", err);
      });
    }
  };

  const handleSeekVoice = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!voiceAudio || !voiceAudio.duration) return;
    const seekPercentage = parseFloat(e.target.value);
    const newTime = (seekPercentage / 100) * voiceAudio.duration;
    voiceAudio.currentTime = newTime;
    setVoiceProgress(seekPercentage);
  };

  // Sync index pointers if the letters/photos lengths are customized
  useEffect(() => {
    setLetterIndex(0);
  }, [letters.length]);

  useEffect(() => {
    setPhotoIndex(0);
  }, [photos.length]);

  // Safe variables checks
  const currentLetter = letters[letterIndex] || letters[0] || { title: "A Love Letter For You", body: "Thinking of you every single second." };
  const currentPhoto = photos[photoIndex] || photos[0] || { src: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600&auto=format&fit=crop", caption: "Our beautiful path together." };

  // Next/prev letter controls
  const handleNextLetter = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (letterIndex < letters.length - 1) {
      setLetterIndex(prev => prev + 1);
    }
  };

  const handlePrevLetter = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (letterIndex > 0) {
      setLetterIndex(prev => prev - 1);
    }
  };

  // Slideshow photo controls
  const handleNextPhoto = () => {
    setPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const handlePrevPhoto = () => {
    setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <div className="relative min-h-screen z-10 flex flex-col items-center px-4 py-24 max-w-4xl mx-auto">
      
      {/* Intro message */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-center mb-12"
      >
        <span className="font-sans text-xs tracking-[0.3em] text-rose-gold uppercase font-semibold">
          Final Chapter • The Sanctuary
        </span>
        <h2 className="font-display text-3xl md:text-4xl text-soft-white tracking-widest mt-1 mb-3">
          Our Secret Place
        </h2>
        <p className="font-serif text-base md:text-lg text-soft-white/70 italic max-w-md mx-auto">
          Here is your custom sanctuary, made purely out of our love. Open the envelope to reveal what's inside.
        </p>
      </motion.div>

      {/* 3D Envelope Container */}
      <div className="relative w-full max-w-lg mb-16 flex justify-center items-center z-20">
        <motion.div 
          onClick={() => { if (!envelopeOpen) setEnvelopeOpen(true); }}
          id="love-envelope-wrapper"
          className={`envelope-wrapper cursor-pointer w-[300px] sm:w-[380px] h-[200px] sm:h-[240px] relative ${envelopeOpen ? 'pointer-events-auto' : 'pointer-events-auto'}`}
          whileHover={!envelopeOpen ? { scale: 1.03 } : {}}
          whileTap={!envelopeOpen ? { scale: 0.98 } : {}}
        >
          {/* Back of envelope body */}
          <div className={`envelope w-full h-full rounded-b-xl relative ${envelopeOpen ? 'open' : ''}`}>
            {/* The flap */}
            <div className="envelope-flap" />

            {/* Glowing seal button on the center */}
            <AnimatePresence>
              {!envelopeOpen && (
                <motion.div 
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute top-[40%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 z-10 w-14 h-14 rounded-full bg-rose-gold border border-gold-accent flex items-center justify-center shadow-lg cursor-pointer"
                  id="envelope-seal-seal"
                >
                  <Heart className="w-6 h-6 text-navy fill-navy animate-pulse" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inside Love Letter sheet. Slides up when open is active. */}
            <div className="letter-sheet rounded-md p-4 sm:p-6 flex flex-col justify-between overflow-hidden">
              <div className="flex-1 overflow-y-auto pr-1">
                {/* Header title inside letter */}
                <h4 className="font-display text-sm text-rose-gold text-center tracking-wider mb-2 font-bold uppercase border-b border-rose-gold/10 pb-1">
                  {currentLetter.title}
                </h4>
                
                {/* Body paragraph */}
                <p className="font-serif text-sm text-[#4a3626] leading-relaxed whitespace-pre-wrap italic">
                  {currentLetter.body}
                </p>
              </div>

              {/* Paginator row if there are multiple customizable letters */}
              {letters.length > 1 && (
                <div className="flex justify-between items-center border-t border-rose-gold/10 pt-2 text-[10px] font-sans uppercase tracking-widest text-[#7a6452]">
                  <button 
                    onClick={handlePrevLetter}
                    disabled={letterIndex === 0}
                    id="prev-letter-button"
                    className={`flex items-center gap-0.5 hover:text-rose-gold cursor-pointer ${letterIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >
                    <ChevronLeft className="w-3 h-3" />
                    <span>Back</span>
                  </button>

                  <span className="font-medium text-[#4a3626]/70">Page {letterIndex + 1} of {letters.length}</span>

                  <button 
                    onClick={handleNextLetter}
                    disabled={letterIndex === letters.length - 1}
                    id="next-letter-button"
                    className={`flex items-center gap-0.5 hover:text-rose-gold cursor-pointer ${letterIndex === letters.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Decorative letter front elements */}
            <div className="absolute inset-0 z-3 pointer-events-none border border-rose-gold/20 rounded-xl" />
          </div>
        </motion.div>
      </div>

      {/* The rest of the page fades in ONLY once envelope is open */}
      <AnimatePresence>
        {envelopeOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.5 }}
            className="w-full space-y-16 mt-8 p-1 sm:p-4"
          >
            {/* 0. ANNIVERSARY VOICE MESSAGE PLAYER */}
            {(voiceMessageBase64 || voiceMessageUrl) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glowing-card rounded-2xl p-6 sm:p-8 backdrop-blur-md border border-rose-gold/20 flex flex-col md:flex-row items-center gap-6"
              >
                {/* Decorative Cassette Tape / Audio disk */}
                <div className="relative flex-shrink-0 w-24 h-24 bg-gradient-to-tr from-[#121226] to-[#251830] rounded-full border-4 border-rose-gold/30 shadow-2xl flex items-center justify-center overflow-hidden">
                  <motion.div
                    animate={isPlayingVoice ? { rotate: 360 } : {}}
                    transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                    className="w-full h-full absolute inset-0 rounded-full flex items-center justify-center"
                    style={{ backgroundImage: 'radial-gradient(circle, #0a0a14 30%, transparent 60%)' }}
                  >
                    <div className="w-8 h-8 rounded-full bg-rose-gold/20 flex items-center justify-center font-serif text-gold-accent italic text-[10px]">
                      LP
                    </div>
                  </motion.div>
                  <Mic className={`w-8 h-8 text-rose-gold z-10 ${isPlayingVoice ? 'animate-bounce' : ''}`} />
                </div>

                {/* Player details */}
                <div className="flex-1 w-full space-y-3">
                  <div>
                    <span className="font-sans text-[10px] tracking-[0.2em] text-gold-accent uppercase font-bold flex items-center gap-1.5 md:justify-start justify-center">
                      <Sparkles className="w-3 h-3 animate-pulse" />
                      Dedicated Voice Note
                    </span>
                    <h3 className="font-display text-lg text-soft-white text-center md:text-left tracking-wide mt-1">
                      Anniversary Voice Message
                    </h3>
                  </div>

                  {/* Slider and interactive times */}
                  <div className="space-y-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={voiceProgress}
                      onChange={handleSeekVoice}
                      className="w-full accent-rose-gold h-1 rounded-lg cursor-pointer bg-soft-white/10"
                    />
                    <div className="flex justify-between text-[11px] font-mono text-soft-white/50">
                      <span>{voiceAudio ? `${Math.floor(voiceAudio.currentTime / 60)}:${String(Math.floor(voiceAudio.currentTime % 60)).padStart(2, '0')}` : '0:00'}</span>
                      <span>{voiceDuration ? `${Math.floor(voiceDuration / 60)}:${String(Math.floor(voiceDuration % 60)).padStart(2, '0')}` : '0:00'}</span>
                    </div>
                  </div>

                  {/* Playback Controls & Voice Waves */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => togglePlayVoice()}
                        className="w-12 h-12 bg-rose-gold text-navy rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        title={isPlayingVoice ? "Pause" : "Play Message"}
                      >
                        {isPlayingVoice ? (
                          <Pause className="w-5 h-5 fill-navy text-navy" />
                        ) : (
                          <Play className="w-5 h-5 fill-navy text-navy translate-x-0.5" />
                        )}
                      </button>

                      <div className="text-left">
                        <p className="text-xs text-soft-white/80 font-medium">
                          {isPlayingVoice ? "Speaking to your heart..." : `Listen to a message from ${coupleNames.split('&')[0].trim() || 'me'}`}
                        </p>
                        <p className="text-[10px] text-soft-white/40">
                          {voiceError ? <span className="text-rose-400">{voiceError}</span> : "Recorded especially for this moment"}
                        </p>
                      </div>
                    </div>

                    {/* Cute responsive visualizer bars */}
                    <div className="flex items-end gap-1 h-6 pr-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((bar) => (
                        <motion.div
                          key={bar}
                          animate={isPlayingVoice ? {
                            height: [8, Math.random() * 24 + 8, 8]
                          } : { height: 6 }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.5 + Math.random() * 0.5,
                            ease: "easeInOut"
                          }}
                          className="w-1 bg-rose-gold/60 rounded-full"
                          style={{ height: '6px' }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 1. PHOTOGRAPH GALLERY / SLIDESHOW */}
            <div className="glowing-card rounded-2xl p-6 sm:p-8 relative backdrop-blur-md">
              <span className="font-sans text-[10px] tracking-widest text-rose-gold uppercase font-bold text-center block mb-2">
                Gallery Slideshow • Nostalgic Sparks
              </span>
              <h3 className="font-display text-xl text-center text-soft-white tracking-widest mb-6">
                Our Beautiful Memories
              </h3>

              {/* Display Framed Image Container */}
              <div className="relative aspect-[3/2] w-full max-w-xl mx-auto rounded-xl overflow-hidden border border-rose-gold/30">
                <img
                  src={currentPhoto.src}
                  alt={currentPhoto.caption}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover shadow-2xl transition-all duration-700"
                />

                {/* Left/Right slides controls */}
                <button
                  onClick={handlePrevPhoto}
                  id="gallery-prev-button"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-navy/80 hover:bg-rose-gold hover:text-navy text-soft-white p-2 rounded-full border border-rose-gold/30 cursor-pointer transition-colors active:scale-95 z-20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={handleNextPhoto}
                  id="gallery-next-button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-navy/80 hover:bg-rose-gold hover:text-navy text-soft-white p-2 rounded-full border border-rose-gold/30 cursor-pointer transition-colors active:scale-95 z-20"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Dots indicator index */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20">
                  {photos.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPhotoIndex(idx)}
                      id={`gallery-dot-${idx}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${idx === photoIndex ? 'w-5 bg-rose-gold' : 'w-1.5 bg-soft-white/40'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Dynamic image caption sheet */}
              <div className="max-w-md mx-auto mt-4 text-center min-h-[48px]">
                <p className="font-serif text-base text-soft-white/80 leading-relaxed italic">
                  &ldquo;{currentPhoto.caption}&rdquo;
                </p>
              </div>
            </div>

            {/* 2. CINEMATIC VIDEO SCREEN */}
            {videoUrl && (
              <div className="glowing-card rounded-2xl p-6 sm:p-8 backdrop-blur-md">
                <span className="font-sans text-[10px] tracking-widest text-rose-gold uppercase font-bold text-center block mb-2">
                  Feature Reward • Film Presentation
                </span>
                <h3 className="font-display text-xl text-center text-soft-white tracking-widest mb-6 border-b border-rose-gold/10 pb-4 max-w-sm mx-auto">
                  A Gift For Us
                </h3>

                {/* Player screen wrapper */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-rose-gold/30 shadow-2xl bg-black">
                  {videoUrl.startsWith('data:video') || 
                   videoUrl.includes('.mp4') || 
                   videoUrl.includes('.mov') || 
                   videoUrl.includes('.webm') || 
                   videoUrl.startsWith('blob:') ? (
                    <video
                      src={videoUrl}
                      controls
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <iframe
                      src={videoUrl}
                      title="Our Anniversary Reward Video"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    />
                  )}
                </div>
              </div>
            )}

            {/* 3. SIGNATURE HEADING */}
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: [0.95, 1.01, 0.95] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="text-center py-8 border-t border-dashed border-rose-gold/20"
            >
              <Heart className="w-8 h-8 text-rose-gold fill-rose-gold mx-auto mb-3 animate-pulse" />
              <h3 className="font-display text-xl md:text-2xl text-rose-gold tracking-[0.2em] font-bold">
                From me, forever ♥
              </h3>
              <p className="font-serif text-sm text-soft-white/50 italic mt-1 uppercase tracking-widest">
                Happy Anniversary, My Entire World
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
