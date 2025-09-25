import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  Gift, 
  TrendingUp, 
  TrendingDown,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useLoyalty, LoyaltyTransaction } from '@/hooks/useLoyalty';
import { cn } from '@/lib/utils';

interface LoyaltyHistoryProps {
  className?: string;
  limit?: number;
}

export const LoyaltyHistory: React.FC<LoyaltyHistoryProps> = ({
  className,
  limit = 10
}) => {
  const { account, loading, getTransactionHistory } = useLoyalty();
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadHistory = async (page: number = 0) => {
    setHistoryLoading(true);
    try {
      const data = await getTransactionHistory(limit, page * limit);
      setTransactions(data);
      setHasMore(data.length === limit);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(currentPage);
  }, [currentPage]);

  const getTransactionIcon = (type: LoyaltyTransaction['transaction_type']) => {
    switch (type) {
      case 'earned':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'redeemed':
        return <Gift className="w-4 h-4 text-blue-600" />;
      case 'expired':
        return <Clock className="w-4 h-4 text-red-600" />;
      case 'admin_adjustment':
        return <Star className="w-4 h-4 text-purple-600" />;
      default:
        return <Star className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionBadge = (type: LoyaltyTransaction['transaction_type']) => {
    switch (type) {
      case 'earned':
        return <Badge className="bg-green-600">Gagné</Badge>;
      case 'redeemed':
        return <Badge className="bg-blue-600">Utilisé</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expiré</Badge>;
      case 'admin_adjustment':
        return <Badge className="bg-purple-600">Ajustement</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-600" />
            Historique des Points
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadHistory(currentPage)}
            disabled={historyLoading}
          >
            <RefreshCw className={cn("w-4 h-4", historyLoading && "animate-spin")} />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucune transaction</h3>
            <p className="text-muted-foreground">
              Vos transactions de points de fidélité apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getTransactionIcon(transaction.transaction_type)}
                  <div>
                    <p className="font-medium">
                      {transaction.points > 0 ? '+' : ''}{transaction.points} points
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.description || 'Transaction de points'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(transaction.created_at)}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  {getTransactionBadge(transaction.transaction_type)}
                  <p className="text-sm font-medium mt-1">
                    Solde: {transaction.points_balance}
                  </p>
                </div>
              </div>
            ))}

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0 || historyLoading}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Précédent
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Page {currentPage + 1}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!hasMore || historyLoading}
              >
                Suivant
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LoyaltyHistory;
