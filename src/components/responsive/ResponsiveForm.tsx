import React, { ReactNode } from 'react';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { ResponsiveContainer } from './ResponsiveContainer';
import { cn } from '@/lib/utils';
import './ResponsiveForm.css';

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

  // CSS variables for dynamic values
  const formStyle: React.CSSProperties = {
    '--rf-gap': finalSpacing === 'compact' ? '0.5rem' : 
                finalSpacing === 'comfortable' ? '1rem' : '1.5rem',
    '--rf-columns': finalColumns.toString()
  } as React.CSSProperties;

  return (
    <div className={cn('responsive-form', className)}>
      <form 
        onSubmit={onSubmit}
        style={formStyle}
        className={cn(
          'w-full responsive-form',
          finalLayout === 'stack' && 'responsive-form--stack',
          finalLayout === 'grid' && 'responsive-form--grid',
          finalSpacing === 'compact' && 'responsive-form--compact',
          finalSpacing === 'comfortable' && 'responsive-form--comfortable',
          finalSpacing === 'spacious' && 'responsive-form--spacious'
        )}
      >
        {children}
      </form>
    </div>
  );
};
