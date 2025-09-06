import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Store, 
  MapPin, 
  Phone, 
  Mail, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface Merchant {
  id: string;
  name: string;
  type: 'restaurant' | 'pharmacy' | 'grocery' | 'other';
  address: string;
  city: string;
  postal_code: string;
  phone: string;
  email: string;
  status: 'active' | 'pending' | 'suspended';
  created_at: string;
  total_orders: number;
  total_revenue: number;
}

const MerchantManagement = () => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    setLoading(true);
    try {
      // Simuler des données pour l'instant
      const mockMerchants: Merchant[] = [
        {
          id: '1',
          name: 'Restaurant Le Bistro',
          type: 'restaurant',
          address: '123 Rue Principale',
          city: 'Valleyfield',
          postal_code: 'J6T 1A1',
          phone: '(450) 555-0123',
          email: 'contact@lebistro.com',
          status: 'active',
          created_at: '2024-01-15',
          total_orders: 156,
          total_revenue: 4200
        },
        {
          id: '2',
          name: 'Pharmacie Centrale',
          type: 'pharmacy',
          address: '456 Boulevard des Érables',
          city: 'Valleyfield',
          postal_code: 'J6T 2B2',
          phone: '(450) 555-0456',
          email: 'info@pharmaciecentrale.com',
          status: 'active',
          created_at: '2024-01-10',
          total_orders: 89,
          total_revenue: 2100
        },
        {
          id: '3',
          name: 'Épicerie Martin',
          type: 'grocery',
          address: '789 Avenue du Parc',
          city: 'Valleyfield',
          postal_code: 'J6T 3C3',
          phone: '(450) 555-0789',
          email: 'martin@epicerie.com',
          status: 'pending',
          created_at: '2024-01-20',
          total_orders: 0,
          total_revenue: 0
        }
      ];
      setMerchants(mockMerchants);
    } catch (error) {
      console.error('Erreur lors du chargement des marchands:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Actif</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'suspended':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Suspendu</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const types = {
      restaurant: { label: 'Restaurant', color: 'bg-orange-500' },
      pharmacy: { label: 'Pharmacie', color: 'bg-blue-500' },
      grocery: { label: 'Épicerie', color: 'bg-green-500' },
      other: { label: 'Autre', color: 'bg-gray-500' }
    };
    const typeInfo = types[type as keyof typeof types] || types.other;
    return <Badge className={typeInfo.color}>{typeInfo.label}</Badge>;
  };

  const filteredMerchants = merchants.filter(merchant => {
    const matchesSearch = merchant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         merchant.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || merchant.type === filterType;
    const matchesStatus = filterStatus === 'all' || merchant.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Gestion des Marchands</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des marchands...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Marchands</h2>
          <p className="text-muted-foreground">Gérez tous les marchands de la plateforme</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Marchand
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <Input
                placeholder="Rechercher un marchand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">Tous les types</option>
              <option value="restaurant">Restaurants</option>
              <option value="pharmacy">Pharmacies</option>
              <option value="grocery">Épiceries</option>
              <option value="other">Autres</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="pending">En attente</option>
              <option value="suspended">Suspendus</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des marchands */}
      <div className="grid gap-4">
        {filteredMerchants.map((merchant) => (
          <Card key={merchant.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Store className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{merchant.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{merchant.address}, {merchant.city} {merchant.postal_code}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{merchant.phone}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span>{merchant.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeBadge(merchant.type)}
                      {getStatusBadge(merchant.status)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>{merchant.total_orders} commandes</p>
                      <p>${merchant.total_revenue} de revenus</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMerchants.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Store className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun marchand trouvé</h3>
            <p className="text-muted-foreground">
              Aucun marchand ne correspond à vos critères de recherche.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MerchantManagement;