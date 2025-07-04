import { useCallback, useEffect, useRef, useState } from 'react';
import { useSpeechRecognition } from './useSpeechRecognition';

export interface WakeWordConfig {
  phrases: string[];
  threshold?: number; // Similarity threshold for fuzzy matching
  timeout?: number; // How long to listen after wake word detection (ms)
  continuous?: boolean; // Whether to keep listening after wake word
  language?: string;
}

export interface WakeWordState {
  isActive: boolean; // Whether wake word detection is running
  isAwake: boolean; // Whether wake word was recently detected
  lastDetected: Date | null;
  detectedPhrase: string | null;
  isListening: boolean;
  error: string | null;
}

export interface WakeWordActions {
  start: (config: WakeWordConfig) => Promise<void>;
  stop: () => void;
  reset: () => void;
  onWakeWordDetected: (callback: (phrase: string) => void) => void;
  onWakeWordTimeout: (callback: () => void) => void;
}

const DEFAULT_WAKE_WORDS = ['hey yohan', 'ok yohan', 'yohan'];
const DEFAULT_THRESHOLD = 0.7;
const DEFAULT_TIMEOUT = 5000; // 5 seconds

export const useWakeWordDetection = (): WakeWordState & WakeWordActions => {
  const [isActive, setIsActive] = useState(false);
  const [isAwake, setIsAwake] = useState(false);
  const [lastDetected, setLastDetected] = useState<Date | null>(null);
  const [detectedPhrase, setDetectedPhrase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<WakeWordConfig>({
    phrases: DEFAULT_WAKE_WORDS,
    threshold: DEFAULT_THRESHOLD,
    timeout: DEFAULT_TIMEOUT,
  });

  const wakeWordCallbackRef = useRef<((phrase: string) => void) | null>(null);
  const timeoutCallbackRef = useRef<(() => void) | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isListening,
    startListening,
    stopListening,
    addCommand,
    removeCommand,
    clearCommands,
    transcript,
    isSupported,
    error: speechError,
  } = useSpeechRecognition();

  // Normalize text for comparison
  const normalizeText = (text: string): string => {
    return text.toLowerCase().trim().replace(/[^\w\s]/g, '');
  };

  // Calculate similarity between two strings
  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  // Levenshtein distance implementation
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  // Check if transcript contains wake word
  const checkForWakeWord = useCallback((text: string) => {
    const normalizedTranscript = normalizeText(text);
    const threshold = config.threshold || DEFAULT_THRESHOLD;

    for (const phrase of config.phrases) {
      const normalizedPhrase = normalizeText(phrase);
      
      // Check for exact match or fuzzy match
      if (normalizedTranscript.includes(normalizedPhrase)) {
        return { detected: true, phrase, similarity: 1.0 };
      }
      
      // Check for fuzzy match
      const similarity = calculateSimilarity(normalizedTranscript, normalizedPhrase);
      if (similarity >= threshold) {
        return { detected: true, phrase, similarity };
      }
      
      // Check if wake word is at the beginning or end of transcript
      const words = normalizedTranscript.split(/\s+/);
      const phraseWords = normalizedPhrase.split(/\s+/);
      
      // Check beginning
      if (words.length >= phraseWords.length) {
        const beginning = words.slice(0, phraseWords.length).join(' ');
        const beginSimilarity = calculateSimilarity(beginning, normalizedPhrase);
        if (beginSimilarity >= threshold) {
          return { detected: true, phrase, similarity: beginSimilarity };
        }
        
        // Check end
        const ending = words.slice(-phraseWords.length).join(' ');
        const endSimilarity = calculateSimilarity(ending, normalizedPhrase);
        if (endSimilarity >= threshold) {
          return { detected: true, phrase, similarity: endSimilarity };
        }
      }
    }
    
    return { detected: false, phrase: null, similarity: 0 };
  }, [config.phrases, config.threshold]);

  // Handle wake word detection
  const handleWakeWordDetected = useCallback((phrase: string) => {
    setIsAwake(true);
    setLastDetected(new Date());
    setDetectedPhrase(phrase);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Call user callback
    if (wakeWordCallbackRef.current) {
      wakeWordCallbackRef.current(phrase);
    }
    
    // Set timeout for wake state
    if (config.timeout && config.timeout > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsAwake(false);
        setDetectedPhrase(null);
        
        if (timeoutCallbackRef.current) {
          timeoutCallbackRef.current();
        }
        
        // Restart listening if continuous
        if (config.continuous && isActive) {
          startListening({
            continuous: true,
            language: config.language,
          });
        }
      }, config.timeout);
    }
  }, [config.timeout, config.continuous, config.language, isActive, startListening]);

  // Monitor transcript for wake words
  useEffect(() => {
    if (!isActive || !transcript) return;
    
    const result = checkForWakeWord(transcript);
    if (result.detected && result.phrase) {
      handleWakeWordDetected(result.phrase);
    }
  }, [transcript, isActive, checkForWakeWord, handleWakeWordDetected]);

  // Set up wake word command
  useEffect(() => {
    if (!isActive) return;

    clearCommands();
    
    const wakeWordCommand = {
      phrases: config.phrases,
      action: (detectedText: string) => {
        const result = checkForWakeWord(detectedText);
        if (result.detected && result.phrase) {
          handleWakeWordDetected(result.phrase);
        }
      },
      continuous: true,
    };

    addCommand(wakeWordCommand);

    return () => {
      removeCommand(config.phrases);
    };
  }, [isActive, config.phrases, addCommand, removeCommand, clearCommands, checkForWakeWord, handleWakeWordDetected]);

  // Handle speech recognition errors
  useEffect(() => {
    if (speechError) {
      setError(speechError);
    }
  }, [speechError]);

  const start = async (newConfig: WakeWordConfig) => {
    try {
      if (!isSupported) {
        throw new Error('Speech recognition not supported');
      }

      setConfig(newConfig);
      setError(null);
      setIsActive(true);

      await startListening({
        continuous: true,
        language: newConfig.language || 'en-US',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start wake word detection';
      setError(errorMessage);
      setIsActive(false);
      throw new Error(errorMessage);
    }
  };

  const stop = () => {
    setIsActive(false);
    setIsAwake(false);
    setDetectedPhrase(null);
    setError(null);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    stopListening();
    clearCommands();
  };

  const reset = () => {
    setIsAwake(false);
    setDetectedPhrase(null);
    setLastDetected(null);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const onWakeWordDetected = (callback: (phrase: string) => void) => {
    wakeWordCallbackRef.current = callback;
  };

  const onWakeWordTimeout = (callback: () => void) => {
    timeoutCallbackRef.current = callback;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      stop();
    };
  }, []);

  return {
    // State
    isActive,
    isAwake,
    lastDetected,
    detectedPhrase,
    isListening,
    error,
    
    // Actions
    start,
    stop,
    reset,
    onWakeWordDetected,
    onWakeWordTimeout,
  };
};

export default useWakeWordDetection;