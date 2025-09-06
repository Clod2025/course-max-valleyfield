import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useChatMessages, useChatRealtime, useSendMessage } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';

interface ChatWidgetProps {
  chatId: string;
  title?: string;
  minimizable?: boolean;
  className?: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  chatId,
  title = 'Support',
  minimizable = true,
  className,
}) => {
  const { user } = useAuth();
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useChatMessages(chatId);
  const sendMessage = useSendMessage();

  // Écoute temps réel
  useChatRealtime(chatId);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await sendMessage.mutateAsync({
        chatId,
        content: message.trim(),
      });
      setMessage('');
    } catch (error) {
      // Error handled by hook
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUserInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return firstName?.[0]?.toUpperCase() || 'U';
  };

  if (isMinimized) {
    return (
      <Button
        onClick={() => setIsMinimized(false)}
        className={`fixed bottom-4 right-4 rounded-full w-14 h-14 shadow-lg ${className}`}
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-4 right-4 w-80 h-96 shadow-lg ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
        <div className="flex space-x-1">
          {minimizable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(true)}
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col h-full">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center text-muted-foreground">
                Chargement des messages...
              </div>
            ) : messages?.length === 0 ? (
              <div className="text-center text-muted-foreground">
                Aucun message pour l'instant
              </div>
            ) : (
              messages?.map((msg) => {
                const isOwn = msg.user_id === user?.id;
                const isSystem = msg.message_type === 'system';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        {msg.content}
                      </Badge>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex items-start space-x-2 max-w-[75%] ${
                        isOwn ? 'flex-row-reverse space-x-reverse' : ''
                      }`}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {getUserInitials(
                            msg.profiles?.first_name,
                            msg.profiles?.last_name
                          )}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div
                        className={`rounded-lg px-3 py-2 ${
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <div
                          className={`text-xs mt-1 ${
                            isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}
                        >
                          {formatTime(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tapez votre message..."
              className="flex-1"
              disabled={sendMessage.isPending}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!message.trim() || sendMessage.isPending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

// Composant minimal pour l'affichage des messages uniquement
export const ChatMessages: React.FC<{ chatId: string }> = ({ chatId }) => {
  const { user } = useAuth();
  const { data: messages, isLoading } = useChatMessages(chatId);

  useChatRealtime(chatId);

  if (isLoading) {
    return <div>Chargement des messages...</div>;
  }

  return (
    <div className="space-y-3">
      {messages?.map((msg) => {
        const isOwn = msg.user_id === user?.id;
        const isSystem = msg.message_type === 'system';

        if (isSystem) {
          return (
            <div key={msg.id} className="text-center py-2">
              <Badge variant="secondary">{msg.content}</Badge>
            </div>
          );
        }

        return (
          <div
            key={msg.id}
            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-3 py-2 ${
                isOwn
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <div className="text-xs mt-1 opacity-70">
                {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};