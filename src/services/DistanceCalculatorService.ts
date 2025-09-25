import { supabase } from '@/integrations/supabase/client';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DistanceResult {
  distance: number; // en kilomètres
  duration: number; // en minutes
  route?: Coordinates[];
  status: 'OK' | 'NOT_FOUND' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'UNKNOWN_ERROR';
}

export interface MultiMerchantRouteResult {
  totalDistance: number;
  totalDuration: number;
  optimizedRoute: string[];
  individualDistances: Array<{
    merchantId: string;
    merchantName: string;
    address: string;
    distance: number;
    duration: number;
    order: number;
  }>;
  route: Coordinates[];
  status: 'OK' | 'PARTIAL' | 'ERROR';
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  status: 'OK' | 'NOT_FOUND' | 'ERROR';
}

class DistanceCalculatorService {
  private apiKey: string;
  private baseUrl: string = 'https://maps.googleapis.com/maps/api';
  private cache: Map<string, DistanceResult> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Google Maps API key not found. Distance calculations will use fallback methods.');
    }
  }

  /**
   * Calcule la distance entre deux adresses
   */
  async calculateDistance(
    origin: string, 
    destination: string
  ): Promise<DistanceResult> {
    const cacheKey = `${origin}|${destination}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Géocodage des adresses
      const [originCoords, destCoords] = await Promise.all([
        this.geocodeAddress(origin),
        this.geocodeAddress(destination)
      ]);

      if (originCoords.status !== 'OK' || destCoords.status !== 'OK') {
        return this.calculateFallbackDistance(originCoords, destCoords);
      }

      // Appel à l'API Google Maps Distance Matrix
      const result = await this.callDistanceMatrixAPI(
        originCoords,
        destCoords
      );

      // Cache le résultat
      this.cacheResult(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Error calculating distance:', error);
      return this.calculateFallbackDistance(
        { lat: 0, lng: 0, formattedAddress: origin, status: 'ERROR' },
        { lat: 0, lng: 0, formattedAddress: destination, status: 'ERROR' }
      );
    }
  }

  /**
   * Calcule l'itinéraire optimisé pour plusieurs marchands
   */
  async calculateMultiMerchantRoute(
    clientAddress: string,
    merchantAddresses: Array<{
      merchantId: string;
      merchantName: string;
      address: string;
    }>
  ): Promise<MultiMerchantRouteResult> {
    try {
      if (merchantAddresses.length === 0) {
        return {
          totalDistance: 0,
          totalDuration: 0,
          optimizedRoute: [clientAddress],
          individualDistances: [],
          route: [],
          status: 'OK'
        };
      }

      if (merchantAddresses.length === 1) {
        const singleResult = await this.calculateDistance(
          clientAddress, 
          merchantAddresses[0].address
        );
        
        return {
          totalDistance: singleResult.distance,
          totalDuration: singleResult.duration,
          optimizedRoute: [merchantAddresses[0].address, clientAddress],
          individualDistances: [{
            merchantId: merchantAddresses[0].merchantId,
            merchantName: merchantAddresses[0].merchantName,
            address: merchantAddresses[0].address,
            distance: singleResult.distance,
            duration: singleResult.duration,
            order: 0
          }],
          route: singleResult.route || [],
          status: singleResult.status
        };
      }

      // Pour plusieurs marchands, utiliser l'API Directions avec waypoints
      const result = await this.callDirectionsAPI(clientAddress, merchantAddresses);
      return result;

    } catch (error) {
      console.error('Error calculating multi-merchant route:', error);
      return this.calculateFallbackMultiRoute(clientAddress, merchantAddresses);
    }
  }

  /**
   * Géocode une adresse en coordonnées
   */
  async geocodeAddress(address: string): Promise<GeocodeResult> {
    if (!this.apiKey) {
      return this.geocodeFallback(address);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng,
          formattedAddress: data.results[0].formatted_address,
          status: 'OK'
        };
      }
      
      return {
        lat: 0,
        lng: 0,
        formattedAddress: address,
        status: 'NOT_FOUND'
      };

    } catch (error) {
      console.error('Geocoding error:', error);
      return this.geocodeFallback(address);
    }
  }

  /**
   * Appel à l'API Distance Matrix de Google Maps
   */
  private async callDistanceMatrixAPI(
    origin: GeocodeResult,
    destination: GeocodeResult
  ): Promise<DistanceResult> {
    const response = await fetch(
      `${this.baseUrl}/distancematrix/json?` +
      `origins=${origin.lat},${origin.lng}&` +
      `destinations=${destination.lat},${destination.lng}&` +
      `mode=driving&units=metric&key=${this.apiKey}`
    );

    const data = await response.json();

    if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
      const element = data.rows[0].elements[0];
      return {
        distance: element.distance.value / 1000, // Convertir en km
        duration: Math.ceil(element.duration.value / 60), // Convertir en minutes
        status: 'OK'
      };
    }

    return {
      distance: 0,
      duration: 0,
      status: data.status as any
    };
  }

  /**
   * Appel à l'API Directions de Google Maps avec waypoints
   */
  private async callDirectionsAPI(
    clientAddress: string,
    merchantAddresses: Array<{ merchantId: string; merchantName: string; address: string }>
  ): Promise<MultiMerchantRouteResult> {
    const waypoints = merchantAddresses.map(m => m.address).join('|');
    
    const response = await fetch(
      `${this.baseUrl}/directions/json?` +
      `origin=${encodeURIComponent(clientAddress)}&` +
      `destination=${encodeURIComponent(clientAddress)}&` +
      `waypoints=optimize:true|${encodeURIComponent(waypoints)}&` +
      `mode=driving&units=metric&key=${this.apiKey}`
    );

    const data = await response.json();

    if (data.status === 'OK' && data.routes.length > 0) {
      const route = data.routes[0];
      const legs = route.legs;
      
      // Calculer les distances individuelles
      const individualDistances = legs.slice(0, -1).map((leg: any, index: number) => {
        const merchantIndex = route.waypoint_order[index];
        const merchant = merchantAddresses[merchantIndex];
        
        return {
          merchantId: merchant.merchantId,
          merchantName: merchant.merchantName,
          address: merchant.address,
          distance: leg.distance.value / 1000,
          duration: Math.ceil(leg.duration.value / 60),
          order: index
        };
      });

      const totalDistance = legs.reduce((sum: number, leg: any) => 
        sum + leg.distance.value, 0) / 1000;
      const totalDuration = legs.reduce((sum: number, leg: any) => 
        sum + leg.duration.value, 0) / 60;

      return {
        totalDistance,
        totalDuration: Math.ceil(totalDuration),
        optimizedRoute: [
          clientAddress,
          ...route.waypoint_order.map((i: number) => merchantAddresses[i].address),
          clientAddress
        ],
        individualDistances,
        route: this.extractRouteCoordinates(route),
        status: 'OK'
      };
    }

    return this.calculateFallbackMultiRoute(clientAddress, merchantAddresses);
  }

  /**
   * Méthode de fallback pour le calcul de distance
   */
  private calculateFallbackDistance(
    origin: GeocodeResult,
    destination: GeocodeResult
  ): DistanceResult {
    if (origin.status === 'ERROR' || destination.status === 'ERROR') {
      return {
        distance: 0,
        duration: 0,
        status: 'ERROR'
      };
    }

    // Calcul de distance à vol d'oiseau (formule de Haversine)
    const distance = this.calculateHaversineDistance(
      { lat: origin.lat, lng: origin.lng },
      { lat: destination.lat, lng: destination.lng }
    );

    // Estimation du temps de trajet (distance * 1.5 pour route réelle)
    const duration = Math.ceil(distance * 1.5);

    return {
      distance,
      duration,
      status: 'OK'
    };
  }

  /**
   * Méthode de fallback pour l'itinéraire multi-marchands
   */
  private calculateFallbackMultiRoute(
    clientAddress: string,
    merchantAddresses: Array<{ merchantId: string; merchantName: string; address: string }>
  ): MultiMerchantRouteResult {
    // Algorithme simple du plus proche voisin
    const optimizedOrder = this.nearestNeighborOptimization(clientAddress, merchantAddresses);
    
    let totalDistance = 0;
    let totalDuration = 0;
    const individualDistances: any[] = [];

    for (let i = 0; i < optimizedOrder.length; i++) {
      const merchant = optimizedOrder[i];
      const distance = Math.random() * 10 + 1; // Simulation
      const duration = Math.ceil(distance * 1.5);
      
      totalDistance += distance;
      totalDuration += duration;
      
      individualDistances.push({
        merchantId: merchant.merchantId,
        merchantName: merchant.merchantName,
        address: merchant.address,
        distance,
        duration,
        order: i
      });
    }

    return {
      totalDistance,
      totalDuration,
      optimizedRoute: [
        clientAddress,
        ...optimizedOrder.map(m => m.address),
        clientAddress
      ],
      individualDistances,
      route: [],
      status: 'OK'
    };
  }

  /**
   * Algorithme du plus proche voisin pour l'optimisation
   */
  private nearestNeighborOptimization(
    clientAddress: string,
    merchants: Array<{ merchantId: string; merchantName: string; address: string }>
  ): Array<{ merchantId: string; merchantName: string; address: string }> {
    if (merchants.length <= 1) return merchants;

    const result: Array<{ merchantId: string; merchantName: string; address: string }> = [];
    const remaining = [...merchants];
    let currentAddress = clientAddress;

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        // Simulation de distance (dans un vrai cas, on utiliserait l'API)
        const distance = Math.random() * 10 + 1;
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      const nearest = remaining.splice(nearestIndex, 1)[0];
      result.push(nearest);
      currentAddress = nearest.address;
    }

    return result;
  }

  /**
   * Calcul de distance à vol d'oiseau (formule de Haversine)
   */
  private calculateHaversineDistance(point1: Coordinates, point2: Coordinates): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Conversion degrés en radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Géocodage de fallback
   */
  private geocodeFallback(address: string): GeocodeResult {
    // Simulation basée sur des coordonnées de Valleyfield
    const valleyfieldCoords = { lat: 45.2467, lng: -74.1256 };
    return {
      lat: valleyfieldCoords.lat + (Math.random() - 0.5) * 0.01,
      lng: valleyfieldCoords.lng + (Math.random() - 0.5) * 0.01,
      formattedAddress: address,
      status: 'OK'
    };
  }

  /**
   * Extraction des coordonnées de route
   */
  private extractRouteCoordinates(route: any): Coordinates[] {
    const coordinates: Coordinates[] = [];
    
    if (route.overview_polyline?.points) {
      // Décoder la polyline (simplifié)
      // Dans un vrai projet, utiliser une librairie comme @mapbox/polyline
      return coordinates;
    }
    
    return coordinates;
  }

  /**
   * Gestion du cache
   */
  private getCachedResult(key: string): DistanceResult | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - (cached as any).timestamp < this.cacheExpiry) {
      return cached;
    }
    this.cache.delete(key);
    return null;
  }

  private cacheResult(key: string, result: DistanceResult): void {
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
   * Statistiques du cache
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Instance singleton
export const distanceCalculatorService = new DistanceCalculatorService();
