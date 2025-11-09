import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  MessageSquare, 
  User, 
  Mail, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Send,
  Download,
  Eye,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface HelpMessage {
  id: string;
  subject: string;
  message: string;
  merchant_id: string;
  merchant_name: string;
  merchant_email: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  attachment_name?: string;
  attachment_size?: number;
  attachment_type?: string;
  admin_response?: string;
  admin_id?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export default function HelpMessagesManager() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<HelpMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<HelpMessage | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [responding, setResponding] = useState(false);

  const toastRef = useRef(toast);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('help_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Table help_messages non trouvée, utilisation de la table settings');
        // Alternative : récupérer depuis la table settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('*')
          .eq('category', 'help_messages')
          .order('created_at', { ascending: false });

        if (settingsError) throw settingsError;

        const parsedMessages = settingsData?.map(item => JSON.parse(item.value)) || [];
        setMessages(parsedMessages);
      } else {
        setMessages(data || []);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des messages:', error);
      toastRef.current({
        title: "Erreur",
        description: "Impossible de charger les messages d'aide",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const updateMessageStatus = async (messageId: string, status: string, response?: string) => {
    try {
      setResponding(true);
      
      // Essayer d'abord la table help_messages
      const { error } = await supabase
        .from('help_messages')
        .update({
          status,
          admin_response: response,
          admin_id: (await supabase.auth.getUser()).data.user?.id,
          resolved_at: status === 'resolved' ? new Date().toISOString() : null
        })
        .eq('id', messageId);

      if (error) {
        // Alternative : mettre à jour dans settings
        const { error: settingsError } = await supabase
          .from('settings')
          .update({
            value: JSON.stringify({
              ...selectedMessage,
              status,
              admin_response: response,
              admin_id: (await supabase.auth.getUser()).data.user?.id,
              resolved_at: status === 'resolved' ? new Date().toISOString() : null
            })
          })
          .eq('category', 'help_messages')
          .eq('key', `message_${messageId}`);

        if (settingsError) throw settingsError;
      }

      toast({
        title: "Message mis à jour",
        description: `Le message a été marqué comme ${status}`,
      });

      setSelectedMessage(null);
      setAdminResponse('');
      await loadMessages();
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le message",
        variant: "destructive"
      });
    } finally {
      setResponding(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'in_progress': return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed': return <CheckCircle className="w-4 h-4 text-gray-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Messages d'Aide</h2>
          <p className="text-muted-foreground">
            Gérez les demandes d'aide des marchands
          </p>
        </div>
        <Button onClick={loadMessages} variant="outline">
          <MessageSquare className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun message d'aide</h3>
            <p className="text-muted-foreground">
              Les demandes d'aide des marchands apparaîtront ici
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {messages.map((message) => (
            <Card key={message.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg truncate">{message.subject}</CardTitle>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{message.merchant_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{message.merchant_email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>{new Date(message.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(message.status)}>
                      {getStatusIcon(message.status)}
                      <span className="ml-1 capitalize">{message.status}</span>
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedMessage(message)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {message.message}
                </p>
                {message.attachment_name && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Download className="w-3 h-3" />
                    {message.attachment_name} ({formatFileSize(message.attachment_size)})
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de réponse */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Répondre au message
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMessage(null)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold">{selectedMessage.subject}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  De: {selectedMessage.merchant_name} ({selectedMessage.merchant_email})
                </p>
                <p className="text-sm text-muted-foreground">
                  Le: {new Date(selectedMessage.created_at).toLocaleString()}
                </p>
              </div>

              <div>
                <Label>Message original</Label>
                <div className="mt-1 p-3 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              {selectedMessage.attachment_name && (
                <div>
                  <Label>Pièce jointe</Label>
                  <div className="mt-1 flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <Download className="w-4 h-4" />
                    <span className="text-sm">{selectedMessage.attachment_name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({formatFileSize(selectedMessage.attachment_size)})
                    </span>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="admin-response">Votre réponse</Label>
                <Textarea
                  id="admin-response"
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Tapez votre réponse ici..."
                  className="mt-1 min-h-[120px]"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedMessage(null)}
                  className="w-full sm:w-auto"
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => updateMessageStatus(selectedMessage.id, 'in_progress', adminResponse)}
                  disabled={responding}
                  className="w-full sm:w-auto"
                >
                  {responding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Marquer en cours
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => updateMessageStatus(selectedMessage.id, 'resolved', adminResponse)}
                  disabled={responding}
                  variant="default"
                  className="w-full sm:w-auto"
                >
                  {responding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Résoudre
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
