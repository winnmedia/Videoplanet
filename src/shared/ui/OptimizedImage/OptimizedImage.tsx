/**
 * Optimized Image Component
 * Handles lazy loading, responsive images, and fallbacks
 */

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './OptimizedImage.module.scss';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  fallbackSrc?: string;
  blur?: boolean;
  blurDataURL?: string;
  sizes?: string;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  fallbackSrc = '/images/placeholder.svg',
  blur = true,
  blurDataURL,
  sizes,
  quality = 75,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Image is in viewport, start loading
            setIsLoading(false);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setImageSrc(fallbackSrc);
    onError?.();
  };

  // Generate blur placeholder if not provided
  const placeholderDataURL = blurDataURL || generateBlurDataURL();

  return (
    <div
      ref={imgRef}
      className={`${styles.imageContainer} ${className || ''}`}
      style={{ width, height }}
    >
      {!priority && isLoading && (
        <div className={styles.skeleton} />
      )}
      
      <Image
        src={imageSrc}
        alt={alt}
        width={width || 0}
        height={height || 0}
        fill={!width || !height}
        priority={priority}
        className={styles.image}
        placeholder={blur ? 'blur' : 'empty'}
        blurDataURL={blur ? placeholderDataURL : undefined}
        sizes={sizes || generateSizes()}
        quality={quality}
        onLoad={handleLoad}
        onError={handleError}
      />
      
      {hasError && (
        <div className={styles.errorOverlay}>
          <span>이미지를 불러올 수 없습니다</span>
        </div>
      )}
    </div>
  );
}

// Generate sizes attribute for responsive images
function generateSizes(): string {
  return `
    (max-width: 640px) 100vw,
    (max-width: 768px) 50vw,
    (max-width: 1024px) 33vw,
    25vw
  `;
}

// Generate a simple blur placeholder
function generateBlurDataURL(): string {
  // Simple 1x1 pixel gray image
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEiIGhlaWdodD0iMSIgZmlsbD0iI2NjYyIvPjwvc3ZnPg==';
}

// Hook for preloading images
export function useImagePreloader(imageUrls: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadImage = (url: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.src = url;
        img.onload = () => {
          setLoadedImages((prev) => new Set(prev).add(url));
          resolve();
        };
        img.onerror = reject;
      });
    };

    const loadAllImages = async () => {
      setIsLoading(true);
      
      try {
        await Promise.all(imageUrls.map(loadImage));
      } catch (error) {
        console.error('Failed to preload images:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (imageUrls.length > 0) {
      loadAllImages();
    }
  }, [imageUrls]);

  return { loadedImages, isLoading };
}

// Avatar component with optimization
export function Avatar({
  src,
  alt,
  size = 40,
  className,
}: {
  src?: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  const defaultAvatar = '/images/default-avatar.svg';
  
  return (
    <OptimizedImage
      src={src || defaultAvatar}
      alt={alt}
      width={size}
      height={size}
      className={`${styles.avatar} ${className || ''}`}
      priority={false}
      quality={90}
    />
  );
}