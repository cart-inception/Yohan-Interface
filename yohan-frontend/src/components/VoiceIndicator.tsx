import React from 'react';
import { useVoiceIntegration } from '../hooks/useVoiceIntegration';
import { useAppStore } from '../store/appStore';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Mic, MicOff, Volume2, VolumeX, Zap, ZapOff } from 'lucide-react';

export const VoiceIndicator: React.FC = () => {
  const {
    isEnabled,
    isListening,
    isWakeWordActive,
    isAwake,
    isSpeaking,
    status,
    error,
    lastCommand,
    supportedFeatures,
    enable,
    disable,
    startListening,
    stopListening,
    toggleWakeWord,
  } = useVoiceIntegration();

  const { voice } = useAppStore();

  const getStatusColor = () => {
    if (error) return 'text-red-500';
    switch (status) {
      case 'listening': return 'text-green-500';
      case 'processing': return 'text-yellow-500';
      case 'speaking': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    if (isSpeaking) return <Volume2 className="h-6 w-6" />;
    if (isListening) return <Mic className="h-6 w-6 animate-pulse" />;
    return <MicOff className="h-6 w-6" />;
  };

  const handleToggleVoice = async () => {
    try {
      if (isEnabled) {
        disable();
      } else {
        await enable();
      }
    } catch (err) {
      console.error('Failed to toggle voice:', err);
    }
  };

  const handleToggleListening = async () => {
    try {
      if (isListening) {
        stopListening();
      } else {
        await startListening();
      }
    } catch (err) {
      console.error('Failed to toggle listening:', err);
    }
  };

  const handleToggleWakeWord = async () => {
    try {
      await toggleWakeWord(!isWakeWordActive);
    } catch (err) {
      console.error('Failed to toggle wake word:', err);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className={getStatusColor()}>
            {getStatusIcon()}
          </div>
          Voice Status: {status}
          {isAwake && <span className="text-green-500 text-sm">(Awake)</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Support Status */}
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>Speech Recognition:</span>
            <span className={supportedFeatures.speechRecognition ? 'text-green-500' : 'text-red-500'}>
              {supportedFeatures.speechRecognition ? '✓ Supported' : '✗ Not Supported'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Text-to-Speech:</span>
            <span className={supportedFeatures.textToSpeech ? 'text-green-500' : 'text-red-500'}>
              {supportedFeatures.textToSpeech ? '✓ Supported' : '✗ Not Supported'}
            </span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Last Command */}
        {lastCommand && (
          <div className="p-2 bg-blue-100 border border-blue-300 rounded text-blue-700 text-sm">
            <strong>Last Command:</strong> {lastCommand}
          </div>
        )}

        {/* Wake Word Status */}
        {voice.detectedWakeWord && (
          <div className="p-2 bg-green-100 border border-green-300 rounded text-green-700 text-sm">
            <strong>Wake Word Detected:</strong> {voice.detectedWakeWord}
          </div>
        )}

        {/* Control Buttons */}
        <div className="space-y-2">
          <Button 
            onClick={handleToggleVoice}
            className="w-full"
            variant={isEnabled ? "destructive" : "default"}
            disabled={!supportedFeatures.speechRecognition}
          >
            {isEnabled ? (
              <>
                <VolumeX className="h-4 w-4 mr-2" />
                Disable Voice
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 mr-2" />
                Enable Voice
              </>
            )}
          </Button>

          {isEnabled && (
            <>
              <Button 
                onClick={handleToggleListening}
                className="w-full"
                variant={isListening ? "secondary" : "outline"}
              >
                {isListening ? (
                  <>
                    <MicOff className="h-4 w-4 mr-2" />
                    Stop Listening
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Start Listening
                  </>
                )}
              </Button>

              <Button 
                onClick={handleToggleWakeWord}
                className="w-full"
                variant={isWakeWordActive ? "secondary" : "outline"}
              >
                {isWakeWordActive ? (
                  <>
                    <ZapOff className="h-4 w-4 mr-2" />
                    Disable Wake Word
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Enable Wake Word
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        {/* Voice Settings Display */}
        {isEnabled && (
          <div className="text-xs text-gray-600 space-y-1">
            <div><strong>Language:</strong> {voice.settings.language}</div>
            <div><strong>Wake Words:</strong> {voice.settings.wakeWords.join(', ')}</div>
            <div><strong>Auto Speak:</strong> {voice.settings.autoSpeak ? 'Yes' : 'No'}</div>
          </div>
        )}

        {/* Test Instructions */}
        {isEnabled && (
          <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
            <strong>Test Commands:</strong>
            <ul className="mt-1 space-y-1">
              <li>• "Hey Yohan" (wake word)</li>
              <li>• "What's the weather?"</li>
              <li>• "What's my schedule?"</li>
              <li>• "Go to dashboard"</li>
              <li>• "Tell me about React"</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceIndicator;