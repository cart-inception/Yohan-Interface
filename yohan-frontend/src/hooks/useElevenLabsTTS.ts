import { useCallback, useRef, useState } from 'react';

export interface ElevenLabsVoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

export interface ElevenLabsTTSConfig {
  voice_id?: string | null;
  voice_settings?: ElevenLabsVoiceSettings;
  use_cache?: boolean;
  stream?: boolean;
}

export interface ElevenLabsTTSState {
  isSupported: boolean;
  isSpeaking: boolean;
  isLoading: boolean;
  currentAudio: HTMLAudioElement | null;
  error: string | null;
  queue: string[];
  lastResponse: {
    audio_url?: string;
    duration_ms?: number;
    text?: string;
  } | null;
}

export interface ElevenLabsTTSActions {
  speak: (text: string, config?: ElevenLabsTTSConfig) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  clearQueue: () => void;
  checkHealth: () => Promise<boolean>;
}

const DEFAULT_VOICE_SETTINGS: ElevenLabsVoiceSettings = {
  stability: 0.85,
  similarity_boost: 0.75,
  style: 0.5,
  use_speaker_boost: true,
};

const PETER_VOICE_ID = 'ZthjuvLPty3kTMaNKVKb';
const TTS_API_BASE = 'http://localhost:8000/api/tts';

export const useElevenLabsTTS = (): ElevenLabsTTSState & ElevenLabsTTSActions => {
  // State
  const [isSupported] = useState(() => typeof Audio !== 'undefined' && typeof fetch !== 'undefined');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<string[]>([]);
  const [lastResponse, setLastResponse] = useState<ElevenLabsTTSState['lastResponse']>(null);

  // Refs for managing audio and queue processing
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);

  // Update queue ref when queue changes
  queueRef.current = queue;

  // Process next item in queue
  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || queueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    const nextText = queueRef.current[0];
    setQueue(prev => prev.slice(1));

    if (nextText.trim()) {
      await synthesizeAndPlay(nextText);
    }

    isProcessingRef.current = false;

    // Process next item if queue is not empty
    if (queueRef.current.length > 0) {
      setTimeout(() => processQueue(), 100);
    }
  }, []);

  // Synthesize text and play audio
  const synthesizeAndPlay = async (text: string, configParam?: ElevenLabsTTSConfig) => {
    try {
      setIsLoading(true);
      setError(null);

      const requestBody = {
        text: text.trim(),
        voice_id: configParam?.voice_id ?? PETER_VOICE_ID,
        voice_settings: configParam?.voice_settings ?? DEFAULT_VOICE_SETTINGS,
        use_cache: configParam?.use_cache ?? true,
        stream: configParam?.stream ?? false,
      };

      console.log('🎤 Synthesizing speech with ElevenLabs:', text.substring(0, 50) + '...');

      const response = await fetch(`${TTS_API_BASE}/synthesize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.audio_url) {
        throw new Error(data.error || 'Failed to generate audio');
      }

      console.log('🎵 Audio generated successfully, playing...');

      // Store response data
      setLastResponse({
        audio_url: data.audio_url,
        duration_ms: data.duration_ms,
        text: text,
      });

      // Create and configure audio element
      const audio = new Audio(data.audio_url);
      audioRef.current = audio;
      setCurrentAudio(audio);

      // Set up audio event handlers
      audio.onloadstart = () => {
        setIsLoading(true);
      };

      audio.oncanplay = () => {
        setIsLoading(false);
        setIsSpeaking(true);
      };

      audio.onended = () => {
        setIsSpeaking(false);
        setCurrentAudio(null);
        audioRef.current = null;
        console.log('🎵 Audio playback completed');
        
        // Process next item in queue
        setTimeout(() => processQueue(), 100);
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setError('Failed to play generated audio');
        setIsSpeaking(false);
        setIsLoading(false);
        setCurrentAudio(null);
        audioRef.current = null;
        
        // Continue with queue even after error
        setTimeout(() => processQueue(), 100);
      };

      audio.onpause = () => {
        setIsSpeaking(false);
      };

      audio.onplay = () => {
        setIsSpeaking(true);
      };

      // Start playback
      await audio.play();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown TTS error';
      console.error('ElevenLabs TTS error:', err);
      setError(errorMessage);
      setIsLoading(false);
      setIsSpeaking(false);
      
      // Continue processing queue even after error
      setTimeout(() => processQueue(), 100);
    }
  };

  // Public speak method
  const speak = useCallback(async (text: string, config?: ElevenLabsTTSConfig): Promise<void> => {
    if (!isSupported) {
      throw new Error('ElevenLabs TTS not supported in this environment');
    }

    if (!text?.trim()) {
      console.warn('Empty text provided to TTS');
      return;
    }

    const trimmedText = text.trim();
    console.log('🎤 Adding to TTS queue:', trimmedText.substring(0, 50) + '...');

    // Add to queue
    setQueue(prev => [...prev, trimmedText]);

    // Start processing if not already processing
    if (!isProcessingRef.current) {
      setTimeout(() => processQueue(), 0);
    }
  }, [isSupported, processQueue]);

  // Stop current playback and clear queue
  const stop = useCallback(() => {
    console.log('🛑 Stopping TTS playback and clearing queue');
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    
    setCurrentAudio(null);
    setIsSpeaking(false);
    setIsLoading(false);
    setQueue([]);
    isProcessingRef.current = false;
  }, []);

  // Pause current playback
  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      console.log('⏸️ Pausing TTS playback');
      audioRef.current.pause();
    }
  }, []);

  // Resume current playback
  const resume = useCallback(() => {
    if (audioRef.current && audioRef.current.paused) {
      console.log('▶️ Resuming TTS playback');
      audioRef.current.play().catch(err => {
        console.error('Failed to resume audio:', err);
        setError('Failed to resume audio playback');
      });
    }
  }, []);

  // Clear queue without stopping current playback
  const clearQueue = useCallback(() => {
    console.log('🗑️ Clearing TTS queue');
    setQueue([]);
    isProcessingRef.current = false;
  }, []);

  // Check TTS service health
  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${TTS_API_BASE}/health`);
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      
      const data = await response.json();
      const isHealthy = data.success && data.service_available;
      
      if (!isHealthy) {
        setError('TTS service is not available');
      }
      
      return isHealthy;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Health check failed';
      console.error('TTS health check error:', err);
      setError(errorMessage);
      return false;
    }
  }, []);

  return {
    // State
    isSupported,
    isSpeaking,
    isLoading,
    currentAudio,
    error,
    queue,
    lastResponse,

    // Actions
    speak,
    stop,
    pause,
    resume,
    clearQueue,
    checkHealth,
  };
};

export default useElevenLabsTTS;