import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Truck, 
  MapPin, 
  Phone, 
  Mail, 
  Edit, 
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  FileText,
  User
} from 'lucide-react';

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  status: 'active' | 'pending' | 'suspended' | 'offline';
  rating: number;
  total_deliveries: number;
  total_earnings: number;
  license_verified: boolean;
  insurance_verified: boolean;
  created_at: string;
}

const DriverManagement = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      // Simuler des données pour l'instant
      const mockDrivers: Driver[] = [
        {
          id: '1',
          first_name: 'Jean',
          last_name: 'Dupuis',
          email: 'jean.dupuis@email.com',
          phone: '(450) 555-0123',
          address: '123 Rue des Érables',
          city: 'Valleyfield',
          postal_code: 'J6T 1A1',
          status: 'active',
          rating: 4.8,
          total_deliveries: 156,
          total_earnings: 3120,
          license_verified: true,
          insurance_verified: true,
          created_at: '2024-01-15'
        },
        {
          id: '2',
          first_name: 'Marie',
          last_name: 'Tremblay',
          email: 'marie.tremblay@email.com',
          phone: '(450) 555-0456',
          address: '456 Avenue du Parc',
          city: 'Valleyfield',
          postal_code: 'J6T 2B2',
          status: 'active',
          rating: 4.9,
          total_deliveries: 134,
          total_earnings: 2680,
          license_verified: true,
          insurance_verified: true,
          created_at: '2024-01-10'
        },
        {
          id: '3',
          first_name: 'Pierre',
          last_name: 'Gagnon',
          email: 'pierre.gagnon@email.com',
          phone: '(450) 555-0789',
          address: '789 Boulevard Principal',
          city: 'Valleyfield',
          postal_code: 'J6T 3C3',
          status: 'pending',
          rating: 0,
          total_deliveries: 0,
          total_earnings: 0,
          license_verified: false,
          insurance_verified: false,
          created_at: '2024-01-20'
        }
      ];
      setDrivers(mockDrivers);
    } catch (error) {
      console.error('Erreur lors du chargement des livreurs:', error);
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
      case 'offline':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Hors ligne</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getVerificationBadge = (verified: boolean) => {
    return verified ? (
      <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Vérifié</Badge>
    ) : (
      <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Non vérifié</Badge>
    );
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = `${driver.first_name} ${driver.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || driver.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Gestion des Livreurs</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des livreurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Livreurs</h2>
          <p className="text-muted-foreground">Gérez tous les livreurs de la plateforme</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Livreur
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <Input
                placeholder="Rechercher un livreur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="pending">En attente</option>
              <option value="suspended">Suspendus</option>
              <option value="offline">Hors ligne</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des livreurs */}
      <div className="grid gap-4">
        {filteredDrivers.map((driver) => (
          <Card key={driver.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{driver.first_name} {driver.last_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{driver.address}, {driver.city} {driver.postal_code}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{driver.phone}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span>{driver.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(driver.status)}
                      {driver.rating > 0 && (
                        <Badge variant="outline">
                          <Star className="w-3 h-3 mr-1" />
                          {driver.rating}/5
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      <p>{driver.total_deliveries} livraisons</p>
                      <p>${driver.total_earnings} de gains</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs">
                        <p>Permis: {getVerificationBadge(driver.license_verified)}</p>
                        <p>Assurance: {getVerificationBadge(driver.insurance_verified)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4" />
                    </Button>
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

      {filteredDrivers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Truck className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun livreur trouvé</h3>
            <p className="text-muted-foreground">
              Aucun livreur ne correspond à vos critères de recherche.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DriverManagement;