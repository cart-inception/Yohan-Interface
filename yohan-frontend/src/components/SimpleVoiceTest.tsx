import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Mic, MicOff, Volume2 } from 'lucide-react';

export const SimpleVoiceTest: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  // Check browser support
  useEffect(() => {
    const speechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const speechSynthesis = 'speechSynthesis' in window;
    
    setIsSupported(speechRecognition && speechSynthesis);
    
    if (speechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(finalTranscript + interimTranscript);
      };
      
      recognitionInstance.onstart = () => {
        setIsListening(true);
        setError(null);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      recognitionInstance.onerror = (event) => {
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    }
  }, []);

  const startListening = () => {
    if (!recognition) {
      setError('Speech recognition not available');
      return;
    }
    
    setTranscript('');
    setError(null);
    
    try {
      recognition.start();
    } catch (err) {
      setError('Failed to start listening');
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      speechSynthesis.speak(utterance);
    } else {
      setError('Text-to-speech not supported');
    }
  };

  const testCommands = [
    'What\'s the weather?',
    'What\'s my schedule?',
    'Hello Yohan',
    'Go to dashboard'
  ];

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isListening ? (
            <Mic className="h-5 w-5 text-green-500 animate-pulse" />
          ) : (
            <MicOff className="h-5 w-5 text-gray-500" />
          )}
          Simple Voice Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Support Status */}
        <div className="p-3 border rounded-lg">
          <h3 className="font-medium mb-2">Browser Support</h3>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Speech Recognition:</span>
              <span className={('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) ? 'text-green-500' : 'text-red-500'}>
                {('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) ? '✓ Supported' : '✗ Not Supported'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Text-to-Speech:</span>
              <span className={('speechSynthesis' in window) ? 'text-green-500' : 'text-red-500'}>
                {('speechSynthesis' in window) ? '✓ Supported' : '✗ Not Supported'}
              </span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Transcript Display */}
        {transcript && (
          <div className="p-3 bg-blue-100 border border-blue-300 rounded text-blue-700 text-sm">
            <strong>You said:</strong> "{transcript}"
          </div>
        )}

        {/* Control Buttons */}
        <div className="space-y-2">
          {isSupported ? (
            <>
              <Button 
                onClick={isListening ? stopListening : startListening}
                className="w-full"
                variant={isListening ? "destructive" : "default"}
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

              {transcript && (
                <Button 
                  onClick={() => speakText(transcript)}
                  className="w-full"
                  variant="outline"
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  Speak Back
                </Button>
              )}
            </>
          ) : (
            <div className="p-3 bg-yellow-100 border border-yellow-300 rounded text-yellow-700 text-sm">
              <strong>Not Supported:</strong> Your browser doesn't support voice features. Try Chrome or Edge.
            </div>
          )}
        </div>

        {/* Test Commands */}
        {isSupported && (
          <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
            <strong>Try saying:</strong>
            <ul className="mt-1 space-y-1">
              {testCommands.map((command, index) => (
                <li key={index}>• "{command}"</li>
              ))}
            </ul>
          </div>
        )}

        {/* Status */}
        <div className="text-xs text-center text-gray-500">
          Status: {isListening ? 'Listening...' : 'Idle'}
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleVoiceTest;