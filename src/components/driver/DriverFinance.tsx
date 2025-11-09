import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
  Building,
  Phone
} from 'lucide-react';

interface SavedPaymentConfig {
  payment_type: 'debit' | 'credit' | 'interac' | 'bank' | null;
  interac_method?: 'phone' | 'email' | null;
  interac_value?: string | null;
  card_number?: string | null;
  card_name?: string | null;
  expiry_date?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  transit_number?: string | null;
  institution_number?: string | null;
  account_holder_name?: string | null;
}

interface DriverCommissionEntry {
  id: string;
  order_id?: string | null;
  amount: number;
  status: string | null;
  created_at: string;
}

interface DriverTipEntry {
  orderId: string;
  amount: number;
  status: string | null;
  created_at: string;
}

interface EarningsSummary {
  today: number;
  week: number;
  month: number;
  pending: number;
}

interface TipsSummary {
  total: number;
  week: number;
}

export const DriverFinance = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [savedConfig, setSavedConfig] = useState<SavedPaymentConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [financeMetricsLoading, setFinanceMetricsLoading] = useState(true);
  const [earningsSummary, setEarningsSummary] = useState<EarningsSummary>({
    today: 0,
    week: 0,
    month: 0,
    pending: 0,
  });
  const [commissionHistory, setCommissionHistory] = useState<DriverCommissionEntry[]>([]);
  const [tipsSummary, setTipsSummary] = useState<TipsSummary>({ total: 0, week: 0 });
  const [tipsHistory, setTipsHistory] = useState<DriverTipEntry[]>([]);
  const pendingPaymentsCount = useMemo(
    () =>
      commissionHistory.filter((entry) => {
        const status = (entry.status || '').toLowerCase();
        return status !== 'completed' && status !== 'paid';
      }).length,
    [commissionHistory]
  );
  const lastCompletedPayment = useMemo(() => {
    const completed = commissionHistory
      .filter((entry) => {
        const status = (entry.status || '').toLowerCase();
        return status === 'completed' || status === 'paid';
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return completed.length > 0 ? completed[0] : null;
  }, [commissionHistory]);
  
  const [paymentData, setPaymentData] = useState({
    // Carte de débit/crédit
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    
    // Interac
    interacPhone: '',
    interacEmail: '',
    interacMethod: '', // 'phone' ou 'email'
    
    // Compte bancaire
    bankName: '',
    accountNumber: '',
    transitNumber: '',
    institutionNumber: '',
    accountHolderName: ''
  });

  const formatCurrency = (value: number) =>
    value.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' });

  const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat('fr-CA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));

  const renderStatusBadge = (status: string | null | undefined) => {
    const normalized = (status || '').toLowerCase();

    if (normalized === 'completed' || normalized === 'paid') {
      return <Badge className="bg-green-600">Payé</Badge>;
    }

    if (normalized === 'failed') {
      return <Badge variant="destructive">Échec</Badge>;
    }

    return <Badge variant="outline" className="text-orange-600 border-orange-200">En attente</Badge>;
  };

  const applySavedConfigToForm = (config: SavedPaymentConfig) => {
    if (!config) return;

    setPaymentMethod(config.payment_type ?? '');

    setPaymentData((prev) => ({
      ...prev,
      interacMethod: config.interac_method ?? '',
      interacPhone: config.interac_method === 'phone' ? config.interac_value ?? '' : '',
      interacEmail: config.interac_method === 'email' ? config.interac_value ?? '' : '',
      cardNumber: config.card_number ?? '',
      cardName: config.card_name ?? '',
      expiryDate: config.expiry_date ?? '',
      bankName: config.bank_name ?? '',
      accountNumber: config.account_number ?? '',
      transitNumber: config.transit_number ?? '',
      institutionNumber: config.institution_number ?? '',
      accountHolderName: config.account_holder_name ?? '',
    }));
  };
  const loadFinanceMetrics = useCallback(async () => {
    if (!profile?.user_id) {
      setEarningsSummary({ today: 0, week: 0, month: 0, pending: 0 });
      setCommissionHistory([]);
      setTipsSummary({ total: 0, week: 0 });
      setTipsHistory([]);
      setFinanceMetricsLoading(false);
      return;
    }

    try {
      setFinanceMetricsLoading(true);

      const driverId = profile.user_id;
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfDay.getDate() - 6);
      const startOfMonth = new Date(startOfDay);
      startOfMonth.setDate(startOfDay.getDate() - 29);

      const [commissionsResult, tipsResult] = await Promise.all([
        supabase
          .from('delivery_commissions')
          .select('id, driver_amount, status, created_at, order_id')
          .eq('driver_id', driverId)
          .order('created_at', { ascending: false }),
        supabase
          .from('orders')
          .select('id, tip, created_at, status')
          .eq('driver_id', driverId)
          .gt('tip', 0)
          .order('created_at', { ascending: false }),
      ]);

      if (commissionsResult.error && commissionsResult.error.code !== 'PGRST116') {
        throw commissionsResult.error;
      }

      if (tipsResult.error && tipsResult.error.code !== 'PGRST116') {
        throw tipsResult.error;
      }

      const commissionsData = (commissionsResult.data || []).map<DriverCommissionEntry>((entry: any) => ({
        id: entry.id,
        order_id: entry.order_id,
        amount: Number(entry.driver_amount || 0),
        status: entry.status || null,
        created_at: entry.created_at ?? new Date().toISOString(),
      }));

      const earnings: EarningsSummary = { today: 0, week: 0, month: 0, pending: 0 };

      commissionsData.forEach((entry) => {
        const createdAt = entry.created_at ? new Date(entry.created_at) : null;
        const amount = entry.amount || 0;

        if (createdAt) {
          if (createdAt >= startOfDay) {
            earnings.today += amount;
          }
          if (createdAt >= startOfWeek) {
            earnings.week += amount;
          }
          if (createdAt >= startOfMonth) {
            earnings.month += amount;
          }
        }

        const status = (entry.status || '').toLowerCase();
        if (status !== 'completed' && status !== 'paid') {
          earnings.pending += amount;
        }
      });

      setCommissionHistory(commissionsData);
      setEarningsSummary(earnings);

      const tipsData = (tipsResult.data || []).map<DriverTipEntry>((order: any) => ({
        orderId: order.id,
        amount: Number(order.tip || 0),
        status: order.status || null,
        created_at: order.created_at ?? new Date().toISOString(),
      })).filter((entry) => entry.amount > 0);

      const tipTotals: TipsSummary = { total: 0, week: 0 };
      tipsData.forEach((tip) => {
        const createdAt = tip.created_at ? new Date(tip.created_at) : null;
        const amount = tip.amount || 0;
        tipTotals.total += amount;
        if (createdAt && createdAt >= startOfWeek) {
          tipTotals.week += amount;
        }
      });

      setTipsSummary(tipTotals);
      setTipsHistory(tipsData);
    } catch (error) {
      console.error('Erreur lors du chargement des métriques financières:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos statistiques financières.",
        variant: "destructive",
      });
      setCommissionHistory([]);
      setTipsHistory([]);
      setEarningsSummary({ today: 0, week: 0, month: 0, pending: 0 });
      setTipsSummary({ total: 0, week: 0 });
    } finally {
      setFinanceMetricsLoading(false);
    }
  }, [profile?.user_id, toast]);

  // Charger les données au montage
  useEffect(() => {
    loadSavedConfig();
    loadFinanceMetrics();
  }, [profile?.user_id, loadFinanceMetrics]);

  const loadSavedConfig = async () => {
    if (!profile?.user_id) return;

    try {
      const { data, error } = await supabase
        .from('driver_payment_methods')
        .select('*')
        .eq('driver_id', profile.user_id)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') {
          console.warn('Aucune configuration de paiement trouvée pour ce livreur.', error.message);
          setSavedConfig(null);
          setPaymentMethod('');
          return;
        }
        throw error;
      }

      if (data) {
        const config = data as SavedPaymentConfig;
        setSavedConfig(config);
        applySavedConfigToForm(config);
      } else {
        setSavedConfig(null);
        setPaymentMethod('');
      }
    } catch (err) {
      console.error('Erreur de chargement:', err);
      toast({
        title: "Erreur",
        description: "Impossible de charger la configuration de paiement",
        variant: "destructive",
      });
    }
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^(\+1)?[\s-]?\(?([0-9]{3})\)?[\s-]?([0-9]{3})[\s-]?([0-9]{4})$/;
    return phoneRegex.test(phone);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateCardNumber = (cardNumber: string): boolean => {
    const cleaned = cardNumber.replace(/\s/g, '');
    return /^\d{13,19}$/.test(cleaned);
  };

  const formatCardNumber = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    const groups = numbers.match(/.{1,4}/g) || [];
    return groups.join(' ').substring(0, 19);
  };

  const formatPhone = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  };

  const formatExpiryDate = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}`;
  };

  const handleSavePaymentMethod = async () => {
    // Validation basique
    if (!paymentMethod) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un moyen de paiement",
        variant: "destructive",
      });
      return;
    }

    // Validation spécifique selon le type
    let isValid = true;
    let errorMessage = '';

    if (paymentMethod === 'debit' || paymentMethod === 'credit') {
      if (!paymentData.cardNumber || !validateCardNumber(paymentData.cardNumber)) {
        isValid = false;
        errorMessage = 'Numéro de carte invalide';
      } else if (!paymentData.cardName) {
        isValid = false;
        errorMessage = 'Nom sur la carte requis';
      } else if (!paymentData.expiryDate || paymentData.expiryDate.length !== 5) {
        isValid = false;
        errorMessage = 'Date d\'expiration invalide (format: MM/AA)';
      } else if (!paymentData.cvv || paymentData.cvv.length < 3) {
        isValid = false;
        errorMessage = 'CVV invalide';
      }
    } else if (paymentMethod === 'interac') {
      if (!paymentData.interacMethod) {
        isValid = false;
        errorMessage = 'Veuillez choisir une méthode Interac (téléphone ou courriel)';
      } else if (paymentData.interacMethod === 'phone') {
        if (!paymentData.interacPhone) {
          isValid = false;
          errorMessage = 'Numéro de téléphone requis';
        } else if (!validatePhone(paymentData.interacPhone)) {
          isValid = false;
          errorMessage = 'Numéro de téléphone invalide (format: 514-555-1234)';
        }
      } else if (paymentData.interacMethod === 'email') {
        if (!paymentData.interacEmail) {
          isValid = false;
          errorMessage = 'Adresse courriel requise';
        } else if (!validateEmail(paymentData.interacEmail)) {
          isValid = false;
          errorMessage = 'Adresse courriel invalide';
        }
      }
    } else if (paymentMethod === 'bank') {
      if (!paymentData.accountHolderName) {
        isValid = false;
        errorMessage = 'Nom du titulaire requis';
      } else if (!paymentData.bankName) {
        isValid = false;
        errorMessage = 'Nom de la banque requis';
      } else if (!paymentData.accountNumber) {
        isValid = false;
        errorMessage = 'Numéro de compte requis';
      } else if (!paymentData.transitNumber || paymentData.transitNumber.length !== 5) {
        isValid = false;
        errorMessage = 'Numéro de transit invalide (5 chiffres)';
      } else if (!paymentData.institutionNumber || paymentData.institutionNumber.length !== 3) {
        isValid = false;
        errorMessage = 'Numéro d\'institution invalide (3 chiffres)';
      }
    }

    if (!isValid) {
      toast({
        title: "Erreur de validation",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (!profile?.user_id) {
        throw new Error("Profil livreur introuvable.");
      }

      const payload: Record<string, any> = {
        driver_id: profile.user_id,
        payment_type: paymentMethod,
        updated_at: new Date().toISOString(),
      };

      if (paymentMethod === 'interac') {
        payload.interac_method = paymentData.interacMethod;
        payload.interac_value =
          paymentData.interacMethod === 'phone' ? paymentData.interacPhone : paymentData.interacEmail;
      } else if (paymentMethod === 'debit' || paymentMethod === 'credit') {
        payload.card_number = paymentData.cardNumber;
        payload.card_name = paymentData.cardName;
        payload.expiry_date = paymentData.expiryDate;
      } else if (paymentMethod === 'bank') {
        payload.bank_name = paymentData.bankName;
        payload.account_number = paymentData.accountNumber;
        payload.transit_number = paymentData.transitNumber;
        payload.institution_number = paymentData.institutionNumber;
        payload.account_holder_name = paymentData.accountHolderName;
      }

      const { error: saveError } = await supabase
        .from('driver_payment_methods')
        .upsert(payload, { onConflict: 'driver_id' });

      if (saveError) {
        throw saveError;
      }

      toast({
        title: "Succès",
        description: "Votre moyen de paiement a été configuré avec succès",
      });

      setShowPaymentModal(false);
      resetForm();
      await loadSavedConfig();
    } catch (err: any) {
      console.error('Erreur de sauvegarde:', err);
      toast({
        title: "Erreur",
        description: err.message || "Erreur lors de la sauvegarde. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
      interacMethod: '',
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
                onChange={(e) => {
                  const formatted = formatCardNumber(e.target.value);
                  setPaymentData({...paymentData, cardNumber: formatted});
                }}
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
                  onChange={(e) => {
                    const formatted = formatExpiryDate(e.target.value);
                    setPaymentData({...paymentData, expiryDate: formatted});
                  }}
                  maxLength={5}
                />
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  type="password"
                  placeholder="123"
                  value={paymentData.cvv}
                  onChange={(e) => setPaymentData({...paymentData, cvv: e.target.value.replace(/\D/g, '')})}
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
                  variant={paymentData.interacMethod === 'phone' ? 'default' : 'outline'}
                  onClick={() => {
                    setPaymentData({
                      ...paymentData, 
                      interacMethod: 'phone',
                      interacEmail: ''
                    });
                  }}
                  className="h-12"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Téléphone
                </Button>
                <Button
                  type="button"
                  variant={paymentData.interacMethod === 'email' ? 'default' : 'outline'}
                  onClick={() => {
                    setPaymentData({
                      ...paymentData, 
                      interacMethod: 'email',
                      interacPhone: ''
                    });
                  }}
                  className="h-12"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Courriel
                </Button>
              </div>
            </div>
            
            {paymentData.interacMethod === 'phone' && (
              <div>
                <Label htmlFor="interacPhone">Numéro de téléphone</Label>
                <Input
                  id="interacPhone"
                  type="tel"
                  placeholder="514-555-1234"
                  value={paymentData.interacPhone}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value);
                    setPaymentData({...paymentData, interacPhone: formatted});
                  }}
                  maxLength={12}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Format: 514-555-1234
                </p>
              </div>
            )}
            
            {paymentData.interacMethod === 'email' && (
              <div>
                <Label htmlFor="interacEmail">Adresse courriel</Label>
                <Input
                  id="interacEmail"
                  type="email"
                  placeholder="jean.dupuis@email.com"
                  value={paymentData.interacEmail}
                  onChange={(e) => setPaymentData({...paymentData, interacEmail: e.target.value})}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Cette adresse sera utilisée pour recevoir vos paiements Interac
                </p>
              </div>
            )}
            
            {paymentData.interacMethod && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2 text-sm">À propos d'Interac e-Transfer</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Les paiements sont envoyés directement à votre téléphone ou courriel</li>
                  <li>• Vous recevrez une notification pour chaque paiement</li>
                  <li>• Les fonds sont généralement disponibles dans les 30 minutes</li>
                </ul>
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
                onChange={(e) => setPaymentData({...paymentData, accountNumber: e.target.value.replace(/\D/g, '')})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transitNumber">Numéro de transit</Label>
                <Input
                  id="transitNumber"
                  placeholder="12345"
                  value={paymentData.transitNumber}
                  onChange={(e) => setPaymentData({...paymentData, transitNumber: e.target.value.replace(/\D/g, '').substring(0, 5)})}
                  maxLength={5}
                />
              </div>
              <div>
                <Label htmlFor="institutionNumber">Numéro d'institution</Label>
                <Input
                  id="institutionNumber"
                  placeholder="006"
                  value={paymentData.institutionNumber}
                  onChange={(e) => setPaymentData({...paymentData, institutionNumber: e.target.value.replace(/\D/g, '').substring(0, 3)})}
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

  const getPaymentMethodDisplay = (config: SavedPaymentConfig) => {
    const type = config.payment_type;
    if (!type) {
      return 'Méthode inconnue';
    }

    if (type === 'interac') {
      const label = config.interac_method === 'phone' ? 'Téléphone' : 'Courriel';
      const value = config.interac_value || 'Non défini';
      return `Interac e-Transfer (${label}: ${value})`;
    }

    if (type === 'debit' || type === 'credit') {
      const last4 = config.card_number?.slice(-4) || '****';
      return `${type === 'debit' ? 'Carte de Débit' : 'Carte de Crédit'} •••• ${last4}`;
    }

    if (type === 'bank') {
      return `Compte Bancaire - ${config.bank_name ?? 'Non défini'}`;
    }

    return 'Méthode inconnue';
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
                {financeMetricsLoading ? (
                  <span className="inline-block h-7 w-24 rounded bg-green-200 animate-pulse" />
                ) : (
                  <p className="text-2xl font-bold text-green-800">
                    {formatCurrency(earningsSummary.today)}
                  </p>
                )}
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">7 derniers jours</p>
                {financeMetricsLoading ? (
                  <span className="inline-block h-7 w-24 rounded bg-blue-200 animate-pulse" />
                ) : (
                  <p className="text-2xl font-bold text-blue-800">
                    {formatCurrency(earningsSummary.week)}
                  </p>
                )}
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">Pourboires (30 jours)</p>
                {financeMetricsLoading ? (
                  <span className="inline-block h-7 w-24 rounded bg-purple-200 animate-pulse" />
                ) : (
                  <p className="text-2xl font-bold text-purple-800">
                    {formatCurrency(tipsSummary.total)}
                  </p>
                )}
              </div>
              <Gift className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700">Paiements en attente</p>
                {financeMetricsLoading ? (
                  <span className="inline-block h-7 w-24 rounded bg-orange-200 animate-pulse" />
                ) : (
                  <p className="text-2xl font-bold text-orange-800">
                    {formatCurrency(earningsSummary.pending)}
                  </p>
                )}
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments" className="space-y-6">
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
              {financeMetricsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-2 w-full">
                        <span className="inline-block h-4 w-32 bg-muted animate-pulse rounded" />
                        <span className="inline-block h-3 w-40 bg-muted animate-pulse rounded" />
                      </div>
                      <span className="inline-block h-5 w-16 bg-muted animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              ) : commissionHistory.length > 0 ? (
                <div className="space-y-4">
                  {commissionHistory.slice(0, 8).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {entry.order_id ? `Commande #${entry.order_id}` : 'Versement'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(entry.created_at)}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-bold text-green-600">{formatCurrency(entry.amount)}</p>
                        {renderStatusBadge(entry.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Aucun gain enregistré pour le moment.
                </div>
              )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
                  <p className="text-sm text-purple-700">Total sur 30 jours</p>
                  <p className="text-xl font-semibold text-purple-900">
                    {financeMetricsLoading ? (
                      <span className="inline-block h-6 w-24 rounded bg-purple-200 animate-pulse" />
                    ) : (
                      formatCurrency(tipsSummary.total)
                    )}
                  </p>
                  <p className="mt-2 text-xs text-purple-700">
                    Dont {financeMetricsLoading ? '...' : formatCurrency(tipsSummary.week)} au cours des 7 derniers jours.
                  </p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-800">
                      {savedConfig ? 'Moyen de paiement configuré' : 'Configurez un moyen de paiement'}
                    </span>
                  </div>
                  <p className="text-sm text-blue-700">
                    {savedConfig
                      ? 'Vos pourboires seront transférés sur votre moyen de paiement configuré.'
                      : 'Ajoutez un moyen de paiement pour recevoir automatiquement vos pourboires.'}
                  </p>
                </div>
              </div>

              {financeMetricsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-2 w-full">
                        <span className="inline-block h-4 w-28 bg-muted animate-pulse rounded" />
                        <span className="inline-block h-3 w-32 bg-muted animate-pulse rounded" />
                      </div>
                      <span className="inline-block h-5 w-14 bg-muted animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              ) : tipsHistory.length > 0 ? (
                <div className="space-y-3">
                  {tipsHistory.slice(0, 10).map((tip) => (
                    <div key={tip.orderId + tip.created_at} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Commande #{tip.orderId}</p>
                        <p className="text-sm text-muted-foreground">{formatDateTime(tip.created_at)}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-bold text-purple-600">{formatCurrency(tip.amount)}</p>
                        {renderStatusBadge(tip.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Aucun pourboire enregistré pour le moment.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          {/* Statut actuel du moyen de paiement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Moyen de Paiement Actuel
              </CardTitle>
            </CardHeader>
            <CardContent>
              {savedConfig ? (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="text-green-600 w-6 h-6 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900">Moyen de paiement configuré</p>
                    <p className="text-sm text-green-700">{getPaymentMethodDisplay(savedConfig)}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (savedConfig) {
                        applySavedConfigToForm(savedConfig);
                      }
                      setShowPaymentModal(true);
                    }}
                  >
                    Modifier
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="text-amber-600 w-6 h-6 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-900">Aucun moyen de paiement configuré</p>
                    <p className="text-sm text-amber-700">
                      Veuillez configurer votre méthode de paiement pour recevoir vos paiements
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowPaymentModal(true)}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    Configurer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Paiements Programmés
                </div>
                <Button 
                  onClick={() => setShowPaymentModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {savedConfig ? 'Modifier' : 'Configurer'} Moyen de Paiement
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-orange-800">Paiements en attente</span>
                </div>
                {financeMetricsLoading ? (
                  <span className="inline-block h-4 w-48 bg-orange-200 animate-pulse rounded" />
                ) : pendingPaymentsCount > 0 ? (
                  <p className="text-sm text-orange-700">
                    Vous avez {pendingPaymentsCount} paiement{pendingPaymentsCount > 1 ? 's' : ''} en attente
                    pour un total de {formatCurrency(earningsSummary.pending)}.
                  </p>
                ) : (
                  <p className="text-sm text-orange-700">
                    Aucun paiement n'est actuellement en attente.
                  </p>
                )}
              </div>

              <div className="p-4 border rounded-lg">
                {financeMetricsLoading ? (
                  <div className="space-y-2">
                    <span className="inline-block h-4 w-40 bg-muted animate-pulse rounded" />
                    <span className="inline-block h-4 w-32 bg-muted animate-pulse rounded" />
                  </div>
                ) : lastCompletedPayment ? (
                  <div className="space-y-2">
                    <p className="font-medium">Dernier paiement reçu</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(lastCompletedPayment.created_at)}
                    </p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(lastCompletedPayment.amount)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Vous n'avez pas encore reçu de paiement. Dès qu'un versement sera effectué, il apparaîtra ici.
                  </p>
                )}
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
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={handleSavePaymentMethod}
                  disabled={loading}
                >
                  {loading ? (
                    <>Enregistrement...</>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Sauvegarder
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
};
