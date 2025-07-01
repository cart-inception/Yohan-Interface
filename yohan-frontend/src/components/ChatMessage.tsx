import { cn } from '@/lib/utils';
import type { ChatMessageType } from '../types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
  className?: string;
}

export function ChatMessage({ message, className }: ChatMessageProps) {
  const isUser = message.sender === 'user';
  const isAssistant = message.sender === 'assistant';

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Get status indicator
  const getStatusIndicator = () => {
    if (!message.status || message.status === 'sent') return null;
    
    switch (message.status) {
      case 'sending':
        return (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse" />
            Sending...
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1 text-xs text-destructive">
            <div className="w-2 h-2 bg-destructive rounded-full" />
            Failed to send
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "flex w-full mb-2 chat-message",
        isUser ? "justify-end" : "justify-start",
        className
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3 py-2 relative chat-message-bubble",
          "transition-all duration-200",
          isUser && [
            "bg-primary text-primary-foreground",
            "rounded-br-sm",
            "shadow-lg shadow-primary/20"
          ],
          isAssistant && [
            "bg-card border border-border",
            "text-card-foreground",
            "rounded-bl-sm",
            "shadow-lg shadow-black/20"
          ]
        )}
      >
        {/* Message content */}
        <div className="space-y-1">
          {/* Sender label for assistant messages - more compact */}
          {isAssistant && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              Yohan
            </div>
          )}

          {/* Message text - optimized for 7-inch screen */}
          <div className={cn(
            "text-sm leading-snug whitespace-pre-wrap",
            isUser ? "text-primary-foreground" : "text-foreground"
          )}>
            {message.content}
          </div>

          {/* Timestamp and status - more compact */}
          <div className={cn(
            "flex items-center justify-between gap-1 text-xs mt-1",
            isUser ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            <span className="text-xs">{formatTimestamp(message.timestamp)}</span>
            {getStatusIndicator()}
          </div>
        </div>

        {/* Message tail/pointer - smaller for compact design */}
        <div
          className={cn(
            "absolute top-3 w-0 h-0",
            isUser && [
              "right-0 translate-x-full",
              "border-l-[6px] border-l-primary",
              "border-t-[4px] border-t-transparent",
              "border-b-[4px] border-b-transparent"
            ],
            isAssistant && [
              "left-0 -translate-x-full",
              "border-r-[6px] border-r-border",
              "border-t-[4px] border-t-transparent",
              "border-b-[4px] border-b-transparent"
            ]
          )}
        />
      </div>
    </div>
  );
}
