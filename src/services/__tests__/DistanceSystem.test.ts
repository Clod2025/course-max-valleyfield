import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { distanceCalculatorService } from '../DistanceCalculatorService';
import { deliveryPricingService } from '../DeliveryPricingService';
import { routeOptimizerService } from '../RouteOptimizerService';
import { deliveryFeeDistributionService } from '../DeliveryFeeDistributionService';

// Mock des modules externes
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: {}, error: null }))
        }))
      })),
      upsert: vi.fn(() => Promise.resolve({ error: null }))
    }))
  }
}));

// Mock stable de fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('DistanceCalculatorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    distanceCalculatorService.clearCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two addresses', async () => {
      // Mock de la réponse de l'API Google Maps
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          status: 'OK',
          rows: [{
            elements: [{
              status: 'OK',
              distance: { value: 5000 }, // 5km
              duration: { value: 1800 } // 30 minutes
            }]
          }]
        })
      });

      const result = await distanceCalculatorService.calculateDistance(
        '123 Main St, Montreal',
        '456 Oak St, Montreal'
      );

      expect(result.status).toBe('OK');
      expect(result.distance).toBe(5);
      expect(result.duration).toBe(30);
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      const result = await distanceCalculatorService.calculateDistance(
        'Invalid Address',
        'Another Invalid Address'
      );

      expect(result.status).toBe('ERROR');
      expect(result.distance).toBe(0);
    });

    it('should use cache for repeated requests', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          status: 'OK',
          rows: [{
            elements: [{
              status: 'OK',
              distance: { value: 3000 },
              duration: { value: 1200 }
            }]
          }]
        })
      });

      // Premier appel
      await distanceCalculatorService.calculateDistance('A', 'B');
      
      // Deuxième appel (devrait utiliser le cache)
      const result = await distanceCalculatorService.calculateDistance('A', 'B');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.distance).toBe(3);
    });
  });

  describe('calculateMultiMerchantRoute', () => {
    it('should optimize route for multiple merchants', async () => {
      const merchants = [
        { merchantId: 'm1', merchantName: 'Store 1', address: '123 St' },
        { merchantId: 'm2', merchantName: 'Store 2', address: '456 St' }
      ];

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          status: 'OK',
          routes: [{
            legs: [
              { distance: { value: 2000 }, duration: { value: 600 } },
              { distance: { value: 3000 }, duration: { value: 900 } }
            ],
            waypoint_order: [0, 1]
          }]
        })
      });

      const result = await distanceCalculatorService.calculateMultiMerchantRoute(
        'Client Address',
        merchants
      );

      expect(result.status).toBe('OK');
      expect(result.totalDistance).toBe(5);
      expect(result.individualDistances).toHaveLength(2);
    });
  });

  describe('geocodeAddress', () => {
    it('should geocode address to coordinates', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          status: 'OK',
          results: [{
            geometry: {
              location: { lat: 45.5017, lng: -73.5673 }
            },
            formatted_address: '123 Main St, Montreal, QC'
          }]
        })
      });

      const result = await distanceCalculatorService.geocodeAddress('123 Main St, Montreal');

      expect(result.status).toBe('OK');
      expect(result.lat).toBe(45.5017);
      expect(result.lng).toBe(-73.5673);
    });
  });
});

describe('DeliveryPricingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deliveryPricingService.clearCache();
  });

  describe('calculateSingleMerchantDelivery', () => {
    it('should calculate delivery fee for single merchant', async () => {
      const result = await deliveryPricingService.calculateSingleMerchantDelivery(
        'Client Address',
        'Merchant Address',
        25.00,
        'normal'
      );

      expect(result.totalFee).toBeGreaterThan(0);
      expect(result.distance).toBeGreaterThanOrEqual(0);
      expect(result.breakdown).toHaveProperty('base');
      expect(result.breakdown).toHaveProperty('distance');
      expect(result.breakdown).toHaveProperty('total');
    });

    it('should apply free delivery threshold', async () => {
      const result = await deliveryPricingService.calculateSingleMerchantDelivery(
        'Client Address',
        'Merchant Address',
        30.00, // Above threshold
        'normal'
      );

      // Should be free or have reduced fee
      expect(result.totalFee).toBeLessThanOrEqual(0);
    });

    it('should apply time multipliers', async () => {
      const normalResult = await deliveryPricingService.calculateSingleMerchantDelivery(
        'Client Address',
        'Merchant Address',
        20.00,
        'normal'
      );

      const rushResult = await deliveryPricingService.calculateSingleMerchantDelivery(
        'Client Address',
        'Merchant Address',
        20.00,
        'rush'
      );

      expect(rushResult.timeMultiplier).toBeGreaterThan(normalResult.timeMultiplier);
    });
  });

  describe('calculateMultiMerchantDelivery', () => {
    it('should calculate fees for multiple merchants', async () => {
      const merchantOrders = [
        { merchantId: 'm1', merchantName: 'Store 1', address: '123 St', subtotal: 15.00 },
        { merchantId: 'm2', merchantName: 'Store 2', address: '456 St', subtotal: 20.00 }
      ];

      const result = await deliveryPricingService.calculateMultiMerchantDelivery(
        'Client Address',
        merchantOrders,
        'normal'
      );

      expect(result.totalFee).toBeGreaterThan(0);
      expect(result.individualFees).toHaveLength(2);
      expect(result.breakdown).toHaveProperty('multiStopFee');
    });
  });
});

describe('RouteOptimizerService', () => {
  beforeEach(() => {
    routeOptimizerService.clearCache();
  });

  describe('optimizeRoute', () => {
    it('should optimize route with Google Maps algorithm', async () => {
      const request = {
        clientAddress: 'Client Address',
        merchantStops: [
          { merchantId: 'm1', merchantName: 'Store 1', address: '123 St' },
          { merchantId: 'm2', merchantName: 'Store 2', address: '456 St' }
        ]
      };

      const result = await routeOptimizerService.optimizeRoute(request, {
        algorithm: 'google_maps'
      });

      expect(result.routeId).toBeDefined();
      expect(result.totalDistance).toBeGreaterThan(0);
      expect(result.optimizedOrder).toHaveLength(2);
      expect(result.efficiency.efficiencyScore).toBeGreaterThan(0);
    });

    it('should optimize route with nearest neighbor algorithm', async () => {
      const request = {
        clientAddress: 'Client Address',
        merchantStops: [
          { merchantId: 'm1', merchantName: 'Store 1', address: '123 St' },
          { merchantId: 'm2', merchantName: 'Store 2', address: '456 St' }
        ]
      };

      const result = await routeOptimizerService.optimizeRoute(request, {
        algorithm: 'nearest_neighbor'
      });

      expect(result.routeId).toBeDefined();
      expect(result.optimizedOrder).toHaveLength(2);
    });

    it('should validate constraints', async () => {
      const request = {
        clientAddress: 'Client Address',
        merchantStops: [
          { merchantId: 'm1', merchantName: 'Store 1', address: '123 St' }
        ],
        driverConstraints: {
          maxDistance: 1, // Very small limit
          maxDuration: 5
        }
      };

      const result = await routeOptimizerService.optimizeRoute(request);

      expect(result.constraints.allConstraintsMet).toBe(false);
      expect(result.constraints.violations.length).toBeGreaterThan(0);
    });
  });
});

describe('DeliveryFeeDistributionService', () => {
  describe('calculateFeeDistribution', () => {
    it('should distribute fees proportionally', async () => {
      const merchantOrders = [
        { merchantId: 'm1', merchantName: 'Store 1', address: '123 St', subtotal: 20.00 },
        { merchantId: 'm2', merchantName: 'Store 2', address: '456 St', subtotal: 30.00 }
      ];

      const result = await deliveryFeeDistributionService.calculateFeeDistribution(
        merchantOrders,
        10.00,
        'proportional'
      );

      expect(result.totalFee).toBe(10.00);
      expect(result.merchantFees).toHaveLength(2);
      expect(result.merchantFees[0].percentage + result.merchantFees[1].percentage).toBeCloseTo(100);
    });

    it('should distribute fees equally', async () => {
      const merchantOrders = [
        { merchantId: 'm1', merchantName: 'Store 1', address: '123 St', subtotal: 20.00 },
        { merchantId: 'm2', merchantName: 'Store 2', address: '456 St', subtotal: 30.00 }
      ];

      const result = await deliveryFeeDistributionService.calculateFeeDistribution(
        merchantOrders,
        10.00,
        'equal'
      );

      expect(result.totalFee).toBe(10.00);
      expect(result.merchantFees[0].totalFee).toBe(5.00);
      expect(result.merchantFees[1].totalFee).toBe(5.00);
    });

    it('should apply minimum and maximum constraints', async () => {
      const merchantOrders = [
        { merchantId: 'm1', merchantName: 'Store 1', address: '123 St', subtotal: 1.00 },
        { merchantId: 'm2', merchantName: 'Store 2', address: '456 St', subtotal: 1.00 }
      ];

      const result = await deliveryFeeDistributionService.calculateFeeDistribution(
        merchantOrders,
        1.00, // Very small total fee
        'proportional'
      );

      // Should apply minimum fee constraints
      result.merchantFees.forEach(fee => {
        expect(fee.totalFee).toBeGreaterThanOrEqual(0.50); // Minimum fee
      });
    });
  });

  describe('compareDistributionMethods', () => {
    it('should compare different distribution methods', async () => {
      const merchantOrders = [
        { merchantId: 'm1', merchantName: 'Store 1', address: '123 St', subtotal: 20.00 },
        { merchantId: 'm2', merchantName: 'Store 2', address: '456 St', subtotal: 30.00 }
      ];

      const comparison = await deliveryFeeDistributionService.compareDistributionMethods(
        merchantOrders,
        10.00
      );

      expect(comparison).toHaveProperty('proportional');
      expect(comparison).toHaveProperty('equal');
      expect(comparison).toHaveProperty('distance_based');
      expect(comparison).toHaveProperty('hybrid');

      // All methods should distribute the same total fee
      Object.values(comparison).forEach(result => {
        expect(result.totalFee).toBe(10.00);
      });
    });
  });

  describe('recommendDistributionMethod', () => {
    it('should recommend the best distribution method', async () => {
      const merchantOrders = [
        { merchantId: 'm1', merchantName: 'Store 1', address: '123 St', subtotal: 20.00 },
        { merchantId: 'm2', merchantName: 'Store 2', address: '456 St', subtotal: 30.00 }
      ];

      const recommendation = await deliveryFeeDistributionService.recommendDistributionMethod(
        merchantOrders,
        10.00
      );

      expect(recommendation.recommendedMethod).toBeDefined();
      expect(recommendation.reason).toBeDefined();
      expect(recommendation.comparison).toBeDefined();
    });
  });
});

// Tests d'intégration
describe('Integration Tests', () => {
  it('should handle complete delivery workflow', async () => {
    // 1. Calculate distance
    const distanceResult = await distanceCalculatorService.calculateDistance(
      'Client Address',
      'Merchant Address'
    );

    // 2. Calculate pricing
    const pricingResult = await deliveryPricingService.calculateSingleMerchantDelivery(
      'Client Address',
      'Merchant Address',
      25.00,
      'normal'
    );

    // 3. Optimize route
    const routeResult = await routeOptimizerService.optimizeRoute({
      clientAddress: 'Client Address',
      merchantStops: [
        { merchantId: 'm1', merchantName: 'Store 1', address: 'Merchant Address' }
      ]
    });

    // 4. Distribute fees
    const distributionResult = await deliveryFeeDistributionService.calculateFeeDistribution(
      [{ merchantId: 'm1', merchantName: 'Store 1', address: 'Merchant Address', subtotal: 25.00 }],
      pricingResult.totalFee,
      'proportional'
    );

    // Verify all results are valid
    expect(distanceResult.status).toBe('OK');
    expect(pricingResult.totalFee).toBeGreaterThan(0);
    expect(routeResult.optimizedOrder).toHaveLength(1);
    expect(distributionResult.totalFee).toBe(pricingResult.totalFee);
  });

  it('should handle multi-merchant delivery workflow', async () => {
    const merchantOrders = [
      { merchantId: 'm1', merchantName: 'Store 1', address: '123 St', subtotal: 15.00 },
      { merchantId: 'm2', merchantName: 'Store 2', address: '456 St', subtotal: 20.00 }
    ];

    // 1. Calculate multi-merchant route
    const routeResult = await distanceCalculatorService.calculateMultiMerchantRoute(
      'Client Address',
      merchantOrders.map(m => ({ merchantId: m.merchantId, merchantName: m.merchantName, address: m.address }))
    );

    // 2. Calculate multi-merchant pricing
    const pricingResult = await deliveryPricingService.calculateMultiMerchantDelivery(
      'Client Address',
      merchantOrders,
      'normal'
    );

    // 3. Distribute fees
    const distributionResult = await deliveryFeeDistributionService.calculateFeeDistribution(
      merchantOrders,
      pricingResult.totalFee,
      'proportional'
    );

    // Verify results
    expect(routeResult.status).toBe('OK');
    expect(pricingResult.totalFee).toBeGreaterThan(0);
    expect(pricingResult.individualFees).toHaveLength(2);
    expect(distributionResult.merchantFees).toHaveLength(2);
  });
});

// Tests de performance
describe('Performance Tests', () => {
  it('should handle multiple concurrent requests', async () => {
    const promises = Array.from({ length: 10 }, (_, i) =>
      distanceCalculatorService.calculateDistance(
        `Address ${i}`,
        `Destination ${i}`
      )
    );

    const results = await Promise.all(promises);
    expect(results).toHaveLength(10);
    results.forEach(result => {
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('distance');
      expect(result).toHaveProperty('duration');
    });
  });

  it('should cache results efficiently', async () => {
    const startTime = Date.now();
    
    // First call
    await distanceCalculatorService.calculateDistance('A', 'B');
    const firstCallTime = Date.now() - startTime;
    
    // Second call (should use cache)
    const cacheStartTime = Date.now();
    await distanceCalculatorService.calculateDistance('A', 'B');
    const cacheCallTime = Date.now() - cacheStartTime;
    
    // Cache call should be much faster
    expect(cacheCallTime).toBeLessThan(firstCallTime);
  });
});

// Tests de gestion d'erreurs
describe('Error Handling', () => {
  it('should handle network errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await distanceCalculatorService.calculateDistance('A', 'B');
    expect(result.status).toBe('ERROR');
  });

  it('should handle API rate limits', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ status: 'OVER_QUERY_LIMIT' })
    });

    const result = await distanceCalculatorService.calculateDistance('A', 'B');
    expect(result.status).toBe('OVER_QUERY_LIMIT');
  });

  it('should fallback to alternative methods when primary fails', async () => {
    // Mock primary method failure
    mockFetch.mockRejectedValueOnce(new Error('API Error'));

    const result = await distanceCalculatorService.calculateDistance('A', 'B');
    
    // Should use fallback calculation
    expect(result.status).toBe('OK');
    expect(result.distance).toBeGreaterThanOrEqual(0);
  });
});
