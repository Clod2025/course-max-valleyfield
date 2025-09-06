import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp,
  Calendar,
  Download,
  Send,
  Clock,
  CheckCircle,
  Edit,
  Save,
  X,
  Building,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BankAccount {
  accountName: string;
  accountNumber: string;
  bankName: string;
  transitNumber: string;
  isConfigured: boolean;
}

interface TransferMethod {
  type: 'debit' | 'credit' | 'interac';
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  isConfigured: boolean;
}

export function FinanceManager() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showBankForm, setShowBankForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);

  // États pour le compte bancaire
  const [bankAccount, setBankAccount] = useState<BankAccount>({
    accountName: 'CourseMax Inc.',
    accountNumber: '****1234',
    bankName: 'Banque Nationale',
    transitNumber: '00006',
    isConfigured: true
  });

  const [bankForm, setBankForm] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    transitNumber: ''
  });

  // États pour la méthode de transfert
  const [transferMethod, setTransferMethod] = useState<TransferMethod>({
    type: 'debit',
    cardNumber: '****5678',
    cardName: 'CourseMax Business',
    expiryDate: '12/26',
    isConfigured: true
  });

  const [transferForm, setTransferForm] = useState({
    type: 'debit' as 'debit' | 'credit' | 'interac',
    cardNumber: '',
    cardName: '',
    expiryDate: ''
  });

  const handlePayrollFriday = async () => {
    setLoading(true);
    try {
      // Simuler le traitement du payroll
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Payroll traité",
        description: "Tous les paiements ont été envoyés aux livreurs éligibles",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de traiter le payroll",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBankAccount = async () => {
    if (!bankForm.accountName || !bankForm.accountNumber || !bankForm.bankName || !bankForm.transitNumber) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Simuler la sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setBankAccount({
        accountName: bankForm.accountName,
        accountNumber: `****${bankForm.accountNumber.slice(-4)}`,
        bankName: bankForm.bankName,
        transitNumber: bankForm.transitNumber,
        isConfigured: true
      });

      setShowBankForm(false);
      setBankForm({ accountName: '', accountNumber: '', bankName: '', transitNumber: '' });
      
      toast({
        title: "Compte bancaire configuré",
        description: "Les informations ont été sauvegardées avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le compte bancaire",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTransferMethod = async () => {
    if (!transferForm.cardNumber || !transferForm.cardName || !transferForm.expiryDate) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Simuler la sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTransferMethod({
        type: transferForm.type,
        cardNumber: `****${transferForm.cardNumber.slice(-4)}`,
        cardName: transferForm.cardName,
        expiryDate: transferForm.expiryDate,
        isConfigured: true
      });

      setShowTransferForm(false);
      setTransferForm({ type: 'debit', cardNumber: '', cardName: '', expiryDate: '' });
      
      toast({
        title: "Méthode de transfert configurée",
        description: "Les informations ont été sauvegardées avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la méthode de transfert",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Gestion Finance</h2>
          <p className="text-muted-foreground">
            Gérez les paiements et le payroll des livreurs
          </p>
        </div>
      </div>

      {/* Statistiques financières */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus du Mois</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45,230$</div>
            <p className="text-xs text-muted-foreground">+12% vs mois dernier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commissions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,156$</div>
            <p className="text-xs text-muted-foreground">15% des revenus</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payroll en Attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,450$</div>
            <p className="text-xs text-muted-foreground">12 livreurs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payroll Traité</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8,920$</div>
            <p className="text-xs text-muted-foreground">Cette semaine</p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll automatique */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Payroll Automatique - Vendredi Soir
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Comment ça fonctionne :</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Traitement automatique tous les vendredis à 20h00</li>
              <li>• Paiement uniquement aux livreurs avec revenus générés</li>
              <li>• Vérification automatique des moyens de paiement</li>
              <li>• Exclusion des livreurs sans carte débit/crédit/Interac</li>
            </ul>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Prochain payroll automatique</h4>
              <p className="text-sm text-muted-foreground">Vendredi 19 janvier 2024 à 20h00</p>
            </div>
            
            <Button 
              onClick={handlePayrollFriday}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Traiter Payroll Maintenant
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuration des transferts */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration des Transferts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Compte Bancaire Principal */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Compte Bancaire Principal
                </h4>
                {bankAccount.isConfigured && (
                  <Badge className="bg-green-600">Configuré</Badge>
                )}
              </div>
              
              {bankAccount.isConfigured && !showBankForm ? (
                <div className="space-y-2 mb-4">
                  <p className="text-sm"><strong>Nom:</strong> {bankAccount.accountName}</p>
                  <p className="text-sm"><strong>Compte:</strong> {bankAccount.accountNumber}</p>
                  <p className="text-sm"><strong>Banque:</strong> {bankAccount.bankName}</p>
                  <p className="text-sm"><strong>Transit:</strong> {bankAccount.transitNumber}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-3">
                  Compte pour recevoir les revenus de la plateforme
                </p>
              )}

              {showBankForm ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="accountName">Nom du compte</Label>
                    <Input
                      id="accountName"
                      value={bankForm.accountName}
                      onChange={(e) => setBankForm(prev => ({ ...prev, accountName: e.target.value }))}
                      placeholder="CourseMax Inc."
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountNumber">Numéro de compte</Label>
                    <Input
                      id="accountNumber"
                      value={bankForm.accountNumber}
                      onChange={(e) => setBankForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                      placeholder="123456789"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankName">Nom de la banque</Label>
                    <Input
                      id="bankName"
                      value={bankForm.bankName}
                      onChange={(e) => setBankForm(prev => ({ ...prev, bankName: e.target.value }))}
                      placeholder="Banque Nationale"
                    />
                  </div>
                  <div>
                    <Label htmlFor="transitNumber">Numéro de transit</Label>
                    <Input
                      id="transitNumber"
                      value={bankForm.transitNumber}
                      onChange={(e) => setBankForm(prev => ({ ...prev, transitNumber: e.target.value }))}
                      placeholder="00006"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveBankAccount} disabled={loading} size="sm">
                      <Save className="w-4 h-4 mr-2" />
                      Sauvegarder
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowBankForm(false);
                        setBankForm({ accountName: '', accountNumber: '', bankName: '', transitNumber: '' });
                      }}
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowBankForm(true)}
                >
                  {bankAccount.isConfigured ? (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Configurer
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {/* Méthode de Transfert */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Méthode de Transfert
                </h4>
                {transferMethod.isConfigured && (
                  <Badge className="bg-green-600">Configuré</Badge>
                )}
              </div>
              
              {transferMethod.isConfigured && !showTransferForm ? (
                <div className="space-y-2 mb-4">
                  <p className="text-sm"><strong>Type:</strong> {transferMethod.type === 'debit' ? 'Carte Débit' : transferMethod.type === 'credit' ? 'Carte Crédit' : 'Interac'}</p>
                  <p className="text-sm"><strong>Carte:</strong> {transferMethod.cardNumber}</p>
                  <p className="text-sm"><strong>Nom:</strong> {transferMethod.cardName}</p>
                  <p className="text-sm"><strong>Expiration:</strong> {transferMethod.expiryDate}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-3">
                  Carte débit, crédit ou Interac pour les transferts
                </p>
              )}

              {showTransferForm ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="transferType">Type de carte</Label>
                    <select
                      id="transferType"
                      value={transferForm.type}
                      onChange={(e) => setTransferForm(prev => ({ ...prev, type: e.target.value as 'debit' | 'credit' | 'interac' }))}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="debit">Carte Débit</option>
                      <option value="credit">Carte Crédit</option>
                      <option value="interac">Interac</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="cardNumber">Numéro de carte</Label>
                    <Input
                      id="cardNumber"
                      value={transferForm.cardNumber}
                      onChange={(e) => setTransferForm(prev => ({ ...prev, cardNumber: e.target.value }))}
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cardName">Nom sur la carte</Label>
                    <Input
                      id="cardName"
                      value={transferForm.cardName}
                      onChange={(e) => setTransferForm(prev => ({ ...prev, cardName: e.target.value }))}
                      placeholder="CourseMax Business"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiryDate">Date d'expiration</Label>
                    <Input
                      id="expiryDate"
                      value={transferForm.expiryDate}
                      onChange={(e) => setTransferForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                      placeholder="MM/AA"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveTransferMethod} disabled={loading} size="sm">
                      <Save className="w-4 h-4 mr-2" />
                      Sauvegarder
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowTransferForm(false);
                        setTransferForm({ type: 'debit', cardNumber: '', cardName: '', expiryDate: '' });
                      }}
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowTransferForm(true)}
                >
                  {transferMethod.isConfigured ? (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Configurer
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historique des transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Historique des Paiements
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: '2024-01-12', type: 'Payroll', amount: 2450, status: 'completed', recipients: 8 },
              { date: '2024-01-05', type: 'Payroll', amount: 3120, status: 'completed', recipients: 12 },
              { date: '2023-12-29', type: 'Payroll', amount: 1890, status: 'completed', recipients: 6 },
            ].map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">{transaction.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString('fr-CA')} • {transaction.recipients} livreurs
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="font-bold">{transaction.amount.toFixed(2)}$</p>
                  <Badge className="bg-green-600">Complété</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
