import React, { createContext, useContext, useState, useEffect } from 'react';
import { GameConfig, ROMANTIC_GAME_CONFIG } from '../config';
import { db, isFirebaseReady, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface GameConfigContextType {
  config: GameConfig;
  isLoading: boolean;
  isCustomized: boolean;
  gameId: string | null;
  loadedFromUrl: boolean;
  updateLocalConfig: (newConfig: GameConfig) => void;
  saveAndGetShareUrl: (newConfig: GameConfig) => Promise<{ success: boolean; url: string; method: 'firestore' | 'url-code'; error?: string }>;
}

const GameConfigContext = createContext<GameConfigContextType | undefined>(undefined);

// Helper for UTF-8 Safe Base64 Encoder / Decoder to support Emojis in captions and letters
export function encodeConfigToBase64(config: GameConfig): string {
  try {
    const rawJson = JSON.stringify(config);
    const escapedJson = encodeURIComponent(rawJson).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    });
    return btoa(escapedJson);
  } catch (error) {
    console.error('Encoding error:', error);
    return '';
  }
}

export function decodeConfigFromBase64(base64: string): GameConfig | null {
  try {
    const decodedBytes = atob(base64);
    const escapedJson = decodedBytes.split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join('');
    const rawJson = decodeURIComponent(escapedJson);
    const parsed = JSON.parse(rawJson);
    
    // Quick validation to check if standard fields are present
    if (parsed && typeof parsed === 'object' && 'playerName' in parsed && 'coupleNames' in parsed) {
      return parsed as GameConfig;
    }
    return null;
  } catch (error) {
    console.error('Decoding error:', error);
    return null;
  }
}

export function GameConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<GameConfig>(ROMANTIC_GAME_CONFIG);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCustomized, setIsCustomized] = useState<boolean>(false);
  const [gameId, setGameId] = useState<string | null>(null);
  const [loadedFromUrl, setLoadedFromUrl] = useState<boolean>(false);

  useEffect(() => {
    async function loadConfig() {
      setIsLoading(true);
      const urlParams = new URLSearchParams(window.location.search);
      const idParam = urlParams.get('gameId');
      const codeParam = urlParams.get('code');

      // 1. Try to load from compact self-contained URL code first (Instant, Serverless, robust fallback)
      if (codeParam) {
        const decoded = decodeConfigFromBase64(codeParam);
        if (decoded) {
          setConfig(decoded);
          setIsCustomized(true);
          setLoadedFromUrl(true);
          setIsLoading(false);
          return;
        }
      }

      // 2. Try to load from Firestore if gameId is present and Firebase is ready
      if (idParam) {
        setGameId(idParam);
        if (isFirebaseReady()) {
          const path = `games/${idParam}`;
          try {
            const docRef = doc(db, 'games', idParam);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const cloudDoc = docSnap.data() as GameConfig;
              setConfig(cloudDoc);
              setIsCustomized(true);
              setIsLoading(false);
              return;
            }
          } catch (err) {
            console.error('Error fetching game config from Firestore:', err);
            // Catch error according to guidelines and report detail
            try {
              handleFirestoreError(err, OperationType.GET, path);
            } catch (formattedError) {
              // Non-blocking fallback to local storage / default config
            }
          }
        } else {
          // If Firestore is requested but the DB isn't provisioned yet, look in Local Storage
          const localSaved = localStorage.getItem(`anniversary_game_${idParam}`);
          if (localSaved) {
            try {
              const parsed = JSON.parse(localSaved);
              setConfig(parsed);
              setIsCustomized(true);
              setIsLoading(false);
              return;
            } catch (e) {
              console.error(e);
            }
          }
        }
      }

      // 3. Fallback: check general unsaved localStorage edit
      const localDraft = localStorage.getItem('anniversary_game_draft');
      if (localDraft) {
        try {
          const parsed = JSON.parse(localDraft);
          setConfig(parsed);
          setIsCustomized(true);
        } catch (e) {
          console.error(e);
        }
      }

      setIsLoading(false);
    }

    loadConfig();
  }, []);

  // Soft save locally so they do not lose draft if tab reloads before sharing
  const updateLocalConfig = (newConfig: GameConfig) => {
    setConfig(newConfig);
    setIsCustomized(true);
    localStorage.setItem('anniversary_game_draft', JSON.stringify(newConfig));
  };

  // Perform full write to Firestore, or generate URI code if Firestore isn't provisioned
  const saveAndGetShareUrl = async (newConfig: GameConfig): Promise<{
    success: boolean;
    url: string;
    method: 'firestore' | 'url-code';
    error?: string;
  }> => {
    // Generate a secure, unique game ID
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const newId = `love-${randomSuffix}`;

    // Update state & clear draft
    setConfig(newConfig);
    setIsCustomized(true);
    localStorage.removeItem('anniversary_game_draft');
    localStorage.setItem(`anniversary_game_${newId}`, JSON.stringify(newConfig));

    // Try to save directly to Firestore if ready
    if (isFirebaseReady()) {
      const path = `games/${newId}`;
      try {
        await setDoc(doc(db, 'games', newId), {
          ...newConfig,
          id: newId,
          createdAt: new Date().toISOString()
        });
        setGameId(newId);
        
        const shareUrl = `${window.location.origin}${window.location.pathname}?gameId=${newId}`;
        return { success: true, url: shareUrl, method: 'firestore' };
      } catch (err) {
        console.warn('Firestore write failed, falling back to URL Code save:', err);
        try {
          handleFirestoreError(err, OperationType.WRITE, path);
        } catch (formattedError) {
          // Fall back gracefully to URI block below
        }
      }
    }

    // Serverless fallback: Encode URL config block
    const compressedCode = encodeConfigToBase64(newConfig);
    const shareUrl = `${window.location.origin}${window.location.pathname}?code=${compressedCode}`;
    return { success: true, url: shareUrl, method: 'url-code' };
  };

  return (
    <GameConfigContext.Provider value={{
      config,
      isLoading,
      isCustomized,
      gameId,
      loadedFromUrl,
      updateLocalConfig,
      saveAndGetShareUrl
    }}>
      {children}
    </GameConfigContext.Provider>
  );
}

export function useGameConfig() {
  const context = useContext(GameConfigContext);
  if (context === undefined) {
    throw new Error('useGameConfig must be used within a GameConfigProvider');
  }
  return context;
}
