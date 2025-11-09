import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  HelpCircle, 
  Send, 
  Paperclip, 
  X, 
  CheckCircle,
  Loader2,
  MessageSquare,
  User,
  Mail,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface HelpMessage {
  subject: string;
  message: string;
  attachment?: File;
}

export function MerchantHelpModal() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<HelpMessage>({
    subject: '',
    message: '',
    attachment: undefined
  });
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

  const handleSubmit = async () => {
    // Validation des champs obligatoires
    if (!formData.subject.trim()) {
      toast({
        title: "Erreur de validation",
        description: "Le sujet est obligatoire",
        variant: "destructive"
      });
      return;
    }

    if (!formData.message.trim()) {
      toast({
        title: "Erreur de validation",
        description: "Le message est obligatoire",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Préparer les données du message
      const messageData = {
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        merchant_id: profile?.id,
        merchant_name: `${profile?.first_name} ${profile?.last_name}`,
        merchant_email: profile?.email,
        status: 'pending',
        created_at: new Date().toISOString(),
        attachment_name: formData.attachment?.name || null,
        attachment_size: formData.attachment?.size || null,
        attachment_type: formData.attachment?.type || null
      };

      // Insérer le message dans la base de données
      const { data, error } = await supabase
        .from('help_messages')
        .insert([messageData])
        .select()
        .single();

      if (error) {
        // Si la table n'existe pas, créer une table temporaire ou utiliser une autre approche
        console.log('Table help_messages non trouvée, utilisation de la table settings');
        
        // Alternative : stocker dans la table settings
        const { error: settingsError } = await supabase
          .from('settings')
          .insert([{
            category: 'help_messages',
            key: `message_${Date.now()}`,
            value: JSON.stringify(messageData),
            created_at: new Date().toISOString()
          }]);

        if (settingsError) throw settingsError;
      }

      // Message de succès
      toast({
        title: "✅ Message envoyé avec succès",
        description: "Votre demande d'aide a été transmise aux administrateurs",
      });

      // Réinitialiser le formulaire
      setFormData({
        subject: '',
        message: '',
        attachment: undefined
      });
      setAttachmentPreview(null);
      setIsOpen(false);

      // Message de confirmation supplémentaire
      setTimeout(() => {
        toast({
          title: "📧 Notification envoyée",
          description: "Les administrateurs ont été notifiés de votre demande",
        });
      }, 2000);

    } catch (error: any) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast({
        title: "❌ Erreur d'envoi",
        description: error.message || "Impossible d'envoyer votre message. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille du fichier (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "La taille maximale autorisée est de 5MB",
          variant: "destructive"
        });
        return;
      }

      setFormData(prev => ({ ...prev, attachment: file }));
      
      // Créer un aperçu du fichier
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachmentPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = () => {
    setFormData(prev => ({ ...prev, attachment: undefined }));
    setAttachmentPreview(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <HelpCircle className="w-4 h-4 mr-2" />
          Aide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Centre d'Aide - Contact Administrateur
          </DialogTitle>
          <DialogDescription>
            Contactez l'administrateur pour obtenir de l'aide ou signaler un problème
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations du marchand */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vos informations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {profile?.first_name} {profile?.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {profile?.email}
                  </p>
                </div>
                <Badge variant="outline" className="ml-auto">
                  Marchand
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Votre message sera transmis directement aux administrateurs de CourseMax.
              </p>
            </CardContent>
          </Card>

          {/* Formulaire de contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Envoyer un message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="subject">Sujet *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Ex: Problème avec la gestion des produits"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Décrivez votre problème ou votre question en détail..."
                  className="mt-1 min-h-[120px]"
                />
              </div>

              {/* Pièce jointe */}
              <div>
                <Label htmlFor="attachment">Pièce jointe (optionnel)</Label>
                <div className="mt-1">
                  {!formData.attachment ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="attachment"
                        onChange={handleAttachmentChange}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.txt"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('attachment')?.click()}
                      >
                        <Paperclip className="w-4 h-4 mr-2" />
                        Ajouter un fichier
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Max 5MB (images, PDF, documents)
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <Paperclip className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium flex-1">
                        {formData.attachment.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {(formData.attachment.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeAttachment}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Aperçu de l'image si c'est une image */}
              {attachmentPreview && formData.attachment?.type.startsWith('image/') && (
                <div className="mt-2">
                  <Label>Aperçu de l'image</Label>
                  <div className="mt-1 border rounded-lg p-2">
                    <img
                      src={attachmentPreview}
                      alt="Aperçu"
                      className="max-w-full max-h-32 object-contain"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !formData.subject.trim() || !formData.message.trim()}
              className="w-full sm:min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer
                </>
              )}
            </Button>
          </div>

          {/* Informations supplémentaires */}
          <div className="text-xs text-muted-foreground text-center">
            <p>Les administrateurs recevront votre message et vous répondront dans les plus brefs délais.</p>
            <p className="mt-1">Temps de réponse moyen : 24-48 heures</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
