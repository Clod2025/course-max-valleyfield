import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { 
  DollarSign, 
  Plus, 
  Building2, 
  CreditCard, 
  Users, 
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Wallet,
  Smartphone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PaymentMethod {
  id: string;
  type: 'debit_card' | 'bank_account' | 'interac';
  name: string;
  holder_name: string;
  account_number: string;
  bank_name?: string;
  transit?: string;
  institution?: string;
  is_default: boolean;
  created_at: string;
}

interface CommissionTransfer {
  id: string;
  amount: number;
  bank_account: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
}

interface DriverPayment {
  id: string;
  driver_id: string;
  driver_name: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  payment_method: string;
  created_at: string;
  completed_at?: string;
}

export const FinanceManager: React.FC = () => {
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [commissionTransfers, setCommissionTransfers] = useState<CommissionTransfer[]>([]);
  const [driverPayments, setDriverPayments] = useState<DriverPayment[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // États des formulaires
  const [isAddPaymentMethodOpen, setIsAddPaymentMethodOpen] = useState(false);
  const [isTransferCommissionOpen, setIsTransferCommissionOpen] = useState(false);
  const [isPayDriverOpen, setIsPayDriverOpen] = useState(false);

  // Données des formulaires
  const [paymentMethodForm, setPaymentMethodForm] = useState({
    type: 'debit_card' as 'debit_card' | 'bank_account' | 'interac',
    name: '',
    holder_name: '',
    account_number: '',
    bank_name: '',
    transit: '',
    institution: '',
    is_default: false
  });

  const [transferForm, setTransferForm] = useState({
    amount: '',
    bank_account: ''
  });

  const [driverPaymentForm, setDriverPaymentForm] = useState({
    driver_id: '',
    amount: '',
    payment_method: ''
  });

  // Banques canadiennes
  const canadianBanks = [
    'Banque Royale du Canada (RBC)',
    'Banque de Montréal (BMO)',
    'Banque Scotia',
    'Banque CIBC',
    'Banque TD Canada Trust',
    'Banque Nationale du Canada',
    'Desjardins',
    'Banque Laurentienne',
    'Banque HSBC Canada',
    'Banque Tangerine',
    'Banque Simplii Financial',
    'Banque PC Financial',
    'Banque Alterna',
    'Banque First Nations Bank',
    'Banque Vancity',
    'Banque Coast Capital',
    'Banque Servus Credit Union',
    'Banque Meridian Credit Union',
    'Banque FirstOntario Credit Union',
    'Banque DUCA Financial Services'
  ];

  // Chargement des données
  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching finance data...');

      // Mock data pour les moyens de paiement (table n'existe pas encore)
      console.log('⚠️ Payment methods table not found, using mock data');
      setPaymentMethods([
        {
          id: '1',
          type: 'bank_account',
          name: 'Compte Principal',
          holder_name: 'CourseMax Inc.',
          account_number: '****1234',
          bank_name: 'Banque Royale du Canada (RBC)',
          transit: '12345',
          institution: '001',
          is_default: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          type: 'debit_card',
          name: 'Carte Débit',
          holder_name: 'CourseMax Inc.',
          account_number: '****5678',
          bank_name: 'Banque Royale du Canada (RBC)',
          is_default: false,
          created_at: new Date().toISOString()
        }
      ]);

      // Charger les livreurs
      const { data: driversData, error: driversError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'livreur');

      if (driversError) {
        console.log('⚠️ Error loading drivers:', driversError);
        setDrivers([]);
      } else {
        setDrivers(driversData || []);
      }

      // Mock data pour les transferts de commission
      setCommissionTransfers([
        {
          id: '1',
          amount: 2500.00,
          bank_account: '****1234 - RBC',
          status: 'completed',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          amount: 1800.50,
          bank_account: '****1234 - RBC',
          status: 'pending',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]);

      // Mock data pour les paiements des livreurs
      setDriverPayments([
        {
          id: '1',
          driver_id: 'driver1',
          driver_name: 'Jean Dupont',
          amount: 450.00,
          status: 'completed',
          payment_method: 'Interac',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          driver_id: 'driver2',
          driver_name: 'Marie Tremblay',
          amount: 320.75,
          status: 'pending',
          payment_method: 'Compte bancaire',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]);

      toast({
        title: "Données chargées",
        description: "Données financières récupérées avec succès",
      });

    } catch (error: any) {
      console.error('❌ Error loading finance data:', error);
      toast({
        title: "Erreur",
        description: `Impossible de charger les données: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Ajouter un moyen de paiement
  const addPaymentMethod = async () => {
    try {
      setSaving(true);
      console.log('🔄 Adding payment method:', paymentMethodForm);

      // Validation spécifique pour les comptes bancaires
      if (paymentMethodForm.type === 'bank_account') {
        // Validation du transit (5 chiffres)
        if (!paymentMethodForm.transit || !/^[0-9]{5}$/.test(paymentMethodForm.transit)) {
          toast({
            title: "Erreur de validation",
            description: "Le transit doit contenir exactement 5 chiffres",
            variant: "destructive",
          });
          return;
        }

        // Validation de l'institution (3 chiffres)
        if (!paymentMethodForm.institution || !/^[0-9]{3}$/.test(paymentMethodForm.institution)) {
          toast({
            title: "Erreur de validation",
            description: "L'institution doit contenir exactement 3 chiffres",
            variant: "destructive",
          });
          return;
        }

        // Validation de la banque
        if (!paymentMethodForm.bank_name) {
          toast({
            title: "Erreur de validation",
            description: "Veuillez sélectionner une banque",
            variant: "destructive",
          });
          return;
        }
      }

      // Simulation de sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newPaymentMethod: PaymentMethod = {
        id: Date.now().toString(),
        ...paymentMethodForm,
        account_number: `****${paymentMethodForm.account_number.slice(-4)}`,
        created_at: new Date().toISOString()
      };

      setPaymentMethods(prev => [newPaymentMethod, ...prev]);

      toast({
        title: "Succès",
        description: "Moyen de paiement ajouté avec succès",
      });

      setIsAddPaymentMethodOpen(false);
      setPaymentMethodForm({
        type: 'debit_card',
        name: '',
        holder_name: '',
        account_number: '',
        bank_name: '',
        transit: '',
        institution: '',
        is_default: false
      });

    } catch (error: any) {
      console.error('❌ Error adding payment method:', error);
      toast({
        title: "Erreur",
        description: `Impossible d'ajouter le moyen de paiement: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Transférer des commissions
  const transferCommission = async () => {
    try {
      setSaving(true);
      console.log('🔄 Transferring commission:', transferForm);

      // Simulation de transfert
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newTransfer: CommissionTransfer = {
        id: Date.now().toString(),
        amount: parseFloat(transferForm.amount),
        bank_account: transferForm.bank_account,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      setCommissionTransfers(prev => [newTransfer, ...prev]);

      toast({
        title: "Transfert initié",
        description: `Transfert de $${transferForm.amount} vers ${transferForm.bank_account} en cours`,
      });

      setIsTransferCommissionOpen(false);
      setTransferForm({ amount: '', bank_account: '' });

    } catch (error: any) {
      console.error('❌ Error transferring commission:', error);
      toast({
        title: "Erreur",
        description: `Impossible de transférer: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Payer un livreur
  const payDriver = async () => {
    try {
      setSaving(true);
      console.log('🔄 Paying driver:', driverPaymentForm);

      // Simulation de paiement
      await new Promise(resolve => setTimeout(resolve, 1500));

      const selectedDriver = drivers.find(d => d.id === driverPaymentForm.driver_id);
      const newPayment: DriverPayment = {
        id: Date.now().toString(),
        driver_id: driverPaymentForm.driver_id,
        driver_name: selectedDriver ? `${selectedDriver.first_name} ${selectedDriver.last_name}` : 'Livreur inconnu',
        amount: parseFloat(driverPaymentForm.amount),
        status: 'pending',
        payment_method: driverPaymentForm.payment_method,
        created_at: new Date().toISOString()
      };

      setDriverPayments(prev => [newPayment, ...prev]);

      toast({
        title: "Paiement initié",
        description: `Paiement de $${driverPaymentForm.amount} vers ${newPayment.driver_name}`,
      });

      setIsPayDriverOpen(false);
      setDriverPaymentForm({ driver_id: '', amount: '', payment_method: '' });

    } catch (error: any) {
      console.error('❌ Error paying driver:', error);
      toast({
        title: "Erreur",
        description: `Impossible de payer le livreur: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Chargement initial
  useEffect(() => {
    fetchData();
  }, []);

  // Icônes selon le type de moyen de paiement
  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'debit_card': return <CreditCard className="w-4 h-4" />;
      case 'bank_account': return <Building2 className="w-4 h-4" />;
      case 'interac': return <Smartphone className="w-4 h-4" />;
      default: return <Wallet className="w-4 h-4" />;
    }
  };

  // Statut avec icône
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des données financières...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="w-8 h-8" />
            Gestion Financière
          </h1>
          <p className="text-muted-foreground">
            Gérez les transferts de commissions, moyens de paiement et paiements des livreurs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Navigation par onglets */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="transfers">Transferts</TabsTrigger>
          <TabsTrigger value="payment-methods">Moyens de paiement</TabsTrigger>
          <TabsTrigger value="driver-payments">Paiements livreurs</TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commissions disponibles</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$4,250.75</div>
                <p className="text-xs text-muted-foreground">
                  Montant disponible pour transfert
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Moyens de paiement</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{paymentMethods.length}</div>
                <p className="text-xs text-muted-foreground">
                  Moyens de paiement configurés
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Livreurs actifs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{drivers.length}</div>
                <p className="text-xs text-muted-foreground">
                  Livreurs disponibles pour paiement
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Actions rapides */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* ✅ CORRECTION : Supprimé Button redondant - le Card onClick suffit */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIsTransferCommissionOpen(true)}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUp className="w-5 h-5" />
                  Transférer des commissions
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Transférer vos commissions vers votre compte bancaire
                </p>
              </CardHeader>
            </Card>

            {/* ✅ CORRECTION : Supprimé Button redondant */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIsAddPaymentMethodOpen(true)}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Ajouter un moyen de paiement
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configurer un nouveau moyen de paiement
                </p>
              </CardHeader>
            </Card>

            {/* ✅ CORRECTION : Supprimé Button redondant */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIsPayDriverOpen(true)}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Payer un livreur
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Effectuer un paiement à un livreur
                </p>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

        {/* Transferts de commissions */}
        <TabsContent value="transfers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ArrowUp className="w-5 h-5" />
                  Transferts de Commissions
                </CardTitle>
                <Dialog open={isTransferCommissionOpen} onOpenChange={setIsTransferCommissionOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Nouveau transfert
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Transférer des commissions</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); transferCommission(); }} className="space-y-4">
                      <div>
                        <Label htmlFor="amount">Montant (CAD) *</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={transferForm.amount}
                          onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="bank_account">Compte bancaire *</Label>
                        <Select value={transferForm.bank_account} onValueChange={(value) => setTransferForm(prev => ({ ...prev, bank_account: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un compte" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMethods.filter(pm => pm.type === 'bank_account').map((method) => (
                              <SelectItem key={method.id} value={`${method.account_number} - ${method.bank_name}`}>
                                {method.account_number} - {method.bank_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsTransferCommissionOpen(false)}>
                          Annuler
                        </Button>
                        <Button type="submit" disabled={saving}>
                          {saving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Transfert...
                            </>
                          ) : (
                            'Transférer'
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Montant</TableHead>
                    <TableHead>Compte</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissionTransfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell className="font-medium">${transfer.amount.toFixed(2)}</TableCell>
                      <TableCell>{transfer.bank_account}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(transfer.status)}
                          <span className="capitalize">{transfer.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(transfer.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Moyens de paiement */}
        <TabsContent value="payment-methods">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Moyens de Paiement
                </CardTitle>
                <Dialog open={isAddPaymentMethodOpen} onOpenChange={setIsAddPaymentMethodOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter un moyen
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ajouter un moyen de paiement</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); addPaymentMethod(); }} className="space-y-4">
                      <div>
                        <Label htmlFor="type">Type de paiement *</Label>
                        <Select value={paymentMethodForm.type} onValueChange={(value: any) => setPaymentMethodForm(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="debit_card">Carte de débit</SelectItem>
                            <SelectItem value="bank_account">Compte bancaire</SelectItem>
                            <SelectItem value="interac">Interac (e-Transfer)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="name">Nom du moyen de paiement *</Label>
                        <Input
                          id="name"
                          value={paymentMethodForm.name}
                          onChange={(e) => setPaymentMethodForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ex: Compte Principal"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="holder_name">Nom du titulaire *</Label>
                        <Input
                          id="holder_name"
                          value={paymentMethodForm.holder_name}
                          onChange={(e) => setPaymentMethodForm(prev => ({ ...prev, holder_name: e.target.value }))}
                          placeholder="Ex: CourseMax Inc."
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="account_number">Numéro de compte/carte *</Label>
                        <Input
                          id="account_number"
                          value={paymentMethodForm.account_number}
                          onChange={(e) => setPaymentMethodForm(prev => ({ ...prev, account_number: e.target.value }))}
                          placeholder="Ex: 1234567890"
                          required
                        />
                      </div>
                      
                      {paymentMethodForm.type === 'bank_account' && (
                        <>
                          <div>
                            <Label htmlFor="bank_name">Banque *</Label>
                            <Select value={paymentMethodForm.bank_name} onValueChange={(value) => setPaymentMethodForm(prev => ({ ...prev, bank_name: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une banque" />
                              </SelectTrigger>
                              <SelectContent>
                                {canadianBanks.map((bank) => (
                                  <SelectItem key={bank} value={bank}>
                                    {bank}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="transit">Transit *</Label>
                              <Input
                                id="transit"
                                value={paymentMethodForm.transit}
                                onChange={(e) => setPaymentMethodForm(prev => ({ ...prev, transit: e.target.value }))}
                                placeholder="Ex: 12345"
                                maxLength={5}
                                pattern="[0-9]{5}"
                                required
                              />
                              <p className="text-sm text-muted-foreground mt-1">
                                5 chiffres (ex: 12345)
                              </p>
                            </div>
                            
                            <div>
                              <Label htmlFor="institution">Institution *</Label>
                              <Input
                                id="institution"
                                value={paymentMethodForm.institution}
                                onChange={(e) => setPaymentMethodForm(prev => ({ ...prev, institution: e.target.value }))}
                                placeholder="Ex: 001"
                                maxLength={3}
                                pattern="[0-9]{3}"
                                required
                              />
                              <p className="text-sm text-muted-foreground mt-1">
                                3 chiffres (ex: 001)
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="is_default"
                          checked={paymentMethodForm.is_default}
                          onChange={(e) => setPaymentMethodForm(prev => ({ ...prev, is_default: e.target.checked }))}
                          className="rounded"
                        />
                        <Label htmlFor="is_default">Moyen de paiement par défaut</Label>
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsAddPaymentMethodOpen(false)}>
                          Annuler
                        </Button>
                        <Button type="submit" disabled={saving}>
                          {saving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Ajout...
                            </>
                          ) : (
                            'Ajouter'
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Titulaire</TableHead>
                    <TableHead>Compte</TableHead>
                    <TableHead>Banque</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentMethods.map((method) => (
                    <TableRow key={method.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(method.type)}
                          <span className="capitalize">
                            {method.type === 'debit_card' ? 'Carte de débit' : 
                             method.type === 'bank_account' ? 'Compte bancaire' : 'Interac'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{method.name}</TableCell>
                      <TableCell>{method.holder_name}</TableCell>
                      <TableCell>
                        {method.type === 'bank_account' && method.transit && method.institution ? (
                          <div className="text-sm">
                            <div>{method.account_number}</div>
                            <div className="text-muted-foreground">
                              Transit: {method.transit} | Institution: {method.institution}
                            </div>
                          </div>
                        ) : (
                          method.account_number
                        )}
                      </TableCell>
                      <TableCell>
                        {method.bank_name || 'N/A'}
                        {method.type === 'bank_account' && method.transit && method.institution && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {method.transit}-{method.institution}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {method.is_default ? (
                          <Badge variant="default">Par défaut</Badge>
                        ) : (
                          <Badge variant="secondary">Actif</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Paiements des livreurs */}
        <TabsContent value="driver-payments">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Paiements des Livreurs
                </CardTitle>
                <Dialog open={isPayDriverOpen} onOpenChange={setIsPayDriverOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Payer un livreur
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Payer un livreur</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); payDriver(); }} className="space-y-4">
                      <div>
                        <Label htmlFor="driver_id">Livreur *</Label>
                        <Select value={driverPaymentForm.driver_id} onValueChange={(value) => setDriverPaymentForm(prev => ({ ...prev, driver_id: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un livreur" />
                          </SelectTrigger>
                          <SelectContent>
                            {drivers.map((driver) => (
                              <SelectItem key={driver.id} value={driver.id}>
                                {driver.first_name} {driver.last_name} ({driver.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="amount">Montant (CAD) *</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={driverPaymentForm.amount}
                          onChange={(e) => setDriverPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="payment_method">Moyen de paiement *</Label>
                        <Select value={driverPaymentForm.payment_method} onValueChange={(value) => setDriverPaymentForm(prev => ({ ...prev, payment_method: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un moyen de paiement" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Interac">Interac</SelectItem>
                            <SelectItem value="Compte bancaire">Compte bancaire</SelectItem>
                            <SelectItem value="Carte de débit">Carte de débit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsPayDriverOpen(false)}>
                          Annuler
                        </Button>
                        <Button type="submit" disabled={saving}>
                          {saving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Paiement...
                            </>
                          ) : (
                            'Payer'
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Livreur</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Moyen de paiement</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {driverPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.driver_name}</TableCell>
                      <TableCell>${payment.amount.toFixed(2)}</TableCell>
                      <TableCell>{payment.payment_method}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payment.status)}
                          <span className="capitalize">{payment.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};