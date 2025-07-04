import React from 'react';
import { VoiceIndicator } from '../components/VoiceIndicator';
import { SimpleVoiceTest } from '../components/SimpleVoiceTest';
import { Button } from '../components/ui/button';
import { useAppStore } from '../store/appStore';

export const VoiceTestView: React.FC = () => {
  const { setCurrentView } = useAppStore();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Voice Integration Test</h1>
          <Button 
            variant="outline" 
            onClick={() => setCurrentView('dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enhanced Voice Integration Test */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">🎤 Enhanced Voice Assistant (ElevenLabs TTS)</h2>
              <VoiceIndicator />
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">🔧 Simple Voice Test (Web Speech API)</h2>
              <SimpleVoiceTest />
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Voice Assistant Testing Guide</h2>
            
            <div className="p-4 border rounded-lg bg-card border-green-500/20 bg-green-500/5">
              <h3 className="font-medium mb-2 text-green-600">🚀 Step 1: Enable Enhanced Voice Assistant</h3>
              <p className="text-sm text-muted-foreground">
                Use the Enhanced Voice Assistant panel to enable the full voice integration with ElevenLabs TTS.
              </p>
              <ul className="text-sm text-muted-foreground ml-4 mt-2">
                <li>• High-quality Peter voice synthesis</li>
                <li>• Automatic LLM response speech</li>
                <li>• Wake word detection</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg bg-card border-blue-500/20 bg-blue-500/5">
              <h3 className="font-medium mb-2 text-blue-600">🎯 Step 2: Test Voice Commands</h3>
              <p className="text-sm text-muted-foreground">
                Try these voice commands to test the complete workflow:
              </p>
              <ul className="text-sm text-muted-foreground ml-4 mt-2">
                <li>• <strong>"Hey Yohan"</strong> (wake word trigger)</li>
                <li>• <strong>"What's the weather?"</strong> (weather query + TTS response)</li>
                <li>• <strong>"What's my schedule?"</strong> (calendar query + TTS response)</li>
                <li>• <strong>"Tell me about React"</strong> (general chat + TTS response)</li>
                <li>• <strong>"Go to dashboard"</strong> (navigation command)</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg bg-card border-purple-500/20 bg-purple-500/5">
              <h3 className="font-medium mb-2 text-purple-600">🔄 Step 3: Complete Workflow Test</h3>
              <p className="text-sm text-muted-foreground">
                Test the full voice assistant pipeline:
              </p>
              <ol className="text-sm text-muted-foreground ml-4 mt-2 space-y-1">
                <li>1. Enable voice and wake word detection</li>
                <li>2. Say "Hey Yohan, what's the weather?"</li>
                <li>3. Wait for LLM processing</li>
                <li>4. Listen to ElevenLabs TTS response</li>
              </ol>
            </div>
            
            <div className="p-4 border rounded-lg bg-card border-orange-500/20 bg-orange-500/5">
              <h3 className="font-medium mb-2 text-orange-600">🛠️ Troubleshooting</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Browser:</strong> Works best in Chrome/Edge</li>
                <li>• <strong>Microphone:</strong> Allow microphone access when prompted</li>
                <li>• <strong>Backend:</strong> Ensure backend server is running on port 8000</li>
                <li>• <strong>ElevenLabs:</strong> Check API key is configured in backend</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg bg-card border-gray-500/20 bg-gray-500/5">
              <h3 className="font-medium mb-2 text-gray-600">📊 Voice Status Indicators</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <span className="text-gray-500">Idle:</span> Ready to listen</li>
                <li>• <span className="text-green-500">Listening:</span> Capturing speech</li>
                <li>• <span className="text-yellow-500">Processing:</span> LLM generating response</li>
                <li>• <span className="text-blue-500">Speaking:</span> ElevenLabs TTS playing</li>
                <li>• <span className="text-green-400">(Awake):</span> Wake word detected</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceTestView;