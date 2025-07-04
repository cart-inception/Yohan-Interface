import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface TTSTestProps {
  className?: string;
}

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

const TTSTest: React.FC<TTSTestProps> = ({ className = '' }) => {
  const [text, setText] = useState('Hello! This is a test of the ElevenLabs text-to-speech system. I am Peter, your voice assistant.');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    stability: 0.85,
    similarity_boost: 0.75,
    style: 0.5,
    use_speaker_boost: true
  });
  const [useCache, setUseCache] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  const testTTS = async () => {
    if (!text.trim()) {
      setError('Please enter some text to synthesize');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('http://localhost:8000/api/tts/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          voice_id: null, // Use default Peter voice
          voice_settings: voiceSettings,
          use_cache: useCache,
          stream: false
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.audio_url) {
        setSuccess(`Audio generated successfully! Duration: ${data.duration_ms}ms`);
        
        // Play the audio
        if (audioRef.current) {
          audioRef.current.src = data.audio_url;
          audioRef.current.play().catch(err => {
            console.error('Failed to play audio:', err);
            setError('Audio generated but failed to play. Check browser console.');
          });
        }
      } else {
        setError(data.error || 'Unknown error occurred');
      }
    } catch (err) {
      console.error('TTS test error:', err);
      setError(`Request failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testHealth = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('http://localhost:8000/api/tts/health');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (data.success && data.service_available) {
        setSuccess('TTS service is healthy and available!');
      } else {
        setError(`TTS service health check failed: ${data.error || 'Service not available'}`);
      }
    } catch (err) {
      console.error('Health check error:', err);
      setError(`Health check failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateVoiceSetting = (key: keyof VoiceSettings, value: number | boolean) => {
    setVoiceSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Card className={`w-full max-w-2xl ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎤 TTS Test Panel
        </CardTitle>
        <CardDescription>
          Test ElevenLabs text-to-speech integration with Peter voice
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Health Check */}
        <div>
          <Button 
            onClick={testHealth} 
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? '🔄 Checking...' : '🩺 Check TTS Health'}
          </Button>
        </div>

        {/* Text Input */}
        <div className="space-y-2">
          <label htmlFor="tts-text" className="block text-sm font-medium">Text to Synthesize</label>
          <textarea
            id="tts-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to convert to speech..."
            className="min-h-[100px] w-full p-3 border border-border rounded-md bg-background text-foreground resize-none"
            rows={4}
          />
        </div>

        {/* Voice Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Voice Settings</h3>
          
          <div className="space-y-3">
            <div>
              <label htmlFor="stability" className="block text-sm mb-1">
                Stability: {voiceSettings.stability.toFixed(2)}
              </label>
              <input
                type="range"
                id="stability"
                min={0}
                max={1}
                step={0.05}
                value={voiceSettings.stability}
                onChange={(e) => updateVoiceSetting('stability', parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            
            <div>
              <label htmlFor="similarity" className="block text-sm mb-1">
                Similarity Boost: {voiceSettings.similarity_boost.toFixed(2)}
              </label>
              <input
                type="range"
                id="similarity"
                min={0}
                max={1}
                step={0.05}
                value={voiceSettings.similarity_boost}
                onChange={(e) => updateVoiceSetting('similarity_boost', parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            
            <div>
              <label htmlFor="style" className="block text-sm mb-1">
                Style: {voiceSettings.style.toFixed(2)}
              </label>
              <input
                type="range"
                id="style"
                min={0}
                max={1}
                step={0.05}
                value={voiceSettings.style}
                onChange={(e) => updateVoiceSetting('style', parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="speaker-boost"
                checked={voiceSettings.use_speaker_boost}
                onChange={(e) => updateVoiceSetting('use_speaker_boost', e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <label htmlFor="speaker-boost" className="text-sm">
                Use Speaker Boost
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="use-cache"
                checked={useCache}
                onChange={(e) => setUseCache(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <label htmlFor="use-cache" className="text-sm">
                Use Cache
              </label>
            </div>
          </div>
        </div>

        {/* Test Button */}
        <Button 
          onClick={testTTS} 
          disabled={isLoading || !text.trim()}
          className="w-full"
          size="lg"
        >
          {isLoading ? '🔄 Synthesizing...' : '🎵 Test TTS'}
        </Button>

        {/* Status Messages */}
        {error && (
          <div className="p-4 border border-red-500/30 rounded-md bg-red-500/10 text-red-400">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-4 border border-green-500/30 rounded-md bg-green-500/10 text-green-400">
            {success}
          </div>
        )}

        {/* Hidden Audio Element */}
        <audio ref={audioRef} controls className="w-full mt-4" style={{ display: 'none' }} />
        
        {/* Instructions */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Instructions:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>First, run the health check to verify TTS service is available</li>
            <li>Adjust voice settings to customize Peter's voice</li>
            <li>Enter text and click "Test TTS" to generate speech</li>
            <li>Audio will play automatically when generated</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default TTSTest;