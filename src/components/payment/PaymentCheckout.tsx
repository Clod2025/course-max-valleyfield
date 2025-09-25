import React, { useState } from 'react';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { CardPayment } from './CardPayment';
import { InteracPayment } from './InteracPayment';
import { ProofUpload } from './ProofUpload';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface PaymentCheckoutProps {
  orderData: {
    items: any[];
    subtotal: number;
    deliveryFee: number;
    total: number;
    merchantId: string;
    merchantName: string;
  };
  onPaymentSuccess: (result: any) => void;
  onPaymentError: (error: string) => void;
  className?: string;
}

type PaymentStep = 'method-selection' | 'card-payment' | 'interac-payment' | 'proof-upload';

export const PaymentCheckout: React.FC<PaymentCheckoutProps> = ({
  orderData,
  onPaymentSuccess,
  onPaymentError,
  className
}) => {
  const [currentStep, setCurrentStep] = useState<PaymentStep>('method-selection');
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [merchantInteracInfo, setMerchantInteracInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Charger les informations Interac du marchand
  React.useEffect(() => {
    const loadMerchantInteracInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('merchants')
          .select('interac_email, interac_phone, interac_enabled, name')
          .eq('id', orderData.merchantId)
          .single();

        if (error) throw error;

        setMerchantInteracInfo({
          email: data.interac_email,
          phone: data.interac_phone,
          businessName: data.name,
          enabled: data.interac_enabled
        });
      } catch (error) {
        console.error('Erreur lors du chargement des infos Interac:', error);
      }
    };

    loadMerchantInteracInfo();
  }, [orderData.merchantId]);

  const handleMethodSelect = (method: any) => {
    setSelectedMethod(method);
    
    if (method.id === 'card') {
      setCurrentStep('card-payment');
    } else if (method.id === 'interac') {
      setCurrentStep('interac-payment');
    }
  };

  const handleCardPaymentSuccess = async (paymentData: any) => {
    try {
      setIsLoading(true);
      
      // Créer la commande
      const orderResult = await createOrder({
        ...orderData,
        paymentMethod: 'card',
        paymentData,
        status: 'confirmed'
      });
      
      onPaymentSuccess({
        order: orderResult,
        payment: paymentData,
        method: 'card'
      });
      
      toast({
        title: "Paiement réussi",
        description: "Votre commande a été confirmée",
      });
    } catch (error) {
      onPaymentError(error instanceof Error ? error.message : 'Erreur de paiement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInteracProofUploaded = async (proofData: any) => {
    try {
      setIsLoading(true);
      
      // Créer la commande avec statut en attente
      const orderResult = await createOrder({
        ...orderData,
        paymentMethod: 'interac',
        proofData,
        status: 'pending_interac_verification'
      });
      
      onPaymentSuccess({
        order: orderResult,
        proof: proofData,
        method: 'interac'
      });
      
      toast({
        title: "Preuve envoyée",
        description: "Votre preuve de paiement a été transmise au marchand",
      });
    } catch (error) {
      onPaymentError(error instanceof Error ? error.message : 'Erreur d\'envoi');
    } finally {
      setIsLoading(false);
    }
  };

  const createOrder = async (orderData: any) => {
    if (!user) throw new Error('Utilisateur non connecté');

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        store_id: orderData.merchantId,
        items: JSON.stringify(orderData.items),
        subtotal: orderData.subtotal,
        delivery_fee: orderData.deliveryFee,
        total_amount: orderData.total,
        status: orderData.status,
        payment_method: orderData.paymentMethod,
        payment_data: orderData.paymentData || orderData.proofData,
        order_number: `CM${Date.now()}`
      })
      .select()
      .single();

    if (error) throw error;
    return order;
  };

  const handleBack = () => {
    if (currentStep === 'card-payment' || currentStep === 'interac-payment') {
      setCurrentStep('method-selection');
    } else if (currentStep === 'proof-upload') {
      setCurrentStep('interac-payment');
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'method-selection':
        return (
          <PaymentMethodSelector
            amount={orderData.total}
            merchantInfo={{
              id: orderData.merchantId,
              name: orderData.merchantName,
              hasInterac: merchantInteracInfo?.enabled || false,
              interacEmail: merchantInteracInfo?.email,
              interacPhone: merchantInteracInfo?.phone
            }}
            onMethodSelect={handleMethodSelect}
            selectedMethod={selectedMethod}
          />
        );

      case 'card-payment':
        return (
          <CardPayment
            amount={orderData.total}
            merchantInfo={{
              id: orderData.merchantId,
              name: orderData.merchantName
            }}
            onPaymentSuccess={handleCardPaymentSuccess}
            onPaymentError={onPaymentError}
            onBack={handleBack}
          />
        );

      case 'interac-payment':
        return (
          <InteracPayment
            amount={orderData.total}
            orderId={`temp_${Date.now()}`}
            merchantInteracInfo={{
              email: merchantInteracInfo?.email || '',
              phone: merchantInteracInfo?.phone || '',
              businessName: merchantInteracInfo?.businessName || orderData.merchantName
            }}
            onProofUploaded={handleInteracProofUploaded}
            onBack={handleBack}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={className}>
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span>Traitement en cours...</span>
          </div>
        </div>
      )}
      
      {renderCurrentStep()}
    </div>
  );
};
