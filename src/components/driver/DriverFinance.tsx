import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Gift,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
  Save,
  Smartphone,
  Mail,
  Building
} from 'lucide-react';

export const DriverFinance = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentData, setPaymentData] = useState({
    // Carte de débit/crédit
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    
    // Interac
    interacPhone: '',
    interacEmail: '',
    
    // Compte bancaire
    bankName: '',
    accountNumber: '',
    transitNumber: '',
    institutionNumber: '',
    accountHolderName: ''
  });

  const { toast } = useToast();

  const handleSavePaymentMethod = () => {
    // Validation basique
    if (!paymentMethod) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un moyen de paiement",
        variant: "destructive",
      });
      return;
    }

    // Logique de sauvegarde (à connecter avec l'API)
    console.log('Sauvegarde du moyen de paiement:', { paymentMethod, paymentData });
    
    toast({
      title: "Succès",
      description: "Votre moyen de paiement a été configuré avec succès",
    });
    
    setShowPaymentModal(false);
    resetForm();
  };

  const resetForm = () => {
    setPaymentMethod('');
    setPaymentData({
      cardNumber: '',
      cardName: '',
      expiryDate: '',
      cvv: '',
      interacPhone: '',
      interacEmail: '',
      bankName: '',
      accountNumber: '',
      transitNumber: '',
      institutionNumber: '',
      accountHolderName: ''
    });
  };

  const renderPaymentForm = () => {
    switch (paymentMethod) {
      case 'debit':
      case 'credit':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="cardNumber">Numéro de carte</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={paymentData.cardNumber}
                onChange={(e) => setPaymentData({...paymentData, cardNumber: e.target.value})}
                maxLength={19}
              />
            </div>
            <div>
              <Label htmlFor="cardName">Nom sur la carte</Label>
              <Input
                id="cardName"
                placeholder="Jean Dupuis"
                value={paymentData.cardName}
                onChange={(e) => setPaymentData({...paymentData, cardName: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiryDate">Date d'expiration</Label>
                <Input
                  id="expiryDate"
                  placeholder="MM/AA"
                  value={paymentData.expiryDate}
                  onChange={(e) => setPaymentData({...paymentData, expiryDate: e.target.value})}
                  maxLength={5}
                />
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={paymentData.cvv}
                  onChange={(e) => setPaymentData({...paymentData, cvv: e.target.value})}
                  maxLength={4}
                />
              </div>
            </div>
          </div>
        );

      case 'interac':
        return (
          <div className="space-y-4">
            <div>
              <Label>Choisissez votre méthode Interac</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Button
                  type="button"
                  variant={paymentData.interacPhone ? 'default' : 'outline'}
                  onClick={() => setPaymentData({...paymentData, interacEmail: '', interacPhone: paymentData.interacPhone || ''})}
                  className="h-12"
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Téléphone
                </Button>
                <Button
                  type="button"
                  variant={paymentData.interacEmail ? 'default' : 'outline'}
                  onClick={() => setPaymentData({...paymentData, interacPhone: '', interacEmail: paymentData.interacEmail || ''})}
                  className="h-12"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Courriel
                </Button>
              </div>
            </div>
            
            {paymentData.interacPhone !== '' && (
              <div>
                <Label htmlFor="interacPhone">Numéro de téléphone</Label>
                <Input
                  id="interacPhone"
                  placeholder="(450) 123-4567"
                  value={paymentData.interacPhone}
                  onChange={(e) => setPaymentData({...paymentData, interacPhone: e.target.value})}
                />
              </div>
            )}
            
            {paymentData.interacEmail !== '' && (
              <div>
                <Label htmlFor="interacEmail">Adresse courriel</Label>
                <Input
                  id="interacEmail"
                  type="email"
                  placeholder="jean.dupuis@email.com"
                  value={paymentData.interacEmail}
                  onChange={(e) => setPaymentData({...paymentData, interacEmail: e.target.value})}
                />
              </div>
            )}
          </div>
        );

      case 'bank':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="accountHolderName">Nom du titulaire du compte</Label>
              <Input
                id="accountHolderName"
                placeholder="Jean Dupuis"
                value={paymentData.accountHolderName}
                onChange={(e) => setPaymentData({...paymentData, accountHolderName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="bankName">Nom de la banque</Label>
              <Input
                id="bankName"
                placeholder="Banque Nationale du Canada"
                value={paymentData.bankName}
                onChange={(e) => setPaymentData({...paymentData, bankName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="accountNumber">Numéro de compte</Label>
              <Input
                id="accountNumber"
                placeholder="1234567890"
                value={paymentData.accountNumber}
                onChange={(e) => setPaymentData({...paymentData, accountNumber: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transitNumber">Numéro de transit</Label>
                <Input
                  id="transitNumber"
                  placeholder="12345"
                  value={paymentData.transitNumber}
                  onChange={(e) => setPaymentData({...paymentData, transitNumber: e.target.value})}
                  maxLength={5}
                />
              </div>
              <div>
                <Label htmlFor="institutionNumber">Numéro d'institution</Label>
                <Input
                  id="institutionNumber"
                  placeholder="006"
                  value={paymentData.institutionNumber}
                  onChange={(e) => setPaymentData({...paymentData, institutionNumber: e.target.value})}
                  maxLength={3}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Résumé financier */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Gains Aujourd'hui</p>
                <p className="text-2xl font-bold text-green-800">156.50$</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Cette Semaine</p>
                <p className="text-2xl font-bold text-blue-800">892.75$</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">Pourboires</p>
                <p className="text-2xl font-bold text-purple-800">45.25$</p>
              </div>
              <Gift className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700">En Attente</p>
                <p className="text-2xl font-bold text-orange-800">234.50$</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="earnings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="earnings">Gains</TabsTrigger>
          <TabsTrigger value="tips">Pourboires</TabsTrigger>
          <TabsTrigger value="payments">Paiements</TabsTrigger>
        </TabsList>

        <TabsContent value="earnings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Historique des Gains
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">8 livraisons - Aujourd'hui</p>
                    <p className="text-sm text-muted-foreground">9h30 - 17h45</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">156.50$</p>
                    <Badge variant="outline" className="text-green-600">Complété</Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">12 livraisons - Hier</p>
                    <p className="text-sm text-muted-foreground">8h00 - 18h30</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">198.75$</p>
                    <Badge className="bg-green-600">Payé</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tips" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Pourboires Reçus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Transfert Automatique Activé</span>
                </div>
                <p className="text-sm text-blue-700">
                  Les pourboires sont automatiquement transférés sur votre compte dès réception.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Commande #12345</p>
                    <p className="text-sm text-muted-foreground">Il y a 2 heures</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-purple-600">5.00$</p>
                    <Badge className="bg-green-600">Transféré</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Commande #12344</p>
                    <p className="text-sm text-muted-foreground">Il y a 4 heures</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-purple-600">3.50$</p>
                    <Badge className="bg-green-600">Transféré</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Paiements Programmés
                </div>
                {/* NOUVEAU BOUTON POUR CONFIGURER LES MOYENS DE PAIEMENT */}
                <Button 
                  onClick={() => setShowPaymentModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Configurer Moyen de Paiement
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-orange-800">Prochain Paiement</span>
                </div>
                <p className="text-sm text-orange-700">
                  Vendredi 20h00 - Tous les gains de la semaine seront transférés.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                  <div>
                    <p className="font-medium">Paiement du 15 Décembre</p>
                    <p className="text-sm text-muted-foreground">Semaine du 9-15 Décembre</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">1,245.50$</p>
                    <Badge className="bg-green-600">Payé</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                  <div>
                    <p className="font-medium">Paiement du 22 Décembre</p>
                    <p className="text-sm text-muted-foreground">Semaine du 16-22 Décembre</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600">892.75$</p>
                    <Badge variant="outline" className="text-orange-600">En attente</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL POUR CONFIGURER LES MOYENS DE PAIEMENT */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Configurer Moyen de Paiement
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowPaymentModal(false);
                    resetForm();
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sélection du type de paiement */}
              <div>
                <Label>Type de moyen de paiement</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choisissez un moyen de paiement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debit">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Carte de Débit
                      </div>
                    </SelectItem>
                    <SelectItem value="credit">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Carte de Crédit
                      </div>
                    </SelectItem>
                    <SelectItem value="interac">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        Interac e-Transfer
                      </div>
                    </SelectItem>
                    <SelectItem value="bank">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Compte Bancaire
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Formulaire dynamique selon le type sélectionné */}
              {renderPaymentForm()}

              {/* Boutons d'action */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowPaymentModal(false);
                    resetForm();
                  }}
                >
                  Annuler
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={handleSavePaymentMethod}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
