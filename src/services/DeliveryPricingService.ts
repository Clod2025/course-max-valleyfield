import { distanceCalculatorService, DistanceResult, MultiMerchantRouteResult } from './DistanceCalculatorService';
import { supabase } from '@/integrations/supabase/client';

export interface DeliveryPricingConfig {
  baseFee: number;
  pricePerKm: number;
  freeDeliveryThreshold: number;
  maxFreeDistance: number;
  remoteZoneFee: number;
  remoteZoneDistance: number;
  multiStopFee: number;
  rushHourMultiplier: number;
  weekendMultiplier: number;
  holidayMultiplier: number;
}

export interface TimeSlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  multiplier: number;
  isActive: boolean;
}

export interface DeliveryCalculation {
  baseFee: number;
  distanceFee: number;
  remoteFee: number;
  multiStopFee: number;
  timeMultiplier: number;
  totalFee: number;
  distance: number;
  estimatedTime: number;
  breakdown: {
    base: number;
    distance: number;
    remote: number;
    multiStop: number;
    timeMultiplier: number;
    total: number;
  };
}

export interface MultiMerchantDeliveryCalculation {
  totalDistance: number;
  totalDuration: number;
  totalFee: number;
  individualFees: Array<{
    merchantId: string;
    merchantName: string;
    distance: number;
    fee: number;
    order: number;
  }>;
  breakdown: {
    baseFee: number;
    distanceFee: number;
    remoteFee: number;
    multiStopFee: number;
    timeMultiplier: number;
    total: number;
  };
  optimizedRoute: string[];
}

class DeliveryPricingService {
  private config: DeliveryPricingConfig | null = null;
  private timeSlots: TimeSlot[] = [];
  private cache: Map<string, DeliveryCalculation> = new Map();
  private cacheExpiry: number = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.loadConfig();
  }

  /**
   * Charge la configuration depuis la base de données
   */
  private async loadConfig(): Promise<void> {
    try {
      // Charger la configuration principale
      const { data: configData } = await supabase
        .from('delivery_pricing_config')
        .select('*')
        .eq('is_active', true)
        .single();

      if (configData) {
        this.config = {
          baseFee: configData.base_fee,
          pricePerKm: configData.price_per_km,
          freeDeliveryThreshold: configData.free_delivery_threshold,
          maxFreeDistance: configData.max_free_distance,
          remoteZoneFee: configData.remote_zone_fee,
          remoteZoneDistance: configData.remote_zone_distance,
          multiStopFee: configData.multi_stop_fee,
          rushHourMultiplier: configData.rush_hour_multiplier,
          weekendMultiplier: configData.weekend_multiplier,
          holidayMultiplier: configData.holiday_multiplier
        };
      }

      // Charger les créneaux horaires
      const { data: timeSlotsData } = await supabase
        .from('delivery_time_slots')
        .select('*')
        .eq('is_active', true)
        .order('start_time');

      if (timeSlotsData) {
        this.timeSlots = timeSlotsData.map(slot => ({
          id: slot.id,
          name: slot.name,
          startTime: slot.start_time,
          endTime: slot.end_time,
          multiplier: slot.multiplier,
          isActive: slot.is_active
        }));
      }

    } catch (error) {
      console.error('Erreur lors du chargement de la configuration:', error);
      // Utiliser des valeurs par défaut
      this.config = {
        baseFee: 2.99,
        pricePerKm: 0.50,
        freeDeliveryThreshold: 25.00,
        maxFreeDistance: 5,
        remoteZoneFee: 5.00,
        remoteZoneDistance: 15,
        multiStopFee: 3.00,
        rushHourMultiplier: 1.5,
        weekendMultiplier: 1.2,
        holidayMultiplier: 1.3
      };
    }
  }

  /**
   * Calcule les frais de livraison pour un marchand unique
   */
  async calculateSingleMerchantDelivery(
    clientAddress: string,
    merchantAddress: string,
    orderValue: number,
    timeSlot?: string
  ): Promise<DeliveryCalculation> {
    if (!this.config) {
      await this.loadConfig();
    }

    const cacheKey = `single_${clientAddress}_${merchantAddress}_${orderValue}_${timeSlot || 'normal'}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Calculer la distance
      const distanceResult = await distanceCalculatorService.calculateDistance(
        clientAddress,
        merchantAddress
      );

      if (distanceResult.status !== 'OK') {
        throw new Error('Impossible de calculer la distance');
      }

      // Appliquer la logique de tarification
      const calculation = this.calculateFees(
        distanceResult.distance,
        orderValue,
        timeSlot,
        1 // Un seul arrêt
      );

      const result: DeliveryCalculation = {
        ...calculation,
        distance: distanceResult.distance,
        estimatedTime: distanceResult.duration
      };

      this.cacheResult(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Erreur calcul livraison simple:', error);
      return this.getFallbackCalculation(orderValue, timeSlot);
    }
  }

  /**
   * Calcule les frais de livraison pour plusieurs marchands
   */
  async calculateMultiMerchantDelivery(
    clientAddress: string,
    merchantOrders: Array<{
      merchantId: string;
      merchantName: string;
      address: string;
      subtotal: number;
    }>,
    timeSlot?: string
  ): Promise<MultiMerchantDeliveryCalculation> {
    if (!this.config) {
      await this.loadConfig();
    }

    try {
      // Calculer l'itinéraire optimisé
      const routeResult = await distanceCalculatorService.calculateMultiMerchantRoute(
        clientAddress,
        merchantOrders.map(order => ({
          merchantId: order.merchantId,
          merchantName: order.merchantName,
          address: order.address
        }))
      );

      if (routeResult.status !== 'OK') {
        throw new Error('Impossible de calculer l\'itinéraire optimisé');
      }

      // Calculer les frais totaux
      const totalOrderValue = merchantOrders.reduce((sum, order) => sum + order.subtotal, 0);
      const numberOfStops = merchantOrders.length;

      const baseCalculation = this.calculateFees(
        routeResult.totalDistance,
        totalOrderValue,
        timeSlot,
        numberOfStops
      );

      // Répartir les frais entre les marchands
      const individualFees = this.distributeFees(
        merchantOrders,
        routeResult.individualDistances,
        baseCalculation.totalFee
      );

      const result: MultiMerchantDeliveryCalculation = {
        totalDistance: routeResult.totalDistance,
        totalDuration: routeResult.totalDuration,
        totalFee: baseCalculation.totalFee,
        individualFees,
        breakdown: baseCalculation.breakdown,
        optimizedRoute: routeResult.optimizedRoute
      };

      return result;

    } catch (error) {
      console.error('Erreur calcul livraison multi-marchands:', error);
      return this.getFallbackMultiCalculation(merchantOrders, timeSlot);
    }
  }

  /**
   * Calcule les frais selon la configuration
   */
  private calculateFees(
    distance: number,
    orderValue: number,
    timeSlot?: string,
    numberOfStops: number = 1
  ): DeliveryCalculation {
    if (!this.config) {
      throw new Error('Configuration non chargée');
    }

    // Frais de base
    let baseFee = orderValue >= this.config.freeDeliveryThreshold ? 0 : this.config.baseFee;

    // Frais de distance
    const distanceFee = distance > this.config.maxFreeDistance
      ? (distance - this.config.maxFreeDistance) * this.config.pricePerKm
      : 0;

    // Frais zone éloignée
    const remoteFee = distance > this.config.remoteZoneDistance ? this.config.remoteZoneFee : 0;

    // Frais arrêts multiples
    const multiStopFee = numberOfStops > 1 ? (numberOfStops - 1) * this.config.multiStopFee : 0;

    // Multiplicateur temporel
    const timeMultiplier = this.getTimeMultiplier(timeSlot);

    // Calcul total
    const subtotal = baseFee + distanceFee + remoteFee + multiStopFee;
    const totalFee = subtotal * timeMultiplier;

    return {
      baseFee,
      distanceFee,
      remoteFee,
      multiStopFee,
      timeMultiplier,
      totalFee: Math.round(totalFee * 100) / 100,
      distance,
      estimatedTime: 0, // Sera rempli par l'appelant
      breakdown: {
        base: baseFee,
        distance: distanceFee,
        remote: remoteFee,
        multiStop: multiStopFee,
        timeMultiplier,
        total: totalFee
      }
    };
  }

  /**
   * Répartit les frais entre les marchands
   */
  private distributeFees(
    merchantOrders: Array<{
      merchantId: string;
      merchantName: string;
      address: string;
      subtotal: number;
    }>,
    individualDistances: Array<{
      merchantId: string;
      merchantName: string;
      address: string;
      distance: number;
      duration: number;
      order: number;
    }>,
    totalFee: number
  ): Array<{
    merchantId: string;
    merchantName: string;
    distance: number;
    fee: number;
    order: number;
  }> {
    const totalOrderValue = merchantOrders.reduce((sum, order) => sum + order.subtotal, 0);

    return individualDistances.map(dist => {
      const merchant = merchantOrders.find(m => m.merchantId === dist.merchantId);
      if (!merchant) {
        return {
          merchantId: dist.merchantId,
          merchantName: dist.merchantName,
          distance: dist.distance,
          fee: 0,
          order: dist.order
        };
      }

      // Répartition proportionnelle au montant de la commande
      const feeShare = (merchant.subtotal / totalOrderValue) * totalFee;

      return {
        merchantId: dist.merchantId,
        merchantName: dist.merchantName,
        distance: dist.distance,
        fee: Math.round(feeShare * 100) / 100,
        order: dist.order
      };
    });
  }

  /**
   * Détermine le multiplicateur temporel
   */
  private getTimeMultiplier(timeSlot?: string): number {
    if (!timeSlot) return 1.0;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    const isHoliday = this.isHoliday(now);

    // Vérifier les créneaux horaires
    for (const slot of this.timeSlots) {
      if (slot.isActive && this.isTimeInSlot(currentTime, slot.startTime, slot.endTime)) {
        return slot.multiplier;
      }
    }

    // Multiplicateurs par défaut
    if (isHoliday) return this.config?.holidayMultiplier || 1.3;
    if (isWeekend) return this.config?.weekendMultiplier || 1.2;
    if (this.isRushHour(currentTime)) return this.config?.rushHourMultiplier || 1.5;

    return 1.0;
  }

  /**
   * Vérifie si l'heure actuelle est dans un créneau
   */
  private isTimeInSlot(currentTime: string, startTime: string, endTime: string): boolean {
    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * Vérifie si c'est l'heure de pointe
   */
  private isRushHour(time: string): boolean {
    return (time >= '07:00' && time <= '09:00') || (time >= '17:00' && time <= '19:00');
  }

  /**
   * Vérifie si c'est un jour férié
   */
  private isHoliday(date: Date): boolean {
    // Liste simplifiée des jours fériés canadiens
    const holidays = [
      '01-01', // Nouvel An
      '07-01', // Fête du Canada
      '12-25', // Noël
      '12-26'  // Boxing Day
    ];

    const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return holidays.includes(monthDay);
  }

  /**
   * Calcul de fallback en cas d'erreur
   */
  private getFallbackCalculation(orderValue: number, timeSlot?: string): DeliveryCalculation {
    const baseFee = orderValue >= (this.config?.freeDeliveryThreshold || 25) ? 0 : (this.config?.baseFee || 2.99);
    const timeMultiplier = this.getTimeMultiplier(timeSlot);

    return {
      baseFee,
      distanceFee: 0,
      remoteFee: 0,
      multiStopFee: 0,
      timeMultiplier,
      totalFee: baseFee * timeMultiplier,
      distance: 0,
      estimatedTime: 0,
      breakdown: {
        base: baseFee,
        distance: 0,
        remote: 0,
        multiStop: 0,
        timeMultiplier,
        total: baseFee * timeMultiplier
      }
    };
  }

  /**
   * Calcul de fallback pour multi-marchands
   */
  private getFallbackMultiCalculation(
    merchantOrders: Array<{
      merchantId: string;
      merchantName: string;
      address: string;
      subtotal: number;
    }>,
    timeSlot?: string
  ): MultiMerchantDeliveryCalculation {
    const totalOrderValue = merchantOrders.reduce((sum, order) => sum + order.subtotal, 0);
    const baseFee = totalOrderValue >= (this.config?.freeDeliveryThreshold || 25) ? 0 : (this.config?.baseFee || 2.99);
    const multiStopFee = (merchantOrders.length - 1) * (this.config?.multiStopFee || 3.00);
    const timeMultiplier = this.getTimeMultiplier(timeSlot);
    const totalFee = (baseFee + multiStopFee) * timeMultiplier;

    const individualFees = merchantOrders.map((order, index) => ({
      merchantId: order.merchantId,
      merchantName: order.merchantName,
      distance: 0,
      fee: (order.subtotal / totalOrderValue) * totalFee,
      order: index
    }));

    return {
      totalDistance: 0,
      totalDuration: 0,
      totalFee,
      individualFees,
      breakdown: {
        baseFee: baseFee,
        distanceFee: 0,
        remoteFee: 0,
        multiStopFee: multiStopFee,
        timeMultiplier: timeMultiplier,
        total: totalFee
      },
      optimizedRoute: [merchantOrders[0]?.address || '', 'Client Address']
    };
  }

  /**
   * Gestion du cache
   */
  private getCachedResult(key: string): DeliveryCalculation | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - (cached as any).timestamp < this.cacheExpiry) {
      return cached;
    }
    this.cache.delete(key);
    return null;
  }

  private cacheResult(key: string, result: DeliveryCalculation): void {
    (result as any).timestamp = Date.now();
    this.cache.set(key, result);
  }

  /**
   * Nettoyage du cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Recharge la configuration
   */
  public async refreshConfig(): Promise<void> {
    await this.loadConfig();
    this.clearCache();
  }

  /**
   * Obtient la configuration actuelle
   */
  public getConfig(): DeliveryPricingConfig | null {
    return this.config;
  }

  /**
   * Obtient les créneaux horaires
   */
  public getTimeSlots(): TimeSlot[] {
    return this.timeSlots;
  }
}

// Instance singleton
export const deliveryPricingService = new DeliveryPricingService();
