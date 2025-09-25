import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoyaltyCard } from '../LoyaltyCard';
import { useLoyalty } from '@/hooks/useLoyalty';

// Mock useLoyalty hook
vi.mock('@/hooks/useLoyalty', () => ({
  useLoyalty: vi.fn()
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

const mockUseLoyalty = useLoyalty as any;

describe('LoyaltyCard', () => {
  const mockAccount = {
    points: 250,
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    it('should show loading state', () => {
      mockUseLoyalty.mockReturnValue({
        account: null,
        loading: true,
        calculatePointsValue: vi.fn()
      });

      render(<LoyaltyCard />);
      
      expect(screen.getByText('Chargement...')).toBeInTheDocument();
    });
  });

  describe('No account state', () => {
    it('should show unavailable message when no account', () => {
      mockUseLoyalty.mockReturnValue({
        account: null,
        loading: false,
        calculatePointsValue: vi.fn()
      });

      render(<LoyaltyCard />);
      
      expect(screen.getByText('Système de fidélité non disponible')).toBeInTheDocument();
    });
  });

  describe('With account', () => {
    beforeEach(() => {
      mockUseLoyalty.mockReturnValue({
        account: mockAccount,
        loading: false,
        calculatePointsValue: (points: number) => points * 0.01
      });
    });

    it('should display user points correctly', () => {
      render(<LoyaltyCard />);
      
      expect(screen.getByText('250')).toBeInTheDocument();
      expect(screen.getByText('Points disponibles')).toBeInTheDocument();
      expect(screen.getByText('= 2.50$ de réduction')).toBeInTheDocument();
    });

    it('should show active badge when system is enabled', () => {
      render(<LoyaltyCard />);
      
      expect(screen.getByText('Actif')).toBeInTheDocument();
    });

    it('should show progress to next reward', () => {
      render(<LoyaltyCard />);
      
      expect(screen.getByText('Prochaine récompense')).toBeInTheDocument();
      expect(screen.getByText('100 points = 1.00$ de réduction')).toBeInTheDocument();
    });

    it('should show redeem button when user has enough points', () => {
      const mockOnRedeemClick = vi.fn();
      render(<LoyaltyCard onRedeemClick={mockOnRedeemClick} />);
      
      const redeemButton = screen.getByText('Utiliser mes points');
      expect(redeemButton).toBeInTheDocument();
      expect(redeemButton).not.toBeDisabled();
    });

    it('should show details when showDetails is true', () => {
      render(<LoyaltyCard showDetails={true} />);
      
      expect(screen.getByText('1$ dépensé = 1 point')).toBeInTheDocument();
      expect(screen.getByText('1 point = 0.01$')).toBeInTheDocument();
      expect(screen.getByText('• Minimum 100 points pour échanger')).toBeInTheDocument();
    });

    it('should not show details when showDetails is false', () => {
      render(<LoyaltyCard showDetails={false} />);
      
      expect(screen.queryByText('1$ dépensé = 1 point')).not.toBeInTheDocument();
    });
  });

  describe('Disabled system', () => {
    it('should show disabled message when system is disabled', () => {
      const disabledAccount = {
        ...mockAccount,
        settings: {
          ...mockAccount.settings,
          loyalty_enabled: false
        }
      };

      mockUseLoyalty.mockReturnValue({
        account: disabledAccount,
        loading: false,
        calculatePointsValue: (points: number) => points * 0.01
      });

      render(<LoyaltyCard />);
      
      expect(screen.getByText('Le système de fidélité est temporairement désactivé')).toBeInTheDocument();
    });
  });

  describe('Insufficient points', () => {
    it('should show insufficient points message when user has less than minimum', () => {
      const lowPointsAccount = {
        ...mockAccount,
        points: 50
      };

      mockUseLoyalty.mockReturnValue({
        account: lowPointsAccount,
        loading: false,
        calculatePointsValue: (points: number) => points * 0.01
      });

      render(<LoyaltyCard />);
      
      expect(screen.getByText('Points insuffisants')).toBeInTheDocument();
      expect(screen.getByText('Il vous manque 50 points')).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      mockUseLoyalty.mockReturnValue({
        account: mockAccount,
        loading: false,
        calculatePointsValue: (points: number) => points * 0.01
      });

      const { container } = render(<LoyaltyCard className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
