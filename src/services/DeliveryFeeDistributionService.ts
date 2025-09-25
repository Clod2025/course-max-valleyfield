import { supabase } from '@/integrations/supabase/client';

export interface MerchantOrder {
  merchantId: string;
  merchantName: string;
  address: string;
  subtotal: number;
  distance?: number;
  priority?: number; // 1 = haute, 2 = normale, 3 = basse
  productTypes?: string[]; // Types de produits
}

export interface FeeDistributionMethod {
  id: 'proportional' | 'equal' | 'distance_based' | 'hybrid';
  name: string;
  description: string;
  formula: string;
}

export interface FeeDistributionResult {
  totalFee: number;
  distributionMethod: string;
  merchantFees: Array<{
    merchantId: string;
    merchantName: string;
    orderValue: number;
    distance?: number;
    baseFee: number;
    distanceFee: number;
    priorityFee: number;
    totalFee: number;
    percentage: number;
    breakdown: {
      base: number;
      distance: number;
      priority: number;
      total: number;
    };
  }>;
  summary: {
    totalOrderValue: number;
    averageFeePerMerchant: number;
    feeEfficiency: number; // 0-100
    savings: number; // Économies vs commandes séparées
  };
}

export interface DistributionConfig {
  method: FeeDistributionMethod['id'];
  baseFeeWeight: number; // 0-1
  distanceWeight: number; // 0-1
  priorityWeight: number; // 0-1
  minimumFee: number; // Frais minimum par marchand
  maximumFee: number; // Frais maximum par marchand
  roundToNearest: number; // Arrondir au centime le plus proche
}

class DeliveryFeeDistributionService {
  private config: DistributionConfig = {
    method: 'proportional',
    baseFeeWeight: 0.6,
    distanceWeight: 0.3,
    priorityWeight: 0.1,
    minimumFee: 0.50,
    maximumFee: 15.00,
    roundToNearest: 0.01
  };

  private availableMethods: FeeDistributionMethod[] = [
    {
      id: 'proportional',
      name: 'Proportionnelle',
      description: 'Répartition basée sur la valeur de la commande',
      formula: 'Frais marchand = (Valeur commande marchand / Valeur totale) × Frais totaux'
    },
    {
      id: 'equal',
      name: 'Égale',
      description: 'Répartition égale entre tous les marchands',
      formula: 'Frais marchand = Frais totaux / Nombre de marchands'
    },
    {
      id: 'distance_based',
      name: 'Basée sur la distance',
      description: 'Répartition basée sur la distance ajoutée par chaque marchand',
      formula: 'Frais marchand = (Distance marchand / Distance totale) × Frais totaux'
    },
    {
      id: 'hybrid',
      name: 'Hybride',
      description: 'Combinaison de plusieurs facteurs (valeur, distance, priorité)',
      formula: 'Frais marchand = (Poids base × Valeur + Poids distance × Distance + Poids priorité × Priorité) × Frais totaux'
    }
  ];

  /**
   * Calcule la répartition des frais de livraison
   */
  async calculateFeeDistribution(
    merchantOrders: MerchantOrder[],
    totalDeliveryFee: number,
    method?: FeeDistributionMethod['id']
  ): Promise<FeeDistributionResult> {
    const selectedMethod = method || this.config.method;
    
    try {
      // Charger la configuration depuis la base de données
      await this.loadConfig();
      
      let merchantFees: any[];
      
      switch (selectedMethod) {
        case 'proportional':
          merchantFees = this.calculateProportionalDistribution(merchantOrders, totalDeliveryFee);
          break;
        case 'equal':
          merchantFees = this.calculateEqualDistribution(merchantOrders, totalDeliveryFee);
          break;
        case 'distance_based':
          merchantFees = this.calculateDistanceBasedDistribution(merchantOrders, totalDeliveryFee);
          break;
        case 'hybrid':
          merchantFees = this.calculateHybridDistribution(merchantOrders, totalDeliveryFee);
          break;
        default:
          throw new Error(`Méthode de répartition non supportée: ${selectedMethod}`);
      }

      // Appliquer les contraintes (minimum, maximum)
      merchantFees = this.applyConstraints(merchantFees);

      // Vérifier que la somme est correcte
      const totalDistributed = merchantFees.reduce((sum, fee) => sum + fee.totalFee, 0);
      const difference = totalDeliveryFee - totalDistributed;
      
      if (Math.abs(difference) > 0.01) {
        // Ajuster le dernier marchand pour corriger la différence
        const lastIndex = merchantFees.length - 1;
        merchantFees[lastIndex].totalFee += difference;
        merchantFees[lastIndex].breakdown.total += difference;
      }

      // Calculer les métriques de résumé
      const totalOrderValue = merchantOrders.reduce((sum, order) => sum + order.subtotal, 0);
      const averageFeePerMerchant = totalDeliveryFee / merchantOrders.length;
      const feeEfficiency = this.calculateFeeEfficiency(merchantFees, totalDeliveryFee);
      const savings = this.calculateSavings(merchantOrders, totalDeliveryFee);

      return {
        totalFee: totalDeliveryFee,
        distributionMethod: selectedMethod,
        merchantFees,
        summary: {
          totalOrderValue,
          averageFeePerMerchant,
          feeEfficiency,
          savings
        }
      };

    } catch (error) {
      console.error('Erreur lors du calcul de répartition:', error);
      throw error;
    }
  }

  /**
   * Répartition proportionnelle basée sur la valeur des commandes
   */
  private calculateProportionalDistribution(
    merchantOrders: MerchantOrder[],
    totalDeliveryFee: number
  ): any[] {
    const totalOrderValue = merchantOrders.reduce((sum, order) => sum + order.subtotal, 0);
    
    return merchantOrders.map(order => {
      const percentage = order.subtotal / totalOrderValue;
      const totalFee = totalDeliveryFee * percentage;
      
      return {
        merchantId: order.merchantId,
        merchantName: order.merchantName,
        orderValue: order.subtotal,
        distance: order.distance,
        baseFee: totalFee,
        distanceFee: 0,
        priorityFee: 0,
        totalFee: Math.round(totalFee / this.config.roundToNearest) * this.config.roundToNearest,
        percentage: percentage * 100,
        breakdown: {
          base: totalFee,
          distance: 0,
          priority: 0,
          total: totalFee
        }
      };
    });
  }

  /**
   * Répartition égale entre tous les marchands
   */
  private calculateEqualDistribution(
    merchantOrders: MerchantOrder[],
    totalDeliveryFee: number
  ): any[] {
    const feePerMerchant = totalDeliveryFee / merchantOrders.length;
    
    return merchantOrders.map(order => ({
      merchantId: order.merchantId,
      merchantName: order.merchantName,
      orderValue: order.subtotal,
      distance: order.distance,
      baseFee: feePerMerchant,
      distanceFee: 0,
      priorityFee: 0,
      totalFee: Math.round(feePerMerchant / this.config.roundToNearest) * this.config.roundToNearest,
      percentage: 100 / merchantOrders.length,
      breakdown: {
        base: feePerMerchant,
        distance: 0,
        priority: 0,
        total: feePerMerchant
      }
    }));
  }

  /**
   * Répartition basée sur la distance
   */
  private calculateDistanceBasedDistribution(
    merchantOrders: MerchantOrder[],
    totalDeliveryFee: number
  ): any[] {
    const totalDistance = merchantOrders.reduce((sum, order) => sum + (order.distance || 0), 0);
    
    if (totalDistance === 0) {
      // Fallback vers la répartition égale si pas de distance
      return this.calculateEqualDistribution(merchantOrders, totalDeliveryFee);
    }
    
    return merchantOrders.map(order => {
      const distance = order.distance || 0;
      const percentage = totalDistance > 0 ? distance / totalDistance : 1 / merchantOrders.length;
      const totalFee = totalDeliveryFee * percentage;
      
      return {
        merchantId: order.merchantId,
        merchantName: order.merchantName,
        orderValue: order.subtotal,
        distance: order.distance,
        baseFee: 0,
        distanceFee: totalFee,
        priorityFee: 0,
        totalFee: Math.round(totalFee / this.config.roundToNearest) * this.config.roundToNearest,
        percentage: percentage * 100,
        breakdown: {
          base: 0,
          distance: totalFee,
          priority: 0,
          total: totalFee
        }
      };
    });
  }

  /**
   * Répartition hybride combinant plusieurs facteurs
   */
  private calculateHybridDistribution(
    merchantOrders: MerchantOrder[],
    totalDeliveryFee: number
  ): any[] {
    const totalOrderValue = merchantOrders.reduce((sum, order) => sum + order.subtotal, 0);
    const totalDistance = merchantOrders.reduce((sum, order) => sum + (order.distance || 0), 0);
    const totalPriority = merchantOrders.reduce((sum, order) => sum + (order.priority || 2), 0);
    
    return merchantOrders.map(order => {
      const valueWeight = (order.subtotal / totalOrderValue) * this.config.baseFeeWeight;
      const distanceWeight = totalDistance > 0 
        ? ((order.distance || 0) / totalDistance) * this.config.distanceWeight 
        : 0;
      const priorityWeight = ((order.priority || 2) / totalPriority) * this.config.priorityWeight;
      
      const combinedWeight = valueWeight + distanceWeight + priorityWeight;
      const totalFee = totalDeliveryFee * combinedWeight;
      
      const baseFee = totalFee * this.config.baseFeeWeight;
      const distanceFee = totalFee * this.config.distanceWeight;
      const priorityFee = totalFee * this.config.priorityWeight;
      
      return {
        merchantId: order.merchantId,
        merchantName: order.merchantName,
        orderValue: order.subtotal,
        distance: order.distance,
        baseFee: Math.round(baseFee / this.config.roundToNearest) * this.config.roundToNearest,
        distanceFee: Math.round(distanceFee / this.config.roundToNearest) * this.config.roundToNearest,
        priorityFee: Math.round(priorityFee / this.config.roundToNearest) * this.config.roundToNearest,
        totalFee: Math.round(totalFee / this.config.roundToNearest) * this.config.roundToNearest,
        percentage: combinedWeight * 100,
        breakdown: {
          base: baseFee,
          distance: distanceFee,
          priority: priorityFee,
          total: totalFee
        }
      };
    });
  }

  /**
   * Applique les contraintes de frais minimum et maximum
   */
  private applyConstraints(merchantFees: any[]): any[] {
    return merchantFees.map(fee => {
      let adjustedFee = fee.totalFee;
      
      // Appliquer le minimum
      if (adjustedFee < this.config.minimumFee) {
        adjustedFee = this.config.minimumFee;
      }
      
      // Appliquer le maximum
      if (adjustedFee > this.config.maximumFee) {
        adjustedFee = this.config.maximumFee;
      }
      
      const difference = adjustedFee - fee.totalFee;
      
      return {
        ...fee,
        totalFee: adjustedFee,
        breakdown: {
          ...fee.breakdown,
          total: adjustedFee
        }
      };
    });
  }

  /**
   * Calcule l'efficacité de la répartition
   */
  private calculateFeeEfficiency(merchantFees: any[], totalFee: number): number {
    const totalDistributed = merchantFees.reduce((sum, fee) => sum + fee.totalFee, 0);
    const accuracy = Math.max(0, 100 - Math.abs(totalFee - totalDistributed) / totalFee * 100);
    
    // Bonus pour la répartition équitable
    const fees = merchantFees.map(fee => fee.totalFee);
    const standardDeviation = this.calculateStandardDeviation(fees);
    const fairness = Math.max(0, 100 - standardDeviation * 10);
    
    return Math.round((accuracy + fairness) / 2);
  }

  /**
   * Calcule les économies par rapport aux commandes séparées
   */
  private calculateSavings(merchantOrders: MerchantOrder[], totalFee: number): number {
    // Estimation des frais si commandes séparées
    const estimatedSeparateFees = merchantOrders.length * 2.99; // Frais de base par commande
    const savings = Math.max(0, estimatedSeparateFees - totalFee);
    
    return Math.round(savings * 100) / 100;
  }

  /**
   * Calcule l'écart-type
   */
  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Charge la configuration depuis la base de données
   */
  private async loadConfig(): Promise<void> {
    try {
      const { data } = await supabase
        .from('delivery_fee_distribution_config')
        .select('*')
        .eq('is_active', true)
        .single();

      if (data) {
        this.config = {
          method: data.method,
          baseFeeWeight: data.base_fee_weight,
          distanceWeight: data.distance_weight,
          priorityWeight: data.priority_weight,
          minimumFee: data.minimum_fee,
          maximumFee: data.maximum_fee,
          roundToNearest: data.round_to_nearest
        };
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration:', error);
      // Utiliser la configuration par défaut
    }
  }

  /**
   * Sauvegarde la configuration
   */
  async saveConfig(config: DistributionConfig): Promise<void> {
    try {
      const { error } = await supabase
        .from('delivery_fee_distribution_config')
        .upsert({
          method: config.method,
          base_fee_weight: config.baseFeeWeight,
          distance_weight: config.distanceWeight,
          priority_weight: config.priorityWeight,
          minimum_fee: config.minimumFee,
          maximum_fee: config.maximumFee,
          round_to_nearest: config.roundToNearest,
          is_active: true,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      this.config = config;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration:', error);
      throw error;
    }
  }

  /**
   * Obtient les méthodes de répartition disponibles
   */
  getAvailableMethods(): FeeDistributionMethod[] {
    return this.availableMethods;
  }

  /**
   * Obtient la configuration actuelle
   */
  getConfig(): DistributionConfig {
    return this.config;
  }

  /**
   * Simule différentes méthodes de répartition pour comparaison
   */
  async compareDistributionMethods(
    merchantOrders: MerchantOrder[],
    totalDeliveryFee: number
  ): Promise<Record<string, FeeDistributionResult>> {
    const results: Record<string, FeeDistributionResult> = {};

    for (const method of this.availableMethods) {
      try {
        const result = await this.calculateFeeDistribution(
          merchantOrders,
          totalDeliveryFee,
          method.id
        );
        results[method.id] = result;
      } catch (error) {
        console.error(`Erreur avec la méthode ${method.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Recommande la meilleure méthode de répartition
   */
  async recommendDistributionMethod(
    merchantOrders: MerchantOrder[],
    totalDeliveryFee: number
  ): Promise<{
    recommendedMethod: FeeDistributionMethod['id'];
    reason: string;
    comparison: Record<string, FeeDistributionResult>;
  }> {
    const comparison = await this.compareDistributionMethods(merchantOrders, totalDeliveryFee);
    
    // Analyser les résultats pour recommander la meilleure méthode
    let bestMethod: FeeDistributionMethod['id'] = 'proportional';
    let bestScore = 0;
    let reason = '';

    for (const [methodId, result] of Object.entries(comparison)) {
      const score = result.summary.feeEfficiency + (result.summary.savings / totalDeliveryFee * 100);
      
      if (score > bestScore) {
        bestScore = score;
        bestMethod = methodId as FeeDistributionMethod['id'];
      }
    }

    // Générer la raison de la recommandation
    const bestResult = comparison[bestMethod];
    if (bestResult.summary.savings > 0) {
      reason = `Économies de ${bestResult.summary.savings.toFixed(2)}$ par rapport aux commandes séparées`;
    } else {
      reason = `Répartition la plus équitable avec une efficacité de ${bestResult.summary.feeEfficiency}%`;
    }

    return {
      recommendedMethod: bestMethod,
      reason,
      comparison
    };
  }
}

// Instance singleton
export const deliveryFeeDistributionService = new DeliveryFeeDistributionService();
