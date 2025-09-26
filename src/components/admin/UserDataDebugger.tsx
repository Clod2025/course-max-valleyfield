import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  Users, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  RefreshCw,
  Eye,
  User,
  Mail,
  Calendar,
  Shield
} from 'lucide-react';

export const UserDataDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const runDebug = async () => {
    setLoading(true);
    try {
      console.log('🔍 Running comprehensive user data debug...');
      
      // 1. Vérifier la connexion Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('🔐 Auth user:', user);
      
      // 2. Vérifier la structure de la table profiles
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'profiles')
        .eq('table_schema', 'public');
      
      console.log('🏗️ Profiles table structure:', columns);
      
      // 3. Compter tous les utilisateurs
      const { count: totalCount, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      console.log('👥 Total users count:', totalCount);
      
      // 4. Récupérer TOUS les utilisateurs
      const { data: allUsers, error: allUsersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('👤 All users:', allUsers);
      
      // 5. Vérifier les rôles uniques
      const { data: roles, error: rolesError } = await supabase
        .from('profiles')
        .select('role')
        .not('role', 'is', null);
      
      const uniqueRoles = [...new Set(roles?.map(r => r.role) || [])];
      console.log('🎭 Unique roles found:', uniqueRoles);
      
      // 6. Vérifier les utilisateurs par rôle
      const usersByRole: Record<string, any[]> = {};
      for (const role of uniqueRoles) {
        const { data: roleUsers, error: roleError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', role);
        
        usersByRole[role] = roleUsers || [];
        console.log(`👥 Users with role '${role}':`, roleUsers);
      }
      
      // 7. Vérifier les permissions RLS
      const { data: rlsPolicies, error: rlsError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'profiles');
      
      console.log('🔒 RLS Policies:', rlsPolicies);
      
      // 8. Test de requête simple
      const { data: simpleTest, error: simpleError } = await supabase
        .from('profiles')
        .select('id, email, role, created_at')
        .limit(5);
      
      console.log('🧪 Simple test query:', simpleTest);
      
      setDebugInfo({
        authUser: user,
        authError,
        columns: columns || [],
        columnsError,
        totalUsers: totalCount,
        countError,
        allUsers: allUsers || [],
        allUsersError,
        uniqueRoles,
        rolesError,
        usersByRole,
        rlsPolicies,
        rlsError,
        simpleTest,
        simpleError
      });
      
      toast({
        title: "Debug terminé",
        description: "Diagnostic complet des données utilisateurs effectué",
      });
      
    } catch (error: any) {
      console.error('❌ Debug error:', error);
      toast({
        title: "Erreur de debug",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Debug - Données Utilisateurs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDebug} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exécution du debug...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              Lancer le diagnostic complet
            </>
          )}
        </Button>

        {debugInfo && (
          <div className="space-y-4">
            {/* Connexion Auth */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                {debugInfo.authError ? (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                Connexion Supabase Auth
              </h4>
              <p className="text-sm text-muted-foreground">
                {debugInfo.authError ? 
                  `Erreur: ${debugInfo.authError.message}` : 
                  `Connecté: ${debugInfo.authUser?.email || 'Aucun utilisateur connecté'}`
                }
              </p>
            </div>

            {/* Structure de la table */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                {debugInfo.columnsError ? (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                Structure table profiles ({debugInfo.columns.length} colonnes)
              </h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {debugInfo.columns.map((col: any) => (
                  <div key={col.column_name} className="p-2 bg-muted rounded">
                    <strong>{col.column_name}</strong>
                    <br />
                    <span className="text-muted-foreground">{col.data_type}</span>
                    {col.is_nullable === 'YES' && <span className="text-orange-500"> (nullable)</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Nombre total d'utilisateurs */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                {debugInfo.countError ? (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                Nombre total d'utilisateurs
              </h4>
              <p className="text-2xl font-bold">
                {debugInfo.countError ? 
                  `Erreur: ${debugInfo.countError.message}` : 
                  `${debugInfo.totalUsers || 0} utilisateurs`
                }
              </p>
            </div>

            {/* Rôles uniques */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Rôles uniques trouvés ({debugInfo.uniqueRoles.length})
              </h4>
              <div className="flex flex-wrap gap-1">
                {debugInfo.uniqueRoles.map((role: string) => (
                  <Badge key={role} variant="secondary">{role}</Badge>
                ))}
              </div>
            </div>

            {/* Utilisateurs par rôle */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Utilisateurs par rôle
              </h4>
              <div className="space-y-3">
                {Object.entries(debugInfo.usersByRole).map(([role, users]) => (
                  <div key={role} className="p-3 bg-muted rounded">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{role}</Badge>
                      <span className="text-sm text-muted-foreground">{users.length} utilisateur(s)</span>
                    </div>
                    {users.length > 0 ? (
                      <div className="space-y-1">
                        {users.slice(0, 3).map((user: any) => (
                          <div key={user.id} className="text-xs p-2 bg-background rounded">
                            <strong>{user.first_name} {user.last_name}</strong> ({user.email})
                            <br />
                            <span className="text-muted-foreground">
                              Actif: {user.is_active ? 'Oui' : 'Non'} | 
                              Créé: {new Date(user.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                        {users.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            ... et {users.length - 3} autre(s) utilisateur(s)
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Aucun utilisateur avec ce rôle</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Test de requête simple */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                {debugInfo.simpleError ? (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                Test de requête simple
              </h4>
              {debugInfo.simpleError ? (
                <p className="text-sm text-red-600">
                  Erreur: {debugInfo.simpleError.message}
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Résultat:</strong> {debugInfo.simpleTest?.length || 0} utilisateur(s) récupéré(s)
                  </p>
                  {debugInfo.simpleTest?.map((user: any) => (
                    <div key={user.id} className="text-xs p-2 bg-muted rounded">
                      <strong>{user.email}</strong> - Rôle: {user.role}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Politiques RLS */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-500" />
                Politiques RLS
              </h4>
              {debugInfo.rlsError ? (
                <p className="text-sm text-red-600">
                  Erreur: {debugInfo.rlsError.message}
                </p>
              ) : (
                <p className="text-sm">
                  {debugInfo.rlsPolicies?.length || 0} politiques trouvées
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
