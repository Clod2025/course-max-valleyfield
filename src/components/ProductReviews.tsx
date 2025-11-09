import { useState } from 'react';
import { Star, ThumbsUp, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useProductReviews, useUserProductReview, useDeleteReview } from '@/hooks/useReviews';
import { useAuth } from '@/contexts/AuthContext';
import { ReviewForm } from './ReviewForm';
import LoadingSkeleton from './LoadingSkeleton';

interface ProductReviewsProps {
  productId: string;
  averageRating?: number;
  totalReviews?: number;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  averageRating = 0,
  totalReviews = 0,
}) => {
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating_high' | 'rating_low'>('newest');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);

  const { data: reviews, isLoading } = useProductReviews(productId, { sortBy, limit: 20 });
  const { data: userReview } = useUserProductReview(productId);
  const deleteReview = useDeleteReview();

  const handleDeleteReview = async (reviewId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) {
      await deleteReview.mutateAsync(reviewId);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton className="h-8 w-48" />
        {Array.from({ length: 3 }, (_, i) => (
          <Card key={i} className="p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <LoadingSkeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <LoadingSkeleton className="h-4 w-32" />
                  <LoadingSkeleton className="h-3 w-24" />
                </div>
              </div>
              <LoadingSkeleton className="h-4 w-full" />
              <LoadingSkeleton className="h-4 w-3/4" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête des avis */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <h3 className="text-2xl font-bold">Avis clients</h3>
            {totalReviews > 0 && (
              <Badge variant="secondary">
                {totalReviews} avis
              </Badge>
            )}
          </div>
          {averageRating > 0 && (
            <div className="flex items-center space-x-2">
              {renderStars(averageRating)}
              <span className="text-lg font-semibold">{averageRating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">sur 5</span>
            </div>
          )}
        </div>

        {user && !userReview && (
          <Dialog open={showReviewForm} onOpenChange={setShowReviewForm}>
            <DialogTrigger asChild>
              <Button>Laisser un avis</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Laisser un avis</DialogTitle>
                <DialogDescription>
                  Partagez votre expérience avec ce produit
                </DialogDescription>
              </DialogHeader>
              <ReviewForm
                productId={productId}
                onSuccess={() => setShowReviewForm(false)}
                onCancel={() => setShowReviewForm(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Avis existant de l'utilisateur */}
      {userReview && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline">Votre avis</Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setEditingReview(userReview)}>
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDeleteReview(userReview.id)}
                    className="text-destructive"
                  >
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                {renderStars(userReview.rating)}
                <span className="font-medium">{userReview.rating}/5</span>
              </div>
              {userReview.title && (
                <h4 className="font-semibold">{userReview.title}</h4>
              )}
              {userReview.body && (
                <p className="text-muted-foreground">{userReview.body}</p>
              )}
              <div className="text-xs text-muted-foreground">
                {new Date(userReview.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contrôles de tri */}
      {reviews && reviews.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {reviews.length} avis affichés
          </p>
          <Select value={sortBy} onValueChange={setSortBy as any}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Plus récents</SelectItem>
              <SelectItem value="oldest">Plus anciens</SelectItem>
              <SelectItem value="rating_high">Note: élevée à faible</SelectItem>
              <SelectItem value="rating_low">Note: faible à élevée</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Liste des avis */}
      <div className="space-y-4">
        {reviews?.map((review) => (
          <Card key={review.id}>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>
                        {review.profiles?.first_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {review.profiles?.first_name || 'Utilisateur anonyme'}
                      </p>
                      <div className="flex items-center space-x-2">
                        {renderStars(review.rating)}
                        <span className="text-sm text-muted-foreground">
                          {review.rating}/5
                        </span>
                        {review.is_verified && (
                          <Badge variant="secondary" className="text-xs">
                            Achat vérifié
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <time className="text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString('fr-FR')}
                  </time>
                </div>

                {review.title && (
                  <h4 className="font-semibold">{review.title}</h4>
                )}

                {review.body && (
                  <p className="text-muted-foreground">{review.body}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Message si aucun avis */}
      {reviews?.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="space-y-4">
              <div className="text-6xl">💭</div>
              <h3 className="text-xl font-semibold">Aucun avis pour l'instant</h3>
              <p className="text-muted-foreground">
                Soyez le premier à laisser un avis sur ce produit !
              </p>
              {user && (
                <Button onClick={() => setShowReviewForm(true)}>
                  Laisser le premier avis
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog pour modifier un avis */}
      <Dialog open={!!editingReview} onOpenChange={() => setEditingReview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier votre avis</DialogTitle>
            <DialogDescription>
              Modifiez votre avis précédent sur ce produit
            </DialogDescription>
          </DialogHeader>
          {editingReview && (
            <ReviewForm
              productId={productId}
              existingReview={editingReview}
              onSuccess={() => setEditingReview(null)}
              onCancel={() => setEditingReview(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
