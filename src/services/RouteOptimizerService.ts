import { distanceCalculatorService, Coordinates } from './DistanceCalculatorService';

export interface RouteOptimizationRequest {
  clientAddress: string;
  merchantStops: Array<{
    merchantId: string;
    merchantName: string;
    address: string;
    priority?: number; // 1 = haute, 2 = normale, 3 = basse
    timeConstraints?: {
      openTime?: string; // HH:MM
      closeTime?: string; // HH:MM
      maxWaitTime?: number; // minutes
    };
    productTypes?: string[]; // Types de produits (périssables, etc.)
  }>;
  driverConstraints?: {
    maxDistance?: number; // km
    maxDuration?: number; // minutes
    preferredStartTime?: string; // HH:MM
    vehicleType?: 'car' | 'bike' | 'scooter';
  };
}

export interface OptimizedRoute {
  routeId: string;
  totalDistance: number; // km
  totalDuration: number; // minutes
  optimizedOrder: Array<{
    merchantId: string;
    merchantName: string;
    address: string;
    order: number;
    estimatedArrival: string; // HH:MM
    estimatedDeparture: string; // HH:MM
    distanceFromPrevious: number; // km
    durationFromPrevious: number; // minutes
  }>;
  route: Coordinates[];
  efficiency: {
    distanceSaved: number; // km économisés vs ordre original
    timeSaved: number; // minutes économisées
    efficiencyScore: number; // 0-100
  };
  constraints: {
    allConstraintsMet: boolean;
    violations: Array<{
      type: 'time' | 'distance' | 'priority';
      message: string;
      severity: 'warning' | 'error';
    }>;
  };
}

export interface RouteOptimizationOptions {
  algorithm: 'google_maps' | 'nearest_neighbor' | 'genetic' | 'simulated_annealing';
  maxIterations?: number;
  timeLimit?: number; // seconds
  considerTraffic?: boolean;
  considerTimeWindows?: boolean;
  prioritizeFreshProducts?: boolean;
}

class RouteOptimizerService {
  private cache: Map<string, OptimizedRoute> = new Map();
  private cacheExpiry: number = 30 * 60 * 1000; // 30 minutes

  /**
   * Optimise l'itinéraire pour une livraison multi-marchands
   */
  async optimizeRoute(
    request: RouteOptimizationRequest,
    options: RouteOptimizationOptions = {
      algorithm: 'google_maps',
      considerTraffic: true,
      considerTimeWindows: true,
      prioritizeFreshProducts: true
    }
  ): Promise<OptimizedRoute> {
    const cacheKey = this.generateCacheKey(request, options);
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      let optimizedRoute: OptimizedRoute;

      switch (options.algorithm) {
        case 'google_maps':
          optimizedRoute = await this.optimizeWithGoogleMaps(request, options);
          break;
        case 'nearest_neighbor':
          optimizedRoute = await this.optimizeWithNearestNeighbor(request, options);
          break;
        case 'genetic':
          optimizedRoute = await this.optimizeWithGeneticAlgorithm(request, options);
          break;
        case 'simulated_annealing':
          optimizedRoute = await this.optimizeWithSimulatedAnnealing(request, options);
          break;
        default:
          throw new Error(`Algorithme non supporté: ${options.algorithm}`);
      }

      // Valider les contraintes
      optimizedRoute.constraints = this.validateConstraints(optimizedRoute, request);

      // Calculer l'efficacité
      optimizedRoute.efficiency = this.calculateEfficiency(optimizedRoute, request);

      this.cacheResult(cacheKey, optimizedRoute);
      return optimizedRoute;

    } catch (error) {
      console.error('Erreur lors de l\'optimisation:', error);
      // Fallback vers l'algorithme du plus proche voisin
      return this.optimizeWithNearestNeighbor(request, options);
    }
  }

  /**
   * Optimisation avec l'API Google Maps
   */
  private async optimizeWithGoogleMaps(
    request: RouteOptimizationRequest,
    options: RouteOptimizationOptions
  ): Promise<OptimizedRoute> {
    const merchantAddresses = request.merchantStops.map(stop => ({
      merchantId: stop.merchantId,
      merchantName: stop.merchantName,
      address: stop.address
    }));

    const routeResult = await distanceCalculatorService.calculateMultiMerchantRoute(
      request.clientAddress,
      merchantAddresses
    );

    if (routeResult.status !== 'OK') {
      throw new Error('Impossible d\'optimiser avec Google Maps');
    }

    // Construire l'itinéraire optimisé
    const optimizedOrder = routeResult.individualDistances.map((dist, index) => ({
      merchantId: dist.merchantId,
      merchantName: dist.merchantName,
      address: dist.address,
      order: index,
      estimatedArrival: this.calculateArrivalTime(index, routeResult.totalDuration),
      estimatedDeparture: this.calculateDepartureTime(index, routeResult.totalDuration),
      distanceFromPrevious: index === 0 ? 0 : dist.distance,
      durationFromPrevious: index === 0 ? 0 : dist.duration
    }));

    return {
      routeId: `route_${Date.now()}`,
      totalDistance: routeResult.totalDistance,
      totalDuration: routeResult.totalDuration,
      optimizedOrder,
      route: routeResult.route,
      efficiency: {
        distanceSaved: 0,
        timeSaved: 0,
        efficiencyScore: 100
      },
      constraints: {
        allConstraintsMet: true,
        violations: []
      }
    };
  }

  /**
   * Algorithme du plus proche voisin
   */
  private async optimizeWithNearestNeighbor(
    request: RouteOptimizationRequest,
    options: RouteOptimizationOptions
  ): Promise<OptimizedRoute> {
    const clientCoords = await this.getCoordinates(request.clientAddress);
    const merchantCoords = await Promise.all(
      request.merchantStops.map(async stop => ({
        ...stop,
        coordinates: await this.getCoordinates(stop.address)
      }))
    );

    // Algorithme du plus proche voisin
    const optimizedOrder: any[] = [];
    const remaining = [...merchantCoords];
    let currentCoords = clientCoords;
    let totalDistance = 0;
    let totalDuration = 0;

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const distance = this.calculateHaversineDistance(currentCoords, remaining[i].coordinates);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      const nearest = remaining.splice(nearestIndex, 1)[0];
      optimizedOrder.push({
        merchantId: nearest.merchantId,
        merchantName: nearest.merchantName,
        address: nearest.address,
        order: optimizedOrder.length,
        estimatedArrival: this.calculateArrivalTime(optimizedOrder.length, totalDuration),
        estimatedDeparture: this.calculateDepartureTime(optimizedOrder.length, totalDuration),
        distanceFromPrevious: nearestDistance,
        durationFromPrevious: Math.ceil(nearestDistance * 1.5) // Estimation
      });

      totalDistance += nearestDistance;
      totalDuration += Math.ceil(nearestDistance * 1.5);
      currentCoords = nearest.coordinates;
    }

    // Retour au client
    const returnDistance = this.calculateHaversineDistance(currentCoords, clientCoords);
    totalDistance += returnDistance;
    totalDuration += Math.ceil(returnDistance * 1.5);

    return {
      routeId: `route_${Date.now()}`,
      totalDistance,
      totalDuration,
      optimizedOrder,
      route: [],
      efficiency: {
        distanceSaved: 0,
        timeSaved: 0,
        efficiencyScore: 85
      },
      constraints: {
        allConstraintsMet: true,
        violations: []
      }
    };
  }

  /**
   * Algorithme génétique (simplifié)
   */
  private async optimizeWithGeneticAlgorithm(
    request: RouteOptimizationRequest,
    options: RouteOptimizationOptions
  ): Promise<OptimizedRoute> {
    const maxIterations = options.maxIterations || 100;
    const populationSize = 50;
    const mutationRate = 0.1;

    // Génération initiale
    let population = this.generateInitialPopulation(request.merchantStops, populationSize);

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // Évaluation
      const fitnessScores = await Promise.all(
        population.map(individual => this.evaluateFitness(individual, request))
      );

      // Sélection des meilleurs
      const sortedPopulation = population
        .map((individual, index) => ({ individual, fitness: fitnessScores[index] }))
        .sort((a, b) => b.fitness - a.fitness);

      // Nouvelle génération
      const newPopulation = [];
      
      // Garder les meilleurs (élitisme)
      for (let i = 0; i < populationSize * 0.2; i++) {
        newPopulation.push(sortedPopulation[i].individual);
      }

      // Croisement et mutation
      while (newPopulation.length < populationSize) {
        const parent1 = this.selectParent(sortedPopulation);
        const parent2 = this.selectParent(sortedPopulation);
        const child = this.crossover(parent1, parent2);
        const mutatedChild = this.mutate(child, mutationRate);
        newPopulation.push(mutatedChild);
      }

      population = newPopulation;
    }

    // Retourner le meilleur individu
    const bestIndividual = population[0];
    return this.convertToOptimizedRoute(bestIndividual, request);
  }

  /**
   * Algorithme de recuit simulé
   */
  private async optimizeWithSimulatedAnnealing(
    request: RouteOptimizationRequest,
    options: RouteOptimizationOptions
  ): Promise<OptimizedRoute> {
    const maxIterations = options.maxIterations || 1000;
    const initialTemperature = 100;
    const coolingRate = 0.95;

    let currentSolution = this.generateRandomSolution(request.merchantStops);
    let bestSolution = [...currentSolution];
    let temperature = initialTemperature;

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const newSolution = this.generateNeighbor(currentSolution);
      
      const currentCost = await this.calculateRouteCost(currentSolution, request);
      const newCost = await this.calculateRouteCost(newSolution, request);

      if (newCost < currentCost || Math.random() < Math.exp(-(newCost - currentCost) / temperature)) {
        currentSolution = newSolution;
        
        if (newCost < await this.calculateRouteCost(bestSolution, request)) {
          bestSolution = [...newSolution];
        }
      }

      temperature *= coolingRate;
    }

    return this.convertToOptimizedRoute(bestSolution, request);
  }

  /**
   * Validation des contraintes
   */
  private validateConstraints(
    route: OptimizedRoute,
    request: RouteOptimizationRequest
  ): { allConstraintsMet: boolean; violations: any[] } {
    const violations: any[] = [];

    // Vérifier les contraintes de distance
    if (request.driverConstraints?.maxDistance && 
        route.totalDistance > request.driverConstraints.maxDistance) {
      violations.push({
        type: 'distance',
        message: `Distance totale (${route.totalDistance.toFixed(1)}km) dépasse la limite (${request.driverConstraints.maxDistance}km)`,
        severity: 'error'
      });
    }

    // Vérifier les contraintes de temps
    if (request.driverConstraints?.maxDuration && 
        route.totalDuration > request.driverConstraints.maxDuration) {
      violations.push({
        type: 'time',
        message: `Durée totale (${route.totalDuration}min) dépasse la limite (${request.driverConstraints.maxDuration}min)`,
        severity: 'error'
      });
    }

    // Vérifier les fenêtres de temps des marchands
    for (const stop of route.optimizedOrder) {
      const merchant = request.merchantStops.find(m => m.merchantId === stop.merchantId);
      if (merchant?.timeConstraints) {
        const arrivalTime = new Date(`2000-01-01T${stop.estimatedArrival}`);
        const openTime = new Date(`2000-01-01T${merchant.timeConstraints.openTime || '00:00'}`);
        const closeTime = new Date(`2000-01-01T${merchant.timeConstraints.closeTime || '23:59'}`);

        if (arrivalTime < openTime || arrivalTime > closeTime) {
          violations.push({
            type: 'time',
            message: `Arrivée prévue (${stop.estimatedArrival}) en dehors des heures d'ouverture de ${merchant.merchantName}`,
            severity: 'warning'
          });
        }
      }
    }

    return {
      allConstraintsMet: violations.length === 0,
      violations
    };
  }

  /**
   * Calcul de l'efficacité de l'itinéraire
   */
  private calculateEfficiency(
    route: OptimizedRoute,
    request: RouteOptimizationRequest
  ): { distanceSaved: number; timeSaved: number; efficiencyScore: number } {
    // Calculer la distance de l'ordre original
    const originalDistance = this.calculateOriginalDistance(request);
    const distanceSaved = Math.max(0, originalDistance - route.totalDistance);
    
    // Estimation du temps économisé
    const timeSaved = Math.max(0, Math.ceil(originalDistance * 1.5) - route.totalDuration);
    
    // Score d'efficacité (0-100)
    const efficiencyScore = originalDistance > 0 
      ? Math.min(100, Math.round((distanceSaved / originalDistance) * 100))
      : 100;

    return {
      distanceSaved,
      timeSaved,
      efficiencyScore
    };
  }

  /**
   * Méthodes utilitaires
   */
  private async getCoordinates(address: string): Promise<Coordinates> {
    const result = await distanceCalculatorService.geocodeAddress(address);
    return { lat: result.lat, lng: result.lng };
  }

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

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private calculateArrivalTime(order: number, totalDuration: number): string {
    const now = new Date();
    const arrivalMinutes = Math.floor((order / (order + 1)) * totalDuration);
    const arrivalTime = new Date(now.getTime() + arrivalMinutes * 60000);
    return arrivalTime.toTimeString().slice(0, 5);
  }

  private calculateDepartureTime(order: number, totalDuration: number): string {
    const arrivalTime = this.calculateArrivalTime(order, totalDuration);
    const [hours, minutes] = arrivalTime.split(':').map(Number);
    const departureTime = new Date();
    departureTime.setHours(hours, minutes + 5, 0, 0); // 5 minutes de pause
    return departureTime.toTimeString().slice(0, 5);
  }

  private calculateOriginalDistance(request: RouteOptimizationRequest): number {
    // Distance simple en ligne droite pour comparaison
    return request.merchantStops.length * 5; // Estimation
  }

  private generateCacheKey(request: RouteOptimizationRequest, options: RouteOptimizationOptions): string {
    return `${request.clientAddress}_${request.merchantStops.map(m => m.merchantId).join(',')}_${options.algorithm}`;
  }

  private getCachedResult(key: string): OptimizedRoute | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - (cached as any).timestamp < this.cacheExpiry) {
      return cached;
    }
    this.cache.delete(key);
    return null;
  }

  private cacheResult(key: string, result: OptimizedRoute): void {
    (result as any).timestamp = Date.now();
    this.cache.set(key, result);
  }

  // Méthodes pour l'algorithme génétique
  private generateInitialPopulation(merchants: any[], size: number): any[][] {
    const population = [];
    for (let i = 0; i < size; i++) {
      const individual = [...merchants];
      this.shuffleArray(individual);
      population.push(individual);
    }
    return population;
  }

  private async evaluateFitness(individual: any[], request: RouteOptimizationRequest): Promise<number> {
    // Calculer la distance totale de cet individu
    let totalDistance = 0;
    let currentCoords = await this.getCoordinates(request.clientAddress);
    
    for (const merchant of individual) {
      const merchantCoords = await this.getCoordinates(merchant.address);
      totalDistance += this.calculateHaversineDistance(currentCoords, merchantCoords);
      currentCoords = merchantCoords;
    }
    
    // Retour au client
    const clientCoords = await this.getCoordinates(request.clientAddress);
    totalDistance += this.calculateHaversineDistance(currentCoords, clientCoords);
    
    // Fitness = 1 / distance (plus la distance est petite, plus le fitness est élevé)
    return 1 / (totalDistance + 1);
  }

  private selectParent(sortedPopulation: any[]): any[] {
    // Sélection par roulette
    const totalFitness = sortedPopulation.reduce((sum, item) => sum + item.fitness, 0);
    let random = Math.random() * totalFitness;
    
    for (const item of sortedPopulation) {
      random -= item.fitness;
      if (random <= 0) {
        return item.individual;
      }
    }
    
    return sortedPopulation[0].individual;
  }

  private crossover(parent1: any[], parent2: any[]): any[] {
    // Croisement en ordre (Order Crossover)
    const start = Math.floor(Math.random() * parent1.length);
    const end = Math.floor(Math.random() * (parent1.length - start)) + start;
    
    const child = new Array(parent1.length).fill(null);
    
    // Copier la section du parent1
    for (let i = start; i <= end; i++) {
      child[i] = parent1[i];
    }
    
    // Remplir le reste avec le parent2
    let childIndex = 0;
    for (const merchant of parent2) {
      if (!child.includes(merchant)) {
        while (child[childIndex] !== null) {
          childIndex++;
        }
        child[childIndex] = merchant;
      }
    }
    
    return child;
  }

  private mutate(individual: any[], mutationRate: number): any[] {
    const mutated = [...individual];
    
    if (Math.random() < mutationRate) {
      // Échange de deux éléments
      const i = Math.floor(Math.random() * mutated.length);
      const j = Math.floor(Math.random() * mutated.length);
      [mutated[i], mutated[j]] = [mutated[j], mutated[i]];
    }
    
    return mutated;
  }

  private generateRandomSolution(merchants: any[]): any[] {
    const solution = [...merchants];
    this.shuffleArray(solution);
    return solution;
  }

  private generateNeighbor(solution: any[]): any[] {
    const neighbor = [...solution];
    const i = Math.floor(Math.random() * neighbor.length);
    const j = Math.floor(Math.random() * neighbor.length);
    [neighbor[i], neighbor[j]] = [neighbor[j], neighbor[i]];
    return neighbor;
  }

  private async calculateRouteCost(solution: any[], request: RouteOptimizationRequest): Promise<number> {
    let totalDistance = 0;
    let currentCoords = await this.getCoordinates(request.clientAddress);
    
    for (const merchant of solution) {
      const merchantCoords = await this.getCoordinates(merchant.address);
      totalDistance += this.calculateHaversineDistance(currentCoords, merchantCoords);
      currentCoords = merchantCoords;
    }
    
    return totalDistance;
  }

  private convertToOptimizedRoute(solution: any[], request: RouteOptimizationRequest): OptimizedRoute {
    // Convertir la solution en OptimizedRoute
    // Cette méthode devrait être implémentée selon la structure de données
    return {
      routeId: `route_${Date.now()}`,
      totalDistance: 0,
      totalDuration: 0,
      optimizedOrder: [],
      route: [],
      efficiency: { distanceSaved: 0, timeSaved: 0, efficiencyScore: 0 },
      constraints: { allConstraintsMet: true, violations: [] }
    };
  }

  private shuffleArray(array: any[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
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
export const routeOptimizerService = new RouteOptimizerService();
