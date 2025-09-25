import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLoyalty } from '../useLoyalty';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      rpc: vi.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }
}));

// Mock useAuth
vi.mock('../useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' }
  })
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('useLoyalty', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('calculateEarnedPoints', () => {
    it('should calculate points correctly with default rate', () => {
      const { result } = renderHook(() => useLoyalty());
      
      // Mock account with default settings
      act(() => {
        result.current.account = {
          points: 100,
          settings: {
            id: '1',
            loyalty_enabled: true,
            loyalty_earn_rate: 1.0,
            loyalty_redeem_rate: 0.01,
            min_redemption_points: 100,
            max_redemption_percentage: 50,
            points_expiry_days: 365,
            is_active: true
          },
          transactions: [],
          redemptions: []
        };
      });

      const points = result.current.calculateEarnedPoints(50);
      expect(points).toBe(50);
    });

    it('should calculate points with custom rate', () => {
      const { result } = renderHook(() => useLoyalty());
      
      act(() => {
        result.current.account = {
          points: 100,
          settings: {
            id: '1',
            loyalty_enabled: true,
            loyalty_earn_rate: 2.0, // 2 points per dollar
            loyalty_redeem_rate: 0.01,
            min_redemption_points: 100,
            max_redemption_percentage: 50,
            points_expiry_days: 365,
            is_active: true
          },
          transactions: [],
          redemptions: []
        };
      });

      const points = result.current.calculateEarnedPoints(50);
      expect(points).toBe(100);
    });
  });

  describe('calculatePointsValue', () => {
    it('should calculate value correctly with default rate', () => {
      const { result } = renderHook(() => useLoyalty());
      
      act(() => {
        result.current.account = {
          points: 100,
          settings: {
            id: '1',
            loyalty_enabled: true,
            loyalty_earn_rate: 1.0,
            loyalty_redeem_rate: 0.01, // 1 point = 0.01$
            min_redemption_points: 100,
            max_redemption_percentage: 50,
            points_expiry_days: 365,
            is_active: true
          },
          transactions: [],
          redemptions: []
        };
      });

      const value = result.current.calculatePointsValue(100);
      expect(value).toBe(1.0);
    });

    it('should calculate value with custom rate', () => {
      const { result } = renderHook(() => useLoyalty());
      
      act(() => {
        result.current.account = {
          points: 100,
          settings: {
            id: '1',
            loyalty_enabled: true,
            loyalty_earn_rate: 1.0,
            loyalty_redeem_rate: 0.02, // 1 point = 0.02$
            min_redemption_points: 100,
            max_redemption_percentage: 50,
            points_expiry_days: 365,
            is_active: true
          },
          transactions: [],
          redemptions: []
        };
      });

      const value = result.current.calculatePointsValue(100);
      expect(value).toBe(2.0);
    });
  });

  describe('calculateMaxRedeemablePoints', () => {
    it('should calculate max redeemable points correctly', () => {
      const { result } = renderHook(() => useLoyalty());
      
      act(() => {
        result.current.account = {
          points: 1000,
          settings: {
            id: '1',
            loyalty_enabled: true,
            loyalty_earn_rate: 1.0,
            loyalty_redeem_rate: 0.01,
            min_redemption_points: 100,
            max_redemption_percentage: 50, // 50% max reduction
            points_expiry_days: 365,
            is_active: true
          },
          transactions: [],
          redemptions: []
        };
      });

      const maxPoints = result.current.calculateMaxRedeemablePoints(100); // 100$ order
      // 50% of 100$ = 50$ max discount
      // 50$ / 0.01$ per point = 5000 points max
      expect(maxPoints).toBe(5000);
    });

    it('should not exceed user points', () => {
      const { result } = renderHook(() => useLoyalty());
      
      act(() => {
        result.current.account = {
          points: 100, // User has only 100 points
          settings: {
            id: '1',
            loyalty_enabled: true,
            loyalty_earn_rate: 1.0,
            loyalty_redeem_rate: 0.01,
            min_redemption_points: 100,
            max_redemption_percentage: 50,
            points_expiry_days: 365,
            is_active: true
          },
          transactions: [],
          redemptions: []
        };
      });

      const maxPoints = result.current.calculateMaxRedeemablePoints(1000); // Large order
      expect(maxPoints).toBe(100); // Should be limited by user's points
    });
  });

  describe('canRedeemPoints', () => {
    it('should allow redemption when conditions are met', () => {
      const { result } = renderHook(() => useLoyalty());
      
      act(() => {
        result.current.account = {
          points: 200,
          settings: {
            id: '1',
            loyalty_enabled: true,
            loyalty_earn_rate: 1.0,
            loyalty_redeem_rate: 0.01,
            min_redemption_points: 100,
            max_redemption_percentage: 50,
            points_expiry_days: 365,
            is_active: true
          },
          transactions: [],
          redemptions: []
        };
      });

      const canRedeem = result.current.canRedeemPoints(150, 100);
      expect(canRedeem).toBe(true);
    });

    it('should not allow redemption when points are insufficient', () => {
      const { result } = renderHook(() => useLoyalty());
      
      act(() => {
        result.current.account = {
          points: 50,
          settings: {
            id: '1',
            loyalty_enabled: true,
            loyalty_earn_rate: 1.0,
            loyalty_redeem_rate: 0.01,
            min_redemption_points: 100,
            max_redemption_percentage: 50,
            points_expiry_days: 365,
            is_active: true
          },
          transactions: [],
          redemptions: []
        };
      });

      const canRedeem = result.current.canRedeemPoints(100, 100);
      expect(canRedeem).toBe(false);
    });

    it('should not allow redemption when below minimum', () => {
      const { result } = renderHook(() => useLoyalty());
      
      act(() => {
        result.current.account = {
          points: 200,
          settings: {
            id: '1',
            loyalty_enabled: true,
            loyalty_earn_rate: 1.0,
            loyalty_redeem_rate: 0.01,
            min_redemption_points: 100,
            max_redemption_percentage: 50,
            points_expiry_days: 365,
            is_active: true
          },
          transactions: [],
          redemptions: []
        };
      });

      const canRedeem = result.current.canRedeemPoints(50, 100); // Below minimum
      expect(canRedeem).toBe(false);
    });

    it('should not allow redemption when system is disabled', () => {
      const { result } = renderHook(() => useLoyalty());
      
      act(() => {
        result.current.account = {
          points: 200,
          settings: {
            id: '1',
            loyalty_enabled: false, // System disabled
            loyalty_earn_rate: 1.0,
            loyalty_redeem_rate: 0.01,
            min_redemption_points: 100,
            max_redemption_percentage: 50,
            points_expiry_days: 365,
            is_active: true
          },
          transactions: [],
          redemptions: []
        };
      });

      const canRedeem = result.current.canRedeemPoints(150, 100);
      expect(canRedeem).toBe(false);
    });
  });

  describe('addPoints', () => {
    it('should add points successfully', async () => {
      const mockRpc = vi.fn().mockResolvedValue({ data: true, error: null });
      (supabase.from as any).mockReturnValue({
        rpc: mockRpc
      });

      const { result } = renderHook(() => useLoyalty());
      
      act(() => {
        result.current.account = {
          points: 100,
          settings: {
            id: '1',
            loyalty_enabled: true,
            loyalty_earn_rate: 1.0,
            loyalty_redeem_rate: 0.01,
            min_redemption_points: 100,
            max_redemption_percentage: 50,
            points_expiry_days: 365,
            is_active: true
          },
          transactions: [],
          redemptions: []
        };
      });

      const success = await result.current.addPoints('order-123', 50, 'Test order');
      expect(success).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith('add_loyalty_points', {
        p_user_id: 'test-user-id',
        p_points: 50,
        p_order_id: 'order-123',
        p_description: 'Test order',
        p_metadata: { order_amount: 50, points_earned: 50 }
      });
    });

    it('should handle errors gracefully', async () => {
      const mockRpc = vi.fn().mockResolvedValue({ data: null, error: new Error('Database error') });
      (supabase.from as any).mockReturnValue({
        rpc: mockRpc
      });

      const { result } = renderHook(() => useLoyalty());
      
      act(() => {
        result.current.account = {
          points: 100,
          settings: {
            id: '1',
            loyalty_enabled: true,
            loyalty_earn_rate: 1.0,
            loyalty_redeem_rate: 0.01,
            min_redemption_points: 100,
            max_redemption_percentage: 50,
            points_expiry_days: 365,
            is_active: true
          },
          transactions: [],
          redemptions: []
        };
      });

      const success = await result.current.addPoints('order-123', 50);
      expect(success).toBe(false);
    });
  });

  describe('redeemPoints', () => {
    it('should redeem points successfully', async () => {
      const mockRpc = vi.fn().mockResolvedValue({ data: 1.5, error: null });
      (supabase.from as any).mockReturnValue({
        rpc: mockRpc
      });

      const { result } = renderHook(() => useLoyalty());
      
      act(() => {
        result.current.account = {
          points: 200,
          settings: {
            id: '1',
            loyalty_enabled: true,
            loyalty_earn_rate: 1.0,
            loyalty_redeem_rate: 0.01,
            min_redemption_points: 100,
            max_redemption_percentage: 50,
            points_expiry_days: 365,
            is_active: true
          },
          transactions: [],
          redemptions: []
        };
      });

      const discount = await result.current.redeemPoints('order-123', 150);
      expect(discount).toBe(1.5);
      expect(mockRpc).toHaveBeenCalledWith('redeem_loyalty_points', {
        p_user_id: 'test-user-id',
        p_order_id: 'order-123',
        p_points_to_redeem: 150,
        p_redeem_rate: 0.01
      });
    });

    it('should handle redemption errors', async () => {
      const mockRpc = vi.fn().mockResolvedValue({ data: null, error: new Error('Insufficient points') });
      (supabase.from as any).mockReturnValue({
        rpc: mockRpc
      });

      const { result } = renderHook(() => useLoyalty());
      
      act(() => {
        result.current.account = {
          points: 200,
          settings: {
            id: '1',
            loyalty_enabled: true,
            loyalty_earn_rate: 1.0,
            loyalty_redeem_rate: 0.01,
            min_redemption_points: 100,
            max_redemption_percentage: 50,
            points_expiry_days: 365,
            is_active: true
          },
          transactions: [],
          redemptions: []
        };
      });

      const discount = await result.current.redeemPoints('order-123', 150);
      expect(discount).toBe(0);
    });
  });
});
