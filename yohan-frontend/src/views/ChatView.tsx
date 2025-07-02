import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { ChatMessage } from '../components/ChatMessage';
import { useAppStore } from '../store/appStore';

interface ChatViewProps {
  sendChatMessage: (message: string) => void;
  isConnected: boolean;
  connectionStatus: string;
}

export function ChatView({ sendChatMessage, isConnected }: ChatViewProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get store state and actions
  const {
    chatHistory,
    error,
    setError,
  } = useAppStore();

  // WebSocket functions are now passed as props

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [chatHistory]);

  // Focus input when view loads
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Note: Chat history now persists across navigation thanks to WebSocket session management

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    if (!isConnected) {
      setError('Cannot send message: Not connected to server');
      return;
    }

    // Send message via WebSocket
    sendChatMessage(inputMessage.trim());
    
    // Clear input and reset state
    setInputMessage('');
    setError(null);
    
    // Show typing indicator briefly
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1000);
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Header functions removed since we no longer have a header section

  return (
    <div className="flex flex-col bg-background" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Messages Area - This will be the scrollable section */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="p-3 space-y-1">
            {chatHistory.length === 0 ? (
              <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 200px)' }}>
                <div className="text-center space-y-2">
                  <div className="text-3xl">💬</div>
                  <div className="text-lg font-medium text-foreground">
                    Start a conversation with Yohan
                  </div>
                  <div className="text-sm text-muted-foreground max-w-md px-4">
                    Ask about your calendar, weather, or anything else.
                    Yohan has access to your current data and can help with various tasks.
                  </div>
                </div>
              </div>
            ) : (
              chatHistory.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
            )}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start mb-2">
                <div className="bg-card border border-border rounded-lg px-3 py-2 rounded-bl-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs">Yohan is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20 flex-shrink-0">
          <div className="text-sm text-destructive">{error}</div>
        </div>
      )}

      {/* Input Area - Fixed at bottom, optimized for 7-inch screen */}
      <Card className="rounded-none border-x-0 border-b-0 bg-card/50 backdrop-blur-sm flex-shrink-0">
        <CardContent className="p-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={isConnected ? "Type your message..." : "Connecting..."}
              disabled={!isConnected}
              className="flex-1 bg-background border-border focus:border-primary transition-colors h-10 text-sm"
            />
            <Button
              type="submit"
              disabled={!isConnected || !inputMessage.trim()}
              className="px-4 bg-primary hover:bg-primary/90 text-primary-foreground h-10 text-sm touch-target"
            >
              Send
            </Button>
          </form>

          {/* Input hints - more compact */}
          <div className="mt-1 text-xs text-muted-foreground text-center">
            Press Enter to send
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
