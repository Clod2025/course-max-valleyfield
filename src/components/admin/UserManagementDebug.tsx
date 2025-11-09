import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { RefreshCw, Database, Users, AlertCircle, CheckCircle, User, Shield } from 'lucide-react';

const UserManagementDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();

  const runDebug = async () => {
    setLoading(true);
    try {
      console.log('🔍 Running debug checks...');
      
      // 1. Vérifier l'utilisateur connecté
      console.log('👤 Current user:', user);
      console.log('👤 Current profile:', profile);
      console.log('👤 Auth loading:', authLoading);
      
      // 2. Vérifier la connexion Supabase
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      console.log('🔐 Auth user:', authUser);
      
      // 3. Vérifier les tables disponibles
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      console.log('📊 Available tables:', tables);
      
      // 4. Vérifier la structure de la table profiles
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'profiles')
        .eq('table_schema', 'public');
      
      console.log('🏗️ Profiles table structure:', columns);
      
      // 5. Compter les utilisateurs
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      console.log('👥 Total users count:', count);
      
      // 6. Récupérer quelques utilisateurs
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .limit(5);
      
      console.log('👤 Sample users:', users);
      
      // 7. Vérifier les rôles uniques
      const { data: roles, error: rolesError } = await supabase
        .from('profiles')
        .select('role')
        .not('role', 'is', null);
      
      const uniqueRoles = [...new Set(roles?.map(r => r.role) || [])];
      console.log('🎭 Unique roles:', uniqueRoles);
      
      // 8. Vérifier spécifiquement l'utilisateur clodenerc@yahoo.fr
      const { data: clodenercUser, error: clodenercError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'clodenerc@yahoo.fr')
        .single();
      
      console.log('🔍 Clodenerc user:', clodenercUser);
      console.log('🔍 Clodenerc error:', clodenercError);
      
      // 9. Vérifier les permissions RLS
      const { data: rlsPolicies, error: rlsError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'profiles');
      
      console.log('🔒 RLS Policies:', rlsPolicies);
      
      setDebugInfo({
        currentUser: user,
        currentProfile: profile,
        authLoading,
        authUser,
        authError,
        tables: tables?.map(t => t.table_name) || [],
        tablesError,
        columns: columns || [],
        columnsError,
        totalUsers: count,
        countError,
        sampleUsers: users || [],
        usersError,
        uniqueRoles,
        rolesError,
        clodenercUser,
        clodenercError,
        rlsPolicies,
        rlsError
      });
      
      toast({
        title: "Debug terminé",
        description: "Informations de debug récupérées avec succès",
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
          Debug - Gestion des Utilisateurs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDebug} disabled={loading} className="w-full">
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Exécution du debug...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              Lancer le debug
            </>
          )}
        </Button>

        {debugInfo && (
          <div className="space-y-4">
            {/* Utilisateur actuel */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                {debugInfo.currentUser ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                Utilisateur actuel
              </h4>
              <div className="space-y-2 text-sm">
                <p><strong>User:</strong> {debugInfo.currentUser?.email || 'Non connecté'}</p>
                <p><strong>Profile:</strong> {debugInfo.currentProfile ? 'Chargé' : 'Non chargé'}</p>
                <p><strong>Rôle:</strong> {debugInfo.currentProfile?.role || 'Non défini'}</p>
                <p><strong>Auth Loading:</strong> {debugInfo.authLoading ? 'Oui' : 'Non'}</p>
              </div>
            </div>

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

            {/* Utilisateur clodenerc spécifique */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                {debugInfo.clodenercError ? (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                ) : debugInfo.clodenercUser ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                )}
                Utilisateur clodenerc@yahoo.fr
              </h4>
              {debugInfo.clodenercError ? (
                <p className="text-sm text-red-600">
                  Erreur: {debugInfo.clodenercError.message}
                </p>
              ) : debugInfo.clodenercUser ? (
                <div className="space-y-1 text-sm">
                  <p><strong>Email:</strong> {debugInfo.clodenercUser.email}</p>
                  <p><strong>Rôle:</strong> {debugInfo.clodenercUser.role}</p>
                  <p><strong>Actif:</strong> {debugInfo.clodenercUser.is_active ? 'Oui' : 'Non'}</p>
                  <p><strong>Créé:</strong> {new Date(debugInfo.clodenercUser.created_at).toLocaleDateString()}</p>
                </div>
              ) : (
                <p className="text-sm text-orange-600">Utilisateur non trouvé</p>
              )}
            </div>

            {/* Tables disponibles */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                {debugInfo.tablesError ? (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                Tables disponibles ({debugInfo.tables.length})
              </h4>
              <div className="flex flex-wrap gap-1">
                {debugInfo.tables.map((table: string) => (
                  <Badge key={table} variant="outline">{table}</Badge>
                ))}
              </div>
            </div>

            {/* Structure de la table profiles */}
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

            {/* Nombre d'utilisateurs */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                {debugInfo.countError ? (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                Nombre d'utilisateurs
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
                Rôles uniques ({debugInfo.uniqueRoles.length})
              </h4>
              <div className="flex flex-wrap gap-1">
                {debugInfo.uniqueRoles.map((role: string) => (
                  <Badge key={role} variant="secondary">{role}</Badge>
                ))}
              </div>
            </div>

            {/* Utilisateurs d'exemple */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Utilisateurs d'exemple ({debugInfo.sampleUsers.length})
              </h4>
              {debugInfo.sampleUsers.length > 0 ? (
                <div className="space-y-2">
                  {debugInfo.sampleUsers.map((user: any) => (
                    <div key={user.id} className="p-2 bg-muted rounded text-sm">
                      <strong>{user.first_name} {user.last_name}</strong> ({user.email})
                      <br />
                      <span className="text-muted-foreground">
                        Rôle: {user.role} | Actif: {user.is_active ? 'Oui' : 'Non'} | 
                        Créé: {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
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

export default UserManagementDebug;
