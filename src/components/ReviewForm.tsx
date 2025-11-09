import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCreateReview, useUpdateReview, type ReviewFormData } from '@/hooks/useReviews';

const reviewSchema = z.object({
  rating: z.number().min(1, 'Veuillez donner une note').max(5),
  title: z.string().optional(),
  body: z.string().optional(),
});

interface ReviewFormProps {
  productId: string;
  existingReview?: {
    id: string;
    rating: number;
    title?: string;
    body?: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  productId,
  existingReview,
  onSuccess,
  onCancel,
}) => {
  const [hoveredRating, setHoveredRating] = useState(0);
  
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();
  
  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: existingReview?.rating || 0,
      title: existingReview?.title || '',
      body: existingReview?.body || '',
    },
  });

  const watchedRating = form.watch('rating');

  const onSubmit = async (data: ReviewFormData) => {
    try {
      if (existingReview) {
        await updateReview.mutateAsync({
          reviewId: existingReview.id,
          reviewData: data,
        });
      } else {
        await createReview.mutateAsync({
          productId,
          reviewData: data,
        });
      }
      onSuccess?.();
    } catch (error) {
      // Error handled by hooks
    }
  };

  const isLoading = createReview.isPending || updateReview.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {existingReview ? 'Modifier votre avis' : 'Laisser un avis'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="focus:outline-none"
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => field.onChange(star)}
                        >
                          <Star
                            className={`w-8 h-8 transition-colors ${
                              (hoveredRating || watchedRating) >= star
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre (optionnel)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Résumez votre expérience..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commentaire (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Partagez votre expérience avec ce produit..."
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-2">
              <Button 
                type="submit" 
                disabled={isLoading || watchedRating === 0}
                className="flex-1"
              >
                {isLoading ? 'Envoi...' : existingReview ? 'Modifier' : 'Publier'}
              </Button>
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  className="flex-1"
                >
                  Annuler
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
