import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ChatMessage {
  id: string;
  content: string;
  sender_type: 'user' | 'support';
  timestamp: string;
}

interface ChatSession {
  id: string;
  status: 'active' | 'closed';
  messages: ChatMessage[];
}

export const useLiveChat = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [newMessage, setNewMessage] = useState('');

  // Créer une nouvelle session de chat
  const createChatSession = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('create_support_chat', {
        p_user_id: user.id,
        p_initial_message: 'Bonjour, j\'ai besoin d\'aide'
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (sessionId) => {
      // Charger la session créée
      loadChatSession(sessionId);
    },
  });

  // Envoyer un message
  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      if (!session || !user) throw new Error('No active session');

      const { data, error } = await supabase
        .from('support_messages')
        .insert({
          session_id: session.id,
          user_id: user.id,
          content: message,
          sender_type: 'user'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (message) => {
      if (session) {
        setSession({
          ...session,
          messages: [...session.messages, message]
        });
      }
      setNewMessage('');
    },
  });

  const loadChatSession = async (sessionId: string) => {
    // Simulation - en production, charger depuis Supabase
    setSession({
      id: sessionId,
      status: 'active',
      messages: [
        {
          id: '1',
          content: 'Bonjour ! Comment puis-je vous aider ?',
          sender_type: 'support',
          timestamp: new Date().toISOString()
        }
      ]
    });
  };

  const startChat = () => {
    setIsOpen(true);
    if (!session) {
      createChatSession.mutate();
    }
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    session,
    newMessage,
    setNewMessage,
    startChat,
    closeChat,
    sendMessage: (message: string) => sendMessage.mutate(message),
    isLoading: createChatSession.isPending || sendMessage.isPending,
  };
};