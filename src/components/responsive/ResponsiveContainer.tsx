import React, { ReactNode } from 'react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { generateResponsiveClasses } from '@/utils/deviceUtils';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  mobileClassName?: string;
  tabletClassName?: string;
  desktopClassName?: string;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Conteneur responsive qui s'adapte automatiquement au type d'appareil
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  mobileClassName,
  tabletClassName,
  desktopClassName,
  as: Component = 'div'
}) => {
  const { device } = useDeviceDetection();
  const { layout } = useResponsiveLayout();
  
  // Générer les classes CSS responsives
  const responsiveClasses = generateResponsiveClasses(device);
  
  // Classes conditionnelles par appareil
  const deviceClasses = {
    mobile: mobileClassName,
    tablet: tabletClassName,
    desktop: desktopClassName
  };
  
  const currentDeviceClass = deviceClasses[device.type];
  
  return (
    <Component
      className={cn(
        'responsive-container',
        responsiveClasses,
        layout.spacing === 'compact' && 'spacing-compact',
        layout.spacing === 'comfortable' && 'spacing-comfortable',
        layout.spacing === 'spacious' && 'spacing-spacious',
        className,
        currentDeviceClass
      )}
      data-device={device.type}
      data-orientation={device.orientation}
      data-layout={layout.layout}
      data-navigation={layout.navigation}
    >
      {children}
    </Component>
  );
};

