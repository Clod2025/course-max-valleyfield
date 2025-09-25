import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoyaltyCheckout } from '../LoyaltyCheckout';
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

describe('LoyaltyCheckout', () => {
  const mockAccount = {
    points: 500,
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

  const defaultProps = {
    orderTotal: 100,
    onLoyaltyDiscount: vi.fn(),
    onRemoveLoyaltyDiscount: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    it('should show loading state', () => {
      mockUseLoyalty.mockReturnValue({
        account: null,
        loading: true,
        calculatePointsValue: vi.fn(),
        calculateMaxRedeemablePoints: vi.fn()
      });

      render(<LoyaltyCheckout {...defaultProps} />);
      
      expect(screen.getByText('Chargement des paramètres...')).toBeInTheDocument();
    });
  });

  describe('No account or disabled system', () => {
    it('should not render when no account', () => {
      mockUseLoyalty.mockReturnValue({
        account: null,
        loading: false,
        calculatePointsValue: vi.fn(),
        calculateMaxRedeemablePoints: vi.fn()
      });

      const { container } = render(<LoyaltyCheckout {...defaultProps} />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when system is disabled', () => {
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
        calculatePointsValue: vi.fn(),
        calculateMaxRedeemablePoints: vi.fn()
      });

      const { container } = render(<LoyaltyCheckout {...defaultProps} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('With enabled account', () => {
    beforeEach(() => {
      mockUseLoyalty.mockReturnValue({
        account: mockAccount,
        loading: false,
        calculatePointsValue: (points: number) => points * 0.01,
        calculateMaxRedeemablePoints: (total: number) => Math.min(500, total * 50) // 50% max
      });
    });

    it('should display user points and value', () => {
      render(<LoyaltyCheckout {...defaultProps} />);
      
      expect(screen.getByText('500')).toBeInTheDocument();
      expect(screen.getByText('Vos points')).toBeInTheDocument();
      expect(screen.getByText('= 5.00$ de réduction')).toBeInTheDocument();
    });

    it('should show redeem button when user can redeem', () => {
      render(<LoyaltyCheckout {...defaultProps} />);
      
      const redeemButton = screen.getByText('Utiliser mes points');
      expect(redeemButton).toBeInTheDocument();
      expect(redeemButton).not.toBeDisabled();
    });

    it('should show maximum redeemable points', () => {
      render(<LoyaltyCheckout {...defaultProps} />);
      
      expect(screen.getByText('Jusqu\'à 50 points utilisables')).toBeInTheDocument();
      expect(screen.getByText('= 0.50$ de réduction')).toBeInTheDocument();
    });

    it('should open redeem modal when button is clicked', () => {
      render(<LoyaltyCheckout {...defaultProps} />);
      
      const redeemButton = screen.getByText('Utiliser mes points');
      fireEvent.click(redeemButton);
      
      expect(screen.getByText('Utiliser mes Points de Fidélité')).toBeInTheDocument();
    });

    it('should show system information', () => {
      render(<LoyaltyCheckout {...defaultProps} />);
      
      expect(screen.getByText('• 1$ dépensé = 1 point')).toBeInTheDocument();
      expect(screen.getByText('• 1 point = 0.01$ de réduction')).toBeInTheDocument();
      expect(screen.getByText('• Minimum 100 points pour échanger')).toBeInTheDocument();
    });
  });

  describe('Insufficient points', () => {
    it('should show insufficient points message', () => {
      const lowPointsAccount = {
        ...mockAccount,
        points: 50
      };

      mockUseLoyalty.mockReturnValue({
        account: lowPointsAccount,
        loading: false,
        calculatePointsValue: (points: number) => points * 0.01,
        calculateMaxRedeemablePoints: vi.fn()
      });

      render(<LoyaltyCheckout {...defaultProps} />);
      
      expect(screen.getByText('Points insuffisants pour échanger')).toBeInTheDocument();
      expect(screen.getByText('Minimum 100 points requis')).toBeInTheDocument();
    });
  });

  describe('Applied discount', () => {
    it('should show applied discount when provided', () => {
      const propsWithDiscount = {
        ...defaultProps,
        appliedDiscount: { points: 200, discount: 2.0 }
      };

      mockUseLoyalty.mockReturnValue({
        account: mockAccount,
        loading: false,
        calculatePointsValue: (points: number) => points * 0.01,
        calculateMaxRedeemablePoints: vi.fn()
      });

      render(<LoyaltyCheckout {...propsWithDiscount} />);
      
      expect(screen.getByText('Réduction appliquée')).toBeInTheDocument();
      expect(screen.getByText('200 points utilisés')).toBeInTheDocument();
      expect(screen.getByText('-2.00$')).toBeInTheDocument();
    });

    it('should call onRemoveLoyaltyDiscount when remove button is clicked', () => {
      const propsWithDiscount = {
        ...defaultProps,
        appliedDiscount: { points: 200, discount: 2.0 }
      };

      mockUseLoyalty.mockReturnValue({
        account: mockAccount,
        loading: false,
        calculatePointsValue: (points: number) => points * 0.01,
        calculateMaxRedeemablePoints: vi.fn()
      });

      render(<LoyaltyCheckout {...propsWithDiscount} />);
      
      const removeButton = screen.getByRole('button', { name: '' }); // X button
      fireEvent.click(removeButton);
      
      expect(defaultProps.onRemoveLoyaltyDiscount).toHaveBeenCalled();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      mockUseLoyalty.mockReturnValue({
        account: mockAccount,
        loading: false,
        calculatePointsValue: (points: number) => points * 0.01,
        calculateMaxRedeemablePoints: vi.fn()
      });

      const { container } = render(<LoyaltyCheckout {...defaultProps} className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
