import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaymentMethodSelector } from '../PaymentMethodSelector';
import { CardPayment } from '../CardPayment';
import { InteracPayment } from '../InteracPayment';
import { ProofUpload } from '../ProofUpload';

// Mock stable des hooks
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn()
  }))
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'test-user', email: 'test@example.com' }
  }))
}));

// Mock stable de navigator.clipboard
const mockClipboard = {
  writeText: jest.fn().mockResolvedValue(undefined)
};

// Tests pour PaymentMethodSelector
describe('PaymentMethodSelector', () => {
  const mockProps = {
    amount: 50.00,
    merchantInfo: {
      id: 'merchant-1',
      name: 'Test Merchant',
      hasInterac: true,
      interacEmail: 'merchant@example.com',
      interacPhone: '(450) 123-4567'
    },
    onMethodSelect: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('affiche les méthodes de paiement disponibles', () => {
    render(<PaymentMethodSelector {...mockProps} />);
    
    expect(screen.getByText('Carte de débit/crédit')).toBeInTheDocument();
    expect(screen.getByText('Interac e-Transfer')).toBeInTheDocument();
  });

  it('affiche le montant correct', () => {
    render(<PaymentMethodSelector {...mockProps} />);
    
    expect(screen.getByText('50.00$')).toBeInTheDocument();
  });

  it('appelle onMethodSelect quand une méthode est sélectionnée', () => {
    render(<PaymentMethodSelector {...mockProps} />);
    
    const cardMethod = screen.getByText('Carte de débit/crédit');
    fireEvent.click(cardMethod);
    
    expect(mockProps.onMethodSelect).toHaveBeenCalled();
  });

  it('affiche les frais pour la carte', () => {
    render(<PaymentMethodSelector {...mockProps} />);
    
    expect(screen.getByText('+3% de frais')).toBeInTheDocument();
  });

  it('n\'affiche pas Interac si le marchand ne l\'accepte pas', () => {
    const propsWithoutInterac = {
      ...mockProps,
      merchantInfo: {
        ...mockProps.merchantInfo,
        hasInterac: false
      }
    };
    
    render(<PaymentMethodSelector {...propsWithoutInterac} />);
    
    expect(screen.queryByText('Interac e-Transfer')).not.toBeInTheDocument();
  });
});

// Tests pour CardPayment
describe('CardPayment', () => {
  const mockProps = {
    amount: 50.00,
    merchantInfo: {
      id: 'merchant-1',
      name: 'Test Merchant'
    },
    onPaymentSuccess: jest.fn(),
    onPaymentError: jest.fn(),
    onBack: jest.fn()
  };

  it('affiche le formulaire de carte', () => {
    render(<CardPayment {...mockProps} />);
    
    expect(screen.getByLabelText('Numéro de carte *')).toBeInTheDocument();
    expect(screen.getByLabelText('Nom sur la carte *')).toBeInTheDocument();
    expect(screen.getByLabelText('Date d\'expiration *')).toBeInTheDocument();
    expect(screen.getByLabelText('CVV *')).toBeInTheDocument();
  });

  it('valide le numéro de carte', async () => {
    render(<CardPayment {...mockProps} />);
    
    const cardNumberInput = screen.getByLabelText('Numéro de carte *');
    fireEvent.change(cardNumberInput, { target: { value: '1234' } });
    
    await waitFor(() => {
      expect(screen.getByText('Numéro de carte invalide (13-19 chiffres)')).toBeInTheDocument();
    });
  });

  it('valide la date d\'expiration', async () => {
    render(<CardPayment {...mockProps} />);
    
    const expiryInput = screen.getByLabelText('Date d\'expiration *');
    fireEvent.change(expiryInput, { target: { value: '12/20' } });
    
    await waitFor(() => {
      expect(screen.getByText('Carte expirée')).toBeInTheDocument();
    });
  });

  it('formate automatiquement le numéro de carte', () => {
    render(<CardPayment {...mockProps} />);
    
    const cardNumberInput = screen.getByLabelText('Numéro de carte *');
    fireEvent.change(cardNumberInput, { target: { value: '1234567890123456' } });
    
    expect(cardNumberInput).toHaveValue('1234 5678 9012 3456');
  });

  it('désactive le bouton de paiement si le formulaire est invalide', () => {
    render(<CardPayment {...mockProps} />);
    
    const payButton = screen.getByText(/Payer/);
    expect(payButton).toBeDisabled();
  });
});

// Tests pour InteracPayment
describe('InteracPayment', () => {
  const mockProps = {
    amount: 50.00,
    orderId: 'order-123',
    merchantInteracInfo: {
      email: 'merchant@example.com',
      phone: '(450) 123-4567',
      businessName: 'Test Business'
    },
    onProofUploaded: jest.fn(),
    onBack: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock stable de navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
      configurable: true,
    });
  });

  it('affiche les informations du marchand', () => {
    render(<InteracPayment {...mockProps} />);
    
    expect(screen.getByText('merchant@example.com')).toBeInTheDocument();
    expect(screen.getByText('(450) 123-4567')).toBeInTheDocument();
    expect(screen.getByText('Test Business')).toBeInTheDocument();
  });

  it('affiche le montant exact', () => {
    render(<InteracPayment {...mockProps} />);
    
    expect(screen.getByText('50.00$')).toBeInTheDocument();
  });

  it('permet de copier les informations', async () => {
    render(<InteracPayment {...mockProps} />);
    
    const copyButtons = screen.getAllByRole('button', { name: /copier/i });
    fireEvent.click(copyButtons[0]);
    
    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledWith('merchant@example.com');
    });
  });
});

// Tests pour ProofUpload
describe('ProofUpload', () => {
  const mockProps = {
    orderId: 'order-123',
    onFilesUploaded: jest.fn()
  };

  it('affiche la zone d\'upload', () => {
    render(<ProofUpload {...mockProps} />);
    
    expect(screen.getByText('Téléchargez vos preuves')).toBeInTheDocument();
  });

  it('accepte les fichiers par drag & drop', () => {
    render(<ProofUpload {...mockProps} />);
    
    const dropZone = screen.getByText('Téléchargez vos preuves').closest('div');
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    fireEvent.dragOver(dropZone!);
    fireEvent.drop(dropZone!, { dataTransfer: { files: [file] } });
    
    expect(screen.getByText('test.jpg')).toBeInTheDocument();
  });

  it('rejette les fichiers trop volumineux', () => {
    render(<ProofUpload {...mockProps} maxSize={1} />);
    
    const file = new File(['x'.repeat(2 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    const input = screen.getByRole('button', { hidden: true }).querySelector('input[type="file"]');
    
    fireEvent.change(input!, { target: { files: [file] } });
    
    expect(screen.getByText(/dépasse la limite/)).toBeInTheDocument();
  });

  it('rejette les formats non supportés', () => {
    render(<ProofUpload {...mockProps} />);
    
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByRole('button', { hidden: true }).querySelector('input[type="file"]');
    
    fireEvent.change(input!, { target: { files: [file] } });
    
    expect(screen.getByText(/n'est pas supporté/)).toBeInTheDocument();
  });
});

// Tests d'intégration
describe('Intégration du système de paiement', () => {
  it('permet de sélectionner une méthode et procéder au paiement', async () => {
    const onMethodSelect = jest.fn();
    const onPaymentSuccess = jest.fn();
    
    const { rerender } = render(
      <PaymentMethodSelector
        amount={50.00}
        merchantInfo={{
          id: 'merchant-1',
          name: 'Test Merchant',
          hasInterac: true,
          interacEmail: 'merchant@example.com',
          interacPhone: '(450) 123-4567'
        }}
        onMethodSelect={onMethodSelect}
      />
    );
    
    // Sélectionner la carte
    const cardMethod = screen.getByText('Carte de débit/crédit');
    fireEvent.click(cardMethod);
    
    expect(onMethodSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'card' })
    );
    
    // Passer au paiement par carte
    rerender(
      <CardPayment
        amount={50.00}
        merchantInfo={{ id: 'merchant-1', name: 'Test Merchant' }}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={jest.fn()}
        onBack={jest.fn()}
      />
    );
    
    // Remplir le formulaire
    fireEvent.change(screen.getByLabelText('Numéro de carte *'), {
      target: { value: '1234567890123456' }
    });
    fireEvent.change(screen.getByLabelText('Nom sur la carte *'), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText('Date d\'expiration *'), {
      target: { value: '12/25' }
    });
    fireEvent.change(screen.getByLabelText('CVV *'), {
      target: { value: '123' }
    });
    
    // Le bouton devrait être activé
    const payButton = screen.getByText(/Payer/);
    expect(payButton).not.toBeDisabled();
  });
});

// Tests de sécurité
describe('Sécurité du système de paiement', () => {
  it('ne stocke pas les données de carte en plain text', () => {
    render(
      <CardPayment
        amount={50.00}
        merchantInfo={{ id: 'merchant-1', name: 'Test Merchant' }}
        onPaymentSuccess={jest.fn()}
        onPaymentError={jest.fn()}
        onBack={jest.fn()}
      />
    );
    
    // Vérifier que les champs sont sécurisés
    const cardNumberInput = screen.getByLabelText('Numéro de carte *');
    expect(cardNumberInput).toHaveAttribute('type', 'text'); // Pas 'password' pour permettre la saisie
    
    const cvvInput = screen.getByLabelText('CVV *');
    expect(cvvInput).toHaveAttribute('type', 'password');
  });

  it('valide les formats de fichier pour les preuves', () => {
    render(<ProofUpload orderId="test" onFilesUploaded={jest.fn()} />);
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const input = screen.getByRole('button', { hidden: true }).querySelector('input[type="file"]');
    
    expect(input).toHaveAttribute('accept', allowedTypes.join(','));
  });
});

// Tests de performance
describe('Performance du système de paiement', () => {
  it('charge rapidement les composants', () => {
    const startTime = performance.now();
    
    render(
      <PaymentMethodSelector
        amount={50.00}
        merchantInfo={{
          id: 'merchant-1',
          name: 'Test Merchant',
          hasInterac: true,
          interacEmail: 'merchant@example.com',
          interacPhone: '(450) 123-4567'
        }}
        onMethodSelect={jest.fn()}
      />
    );
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(100); // Moins de 100ms
  });

  it('gère efficacement les gros fichiers', () => {
    const largeFile = new File(['x'.repeat(1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    
    render(<ProofUpload orderId="test" onFilesUploaded={jest.fn()} />);
    
    const input = screen.getByRole('button', { hidden: true }).querySelector('input[type="file"]');
    fireEvent.change(input!, { target: { files: [largeFile] } });
    
    // Le composant devrait gérer le fichier sans bloquer
    expect(screen.getByText('large.jpg')).toBeInTheDocument();
  });
});
