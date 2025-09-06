import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Chat {
  id: string;
  type: 'order_support' | 'delivery_update' | 'general';
  order_id?: string;
  subject?: string;
  status: 'active' | 'closed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  user_id: string;
  content: string;
  message_type: 'text' | 'image' | 'system' | 'order_update';
  metadata: any;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
  };
}

export interface ChatParticipant {
  id: string;
  chat_id: string;
  user_id: string;
  role: 'client' | 'merchant' | 'driver' | 'admin';
  joined_at: string;
  last_read_at?: string;
  is_active: boolean;
}

// Configuration des clés de cache pour le chat
export const chatKeys = {
  all: ['chats'] as const,
  userChats: (userId: string) => [...chatKeys.all, 'user', userId] as const,
  chat: (chatId: string) => [...chatKeys.all, 'chat', chatId] as const,
  messages: (chatId: string) => [...chatKeys.chat(chatId), 'messages'] as const,
  participants: (chatId: string) => [...chatKeys.chat(chatId), 'participants'] as const,
};

// Hook pour récupérer les chats de l'utilisateur
export const useUserChats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: chatKeys.userChats(user?.id || ''),
    queryFn: async (): Promise<Chat[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          chat_participants!inner(*)
        `)
        .eq('chat_participants.user_id', user.id)
        .eq('chat_participants.is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 1000, // 30 secondes
    gcTime: 2 * 60 * 1000, // 2 minutes en cache
    enabled: Boolean(user?.id),
  });
};

// Hook pour récupérer les messages d'un chat
export const useChatMessages = (chatId: string, limit: number = 50) => {
  return useQuery({
    queryKey: [...chatKeys.messages(chatId), { limit }],
    queryFn: async (): Promise<ChatMessage[]> => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          profiles(first_name, last_name)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 1000, // 10 secondes
    gcTime: 1 * 60 * 1000, // 1 minute en cache
    enabled: Boolean(chatId),
  });
};

// Hook pour l'écoute temps réel des nouveaux messages
export const useChatRealtime = (chatId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!chatId || !user?.id) return;

    const channel = supabase
      .channel(`chat_${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          console.log('Nouveau message reçu:', payload);
          
          // Ajouter le nouveau message au cache
          queryClient.setQueryData(
            chatKeys.messages(chatId),
            (oldMessages: ChatMessage[] = []) => {
              const newMessage = payload.new as ChatMessage;
              return [...oldMessages, newMessage];
            }
          );

          // Invalider la liste des chats pour mettre à jour l'ordre
          queryClient.invalidateQueries({ queryKey: chatKeys.userChats(user.id) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, user?.id, queryClient]);
};

// Hook pour envoyer un message
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      chatId, 
      content, 
      messageType = 'text' 
    }: { 
      chatId: string; 
      content: string; 
      messageType?: 'text' | 'image' | 'system' | 'order_update';
    }) => {
      if (!user?.id) throw new Error('Utilisateur non connecté');

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          user_id: user.id,
          content,
          message_type: messageType,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Le message sera ajouté automatiquement par le realtime
      // Mais on peut mettre à jour le chat pour le timestamp
      queryClient.invalidateQueries({ queryKey: chatKeys.userChats(user?.id || '') });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer le message",
        variant: "destructive",
      });
    },
  });
};

// Hook pour récupérer le chat d'une commande spécifique
export const useOrderChat = (orderId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...chatKeys.all, 'order', orderId],
    queryFn: async (): Promise<Chat | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          chat_participants!inner(*)
        `)
        .eq('order_id', orderId)
        .eq('chat_participants.user_id', user.id)
        .eq('chat_participants.is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore "not found"
      return data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes en cache
    enabled: Boolean(orderId && user?.id),
  });
};