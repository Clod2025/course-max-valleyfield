import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface LoyaltySettings {
  id?: string;
  loyalty_enabled: boolean;
  loyalty_earn_rate: number;
  loyalty_redeem_rate: number;
  min_redemption_points: number;
  max_redemption_percentage: number;
  points_expiry_days?: number;
  is_active?: boolean;
}

export interface LoyaltyTransaction {
  id: string;
  transaction_type: 'earned' | 'redeemed' | 'expired' | 'admin_adjustment';
  points: number;
  points_balance: number;
  description: string | null;
  created_at: string;
}

export interface LoyaltyRedemption {
  id: string;
  order_id: string;
  points_used: number;
  discount_amount: number;
  created_at: string;
}

export interface LoyaltyAccount {
  points: number;
  settings: LoyaltySettings | null;
  transactions: LoyaltyTransaction[];
  redemptions: LoyaltyRedemption[];
}

// Hook simplifié pour le compte de fidélité
export const useLoyaltyAccount = () => {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLoyaltyPoints = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Charger les points de fidélité du profil utilisateur
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('loyalty_points')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.warn('Erreur lors du chargement des points de fidélité:', profileError);
        setPoints(0); // Valeur par défaut si erreur
      } else {
        setPoints(profile?.loyalty_points || 0);
      }

    } catch (err) {
      console.error('Erreur lors du chargement des points de fidélité:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setPoints(0); // Valeur par défaut si erreur
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoyaltyPoints();
  }, [user]);

  return {
    points,
    loading,
    error,
    refresh: loadLoyaltyPoints
  };
};

// Hook complet pour le système de fidélité
export const useLoyalty = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Paramètres par défaut si pas de table loyalty_settings
  const defaultSettings: LoyaltySettings = {
    loyalty_enabled: true,
    loyalty_earn_rate: 1.0,
    loyalty_redeem_rate: 0.01,
    min_redemption_points: 100,
    max_redemption_percentage: 0.5
  };

  // Charger les données de fidélité
  const loadLoyaltyData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Charger les paramètres de fidélité (avec fallback)
      let settings = defaultSettings;
      try {
        const { data: settingsData, error: settingsError } = await supabase
          .from('loyalty_settings')
          .select('*')
          .limit(1)
          .single();

        if (!settingsError && settingsData) {
          settings = settingsData;
        }
      } catch (settingsErr) {
        console.warn('Table loyalty_settings non trouvée, utilisation des paramètres par défaut');
      }

      // Charger le profil utilisateur pour les points
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('loyalty_points')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.warn('Erreur lors du chargement du profil:', profileError);
        throw profileError;
      }

      // Initialiser les données avec valeurs par défaut pour les erreurs de base
      setAccount({
        points: profile?.loyalty_points || 0,
        settings,
        transactions: [],
        redemptions: []
      });

    } catch (err) {
      console.error('Erreur lors du chargement des données de fidélité:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      
      // Définir un compte par défaut en cas d'erreur
      setAccount({
        points: 0,
        settings: defaultSettings,
        transactions: [],
        redemptions: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculer les points gagnés pour un montant
  const calculateEarnedPoints = (amount: number): number => {
    if (!account?.settings) return 0;
    return Math.floor(amount * account.settings.loyalty_earn_rate);
  };

  // Calculer la valeur des points
  const calculatePointsValue = (points: number): number => {
    if (!account?.settings) return 0;
    return points * account.settings.loyalty_redeem_rate;
  };

  // Calculer le maximum de points utilisables
  const calculateMaxRedeemablePoints = (orderTotal: number): number => {
    if (!account?.settings || !account) return 0;
    
    const maxPercentage = account.settings.max_redemption_percentage;
    const maxDiscount = orderTotal * maxPercentage;
    const maxPoints = Math.floor(maxDiscount / account.settings.loyalty_redeem_rate);
    
    return Math.min(maxPoints, account.points);
  };

  // Ajouter des points (simplifié)
  const addPoints = async (orderId: string, amount: number, description?: string) => {
    if (!user || !account?.settings) return false;

    try {
      const points = calculateEarnedPoints(amount);
      if (points <= 0) return true;

      // Mise à jour simple des points dans le profil
      const { error } = await supabase
        .from('profiles')
        .update({ 
          loyalty_points: (account.points + points)
        })
        .eq('id', user.id);

      if (error) throw error;

      // Recharger les données
      await loadLoyaltyData();

      toast({
        title: "Points ajoutés!",
        description: `Vous avez gagné ${points} points de fidélité`,
      });

      return true;
    } catch (err) {
      console.error('Erreur lors de l\'ajout de points:', err);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter les points de fidélité",
        variant: "destructive"
      });
      return false;
    }
  };

  // Utiliser des points (simplifié)
  const redeemPoints = async (orderId: string, pointsToRedeem: number): Promise<number> => {
    if (!user || !account?.settings) return 0;

    try {
      const discountAmount = calculatePointsValue(pointsToRedeem);
      
      if (account.points < pointsToRedeem) {
        throw new Error('Points insuffisants');
      }

      // Mise à jour simple des points dans le profil
      const { error } = await supabase
        .from('profiles')
        .update({ 
          loyalty_points: (account.points - pointsToRedeem)
        })
        .eq('id', user.id);

      if (error) throw error;

      // Recharger les données
      await loadLoyaltyData();

      toast({
        title: "Points utilisés!",
        description: `${pointsToRedeem} points échangés pour ${discountAmount.toFixed(2)}$ de réduction`,
      });

      return discountAmount;
    } catch (err) {
      console.error('Erreur lors de l\'échange de points:', err);
      toast({
        title: "Erreur",
        description: "Impossible d'utiliser les points de fidélité",
        variant: "destructive"
      });
      return 0;
    }
  };

  // Vérifier si l'utilisateur peut utiliser des points
  const canRedeemPoints = (pointsToRedeem: number, orderTotal: number): boolean => {
    if (!account?.settings || !account) return false;
    
    return (
      account.settings.loyalty_enabled &&
      pointsToRedeem >= account.settings.min_redemption_points &&
      pointsToRedeem <= account.points &&
      pointsToRedeem <= calculateMaxRedeemablePoints(orderTotal)
    );
  };

  // Recharger les données
  const refresh = () => {
    loadLoyaltyData();
  };

  useEffect(() => {
    loadLoyaltyData();
  }, [user]);

  return {
    account,
    loading,
    error,
    calculateEarnedPoints,
    calculatePointsValue,
    calculateMaxRedeemablePoints,
    addPoints,
    redeemPoints,
    canRedeemPoints,
    refresh
  };
};

export default useLoyalty;