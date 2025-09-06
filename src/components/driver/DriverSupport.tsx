import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  MessageSquare, 
  AlertTriangle,
  Phone,
  Mail,
  Send,
  CheckCircle
} from 'lucide-react';

export const DriverSupport = () => {
  const [supportType, setSupportType] = useState<'question' | 'complaint' | 'claim'>('question');
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Logique d'envoi du message
    console.log('Support request:', { supportType, subject, message });
    // Reset form
    setMessage('');
    setSubject('');
  };

  return (
    <div className="space-y-6">
      {/* Contact rapide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Phone className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-800">Support Téléphonique</p>
                <p className="text-sm text-blue-700">(450) 123-4567</p>
                <p className="text-xs text-blue-600">24h/7j pour urgences</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Mail className="w-8 h-8 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">Email Support</p>
                <p className="text-sm text-green-700">support@coursemax.com</p>
                <p className="text-xs text-green-600">Réponse sous 2h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulaire de support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Contacter le Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type de demande */}
            <div>
              <label className="block text-sm font-medium mb-2">Type de demande</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={supportType === 'question' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSupportType('question')}
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Question
                </Button>
                <Button
                  type="button"
                  variant={supportType === 'complaint' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSupportType('complaint')}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Plainte
                </Button>
                <Button
                  type="button"
                  variant={supportType === 'claim' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSupportType('claim')}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Réclamation
                </Button>
              </div>
            </div>

            {/* Sujet */}
            <div>
              <label className="block text-sm font-medium mb-2">Sujet</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Décrivez brièvement votre demande"
                required
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Décrivez votre demande en détail..."
                rows={5}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              <Send className="w-4 h-4 mr-2" />
              Envoyer la Demande
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Historique des demandes */}
      <Card>
        <CardHeader>
          <CardTitle>Mes Demandes Récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Problème de paiement</p>
                <p className="text-sm text-muted-foreground">Il y a 2 jours</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Résolu
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Question sur les horaires</p>
                <p className="text-sm text-muted-foreground">Il y a 1 semaine</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Résolu
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Questions Fréquentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-2">Quand suis-je payé ?</h4>
              <p className="text-sm text-muted-foreground">
                Les paiements sont effectués tous les vendredis soir pour les gains de la semaine.
              </p>
            </div>

            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-2">Comment fonctionnent les pourboires ?</h4>
              <p className="text-sm text-muted-foreground">
                Les pourboires sont automatiquement transférés sur votre compte dès qu'ils sont reçus.
              </p>
            </div>

            <div className="p-3 border rounded-lg">
              <h4 className="font-medium mb-2">Que faire en cas de problème avec une livraison ?</h4>
              <p className="text-sm text-muted-foreground">
                Contactez immédiatement le support au (450) 123-4567 ou utilisez le formulaire ci-dessus.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
