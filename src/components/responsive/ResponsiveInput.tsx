import React, { forwardRef } from 'react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ResponsiveInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Input responsive qui s'adapte automatiquement au type d'appareil
 */
export const ResponsiveInput = forwardRef<HTMLInputElement, ResponsiveInputProps>(({
  label,
  error,
  helperText,
  fullWidth = true,
  size,
  className,
  ...props
}, ref) => {
  const { isMobile, isTablet } = useDeviceDetection();

  // Taille adaptative
  const adaptiveSize = size || (isMobile ? 'lg' : isTablet ? 'md' : 'sm');

  // Type d'input adaptatif pour mobile
  const adaptiveType = props.type === 'email' && isMobile ? 'email' : props.type;
  const adaptiveInputMode = props.type === 'email' ? 'email' : 
                           props.type === 'tel' ? 'tel' : 
                           props.type === 'number' ? 'numeric' : 'text';

  return (
    <div className={cn('space-y-2', fullWidth && 'w-full')}>
      {label && (
        <Label 
          htmlFor={props.id}
          className={cn(
            'text-sm font-medium',
            isMobile && 'text-base',
            error && 'text-destructive'
          )}
        >
          {label}
        </Label>
      )}
      
      <Input
        ref={ref}
        {...props}
        type={adaptiveType}
        inputMode={adaptiveInputMode}
        size={adaptiveSize}
        className={cn(
          'transition-all duration-200',
          isMobile && 'h-12 text-base', // Plus grand sur mobile pour le tactile
          isTablet && 'h-10',
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
      />
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
});

ResponsiveInput.displayName = 'ResponsiveInput';
