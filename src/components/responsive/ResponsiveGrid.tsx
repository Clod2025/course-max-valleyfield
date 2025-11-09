import React, { ReactNode } from 'react';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { ResponsiveContainer } from './ResponsiveContainer';
import { cn } from '@/lib/utils';

interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  gap?: 'sm' | 'md' | 'lg';
  items?: ReactNode[];
  minItemWidth?: number;
}

/**
 * Grille responsive qui s'adapte automatiquement au nombre de colonnes
 */
export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className,
  gap = 'md',
  items,
  minItemWidth = 200
}) => {
  const { columns, layout } = useResponsiveLayout();
  
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}px, 1fr))`,
    gap: gap === 'sm' ? '0.5rem' : gap === 'md' ? '1rem' : '1.5rem'
  };
  
  // Adapter le style selon le layout
  if (layout.layout === 'stack') {
    gridStyle.gridTemplateColumns = '1fr';
  } else if (layout.layout === 'grid') {
    gridStyle.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  }
  
  return (
    <ResponsiveContainer className={cn('responsive-grid', className)}>
      <div style={gridStyle}>
        {items || children}
      </div>
    </ResponsiveContainer>
  );
};
