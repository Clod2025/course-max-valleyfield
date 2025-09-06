import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ImageOptimProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

// Fonction utilitaire pour compresser les images avant upload
export async function compressImage(
  file: File, 
  options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
): Promise<File> {
  const { maxWidth = 1920, maxHeight = 1080, quality = 0.8 } = options;

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      // Calculer les nouvelles dimensions en respectant le ratio
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Dessiner l'image redimensionnée
      ctx.drawImage(img, 0, 0, width, height);

      // Convertir en WebP si supporté, sinon JPEG
      const format = canvas.toDataURL('image/webp').startsWith('data:image/webp') 
        ? 'image/webp' : 'image/jpeg';

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, 
              format === 'image/webp' ? '.webp' : '.jpg'), {
              type: format,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file); // Fallback si compression échoue
          }
        },
        format,
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
}

// Fonction pour uploader une image vers Supabase Storage
export async function uploadImageToSupabase(
  file: File,
  bucket: string = 'images',
  folder: string = 'products'
): Promise<string | null> {
  try {
    // Compresser l'image avant upload
    const compressedFile = await compressImage(file, {
      maxWidth: 1200,
      maxHeight: 800,
      quality: 0.85
    });

    // Générer un nom unique
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const extension = compressedFile.name.split('.').pop();
    const fileName = `${folder}/${timestamp}_${randomString}.${extension}`;

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, compressedFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Erreur upload image:', error);
      return null;
    }

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Erreur lors de l\'upload d\'image:', error);
    return null;
  }
}

// Composant ImageOptim principal
export const ImageOptim: React.FC<ImageOptimProps> = ({
  src,
  alt,
  className,
  fallbackSrc = '/placeholder.svg',
  width,
  height,
  priority = false,
  onLoad,
  onError,
  placeholder = 'blur',
  blurDataURL,
}) => {
  const [imageSrc, setImageSrc] = useState<string>(src || fallbackSrc);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  // Intersection Observer pour lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [priority, isInView]);

  // Gestion du changement de src
  useEffect(() => {
    if (src && src !== imageSrc) {
      setImageSrc(src);
      setIsLoading(true);
      setHasError(false);
    }
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    if (imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
    }
    onError?.();
  };

  // Générer un placeholder blur par défaut si pas fourni
  const defaultBlurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==';

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Placeholder blur */}
      {isLoading && placeholder === 'blur' && (
        <div 
          className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"
          style={{
            backgroundImage: `url("${blurDataURL || defaultBlurDataURL}")`,
            backgroundSize: 'cover',
            filter: 'blur(10px)',
            transform: 'scale(1.1)',
          }}
        />
      )}

      {/* Image principale */}
      <img
        ref={imgRef}
        src={isInView ? imageSrc : undefined}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          maxWidth: '100%',
          height: 'auto',
        }}
      />

      {/* Indicateur de chargement */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}
    </div>
  );
};

// Hook utilitaire pour gérer l'upload d'images
export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImage = async (
    file: File,
    options?: {
      bucket?: string;
      folder?: string;
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      onProgress?: (progress: number) => void;
    }
  ) => {
    setUploading(true);
    setProgress(0);

    try {
      options?.onProgress?.(25);
      setProgress(25);

      const url = await uploadImageToSupabase(
        file,
        options?.bucket,
        options?.folder
      );

      options?.onProgress?.(100);
      setProgress(100);

      return url;
    } catch (error) {
      console.error('Erreur upload:', error);
      throw error;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return {
    uploadImage,
    uploading,
    progress,
  };
};

export default ImageOptim;
