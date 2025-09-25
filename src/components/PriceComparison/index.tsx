import React from 'react';
import { PriceComparison } from './PriceComparison';
import { PriceComparisonMobile } from './PriceComparisonMobile';
import { useMobile } from '@/hooks/use-mobile';

interface PriceComparisonWrapperProps {
  className?: string;
  onMerchantSelect?: (merchantId: string) => void;
  onProductView?: (merchantId: string) => void;
}

export const PriceComparisonWrapper: React.FC<PriceComparisonWrapperProps> = (props) => {
  const isMobile = useMobile();

  if (isMobile) {
    return <PriceComparisonMobile {...props} />;
  }

  return <PriceComparison {...props} />;
};

// Export individual components for direct use
export { PriceComparison } from './PriceComparison';
export { PriceComparisonMobile } from './PriceComparisonMobile';
export { SearchBar } from './SearchBar';
export { MerchantsList } from './MerchantsList';
export { MerchantsListMobile } from './MerchantsListMobile';
export type { MerchantPrice } from './MerchantsList';
