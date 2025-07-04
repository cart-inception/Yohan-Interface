import { useCallback, useEffect, useRef, useState } from 'react';

export interface TTSVoice {
  name: string;
  lang: string;
  default: boolean;
  localService: boolean;
  voiceURI: string;
}

export interface TTSConfig {
  voice?: TTSVoice | null;
  rate?: number; // 0.1 to 10
  pitch?: number; // 0 to 2
  volume?: number; // 0 to 1
  lang?: string;
}

export interface TTSState {
  isSupported: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  isLoading: boolean;
  availableVoices: TTSVoice[];
  currentVoice: TTSVoice | null;
  error: string | null;
  queue: string[];
}

export interface TTSActions {
  speak: (text: string, config?: TTSConfig) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setVoice: (voice: TTSVoice | null) => void;
  setRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
  setVolume: (volume: number) => void;
  clearQueue: () => void;
}

export const useTextToSpeech = (): TTSState & TTSActions => {
  const [isSupported] = useState(() => 'speechSynthesis' in window);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<TTSVoice[]>([]);
  const [currentVoice, setCurrentVoiceState] = useState<TTSVoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<string[]>([]);
  
  // TTS settings
  const [rate, setRateState] = useState(1);
  const [pitch, setPitchState] = useState(1);
  const [volume, setVolumeState] = useState(1);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const queueRef = useRef<string[]>([]);

  // Update queue ref when queue changes
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  // Load available voices
  const loadVoices = useCallback(() => {
    if (!isSupported) return;

    const voices = speechSynthesis.getVoices().map(voice => ({
      name: voice.name,
      lang: voice.lang,
      default: voice.default,
      localService: voice.localService,
      voiceURI: voice.voiceURI,
    }));

    setAvailableVoices(voices);

    // Set default voice if none selected
    if (!currentVoice && voices.length > 0) {
      const defaultVoice = voices.find(v => v.default) || voices[0];
      setCurrentVoiceState(defaultVoice);
    }
  }, [isSupported, currentVoice]);

  // Initialize voices
  useEffect(() => {
    if (!isSupported) {
      setError('Text-to-speech not supported in this browser');
      return;
    }

    loadVoices();

    // Some browsers load voices asynchronously
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [isSupported, loadVoices]);

  // Monitor speech synthesis state
  useEffect(() => {
    if (!isSupported) return;

    const checkSpeechState = () => {
      setIsSpeaking(speechSynthesis.speaking);
      setIsPaused(speechSynthesis.paused);
    };

    const interval = setInterval(checkSpeechState, 100);
    return () => clearInterval(interval);
  }, [isSupported]);

  // Process next item in queue
  const processQueue = useCallback(() => {
    if (queueRef.current.length === 0 || speechSynthesis.speaking) {
      return;
    }

    const nextText = queueRef.current[0];
    setQueue(prev => prev.slice(1));

    if (nextText.trim()) {
      speakText(nextText);
    } else {
      // If empty text, process next item
      setTimeout(processQueue, 0);
    }
  }, []);

  const speakText = (text: string) => {
    if (!isSupported) {
      setError('Text-to-speech not supported');
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply current settings
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
      
      if (currentVoice) {
        const voice = speechSynthesis.getVoices().find(v => v.voiceURI === currentVoice.voiceURI);
        if (voice) {
          utterance.voice = voice;
        }
      }

      // Set up event handlers
      utterance.onstart = () => {
        setIsSpeaking(true);
        setError(null);
        setIsLoading(false);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
        
        // Process next item in queue
        setTimeout(processQueue, 100);
      };

      utterance.onerror = (event) => {
        console.error('TTS Error:', event.error);
        setError(`TTS Error: ${event.error}`);
        setIsSpeaking(false);
        setIsPaused(false);
        setIsLoading(false);
        utteranceRef.current = null;
        
        // Process next item in queue even after error
        setTimeout(processQueue, 100);
      };

      utterance.onpause = () => {
        setIsPaused(true);
      };

      utterance.onresume = () => {
        setIsPaused(false);
      };

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to speak text';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const speak = async (text: string, config?: TTSConfig): Promise<void> => {
    if (!isSupported) {
      throw new Error('Text-to-speech not supported');
    }

    if (!text.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    // Apply temporary config if provided
    if (config) {
      if (config.rate !== undefined) setRateState(config.rate);
      if (config.pitch !== undefined) setPitchState(config.pitch);
      if (config.volume !== undefined) setVolumeState(config.volume);
      if (config.voice !== undefined) setCurrentVoiceState(config.voice);
    }

    // Add to queue
    setQueue(prev => [...prev, text]);

    // Start processing if not already speaking
    if (!speechSynthesis.speaking) {
      setTimeout(processQueue, 0);
    }
  };

  const pause = () => {
    if (!isSupported) return;
    
    try {
      speechSynthesis.pause();
    } catch (err) {
      console.error('Error pausing TTS:', err);
      setError('Failed to pause speech');
    }
  };

  const resume = () => {
    if (!isSupported) return;
    
    try {
      speechSynthesis.resume();
    } catch (err) {
      console.error('Error resuming TTS:', err);
      setError('Failed to resume speech');
    }
  };

  const stop = () => {
    if (!isSupported) return;
    
    try {
      speechSynthesis.cancel();
      setQueue([]);
      setIsSpeaking(false);
      setIsPaused(false);
      setIsLoading(false);
      utteranceRef.current = null;
    } catch (err) {
      console.error('Error stopping TTS:', err);
      setError('Failed to stop speech');
    }
  };

  const setVoice = (voice: TTSVoice | null) => {
    setCurrentVoiceState(voice);
  };

  const setRate = (newRate: number) => {
    const clampedRate = Math.max(0.1, Math.min(10, newRate));
    setRateState(clampedRate);
  };

  const setPitch = (newPitch: number) => {
    const clampedPitch = Math.max(0, Math.min(2, newPitch));
    setPitchState(clampedPitch);
  };

  const setVolume = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
  };

  const clearQueue = () => {
    setQueue([]);
  };

  return {
    // State
    isSupported,
    isSpeaking,
    isPaused,
    isLoading,
    availableVoices,
    currentVoice,
    error,
    queue,
    
    // Actions
    speak,
    pause,
    resume,
    stop,
    setVoice,
    setRate,
    setPitch,
    setVolume,
    clearQueue,
  };
};

export default useTextToSpeech;