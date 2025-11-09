import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClientSettings } from '../ClientSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Mock useAuth
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    profile: {
      id: 'test-user-id',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      address: '123 Rue Principale, Valleyfield'
    },
    updateProfile: vi.fn()
  })
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    }))
  }
}));

describe('ClientSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Interface structure', () => {
    it('should render all main tabs', () => {
      render(<ClientSettings />);
      
      expect(screen.getByText('Profil')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Adresses')).toBeInTheDocument();
      expect(screen.getByText('Paiement')).toBeInTheDocument();
    });

    it('should not render debug tab', () => {
      render(<ClientSettings />);
      
      expect(screen.queryByText('Debug')).not.toBeInTheDocument();
    });
  });

  describe('Address management', () => {
    it('should display current address', () => {
      render(<ClientSettings />);
      
      // Navigate to addresses tab
      fireEvent.click(screen.getByText('Adresses'));
      
      expect(screen.getByText('123 Rue Principale, Valleyfield')).toBeInTheDocument();
    });

    it('should show edit button for address', () => {
      render(<ClientSettings />);
      
      fireEvent.click(screen.getByText('Adresses'));
      
      expect(screen.getByText('Modifier l\'adresse')).toBeInTheDocument();
    });

    it('should enter edit mode when edit button is clicked', () => {
      render(<ClientSettings />);
      
      fireEvent.click(screen.getByText('Adresses'));
      fireEvent.click(screen.getByText('Modifier l\'adresse'));
      
      expect(screen.getByDisplayValue('123 Rue Principale, Valleyfield')).toBeInTheDocument();
      expect(screen.getByText('Enregistrer')).toBeInTheDocument();
      expect(screen.getByText('Annuler')).toBeInTheDocument();
    });

    it('should validate address length', async () => {
      render(<ClientSettings />);
      
      fireEvent.click(screen.getByText('Adresses'));
      fireEvent.click(screen.getByText('Modifier l\'adresse'));
      
      const addressInput = screen.getByDisplayValue('123 Rue Principale, Valleyfield');
      fireEvent.change(addressInput, { target: { value: '123' } });
      
      const saveButton = screen.getByText('Enregistrer');
      expect(saveButton).toBeDisabled();
    });

    it('should allow saving valid address', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({ data: null, error: null });
      (supabase.from as any).mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => mockUpdate())
        }))
      });

      render(<ClientSettings />);
      
      fireEvent.click(screen.getByText('Adresses'));
      fireEvent.click(screen.getByText('Modifier l\'adresse'));
      
      const addressInput = screen.getByDisplayValue('123 Rue Principale, Valleyfield');
      fireEvent.change(addressInput, { target: { value: '456 Nouvelle Adresse, Valleyfield' } });
      
      fireEvent.click(screen.getByText('Enregistrer'));
      
      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
      });
    });

    it('should cancel editing and revert changes', () => {
      render(<ClientSettings />);
      
      fireEvent.click(screen.getByText('Adresses'));
      fireEvent.click(screen.getByText('Modifier l\'adresse'));
      
      const addressInput = screen.getByDisplayValue('123 Rue Principale, Valleyfield');
      fireEvent.change(addressInput, { target: { value: '456 Nouvelle Adresse' } });
      
      fireEvent.click(screen.getByText('Annuler'));
      
      // Should revert to original address
      expect(screen.getByText('123 Rue Principale, Valleyfield')).toBeInTheDocument();
    });
  });

  describe('Additional addresses', () => {
    it('should show additional addresses section', () => {
      render(<ClientSettings />);
      
      fireEvent.click(screen.getByText('Adresses'));
      
      expect(screen.getByText('Adresses de livraison supplémentaires')).toBeInTheDocument();
      expect(screen.getByText('Ajouter')).toBeInTheDocument();
    });

    it('should display existing additional addresses', () => {
      render(<ClientSettings />);
      
      fireEvent.click(screen.getByText('Adresses'));
      
      expect(screen.getByText('Domicile')).toBeInTheDocument();
      expect(screen.getByText('Bureau')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should handle save errors gracefully', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({ data: null, error: new Error('Database error') });
      (supabase.from as any).mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn(() => mockUpdate())
        }))
      });

      render(<ClientSettings />);
      
      fireEvent.click(screen.getByText('Adresses'));
      fireEvent.click(screen.getByText('Modifier l\'adresse'));
      
      const addressInput = screen.getByDisplayValue('123 Rue Principale, Valleyfield');
      fireEvent.change(addressInput, { target: { value: '456 Nouvelle Adresse, Valleyfield' } });
      
      fireEvent.click(screen.getByText('Enregistrer'));
      
      await waitFor(() => {
        // Should show error toast
        expect(screen.getByText('Enregistrer')).toBeInTheDocument(); // Still in edit mode
      });
    });
  });
});
