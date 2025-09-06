import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  User, 
  Users, 
  Store, 
  Truck, 
  Shield,
  Search,
  Filter,
  Star,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';

interface TestUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  role: 'client' | 'merchant' | 'driver' | 'admin';
  is_active: boolean;
  created_at: string;
  last_login: string;
  avatar_url?: string;
  // Données spécifiques par rôle
  client_data?: {
    total_orders: number;
    total_spent: number;
    favorite_stores: string[];
    loyalty_points: number;
  };
  merchant_data?: {
    store_id: string;
    store_name: string;
    total_orders: number;
    total_revenue: number;
    commission_rate: number;
  };
  driver_data?: {
    license_number: string;
    license_verified: boolean;
    insurance_verified: boolean;
    vehicle_type: string;
    total_deliveries: number;
    total_earnings: number;
    rating: number;
    is_available: boolean;
  };
  admin_data?: {
    permissions: string[];
    last_activity: string;
    actions_count: number;
  };
}

const TestUsers = () => {
  const [users, setUsers] = useState<TestUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<TestUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    loadTestUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, selectedRole, selectedStatus]);

  const loadTestUsers = () => {
    const testUsers: TestUser[] = [
      // CLIENTS
      {
        id: 'user-1',
        email: 'marie.tremblay@email.com',
        first_name: 'Marie',
        last_name: 'Tremblay',
        phone: '(450) 555-0101',
        address: '123 Rue des Érables',
        city: 'Valleyfield',
        postal_code: 'J6T 1A1',
        role: 'client',
        is_active: true,
        created_at: '2024-01-15',
        last_login: '2024-01-20',
        client_data: {
          total_orders: 23,
          total_spent: 456.78,
          favorite_stores: ['Restaurant Le Bistro', 'Épicerie Martin'],
          loyalty_points: 1250
        }
      },
      {
        id: 'user-2',
        email: 'jean.dupont@email.com',
        first_name: 'Jean',
        last_name: 'Dupont',
        phone: '(450) 555-0102',
        address: '456 Avenue du Parc',
        city: 'Valleyfield',
        postal_code: 'J6T 2B2',
        role: 'client',
        is_active: true,
        created_at: '2024-01-10',
        last_login: '2024-01-19',
        client_data: {
          total_orders: 15,
          total_spent: 289.45,
          favorite_stores: ['Pharmacie Centrale'],
          loyalty_points: 890
        }
      },
      {
        id: 'user-3',
        email: 'sophie.martin@email.com',
        first_name: 'Sophie',
        last_name: 'Martin',
        phone: '(450) 555-0103',
        address: '789 Boulevard Principal',
        city: 'Valleyfield',
        postal_code: 'J6T 3C3',
        role: 'client',
        is_active: false,
        created_at: '2024-01-05',
        last_login: '2024-01-12',
        client_data: {
          total_orders: 8,
          total_spent: 156.32,
          favorite_stores: ['Café Artisanal'],
          loyalty_points: 450
        }
      },
      // MARCHANDS
      {
        id: 'user-4',
        email: 'contact@lebistro.com',
        first_name: 'Antoine',
        last_name: 'Bouchard',
        phone: '(450) 555-0201',
        address: '123 Rue Principale',
        city: 'Valleyfield',
        postal_code: 'J6T 1A1',
        role: 'merchant',
        is_active: true,
        created_at: '2024-01-01',
        last_login: '2024-01-20',
        merchant_data: {
          store_id: 'store-1',
          store_name: 'Restaurant Le Bistro',
          total_orders: 156,
          total_revenue: 4200.50,
          commission_rate: 20
        }
      },
      {
        id: 'user-5',
        email: 'info@pharmaciecentrale.com',
        first_name: 'Dr. Louise',
        last_name: 'Gagnon',
        phone: '(450) 555-0202',
        address: '456 Boulevard des Érables',
        city: 'Valleyfield',
        postal_code: 'J6T 2B2',
        role: 'merchant',
        is_active: true,
        created_at: '2024-01-02',
        last_login: '2024-01-19',
        merchant_data: {
          store_id: 'store-2',
          store_name: 'Pharmacie Centrale',
          total_orders: 89,
          total_revenue: 2100.75,
          commission_rate: 20
        }
      },
      // LIVREURS
      {
        id: 'user-6',
        email: 'pierre.levesque@email.com',
        first_name: 'Pierre',
        last_name: 'Lévesque',
        phone: '(450) 555-0301',
        address: '321 Rue de la Paix',
        city: 'Valleyfield',
        postal_code: 'J6T 4D4',
        role: 'driver',
        is_active: true,
        created_at: '2024-01-08',
        last_login: '2024-01-20',
        driver_data: {
          license_number: 'D123456789',
          license_verified: true,
          insurance_verified: true,
          vehicle_type: 'Véhicule',
          total_deliveries: 156,
          total_earnings: 3120.00,
          rating: 4.8,
          is_available: true
        }
      },
      {
        id: 'user-7',
        email: 'marc.roy@email.com',
        first_name: 'Marc',
        last_name: 'Roy',
        phone: '(450) 555-0302',
        address: '654 Avenue des Pins',
        city: 'Valleyfield',
        postal_code: 'J6T 5E5',
        role: 'driver',
        is_active: true,
        created_at: '2024-01-12',
        last_login: '2024-01-19',
        driver_data: {
          license_number: 'D987654321',
          license_verified: true,
          insurance_verified: false,
          vehicle_type: 'Vélo',
          total_deliveries: 89,
          total_earnings: 1780.00,
          rating: 4.6,
          is_available: false
        }
      },
      {
        id: 'user-8',
        email: 'alex.turcotte@email.com',
        first_name: 'Alex',
        last_name: 'Turcotte',
        phone: '(450) 555-0303',
        address: '987 Rue des Lilas',
        city: 'Valleyfield',
        postal_code: 'J6T 6F6',
        role: 'driver',
        is_active: false,
        created_at: '2024-01-18',
        last_login: '2024-01-18',
        driver_data: {
          license_number: 'D456789123',
          license_verified: false,
          insurance_verified: false,
          vehicle_type: 'Véhicule',
          total_deliveries: 0,
          total_earnings: 0,
          rating: 0,
          is_available: false
        }
      },
      // ADMINISTRATEURS
      {
        id: 'user-9',
        email: 'admin@coursemax.com',
        first_name: 'Admin',
        last_name: 'CourseMax',
        phone: '(450) 555-0001',
        address: '1000 Rue de l\'Administration',
        city: 'Valleyfield',
        postal_code: 'J6T 0A0',
        role: 'admin',
        is_active: true,
        created_at: '2024-01-01',
        last_login: '2024-01-20',
        admin_data: {
          permissions: ['all'],
          last_activity: '2024-01-20',
          actions_count: 245
        }
      },
      {
        id: 'user-10',
        email: 'support@coursemax.com',
        first_name: 'Support',
        last_name: 'Technique',
        phone: '(450) 555-0002',
        address: '1000 Rue de l\'Administration',
        city: 'Valleyfield',
        postal_code: 'J6T 0A0',
        role: 'admin',
        is_active: true,
        created_at: '2024-01-03',
        last_login: '2024-01-19',
        admin_data: {
          permissions: ['users', 'orders', 'support'],
          last_activity: '2024-01-19',
          actions_count: 89
        }
      }
    ];

    setUsers(testUsers);
  };

  const filterUsers = () => {
    let filtered = users;

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par rôle
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    // Filtre par statut
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(user => 
        selectedStatus === 'active' ? user.is_active : !user.is_active
      );
    }

    setFilteredUsers(filtered);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'client': return <User className="w-4 h-4" />;
      case 'merchant': return <Store className="w-4 h-4" />;
      case 'driver': return <Truck className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      client: 'bg-blue-500',
      merchant: 'bg-green-500',
      driver: 'bg-orange-500',
      admin: 'bg-purple-500'
    };
    return (
      <Badge className={colors[role as keyof typeof colors]}>
        {getRoleIcon(role)}
        <span className="ml-1 capitalize">{role}</span>
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-500">
        <CheckCircle className="w-3 h-3 mr-1" />
        Actif
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        Inactif
      </Badge>
    );
  };

  const getRoleSpecificInfo = (user: TestUser) => {
    switch (user.role) {
      case 'client':
        return user.client_data ? (
          <div className="text-sm text-muted-foreground">
            <p>{user.client_data.total_orders} commandes • ${user.client_data.total_spent}</p>
            <p>{user.client_data.loyalty_points} points de fidélité</p>
          </div>
        ) : null;
      
      case 'merchant':
        return user.merchant_data ? (
          <div className="text-sm text-muted-foreground">
            <p>{user.merchant_data.store_name}</p>
            <p>{user.merchant_data.total_orders} commandes • ${user.merchant_data.total_revenue}</p>
          </div>
        ) : null;
      
      case 'driver':
        return user.driver_data ? (
          <div className="text-sm text-muted-foreground">
            <p>{user.driver_data.total_deliveries} livraisons • ${user.driver_data.total_earnings}</p>
            <div className="flex items-center gap-2">
              <span>Note: {user.driver_data.rating}/5</span>
              <Badge variant={user.driver_data.is_available ? 'default' : 'secondary'} className="text-xs">
                {user.driver_data.is_available ? 'Disponible' : 'Indisponible'}
              </Badge>
            </div>
          </div>
        ) : null;
      
      case 'admin':
        return user.admin_data ? (
          <div className="text-sm text-muted-foreground">
            <p>{user.admin_data.permissions.length} permissions</p>
            <p>{user.admin_data.actions_count} actions effectuées</p>
          </div>
        ) : null;
      
      default:
        return null;
    }
  };

  const getRoleStats = () => {
    const stats = {
      client: users.filter(u => u.role === 'client').length,
      merchant: users.filter(u => u.role === 'merchant').length,
      driver: users.filter(u => u.role === 'driver').length,
      admin: users.filter(u => u.role === 'admin').length,
      active: users.filter(u => u.is_active).length,
      inactive: users.filter(u => !u.is_active).length
    };
    return stats;
  };

  const stats = getRoleStats();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">�� Test des Utilisateurs - CourseMax</h1>
        
        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.client}</div>
              <div className="text-sm text-muted-foreground">Clients</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.merchant}</div>
              <div className="text-sm text-muted-foreground">Marchands</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.driver}</div>
              <div className="text-sm text-muted-foreground">Livreurs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.admin}</div>
              <div className="text-sm text-muted-foreground">Admins</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-muted-foreground">Actifs</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
              <div className="text-sm text-muted-foreground">Inactifs</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                <Input
                  placeholder="Rechercher un utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">Tous les rôles</option>
                <option value="client">Clients</option>
                <option value="merchant">Marchands</option>
                <option value="driver">Livreurs</option>
                <option value="admin">Administrateurs</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
              </select>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nouvel Utilisateur
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Liste des utilisateurs */}
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      {getRoleIcon(user.role)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {user.first_name} {user.last_name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Mail className="w-4 h-4" />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{user.address}, {user.city} {user.postal_code}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{user.phone}</span>
                      </div>
                      {getRoleSpecificInfo(user)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-2">
                        {getRoleBadge(user.role)}
                        {getStatusBadge(user.is_active)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Créé: {new Date(user.created_at).toLocaleDateString()}</p>
                        <p>Dernière connexion: {new Date(user.last_login).toLocaleDateString()}</p>
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

        {filteredUsers.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucun utilisateur trouvé</h3>
              <p className="text-muted-foreground">
                Aucun utilisateur ne correspond à vos critères de recherche.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TestUsers;
