import React, { useState, useEffect, useRef } from 'react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useTouchCapability } from '@/hooks/useTouchCapability';
import { useGestures } from '@/utils/gestureHandler';
import { ResponsiveContainer } from './ResponsiveContainer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ResponsiveCarouselProps {
  children: React.ReactNode[];
  className?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  itemsPerView?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
}

/**
 * Carousel responsive avec support des gestes tactiles
 */
export const ResponsiveCarousel: React.FC<ResponsiveCarouselProps> = ({
  children,
  className,
  autoPlay = false,
  autoPlayInterval = 3000,
  showDots = true,
  showArrows = true,
  itemsPerView = { mobile: 1, tablet: 2, desktop: 3 }
}) => {
  const { isMobile, isTablet, isDesktop } = useDeviceDetection();
  const { isTouchDevice } = useTouchCapability();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout>();

  // Déterminer le nombre d'éléments par vue
  const currentItemsPerView = isMobile ? itemsPerView.mobile : 
                             isTablet ? itemsPerView.tablet : 
                             itemsPerView.desktop;

  const totalSlides = Math.ceil(children.length / currentItemsPerView);

  // Gestion des gestes tactiles
  const { onSwipe } = useGestures(carouselRef, {
    swipeThreshold: 50,
    swipeVelocity: 0.3
  });

  // Gestion du swipe
  onSwipe((event) => {
    if (event.direction === 'left') {
      nextSlide();
    } else if (event.direction === 'right') {
      prevSlide();
    }
  });

  // Auto-play
  useEffect(() => {
    if (isAutoPlaying && totalSlides > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % totalSlides);
      }, autoPlayInterval);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, totalSlides, autoPlayInterval]);

  // Pause auto-play au hover/focus
  const handleMouseEnter = () => {
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    }
  };

  const handleMouseLeave = () => {
    if (autoPlay) {
      setIsAutoPlaying(true);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const getVisibleItems = () => {
    const startIndex = currentIndex * currentItemsPerView;
    const endIndex = startIndex + currentItemsPerView;
    return children.slice(startIndex, endIndex);
  };

  return (
    <ResponsiveContainer 
      className={cn('relative w-full', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        ref={carouselRef}
        className="relative overflow-hidden rounded-lg"
        style={{ touchAction: 'pan-y' }}
      >
        <div 
          className="flex transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            width: `${totalSlides * 100}%`
          }}
        >
          {Array.from({ length: totalSlides }, (_, slideIndex) => (
            <div
              key={slideIndex}
              className="flex-shrink-0 w-full"
              style={{ width: `${100 / totalSlides}%` }}
            >
              <div 
                className={cn(
                  'flex gap-4 p-4',
                  currentItemsPerView === 1 && 'justify-center',
                  currentItemsPerView === 2 && 'justify-between',
                  currentItemsPerView >= 3 && 'justify-around'
                )}
              >
                {children.slice(
                  slideIndex * currentItemsPerView,
                  (slideIndex + 1) * currentItemsPerView
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Flèches de navigation */}
        {showArrows && totalSlides > 1 && (
          <>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'absolute left-2 top-1/2 -translate-y-1/2 z-10',
                'bg-background/80 backdrop-blur-sm',
                isMobile && 'hidden' // Masquer sur mobile
              )}
              onClick={prevSlide}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'absolute right-2 top-1/2 -translate-y-1/2 z-10',
                'bg-background/80 backdrop-blur-sm',
                isMobile && 'hidden' // Masquer sur mobile
              )}
              onClick={nextSlide}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Indicateurs de pagination */}
        {showDots && totalSlides > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            {Array.from({ length: totalSlides }, (_, index) => (
              <button
                key={index}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-200',
                  index === currentIndex 
                    ? 'bg-primary scale-125' 
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                )}
                onClick={() => goToSlide(index)}
                aria-label={`Aller à la slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </ResponsiveContainer>
  );
};
```

