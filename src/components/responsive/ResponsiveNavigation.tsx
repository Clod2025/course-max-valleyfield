import React, { ReactNode, useState } from 'react';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { ResponsiveContainer } from './ResponsiveContainer';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: string | number;
}

interface ResponsiveNavigationProps {
  items: NavigationItem[];
  logo?: ReactNode;
  className?: string;
  onItemClick?: (item: NavigationItem) => void;
}

/**
 * Navigation responsive qui s'adapte automatiquement au type d'appareil
 */
export const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({
  items,
  logo,
  className,
  onItemClick
}) => {
  const { navigationType, isCompact } = useResponsiveLayout();
  const { isMobile, isTablet } = useDeviceDetection();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const handleItemClick = (item: NavigationItem) => {
    onItemClick?.(item);
    item.onClick?.();
    setIsDrawerOpen(false);
  };
  
  // Navigation mobile (bottom tabs)
  if (navigationType === 'bottom' && isMobile) {
    return (
      <ResponsiveContainer className={cn('fixed bottom-0 left-0 right-0 z-50 bg-background border-t', className)}>
        <nav className="flex justify-around items-center py-2">
          {items.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              className="flex flex-col items-center gap-1 h-auto py-2"
              onClick={() => handleItemClick(item)}
            >
              {item.icon}
              <span className="text-xs">{item.label}</span>
              {item.badge && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Button>
          ))}
        </nav>
      </ResponsiveContainer>
    );
  }
  
  // Navigation drawer (mobile/tablet)
  if (navigationType === 'drawer' && (isMobile || isTablet)) {
    return (
      <ResponsiveContainer className={cn('sticky top-0 z-40 bg-background border-b', className)}>
        <div className="flex items-center justify-between p-4">
          {logo}
          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <nav className="flex flex-col gap-2 mt-8">
                {items.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className="justify-start gap-3"
                    onClick={() => handleItemClick(item)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full px-2 py-1">
                        {item.badge}
                      </span>
                    )}
                  </Button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </ResponsiveContainer>
    );
  }
  
  // Navigation sidebar (desktop/tablet landscape)
  if (navigationType === 'sidebar') {
    return (
      <ResponsiveContainer className={cn('w-64 bg-background border-r', className)}>
        <div className="p-4">
          {logo}
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {items.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className="justify-start gap-3"
              onClick={() => handleItemClick(item)}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-primary text-primary-foreground text-xs rounded-full px-2 py-1">
                  {item.badge}
                </span>
              )}
            </Button>
          ))}
        </nav>
      </ResponsiveContainer>
    );
  }
  
  // Navigation top (desktop/tablet)
  return (
    <ResponsiveContainer className={cn('sticky top-0 z-40 bg-background border-b', className)}>
      <div className="flex items-center justify-between p-4">
        {logo}
        <nav className="flex items-center gap-2">
          {items.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              size={isCompact ? 'sm' : 'default'}
              onClick={() => handleItemClick(item)}
            >
              {item.icon}
              <span className={isCompact ? 'hidden sm:inline' : ''}>{item.label}</span>
              {item.badge && (
                <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full px-2 py-1">
                  {item.badge}
                </span>
              )}
            </Button>
          ))}
        </nav>
      </div>
    </ResponsiveContainer>
  );
};