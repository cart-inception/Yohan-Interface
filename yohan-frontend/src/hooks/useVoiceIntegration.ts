import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useElevenLabsTTS } from './useElevenLabsTTS';
import { useWakeWordDetection } from './useWakeWordDetection';
import { useVoiceCommands } from './useVoiceCommands';
import { useAppWebSocket } from './useAppWebSocket';
import { useHttpChat } from './useHttpChat';

export interface VoiceIntegrationState {
  isEnabled: boolean;
  isListening: boolean;
  isWakeWordActive: boolean;
  isAwake: boolean;
  isSpeaking: boolean;
  status: 'idle' | 'listening' | 'processing' | 'speaking';
  error: string | null;
  lastCommand: string | null;
  supportedFeatures: {
    speechRecognition: boolean;
    textToSpeech: boolean;
    wakeWord: boolean;
  };
}

export interface VoiceIntegrationActions {
  enable: () => Promise<void>;
  disable: () => void;
  startListening: () => Promise<void>;
  stopListening: () => void;
  processVoiceCommand: (transcript: string) => Promise<void>;
  speakResponse: (text: string) => Promise<void>;
  toggleWakeWord: (enabled: boolean) => Promise<void>;
  updateSettings: (settings: Partial<ReturnType<typeof useAppStore.getState>['voice']['settings']>) => void;
}

export const useVoiceIntegration = (): VoiceIntegrationState & VoiceIntegrationActions => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef(false);
  
  // Store hooks - only get what we need to avoid infinite loops
  const voice = useAppStore(state => state.voice);
  const setVoiceStatus = useAppStore(state => state.setVoiceStatus);
  const setVoiceWakeWordActive = useAppStore(state => state.setVoiceWakeWordActive);
  const setVoiceAwake = useAppStore(state => state.setVoiceAwake);
  const setVoiceCommand = useAppStore(state => state.setVoiceCommand);
  const setVoiceResponse = useAppStore(state => state.setVoiceResponse);
  const setVoiceError = useAppStore(state => state.setVoiceError);
  const updateVoiceSettings = useAppStore(state => state.updateVoiceSettings);

  // Voice service hooks
  const speechRecognition = useSpeechRecognition();
  const elevenLabsTTS = useElevenLabsTTS();
  const wakeWordDetection = useWakeWordDetection();
  const voiceCommands = useVoiceCommands();
  
  // Chat integration hooks
  const { sendChatMessage: sendWebSocketMessage } = useAppWebSocket();
  const { sendChatMessage: sendHttpMessage } = useHttpChat();

  // Supported features detection
  const supportedFeatures = {
    speechRecognition: speechRecognition.isSupported,
    textToSpeech: elevenLabsTTS.isSupported,
    wakeWord: speechRecognition.isSupported, // Wake word depends on speech recognition
  };

  // Update store with current status
  useEffect(() => {
    const currentStatus = 
      elevenLabsTTS.isSpeaking ? 'speaking' :
      processingRef.current ? 'processing' :
      speechRecognition.isListening ? 'listening' :
      'idle';
    
    setVoiceStatus(currentStatus);
  }, [speechRecognition.isListening, elevenLabsTTS.isSpeaking, setVoiceStatus]);

  // Update store with wake word state
  useEffect(() => {
    setVoiceWakeWordActive(wakeWordDetection.isActive);
    setVoiceAwake(wakeWordDetection.isAwake, wakeWordDetection.detectedPhrase || undefined);
  }, [wakeWordDetection.isActive, wakeWordDetection.isAwake, wakeWordDetection.detectedPhrase, setVoiceWakeWordActive, setVoiceAwake]);

  // Update store with errors
  useEffect(() => {
    const combinedError = 
      speechRecognition.error ||
      elevenLabsTTS.error ||
      wakeWordDetection.error ||
      error;
    
    setVoiceError(combinedError);
  }, [speechRecognition.error, elevenLabsTTS.error, wakeWordDetection.error, error, setVoiceError]);

  // Disable voice integration
  const disable = useCallback(() => {
    setIsEnabled(false);
    updateVoiceSettings({ enabled: false });
    
    speechRecognition.stopListening();
    elevenLabsTTS.stop();
    wakeWordDetection.stop();
    
    setError(null);
    console.log('Voice integration disabled');
  }, [speechRecognition, elevenLabsTTS, wakeWordDetection, updateVoiceSettings]);

  // Process voice command
  const processVoiceCommand = useCallback(async (transcript: string) => {
    if (processingRef.current) return;
    
    try {
      processingRef.current = true;
      setVoiceCommand(transcript);
      
      // Parse the command
      const action = voiceCommands.parseCommand(transcript);
      if (!action) {
        throw new Error('Failed to parse voice command');
      }

      // Handle system commands locally
      if (action.type === 'system') {
        if (action.payload.command === 'stop_listening') {
          disable();
          return;
        }
      }

      // Execute the command (this adds messages to chat history)
      await voiceCommands.executeCommand(action);

      // For all commands that create chat messages, send to LLM
      if (action.type === 'chat' || action.type === 'weather' || action.type === 'calendar') {
        // Get the latest message that was just added to chat history
        const chatHistory = useAppStore.getState().chatHistory;
        const latestMessage = chatHistory[chatHistory.length - 1];
        
        if (latestMessage && latestMessage.sender === 'user') {
          try {
            console.log('🎤 Sending voice command to LLM:', latestMessage.content);
            // Try WebSocket first, fallback to HTTP
            await sendWebSocketMessage(latestMessage.content);
          } catch (wsError) {
            console.warn('WebSocket failed, trying HTTP:', wsError);
            await sendHttpMessage(latestMessage.content);
          }
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process voice command';
      console.error('Error processing voice command:', err);
      setError(errorMessage);
    } finally {
      processingRef.current = false;
    }
  }, [voiceCommands.parseCommand, voiceCommands.executeCommand, sendWebSocketMessage, sendHttpMessage, setVoiceCommand, disable]);

  // Speak response text using ElevenLabs TTS
  const speakResponse = useCallback(async (text: string) => {
    if (!elevenLabsTTS.isSupported || !voice.settings.autoSpeak) {
      return;
    }

    try {
      setVoiceResponse(text);
      console.log('🎤 Speaking response with ElevenLabs TTS:', text.substring(0, 50) + '...');
      
      await elevenLabsTTS.speak(text, {
        voice_id: null, // Use default Peter voice
        voice_settings: {
          stability: 0.85,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true,
        },
        use_cache: true,
      });
    } catch (err) {
      console.error('Error speaking response with ElevenLabs:', err);
      setError('Failed to speak response');
    }
  }, [elevenLabsTTS, voice.settings.autoSpeak, setVoiceResponse]);

  // Start listening for commands
  const startListening = useCallback(async () => {
    if (!isEnabled || !supportedFeatures.speechRecognition) {
      throw new Error('Voice integration not enabled or supported');
    }

    try {
      await speechRecognition.startListening({
        continuous: false, // Single command mode
        language: voice.settings.language,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start listening';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isEnabled, supportedFeatures.speechRecognition, speechRecognition, voice.settings.language]);

  // Stop listening
  const stopListening = useCallback(() => {
    speechRecognition.stopListening();
  }, [speechRecognition]);

  // Set up wake word detection callbacks
  useEffect(() => {
    const handleWakeWordDetected = (phrase: string) => {
      console.log('Wake word detected:', phrase);
      
      // Start listening for commands
      if (!speechRecognition.isListening) {
        startListening().catch(err => {
          console.error('Failed to start listening after wake word:', err);
        });
      }
    };

    const handleWakeWordTimeout = () => {
      console.log('Wake word timeout');
      
      // Stop listening if no command was given
      if (speechRecognition.isListening && !processingRef.current) {
        stopListening();
      }
    };

    wakeWordDetection.onWakeWordDetected(handleWakeWordDetected);
    wakeWordDetection.onWakeWordTimeout(handleWakeWordTimeout);
  }, [wakeWordDetection, startListening, stopListening, speechRecognition.isListening]);

  // Set up speech recognition command handling
  useEffect(() => {
    if (!speechRecognition.isListening || !speechRecognition.finalTranscript) return;

    // Process final transcript as commands
    const transcript = speechRecognition.finalTranscript.trim();
    if (transcript) {
      processVoiceCommand(transcript).then(() => {
        speechRecognition.resetTranscript();
      });
    }
  }, [speechRecognition.finalTranscript, speechRecognition.isListening, processVoiceCommand, speechRecognition.resetTranscript]);

  // Listen for chat responses to speak - optimized to prevent infinite loops
  const lastChatMessage = useRef<string>('');
  const chatHistory = useAppStore(state => state.chatHistory);
  const autoSpeak = useAppStore(state => state.voice.settings.autoSpeak);
  
  useEffect(() => {
    if (chatHistory.length > 0 && autoSpeak && isEnabled) {
      const lastMessage = chatHistory[chatHistory.length - 1];
      
      // Speak assistant responses only when voice integration is enabled
      if (lastMessage.sender === 'assistant' && 
          lastMessage.content !== lastChatMessage.current &&
          lastMessage.content.trim()) {
        lastChatMessage.current = lastMessage.content;
        console.log('🎤 Auto-speaking assistant response via voice integration');
        speakResponse(lastMessage.content);
      }
    }
  }, [chatHistory.length, autoSpeak, isEnabled, speakResponse]);

  // Enable voice integration
  const enable = useCallback(async () => {
    try {
      if (!supportedFeatures.speechRecognition) {
        throw new Error('Speech recognition not supported in this browser');
      }

      setError(null);
      setIsEnabled(true);
      
      // Update settings
      updateVoiceSettings({ enabled: true });

      // Start wake word detection if enabled
      if (voice.settings.wakeWordEnabled) {
        await wakeWordDetection.start({
          phrases: voice.settings.wakeWords,
          language: voice.settings.language,
          continuous: true,
          timeout: 10000, // 10 seconds to listen after wake word
        });
      }

      console.log('Voice integration enabled');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enable voice integration';
      setError(errorMessage);
      setIsEnabled(false);
      throw new Error(errorMessage);
    }
  }, [supportedFeatures.speechRecognition, voice.settings, wakeWordDetection, updateVoiceSettings]);

  // Toggle wake word detection
  const toggleWakeWord = useCallback(async (enabled: boolean) => {
    updateVoiceSettings({ wakeWordEnabled: enabled });

    if (enabled && isEnabled) {
      await wakeWordDetection.start({
        phrases: voice.settings.wakeWords,
        language: voice.settings.language,
        continuous: true,
        timeout: 10000,
      });
    } else {
      wakeWordDetection.stop();
    }
  }, [isEnabled, voice.settings, wakeWordDetection, updateVoiceSettings]);

  // Update voice settings
  const updateSettings = useCallback((settings: Partial<typeof voice.settings>) => {
    updateVoiceSettings(settings);
  }, [updateVoiceSettings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disable();
    };
  }, [disable]);

  return {
    // State
    isEnabled,
    isListening: speechRecognition.isListening,
    isWakeWordActive: wakeWordDetection.isActive,
    isAwake: wakeWordDetection.isAwake,
    isSpeaking: elevenLabsTTS.isSpeaking,
    status: voice.status,
    error: voice.error,
    lastCommand: voice.lastCommand,
    supportedFeatures,

    // Actions
    enable,
    disable,
    startListening,
    stopListening,
    processVoiceCommand,
    speakResponse,
    toggleWakeWord,
    updateSettings,
  };
};

export default useVoiceIntegration;