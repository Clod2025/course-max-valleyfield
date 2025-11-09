import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Shield, 
  User, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Database,
  Key
} from 'lucide-react';

const AuthFixer: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const { toast } = useToast();
  const { profile, user, isRole } = useAuth();

  const checkUser = async () => {
    setLoading(true);
    try {
      console.log('🔍 Checking user authentication...');
      
      // 1. Vérifier l'utilisateur actuel
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      console.log('👤 Current user:', currentUser);
      
      // 2. Vérifier le profil dans la base de données
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'clodenerc@yahoo.fr')
        .single();
      
      console.log('👤 Profile data:', profileData);
      
      // 3. Vérifier si l'utilisateur existe dans auth.users
      const { data: authUsers, error: authUsersError } = await supabase
        .from('auth.users')
        .select('*')
        .eq('email', 'clodenerc@yahoo.fr')
        .single();
      
      console.log('🔐 Auth users:', authUsers);
      
      setUserInfo({
        currentUser,
        userError,
        profileData,
        profileError,
        authUsers,
        authUsersError
      });
      
      toast({
        title: "Vérification terminée",
        description: "Informations utilisateur récupérées",
      });
      
    } catch (error: any) {
      console.error('❌ Error checking user:', error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fixUser = async () => {
    setFixing(true);
    try {
      console.log('🔧 Fixing user authentication...');
      
      // 1. Vérifier si le profil existe
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'clodenerc@yahoo.fr')
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }
      
      if (existingProfile) {
        // 2. Mettre à jour le profil existant pour être admin
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            role: 'admin',
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('email', 'clodenerc@yahoo.fr');
        
        if (updateError) {
          throw updateError;
        }
        
        console.log('✅ Profile updated to admin');
        
        toast({
          title: "Profil mis à jour",
          description: "Le profil a été mis à jour avec le rôle admin",
        });
      } else {
        // 3. Créer un nouveau profil admin
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            email: 'clodenerc@yahoo.fr',
            first_name: 'Clodenerc',
            last_name: 'Admin',
            role: 'admin',
            is_active: true,
            user_id: user?.id || 'temp-id'
          });
        
        if (insertError) {
          throw insertError;
        }
        
        console.log('✅ New admin profile created');
        
        toast({
          title: "Profil créé",
          description: "Un nouveau profil admin a été créé",
        });
      }
      
      // 4. Recharger la page pour mettre à jour l'authentification
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Error fixing user:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de réparer l'utilisateur",
        variant: "destructive",
      });
    } finally {
      setFixing(false);
    }
  };

  const forceReconnect = async () => {
    try {
      // signOut is not directly available in useAuth, so we'll just reload
      // This might need a more robust solution depending on your auth flow
      window.location.reload();
      toast({
        title: "Déconnexion",
        description: "Vous allez être redirigé vers la page de connexion",
      });
    } catch (error: any) {
      console.error('❌ Error signing out:', error);
      toast({
        title: "Erreur",
        description: "Impossible de se déconnecter",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Réparation d'Authentification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Utilisateur actuel</h4>
          <div className="space-y-1 text-sm">
            <p><strong>Email:</strong> {user?.email || 'Non connecté'}</p>
            <p><strong>Rôle:</strong> {profile?.role || 'Non défini'}</p>
            <p><strong>Admin:</strong> {isRole(['admin', 'Admin', 'ADMIN']) ? 'Oui' : 'Non'}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={checkUser} disabled={loading} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Vérification...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Vérifier l'utilisateur
              </>
            )}
          </Button>
          
          <Button onClick={fixUser} disabled={fixing} variant="destructive" className="flex-1">
            {fixing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Réparation...
              </>
            ) : (
              <>
                <Key className="w-4 h-4 mr-2" />
                Réparer l'admin
              </>
            )}
          </Button>
        </div>

        <Button onClick={forceReconnect} variant="outline" className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          Forcer la reconnexion
        </Button>

        {userInfo && (
          <div className="space-y-4">
            {/* Utilisateur actuel */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                {userInfo.userError ? (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                Utilisateur connecté
              </h4>
              {userInfo.userError ? (
                <p className="text-sm text-red-600">
                  Erreur: {userInfo.userError.message}
                </p>
              ) : (
                <div className="space-y-1 text-sm">
                  <p><strong>Email:</strong> {userInfo.currentUser?.email}</p>
                  <p><strong>ID:</strong> {userInfo.currentUser?.id}</p>
                  <p><strong>Confirmé:</strong> {userInfo.currentUser?.email_confirmed_at ? 'Oui' : 'Non'}</p>
                </div>
              )}
            </div>

            {/* Profil dans la base de données */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                {userInfo.profileError ? (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                ) : userInfo.profileData ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                )}
                Profil clodenerc@yahoo.fr
              </h4>
              {userInfo.profileError ? (
                <p className="text-sm text-red-600">
                  Erreur: {userInfo.profileError.message}
                </p>
              ) : userInfo.profileData ? (
                <div className="space-y-1 text-sm">
                  <p><strong>Email:</strong> {userInfo.profileData.email}</p>
                  <p><strong>Rôle:</strong> {userInfo.profileData.role}</p>
                  <p><strong>Actif:</strong> {userInfo.profileData.is_active ? 'Oui' : 'Non'}</p>
                  <p><strong>Créé:</strong> {new Date(userInfo.profileData.created_at).toLocaleDateString()}</p>
                </div>
              ) : (
                <p className="text-sm text-orange-600">Profil non trouvé</p>
              )}
            </div>

            {/* Actions recommandées */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium mb-2 text-blue-800">Actions recommandées</h4>
              <div className="space-y-2 text-sm text-blue-700">
                {!userInfo.profileData && (
                  <p>• Le profil n'existe pas - cliquez sur "Réparer l'admin"</p>
                )}
                {userInfo.profileData && !isRole(['admin', 'Admin', 'ADMIN'], userInfo.profileData.role) && (
                  <p>• Le profil existe mais n'est pas admin - cliquez sur "Réparer l'admin"</p>
                )}
                {userInfo.profileData && isRole(['admin', 'Admin', 'ADMIN'], userInfo.profileData.role) && (
                  <p>• Le profil est correct - essayez de vous reconnecter</p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthFixer;
