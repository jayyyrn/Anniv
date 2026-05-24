import React, { useState } from 'react';
import { useGameConfig, encodeConfigToBase64 } from '../context/GameConfigContext';
import { GameConfig, PhotoAsset, QuizQuestion, LoveLetter } from '../config';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, X, Sparkles, Image, HelpCircle, 
  HelpCircle as QuestionIcon, FileText, Video, Save, 
  Check, Copy, Plus, Trash2, ArrowRight, Eye, RefreshCw,
  Mic, Volume2, Pause, Play, AlertCircle
} from 'lucide-react';

export default function EditPanel() {
  const { config, updateLocalConfig, saveAndGetShareUrl, isCustomized, gameId, loadedFromUrl } = useGameConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'basics' | 'photos' | 'quiz' | 'puzzle' | 'letters' | 'video' | 'voice'>('basics');
  
  // Local state for editing to prevent immediate re-renders while typing
  const [draft, setDraft] = useState<GameConfig>({ ...config });
  const [saving, setSaving] = useState(false);
  const [shareConfig, setShareConfig] = useState<{ show: boolean; url: string; method: 'firestore' | 'url-code' } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showHelpDocs, setShowHelpDocs] = useState(false);

  // Audio Note Recording/Management states
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState<any>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [localAudioUrl, setLocalAudioUrl] = useState<string | null>(null);
  const [audioPlayState, setAudioPlayState] = useState(false);
  const [localAudioObj, setLocalAudioObj] = useState<HTMLAudioElement | null>(null);

  // Sync state on unmount
  React.useEffect(() => {
    return () => {
      if (localAudioObj) localAudioObj.pause();
    };
  }, [localAudioObj]);

  // Sync draft when config changes globally
  const handleOpen = () => {
    setDraft({ ...config });
    setIsOpen(true);
  };

  const handleFieldChange = (key: keyof GameConfig, value: any) => {
    const updated = { ...draft, [key]: value };
    setDraft(updated);
  };

  const handlePhotoChange = (index: number, field: keyof PhotoAsset, value: string) => {
    const updatedPhotos = [...draft.photos];
    updatedPhotos[index] = { ...updatedPhotos[index], [field]: value };
    handleFieldChange('photos', updatedPhotos);
  };

  const handleQuizChange = (index: number, field: keyof QuizQuestion, value: any) => {
    const updatedQuiz = [...draft.quizQuestions];
    updatedQuiz[index] = { ...updatedQuiz[index], [field]: value };
    handleFieldChange('quizQuestions', updatedQuiz);
  };

  const handleQuizOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const updatedQuiz = [...draft.quizQuestions];
    const updatedOptions = [...updatedQuiz[qIndex].options];
    updatedOptions[oIndex] = value;
    updatedQuiz[qIndex] = { ...updatedQuiz[qIndex], options: updatedOptions };
    handleFieldChange('quizQuestions', updatedQuiz);
  };

  const handleLetterChange = (index: number, field: keyof LoveLetter, value: string) => {
    const updatedLetters = [...draft.letters];
    updatedLetters[index] = { ...updatedLetters[index], [field]: value };
    handleFieldChange('letters', updatedLetters);
  };

  const addLetter = () => {
    const updatedLetters = [...draft.letters, { title: 'New Story Letter', body: 'Type your intimate letter here...' }];
    handleFieldChange('letters', updatedLetters);
  };

  const removeLetter = (index: number) => {
    if (draft.letters.length <= 1) return; // Retain at least one
    const updatedLetters = draft.letters.filter((_, i) => i !== index);
    handleFieldChange('letters', updatedLetters);
  };

  // Recording & Upload Audio Handlers
  const startRecording = async () => {
    setRecordingError(null);
    if (localAudioObj) {
      localAudioObj.pause();
      setAudioPlayState(false);
    }
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setRecordingError("Audio recording is not supported in this browser or context.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let recorder: MediaRecorder;
      const options = { mimeType: 'audio/webm' };
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        // Fallback for browsers with custom format supports (like Safari)
        recorder = new MediaRecorder(stream);
      }

      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());

        const audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        if (audioBlob.size > 1.2 * 1024 * 1024) {
          setRecordingError("Recorded voice note is too large. Keep it under 30s.");
          return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          handleFieldChange('voiceMessageBase64', base64data);
          handleFieldChange('voiceMessageUrl', ''); // Clear external URL
          
          const u = URL.createObjectURL(audioBlob);
          setLocalAudioUrl(u);
        };
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
      setRecordingSeconds(0);

      const interval = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 29) {
            recorder.stop();
            clearInterval(interval);
            setRecording(false);
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
      setRecordingInterval(interval);

    } catch (err: any) {
      console.error(err);
      setRecordingError("Microphone access denied or audio device not found.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (recordingInterval) {
      clearInterval(recordingInterval);
      setRecordingInterval(null);
    }
    setRecording(false);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecordingError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.2 * 1024 * 1024) {
      setRecordingError("Audio file exceeds 1.2MB limit. Please upload a shorter, compressed audio file.");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64data = reader.result as string;
      handleFieldChange('voiceMessageBase64', base64data);
      handleFieldChange('voiceMessageUrl', ''); // Clear external URL
      
      const u = URL.createObjectURL(file);
      setLocalAudioUrl(u);
    };
  };

  const clearVoiceMessage = () => {
    handleFieldChange('voiceMessageBase64', '');
    handleFieldChange('voiceMessageUrl', '');
    setLocalAudioUrl(null);
    if (localAudioObj) {
      localAudioObj.pause();
      setAudioPlayState(false);
    }
  };

  const toggleLocalAudioPlay = () => {
    const src = draft.voiceMessageBase64 || draft.voiceMessageUrl;
    if (!src) return;

    if (localAudioObj) {
      if (audioPlayState) {
        localAudioObj.pause();
        setAudioPlayState(false);
      } else {
        localAudioObj.play().catch(e => console.error(e));
        setAudioPlayState(true);
      }
    } else {
      const audio = new Audio(src);
      audio.onended = () => setAudioPlayState(false);
      audio.play().catch(e => console.error(e));
      setLocalAudioObj(audio);
      setAudioPlayState(true);
    }
  };

  const applyPreview = () => {
    updateLocalConfig(draft);
    // Visual alert or toast feedback
    const originalText = document.getElementById('preview-feedback')?.innerText;
    const fb = document.getElementById('preview-feedback');
    if (fb) {
      fb.innerText = '✨ Preview applied live below! Play some stages to try it.';
      setTimeout(() => { if (fb) fb.innerText = originalText || 'Preview Changes'; }, 4000);
    }
  };

  const publishGame = async () => {
    setSaving(true);
    try {
      // Apply locally first
      updateLocalConfig(draft);
      const res = await saveAndGetShareUrl(draft);
      if (res.success) {
        setShareConfig({ show: true, url: res.url, method: res.method });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const copyShareUrl = () => {
    if (!shareConfig) return;
    navigator.clipboard.writeText(shareConfig.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Absolute top-right toggle button to control customization workspace */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        {isCustomized && (
          <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-gold/20 border border-rose-gold/40 text-rose-gold text-xs font-serif italic tracking-wide">
            <Sparkles className="w-3 h-3 text-rose-gold fill-current" />
            Playing Custom Link
          </span>
        )}
        <button
          onClick={handleOpen}
          id="toggle-editor-panel"
          className="group relative flex items-center justify-center w-10 h-10 md:w-auto md:px-4 md:py-2.5 rounded-full bg-navy/80 hover:bg-black/40 border border-rose-gold/40 hover:border-rose-gold transition-all duration-300 backdrop-blur-md text-rose-gold font-sans font-semibold text-xs tracking-wider uppercase select-none cursor-pointer"
          title="Customize & Edit Game Content"
        >
          <Settings className="w-4 h-4 md:mr-1.5 animate-[spin_12s_linear_infinite]" />
          <span className="hidden md:inline">Edit Inside Game</span>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
            {/* Click backdrop to close */}
            <div className="absolute inset-0 -z-10" onClick={() => setIsOpen(false)} />

            {/* Editor slide-out side sheet */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="w-full max-w-2xl h-full bg-navy/95 border-l border-rose-gold/30 flex flex-col shadow-2xl overflow-hidden relative"
            >
              {/* Dynamic top ambient gold line */}
              <div className="h-[2px] w-full bg-gradient-to-r from-rose-gold via-gold-accent to-rose-gold" />

              {/* Panel Header */}
              <div className="p-6 md:p-8 border-b border-rose-gold/15 flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-2xl text-gold-accent font-light uppercase tracking-widest flex items-center gap-2">
                    Customizer Workspace
                    <Sparkles className="w-5 h-5 text-rose-gold" />
                  </h2>
                  <p className="font-sans text-xs text-soft-white/60 mt-1">
                    Edit letters, memories, questions and save them into a shareable link!
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-rose-gold/15 text-rose-gold/70 hover:text-rose-gold transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="px-6 md:px-8 border-b border-rose-gold/10 flex gap-1 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-rose-gold/30">
                <button
                  onClick={() => setActiveTab('basics')}
                  className={`py-3.5 px-3 border-b-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                    activeTab === 'basics' ? 'border-gold-accent text-gold-accent' : 'border-transparent text-soft-white/50 hover:text-soft-white/80'
                  }`}
                >
                  💑 Basics & Dates
                </button>
                <button
                  onClick={() => setActiveTab('photos')}
                  className={`py-3.5 px-3 border-b-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                    activeTab === 'photos' ? 'border-gold-accent text-gold-accent' : 'border-transparent text-soft-white/50 hover:text-soft-white/80'
                  }`}
                >
                  📸 Grid Memories (8)
                </button>
                <button
                  onClick={() => setActiveTab('quiz')}
                  className={`py-3.5 px-3 border-b-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                    activeTab === 'quiz' ? 'border-gold-accent text-gold-accent' : 'border-transparent text-soft-white/50 hover:text-soft-white/80'
                  }`}
                >
                  🧩 Milestone Quiz
                </button>
                <button
                  onClick={() => setActiveTab('puzzle')}
                  className={`py-3.5 px-3 border-b-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                    activeTab === 'puzzle' ? 'border-gold-accent text-gold-accent' : 'border-transparent text-soft-white/50 hover:text-soft-white/80'
                  }`}
                >
                  🖼️ Tile Puzzle
                </button>
                <button
                  onClick={() => setActiveTab('letters')}
                  className={`py-3.5 px-3 border-b-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                    activeTab === 'letters' ? 'border-gold-accent text-gold-accent' : 'border-transparent text-soft-white/50 hover:text-soft-white/80'
                  }`}
                >
                  ✉️ Love Letters
                </button>
                <button
                  onClick={() => setActiveTab('video')}
                  className={`py-3.5 px-3 border-b-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                    activeTab === 'video' ? 'border-gold-accent text-gold-accent' : 'border-transparent text-soft-white/50 hover:text-soft-white/80'
                  }`}
                >
                  🎥 Surprise Video
                </button>
                <button
                  onClick={() => setActiveTab('voice')}
                  className={`py-3.5 px-3 border-b-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                    activeTab === 'voice' ? 'border-gold-accent text-gold-accent' : 'border-transparent text-soft-white/50 hover:text-soft-white/80'
                  }`}
                >
                  🎙️ Anniversary Voice
                </button>
              </div>

              {/* Scrollable Form Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                
                {/* BASICS & DATES */}
                {activeTab === 'basics' && (
                  <div className="space-y-4">
                    <h3 className="font-serif text-lg text-rose-gold mb-3">Core Identity Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-soft-white/60 mb-1.5">Player Partner Name</label>
                        <input
                          type="text"
                          value={draft.playerName}
                          onChange={(e) => handleFieldChange('playerName', e.target.value)}
                          className="w-full bg-black/30 border border-rose-gold/20 focus:border-rose-gold/60 rounded-xl px-4 py-3 text-sm text-soft-white focus:outline-none transition-all"
                          placeholder="e.g. Sophia"
                        />
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-widest text-soft-white/60 mb-1.5">Your Combined Couple Names</label>
                        <input
                          type="text"
                          value={draft.coupleNames}
                          onChange={(e) => handleFieldChange('coupleNames', e.target.value)}
                          className="w-full bg-black/30 border border-rose-gold/20 focus:border-rose-gold/60 rounded-xl px-4 py-3 text-sm text-soft-white focus:outline-none transition-all"
                          placeholder="e.g. Alex & Sophia"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-widest text-soft-white/60 mb-1.5">Anniversary Date Label</label>
                      <input
                        type="text"
                        value={draft.anniversaryDate}
                        onChange={(e) => handleFieldChange('anniversaryDate', e.target.value)}
                        className="w-full bg-black/30 border border-rose-gold/20 focus:border-rose-gold/60 rounded-xl px-4 py-3 text-sm text-soft-white focus:outline-none transition-all"
                        placeholder="e.g. October 14th"
                      />
                    </div>
                  </div>
                )}

                {/* MEMORIES MATCHING PHOTOS (8) */}
                {activeTab === 'photos' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-rose-gold/10 border border-rose-gold/20 rounded-2xl p-4">
                      <div className="flex items-center gap-3">
                        <Image className="w-5 h-5 text-rose-gold font-light" />
                        <div>
                          <p className="font-serif text-sm text-rose-gold font-semibold">How do I get links of my photos?</p>
                          <p className="text-[11px] text-soft-white/60">Read the instant uploading & bookmarking helper.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowHelpDocs(!showHelpDocs)}
                        className="bg-rose-gold/20 text-rose-gold border border-rose-gold/30 hover:bg-rose-gold/30 text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                      >
                        {showHelpDocs ? 'Hide Help Guild' : 'Show Help Guide 💡'}
                      </button>
                    </div>

                    {showHelpDocs && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-black/40 border border-rose-gold/20 rounded-2xl p-5 space-y-3 text-xs text-soft-white/80 leading-relaxed"
                      >
                        <p className="font-serif text-sm text-gold-accent uppercase tracking-wider font-semibold">📸 Dynamic Photo Uploading Guide</p>
                        <p>To use your own beautiful moments, you need to convert your device photos into public web links. Here are the 3 simplest ways:</p>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>
                            <strong className="text-rose-gold">Free Image Hosters (Recommended)</strong>: Visit free services like <span className="underline select-all text-gold-accent font-semibold">postimages.org</span> or <span className="underline select-all text-gold-accent font-semibold">imgbb.com</span>. Upload your photos, select <strong>Direct Link</strong> (the URL ending in <code className="bg-navy px-1 rounded text-red-300">.jpg</code>, <code className="bg-navy px-1 rounded text-red-300">.png</code>, or <code className="bg-navy px-1 rounded text-red-300">.webp</code>), and paste it below!
                          </li>
                          <li>
                            <strong className="text-rose-gold">Discord Photo Trick</strong>: If you use Discord, send the photo to any secondary server. Right-click the uploaded image, click <strong>"Copy Link"</strong> or <strong>"Open Link"</strong>, then copy the web destination URL.
                          </li>
                          <li>
                            <strong className="text-rose-gold">Google Drive or Pinterest</strong>: Upload your photo to Google Drive, change sharing rights to <strong>"Anyone with Link can view"</strong>, copy the file ID, or prefer unsplash/direct CDN lines.
                          </li>
                        </ol>
                      </motion.div>
                    )}

                    <h3 className="font-serif text-lg text-rose-gold">Memory Match Cards ({draft.photos.length} Pairs)</h3>
                    <div className="space-y-4">
                      {draft.photos.map((photo, index) => (
                        <div key={index} className="bg-black/20 border border-rose-gold/15 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-rose-gold/20 text-rose-gold flex items-center justify-center text-xs font-semibold">
                              {index + 1}
                            </span>
                            <p className="font-serif text-sm text-gold-accent">Memory Photo Card Pair {index + 1}</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] uppercase tracking-wider text-soft-white/40 mb-1">Image URL</label>
                              <input
                                type="text"
                                value={photo.src}
                                onChange={(e) => handlePhotoChange(index, 'src', e.target.value)}
                                className="w-full bg-black/40 border border-rose-gold/15 focus:border-rose-gold/50 rounded-lg px-3 py-2 text-xs text-soft-white focus:outline-none focus:ring-1 focus:ring-rose-gold/5"
                                placeholder="https://images.unsplash.com/... or postimages Link"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase tracking-wider text-soft-white/40 mb-1">Affectionate Caption</label>
                              <input
                                type="text"
                                value={photo.caption}
                                onChange={(e) => handlePhotoChange(index, 'caption', e.target.value)}
                                className="w-full bg-black/40 border border-rose-gold/15 focus:border-rose-gold/50 rounded-lg px-3 py-2 text-xs text-soft-white focus:outline-none focus:ring-1 focus:ring-rose-gold/5"
                                placeholder="Enter a beautiful memory caption..."
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* MILESTONE QUIZ */}
                {activeTab === 'quiz' && (
                  <div className="space-y-6">
                    <h3 className="font-serif text-lg text-rose-gold">Milestone Quiz Questions</h3>
                    <p className="text-xs text-soft-white/60 -mt-4">
                      Keep the capitalization of the correct answer string identical to the matching option!
                    </p>

                    <div className="space-y-6">
                      {draft.quizQuestions.map((q, qIndex) => (
                        <div key={q.id || qIndex} className="bg-black/20 border border-rose-gold/15 rounded-2xl p-5 space-y-4">
                          <div className="flex items-center gap-3 justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-rose-gold/20 text-rose-gold flex items-center justify-center text-xs font-semibold">
                                {qIndex + 1}
                              </span>
                              <h4 className="font-serif text-sm text-gold-accent font-semibold">Question {qIndex + 1}</h4>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase tracking-wider text-soft-white/50 mb-1">The Question Text</label>
                            <input
                              type="text"
                              value={q.question}
                              onChange={(e) => handleQuizChange(qIndex, 'question', e.target.value)}
                              className="w-full bg-black/40 border border-rose-gold/15 focus:border-rose-gold/50 rounded-lg px-3 py-2 text-sm text-soft-white focus:outline-none"
                              placeholder="e.g. Where did we go on our first official date?"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-[10px] uppercase tracking-wider text-soft-white/50">Multiple-Choice Options:</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {q.options.map((opt, oIndex) => (
                                <div key={oIndex} className="flex gap-2 items-center">
                                  <span className="text-[10px] text-rose-gold font-bold uppercase">{String.fromCharCode(65 + oIndex)}:</span>
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => handleQuizOptionChange(qIndex, oIndex, e.target.value)}
                                    className="flex-1 bg-black/40 border border-rose-gold/15 focus:border-rose-gold/50 rounded-lg px-2.5 py-1.5 text-xs text-soft-white focus:outline-none"
                                    placeholder={`Option ${oIndex + 1}`}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] uppercase tracking-wider text-soft-white/50 mb-1">Correct Answer Match (must match exactly)</label>
                              <select
                                value={q.correctAnswer}
                                onChange={(e) => handleQuizChange(qIndex, 'correctAnswer', e.target.value)}
                                className="w-full bg-black/40 border border-rose-gold/15 focus:border-rose-gold/50 rounded-lg px-3 py-2 text-xs text-soft-white focus:outline-none"
                              >
                                {q.options.map((opt, oIndex) => (
                                  <option key={oIndex} value={opt} className="bg-navy text-soft-white">
                                    {opt || `Option ${oIndex + 1} (Empty)`}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-[10px] uppercase tracking-wider text-soft-white/50 mb-1">Guiding Hint</label>
                              <input
                                type="text"
                                value={q.hint}
                                onChange={(e) => handleQuizChange(qIndex, 'hint', e.target.value)}
                                className="w-full bg-black/40 border border-rose-gold/15 focus:border-rose-gold/50 rounded-lg px-3 py-2 text-xs text-soft-white focus:outline-none"
                                placeholder="Enter hints to ease their journey..."
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TILE PUZZLE PHOTO */}
                {activeTab === 'puzzle' && (
                  <div className="space-y-4">
                    <h3 className="font-serif text-lg text-rose-gold">Level 3: Sliding Tile Puzzle Backdrop</h3>
                    <p className="text-xs text-soft-white/60">
                      We break this photo into a 3x3 grid for the active slider match. Let's use a gorgeous shared picture!
                    </p>

                    <div>
                      <label className="block text-xs uppercase tracking-widest text-soft-white/60 mb-1.5 font-sans">Sliding Photo URL</label>
                      <input
                        type="text"
                        value={draft.slidingPuzzlePhoto}
                        onChange={(e) => handleFieldChange('slidingPuzzlePhoto', e.target.value)}
                        className="w-full bg-black/30 border border-rose-gold/20 focus:border-rose-gold/60 rounded-xl px-4 py-3 text-sm text-soft-white focus:outline-none transition-all"
                        placeholder="https://images.unsplash.com/... or hosting link"
                      />
                    </div>

                    <div className="flex justify-center border border-rose-gold/10 bg-black/30 rounded-2xl p-4 mt-4">
                      <div className="w-full max-w-xs aspect-square border-2 border-dashed border-rose-gold/30 rounded-xl overflow-hidden relative group">
                        {draft.slidingPuzzlePhoto ? (
                          <img 
                            src={draft.slidingPuzzlePhoto} 
                            alt="Preview backdrop" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600&auto=format&fit=crop";
                            }}
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                            <Image className="w-8 h-8 text-rose-gold/40 mb-2" />
                            <span className="text-xs text-soft-white/50">Enter a valid URL above to preview the puzzle scene</span>
                          </div>
                        )}
                        <div className="absolute top-2 left-2 px-2.5 py-1 bg-black/60 rounded text-[10px] text-gold-accent font-serif tracking-widest uppercase">
                          Puzzle Preview
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* HEAVY LOVE LETTERS */}
                {activeTab === 'letters' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="font-serif text-lg text-rose-gold">Handwritten Envelope Letters</h3>
                      <button
                        onClick={addLetter}
                        className="flex items-center gap-1 bg-rose-gold/15 text-rose-gold hover:bg-rose-gold/25 border border-rose-gold/30 text-xs px-3 py-1.5 rounded-xl transition-all font-semibold cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Add Page
                      </button>
                    </div>

                    <div className="space-y-4">
                      {draft.letters.map((letter, index) => (
                        <div key={index} className="bg-black/20 border border-rose-gold/15 rounded-2xl p-4 space-y-3 relative">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-rose-gold/20 text-rose-gold flex items-center justify-center text-xs font-semibold">
                                {index + 1}
                              </span>
                              <input
                                type="text"
                                value={letter.title}
                                onChange={(e) => handleLetterChange(index, 'title', e.target.value)}
                                className="bg-transparent border-b border-transparent hover:border-rose-gold/20 focus:border-rose-gold/50 text-sm font-serif font-semibold text-gold-accent focus:outline-none"
                                placeholder="Letter Title"
                              />
                            </div>
                            
                            {draft.letters.length > 1 && (
                              <button
                                onClick={() => removeLetter(index)}
                                className="p-1 px-2.5 py-1 bg-red-950/25 border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-900/35 rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer"
                                title="Remove Page"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> delete
                              </button>
                            )}
                          </div>

                          <textarea
                            value={letter.body}
                            onChange={(e) => handleLetterChange(index, 'body', e.target.value)}
                            rows={8}
                            className="w-full bg-black/40 border border-rose-gold/15 focus:border-rose-gold/50 rounded-lg p-3 text-xs leading-relaxed text-soft-white/90 focus:outline-none font-serif"
                            placeholder="Type words straight from your heart..."
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SURPRISE VIDEO LINK */}
                {activeTab === 'video' && (
                  <div className="space-y-4">
                    <h3 className="font-serif text-lg text-rose-gold">Surprise Video</h3>
                    <p className="text-xs text-soft-white/60">
                      Place a beautiful YouTube embed link, Google Drive link, or video URL shown during the culmination!
                    </p>

                    <div>
                      <label className="block text-xs uppercase tracking-widest text-soft-white/60 mb-1.5 font-sans">Video Embed URL</label>
                      <input
                        type="text"
                        value={draft.videoUrl}
                        onChange={(e) => handleFieldChange('videoUrl', e.target.value)}
                        className="w-full bg-black/30 border border-rose-gold/20 focus:border-rose-gold/60 rounded-xl px-4 py-3 text-sm text-soft-white focus:outline-none transition-all"
                        placeholder="e.g. https://www.youtube.com/embed/5H-S78g7_dI"
                      />
                    </div>

                    <div className="bg-black/20 border border-rose-gold/15 rounded-2xl p-4 text-xs text-soft-white/60 space-y-1.5">
                      <p className="font-semibold text-gold-accent">💡 Embed Tips:</p>
                      <p>• YouTube: Copy a video, click Share, select <strong>Embed</strong>, and grab the source link inside the iframe source string (<code className="bg-navy px-1 rounded text-red-300">https://www.youtube.com/embed/...</code>).</p>
                      <p>• Or keep the default calming embers ambiance for an immersive atmosphere!</p>
                    </div>
                  </div>
                )}

                {/* ANNIVERSARY VOICE NOTE TAB */}
                {activeTab === 'voice' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-serif text-lg text-rose-gold">Anniversary Voice Message</h3>
                      <p className="text-xs text-soft-white/60 mt-1">
                        Dedicate a short private spoken message that plays automatically when your partner opens the love envelope on the final stage!
                      </p>
                    </div>

                    {/* Microphone Recorder Box */}
                    <div className="bg-black/30 border border-rose-gold/20 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mic className={`w-5 h-5 text-rose-gold ${recording ? 'animate-pulse text-red-400' : ''}`} />
                          <h4 className="font-serif text-sm text-gold-accent font-semibold">Record Voice Message</h4>
                        </div>
                        {recording && (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-950/40 text-[10px] uppercase font-mono text-red-400 border border-red-500/10">
                            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                            Live • {recordingSeconds}s / 30s max
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
                        <div className="space-y-1 text-center sm:text-left">
                          <p className="text-xs text-soft-white/80 font-medium">Capture a real voice note</p>
                          <p className="text-[10px] text-soft-white/40">Requires browser microphone permission. 30 seconds limit ensures rapid cloud saves.</p>
                        </div>

                        {!recording ? (
                          <button
                            onClick={startRecording}
                            className="bg-rose-gold hover:bg-gold-accent text-navy text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-lg active:scale-95 cursor-pointer"
                          >
                            <Mic className="w-4 h-4" />
                            Start Recording
                          </button>
                        ) : (
                          <button
                            onClick={stopRecording}
                            className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-lg active:scale-95 cursor-pointer animate-pulse"
                          >
                            <Pause className="w-4 h-4 fill-white text-white" />
                            Stop & Capture
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Upload MP3 File Block */}
                    <div className="bg-black/30 border border-rose-gold/20 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-5 h-5 text-rose-gold" />
                        <h4 className="font-serif text-sm text-gold-accent font-semibold">Upload Audio Clip (MP3 / WAV / M4A)</h4>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
                        <div className="space-y-1 text-center sm:text-left">
                          <p className="text-xs text-soft-white/80 font-medium">Or select a pre-recorded file</p>
                          <p className="text-[10px] text-soft-white/40">Keep file size under 1.2MB for optimized instant cloud loading.</p>
                        </div>

                        <label className="bg-navy hover:bg-black/20 border border-rose-gold/30 text-rose-gold text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer select-none">
                          Choose File
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={handleAudioUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Dynamic Link URL Option */}
                    <div className="bg-black/30 border border-rose-gold/20 rounded-2xl p-5 space-y-4">
                      <div className="space-y-1">
                        <label className="block text-xs uppercase tracking-widest text-[#cfaf88] font-bold">Alternative Direct Audio URL</label>
                        <p className="text-[10px] text-soft-white/40">If you host your audio file externally, paste its direct URL here.</p>
                      </div>
                      <input
                        type="text"
                        value={draft.voiceMessageUrl || ''}
                        onChange={(e) => {
                          handleFieldChange('voiceMessageUrl', e.target.value);
                          handleFieldChange('voiceMessageBase64', ''); // Reset Base64 upload if they provide URL
                        }}
                        className="w-full bg-black/40 border border-rose-gold/15 focus:border-rose-gold/50 rounded-xl px-3 py-2.5 text-xs text-soft-white focus:outline-none"
                        placeholder="https://yourserver.com/audionote.mp3"
                      />
                    </div>

                    {/* Save or Clear Loaded Audio Note preview widget */}
                    {(draft.voiceMessageBase64 || draft.voiceMessageUrl) && (
                      <div className="bg-rose-gold/10 border border-rose-gold/30 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] tracking-widest text-rose-gold uppercase font-bold flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" /> Ready Anniversary Note Loaded
                          </span>
                          <button
                            onClick={clearVoiceMessage}
                            className="text-[10px] text-red-400 hover:text-red-300 transition-colors uppercase font-mono font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Delete Note
                          </button>
                        </div>

                        <div className="flex items-center justify-between bg-black/20 rounded-xl p-3 border border-rose-gold/10">
                          <div className="text-left">
                            <p className="text-xs text-soft-white/90 font-medium">
                              {draft.voiceMessageBase64 ? "💡 Recorded memo / Local File" : "🔗 Custom Web Link"}
                            </p>
                            <p className="text-[9px] text-[#cfaf88]/60 font-mono truncate max-w-xs sm:max-w-md">
                              {draft.voiceMessageBase64 ? `Recorded Data (Approx ${Math.round(draft.voiceMessageBase64.length / 1024)} KB)` : draft.voiceMessageUrl}
                            </p>
                          </div>

                          <button
                            onClick={toggleLocalAudioPlay}
                            className="bg-rose-gold/20 hover:bg-rose-gold/30 text-rose-gold p-2.5 rounded-full transition-colors active:scale-95 cursor-pointer"
                            title="Play/Pause Note Test"
                          >
                            {audioPlayState ? (
                              <Pause className="w-4 h-4 fill-rose-gold text-rose-gold" />
                            ) : (
                              <Play className="w-4 h-4 fill-rose-gold text-rose-gold translate-x-0.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {recordingError && (
                      <div className="p-3 bg-red-950/30 border border-red-500/20 text-red-300 rounded-xl text-xs flex gap-2 items-center leading-relaxed">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{recordingError}</span>
                      </div>
                    )}

                  </div>
                )}

              </div>

              {/* Panel Footer */}
              <div className="p-6 md:p-8 border-t border-rose-gold/15 bg-black/30 flex flex-col sm:flex-row gap-3 items-center justify-between">
                
                <button
                  onClick={applyPreview}
                  id="preview-changes-btn"
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-6 py-3 border border-rose-gold/40 hover:border-rose-gold text-rose-gold bg-navy/20 hover:bg-rose-gold/5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-300 select-none cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span id="preview-feedback">Preview Changes</span>
                </button>

                <button
                  onClick={publishGame}
                  disabled={saving}
                  id="publish-custom-game-btn"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-gold-accent text-navy hover:bg-rose-gold rounded-xl text-xs font-bold tracking-widest uppercase transition-all duration-300 shadow-[0_0_15px_rgba(201,149,108,0.3)] select-none disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save & Create Share Link
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Confetti & Share Link Screen Modal */}
      <AnimatePresence>
        {shareConfig && shareConfig.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-navy/95 border border-rose-gold/40 rounded-3xl p-6 md:p-10 text-center shadow-2xl relative"
            >
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setShareConfig(null)}
                  className="p-2 rounded-full hover:bg-rose-gold/10 text-rose-gold/70 hover:text-rose-gold transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Glowing Heart Circle */}
              <div className="w-16 h-16 rounded-full bg-rose-gold/20 border border-rose-gold/40 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-rose-gold fill-rose-gold/10 animate-pulse" />
              </div>

              <h3 className="font-serif text-2xl text-gold-accent tracking-widest uppercase font-light mb-2">
                Your Shared Love is Born
              </h3>
              <p className="text-xs text-soft-white/60 max-w-sm mx-auto mb-6 leading-relaxed">
                {shareConfig.method === 'firestore' 
                  ? 'Successfully secured in our live cloud database! Anyone opening your custom code parameters will relive the specific stories you prepared.'
                  : 'Successfully compiled your custom settings into a secure URL packet! You can copy and send this link anywhere, your data resides entirely in the URL itself.'
                }
              </p>

              {/* Copyable Action Zone */}
              <div className="bg-black/40 border border-rose-gold/20 rounded-2xl p-3 flex items-center justify-between gap-2 max-w-sm mx-auto mb-8 relative">
                <input
                  type="text"
                  readOnly
                  value={shareConfig.url}
                  className="w-full bg-transparent border-none text-[10px] text-rose-gold text-left select-all focus:outline-none truncate overflow-x-auto pr-3 font-mono"
                />
                <button
                  onClick={copyShareUrl}
                  className="px-4 py-2 bg-rose-gold/15 hover:bg-rose-gold/25 text-rose-gold text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all outline-none shrink-0 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy URL
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-col gap-3 max-w-sm mx-auto">
                <div className="text-[10px] uppercase tracking-widest text-soft-white/40 mb-1">
                  💡 What is next?
                </div>
                <div className="text-xs text-soft-white/70 leading-relaxed text-left space-y-2 px-2 bg-black/10 rounded-xl py-4 border border-rose-gold/10">
                  <p>1. Copy the URL above.</p>
                  <p>2. Send it to your partner in a sweet romantic text or card.</p>
                  <p>3. When they click the link, they will experience your personalized challenges, milestones, memories, and handwritten letters!</p>
                </div>
                
                <button
                  onClick={() => setShareConfig(null)}
                  className="mt-4 px-6 py-3 bg-rose-gold text-navy rounded-full text-xs font-bold tracking-widest uppercase hover:bg-gold-accent transition-all cursor-pointer"
                >
                  Awesome, Close Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
