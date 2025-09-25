import React, { ReactNode } from 'react';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { ResponsiveContainer } from './ResponsiveContainer';
import { cn } from '@/lib/utils';

interface ResponsiveFormProps {
  children: ReactNode;
  className?: string;
  onSubmit?: (e: React.FormEvent) => void;
  layout?: 'stack' | 'grid' | 'auto';
  columns?: number;
  spacing?: 'compact' | 'comfortable' | 'spacious';
}

/**
 * Formulaire responsive qui s'adapte automatiquement au type d'appareil
 */
export const ResponsiveForm: React.FC<ResponsiveFormProps> = ({
  children,
  className,
  onSubmit,
  layout = 'auto',
  columns,
  spacing
}) => {
  const { layout: responsiveLayout, columns: responsiveColumns, spacing: responsiveSpacing } = useResponsiveLayout();
  const { isMobile, isTablet } = useDeviceDetection();

  // Déterminer le layout final
  const finalLayout = layout === 'auto' ? responsiveLayout.layout : layout;
  const finalColumns = columns || responsiveColumns;
  const finalSpacing = spacing || responsiveSpacing;

  // Styles adaptatifs
  const formStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: finalLayout === 'stack' ? 'column' : 'row',
    flexWrap: finalLayout === 'stack' ? 'nowrap' : 'wrap',
    gap: finalSpacing === 'compact' ? '0.5rem' : 
         finalSpacing === 'comfortable' ? '1rem' : '1.5rem'
  };

  // Pour les grilles sur desktop/tablet
  if (finalLayout === 'grid' && !isMobile) {
    formStyle.display = 'grid';
    formStyle.gridTemplateColumns = `repeat(${finalColumns}, 1fr)`;
  }

  return (
    <ResponsiveContainer className={cn('responsive-form', className)}>
      <form 
        onSubmit={onSubmit}
        style={formStyle}
        className={cn(
          'w-full',
          finalLayout === 'stack' && 'space-y-4',
          finalLayout === 'grid' && 'grid gap-4',
          finalSpacing === 'compact' && 'space-y-2',
          finalSpacing === 'comfortable' && 'space-y-4',
          finalSpacing === 'spacious' && 'space-y-6'
        )}
      >
        {children}
      </form>
    </ResponsiveContainer>
  );
};
```

