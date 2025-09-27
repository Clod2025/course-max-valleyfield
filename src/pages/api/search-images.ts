import { NextApiRequest, NextApiResponse } from 'next';

interface ImageResult {
  id: string;
  url: string;
  thumbnail: string;
  alt: string;
  source: string;
}

interface SearchImagesResponse {
  success: boolean;
  images: ImageResult[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SearchImagesResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      images: [],
      error: 'Method not allowed'
    });
  }

  const { productName } = req.body;

  if (!productName || typeof productName !== 'string') {
    return res.status(400).json({
      success: false,
      images: [],
      error: 'Product name is required'
    });
  }

  try {
    // Utiliser Pexels API (gratuite avec 200 requêtes/heure)
    const searchTerm = encodeURIComponent(productName.toLowerCase());
    const pexelsApiKey = process.env.PEXELS_API_KEY || 'YOUR_PEXELS_API_KEY';
    
    // Essayer Pexels d'abord
    const pexelsResponse = await fetch(
      `https://api.pexels.com/v1/search?query=${searchTerm}&per_page=12&page=1`,
      {
        headers: {
          'Authorization': pexelsApiKey
        }
      }
    );

    let images: ImageResult[] = [];

    if (pexelsResponse.ok) {
      const pexelsData = await pexelsResponse.json();
      images = pexelsData.photos?.map((photo: any) => ({
        id: `pexels-${photo.id}`,
        url: photo.src.large,
        thumbnail: photo.src.medium,
        alt: photo.alt || productName,
        source: 'Pexels'
      })) || [];
    }

    // Si Pexels ne retourne pas assez d'images, utiliser Unsplash
    if (images.length < 6) {
      const unsplashApiKey = process.env.UNSPLASH_ACCESS_KEY || 'YOUR_UNSPLASH_ACCESS_KEY';
      const unsplashResponse = await fetch(
        `https://api.unsplash.com/search/photos?query=${searchTerm}&per_page=${12 - images.length}&client_id=${unsplashApiKey}`
      );

      if (unsplashResponse.ok) {
        const unsplashData = await unsplashResponse.json();
        const unsplashImages = unsplashData.results?.map((photo: any) => ({
          id: `unsplash-${photo.id}`,
          url: photo.urls.regular,
          thumbnail: photo.urls.small,
          alt: photo.alt_description || productName,
          source: 'Unsplash'
        })) || [];
        
        images = [...images, ...unsplashImages];
      }
    }

    // Si aucune API ne fonctionne, générer des images placeholder
    if (images.length === 0) {
      images = Array.from({ length: 6 }, (_, index) => ({
        id: `placeholder-${index}`,
        url: `https://via.placeholder.com/400x300/4f46e5/white?text=${encodeURIComponent(productName)}`,
        thumbnail: `https://via.placeholder.com/200x150/4f46e5/white?text=${encodeURIComponent(productName)}`,
        alt: productName,
        source: 'Placeholder'
      }));
    }

    return res.status(200).json({
      success: true,
      images: images.slice(0, 12) // Limiter à 12 images max
    });

  } catch (error) {
    console.error('Error searching images:', error);
    
    // Fallback: images placeholder
    const fallbackImages = Array.from({ length: 6 }, (_, index) => ({
      id: `fallback-${index}`,
      url: `https://via.placeholder.com/400x300/4f46e5/white?text=${encodeURIComponent(productName)}`,
      thumbnail: `https://via.placeholder.com/200x150/4f46e5/white?text=${encodeURIComponent(productName)}`,
      alt: productName,
      source: 'Fallback'
    }));

    return res.status(200).json({
      success: true,
      images: fallbackImages
    });
  }
}
