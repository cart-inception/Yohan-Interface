import { useEffect, useRef, useState } from 'react';
import SpeechRecognition, { useSpeechRecognition as useNativeSpeechRecognition } from 'react-speech-recognition';

export interface VoiceCommand {
  phrases: string[];
  action: (transcript: string, matches?: string[]) => void;
  continuous?: boolean;
}

export interface SpeechRecognitionConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  grammars?: SpeechGrammarList;
}

export interface SpeechRecognitionState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  finalTranscript: string;
  isSupported: boolean;
  isMicrophoneAvailable: boolean;
  error: string | null;
  confidence: number;
}

export interface SpeechRecognitionActions {
  startListening: (config?: SpeechRecognitionConfig) => Promise<void>;
  stopListening: () => void;
  abortListening: () => void;
  resetTranscript: () => void;
  addCommand: (command: VoiceCommand) => void;
  removeCommand: (phrases: string[]) => void;
  clearCommands: () => void;
}

export const useSpeechRecognition = (): SpeechRecognitionState & SpeechRecognitionActions => {
  const [commands, setCommands] = useState<VoiceCommand[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const commandsRef = useRef<VoiceCommand[]>([]);

  // Update commands ref when commands change
  useEffect(() => {
    commandsRef.current = commands;
  }, [commands]);

  // Convert commands to react-speech-recognition format
  const reactSpeechCommands = commands.map(command => ({
    command: command.phrases,
    callback: (transcript: string, ...matches: string[]) => {
      try {
        command.action(transcript, matches);
      } catch (err) {
        console.error('Error executing voice command:', err);
        setError(err instanceof Error ? err.message : 'Unknown command error');
      }
    },
    matchInterim: command.continuous || false,
    isFuzzyMatch: true,
    fuzzyMatchingThreshold: 0.7,
  }));

  const {
    transcript,
    interimTranscript,
    finalTranscript,
    resetTranscript: nativeResetTranscript,
    listening,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useNativeSpeechRecognition({
    commands: reactSpeechCommands,
    clearTranscriptOnListen: false,
  });

  // Enhanced error handling
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      setError('Browser does not support speech recognition');
    } else if (!isMicrophoneAvailable) {
      setError('Microphone access denied or unavailable');
    } else {
      setError(null);
    }
  }, [browserSupportsSpeechRecognition, isMicrophoneAvailable]);

  // Enhanced start listening with error handling
  const startListening = async (config: SpeechRecognitionConfig = {}) => {
    try {
      setError(null);
      
      if (!browserSupportsSpeechRecognition) {
        throw new Error('Speech recognition not supported in this browser');
      }

      if (!isMicrophoneAvailable) {
        throw new Error('Microphone access is required for speech recognition');
      }

      const options = {
        continuous: config.continuous ?? true,
        language: config.language ?? 'en-US',
      };

      await SpeechRecognition.startListening(options);
      
      // Set up recognition event listeners for additional feedback
      const recognition = SpeechRecognition.getRecognition();
      if (recognition) {
        recognition.onresult = (event) => {
          if (event.results.length > 0) {
            const result = event.results[event.results.length - 1];
            if (result[0]) {
              setConfidence(result[0].confidence || 0);
            }
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setError(`Speech recognition error: ${event.error}`);
        };

        recognition.onend = () => {
          setConfidence(0);
        };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start speech recognition';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const stopListening = () => {
    try {
      SpeechRecognition.stopListening();
      setError(null);
    } catch (err) {
      console.error('Error stopping speech recognition:', err);
      setError('Failed to stop speech recognition');
    }
  };

  const abortListening = () => {
    try {
      SpeechRecognition.abortListening();
      setError(null);
    } catch (err) {
      console.error('Error aborting speech recognition:', err);
      setError('Failed to abort speech recognition');
    }
  };

  const resetTranscript = () => {
    try {
      nativeResetTranscript();
      setError(null);
      setConfidence(0);
    } catch (err) {
      console.error('Error resetting transcript:', err);
      setError('Failed to reset transcript');
    }
  };

  const addCommand = (command: VoiceCommand) => {
    setCommands(prev => {
      // Remove existing commands with same phrases to avoid duplicates
      const filtered = prev.filter(cmd => 
        !cmd.phrases.some(phrase => command.phrases.includes(phrase))
      );
      return [...filtered, command];
    });
  };

  const removeCommand = (phrases: string[]) => {
    setCommands(prev => 
      prev.filter(cmd => 
        !cmd.phrases.some(phrase => phrases.includes(phrase))
      )
    );
  };

  const clearCommands = () => {
    setCommands([]);
  };

  return {
    // State
    isListening: listening,
    transcript,
    interimTranscript,
    finalTranscript,
    isSupported: browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    error,
    confidence,
    
    // Actions
    startListening,
    stopListening,
    abortListening,
    resetTranscript,
    addCommand,
    removeCommand,
    clearCommands,
  };
};

export default useSpeechRecognition;