import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trash2, UserPlus, AlertTriangle, Shield, RefreshCw, Eye } from 'lucide-react';
import EmailUserTools from './EmailUserTools';
import { AuthDebugger } from './AuthDebugger';

interface UserResult {
  id: string;
  email: string;
  status: 'success' | 'error' | 'pending';
  message?: string;
}

const UserManagement = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [userStatuses, setUserStatuses] = useState<UserResult[]>([]);
  const [operationResults, setOperationResults] = useState<{
    deletions: UserResult[];
    creations: UserResult[];
  }>({ deletions: [], creations: [] });
  const { toast } = useToast();

  // UUIDs des utilisateurs à gérer
  const userIds = [
    '52fdfc2f-aebc-43cb-a1b8-4b1d5d4a11f0',
    'baed7cf6-d07e-457c-adb5-214dd5111565',
    'b6d46d77-465a-4f9a-aa8f-a939ccbdd40c',
    '0a414ac4-138b-4026-a5a5-2d6afd8e1692'
  ];

  const testUsers = [
    { id: userIds[0], email: 'clodenerc@yahoo.fr', role: 'client' },
    { id: userIds[1], email: 'claircl18@gmail.com', role: 'store_manager' },
    { id: userIds[2], email: 'desirdelia@gmail.com', role: 'livreur' },
    { id: userIds[3], email: 'engligoclervil9@gmail.com', role: 'admin' }
  ];

  // Reset passwords for problematic users
  const resetProblematicPasswords = async () => {
    setIsCreating(true); // Reuse existing loading state
    
    const usersToReset = [
      { email: 'clodenerc@yahoo.fr', newPassword: 'SecurePass2024!' },
      { email: 'claircl18@gmail.com', newPassword: 'SecurePass2024!' },
      { email: 'desirdelia@gmail.com', newPassword: 'SecurePass2024!' },
      { email: 'engligoclervil9@gmail.com', newPassword: 'SecurePass2024!' },
    ];

    try {
      const { data, error } = await supabase.functions.invoke('batch-password-reset', {
        body: { users: usersToReset }
      });

      if (error) {
        throw error;
      }

      // Update operation results to show password reset results
      const passwordResets = data.results?.map((result: any) => ({
        id: result.email,
        email: result.email,
        status: result.success ? 'success' : 'error',
        message: result.message
      })) || [];

      setOperationResults(prev => ({ 
        ...prev, 
        creations: passwordResets 
      }));

      toast({
        title: "Réinitialisation terminée",
        description: `${data.summary?.succeeded || 0} mots de passe réinitialisés, ${data.summary?.failed || 0} échecs`,
        variant: data.summary?.succeeded > 0 ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      toast({
        title: "Erreur",
        description: "Échec de la réinitialisation des mots de passe",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCheckUserStatus = async () => {
    setIsChecking(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('check-users-status', {
        body: { userIds }
      });

      if (error) {
        throw error;
      }

      setUserStatuses(data.users);
      toast({
        title: "Vérification terminée",
        description: `Statut vérifié pour ${data.users.length} utilisateurs`,
        variant: "default"
      });
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      toast({
        title: "Erreur",
        description: "Échec de la vérification du statut",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleDeleteUsers = async (targetUserIds?: string[]) => {
    setIsDeleting(true);
    const idsToDelete = targetUserIds || userIds;
    
    try {
      const { data, error } = await supabase.functions.invoke('delete-users', {
        body: { userIds: idsToDelete }
      });

      if (error) {
        throw error;
      }

      const deletions = data.results || [];
      setOperationResults(prev => ({ ...prev, deletions }));

      toast({
        title: "Suppression terminée",
        description: `${data.deletedCount || 0} utilisateurs supprimés, ${data.errorCount || 0} erreurs`,
        variant: data.deletedCount > 0 ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Échec de la suppression des utilisateurs",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateUsers = async () => {
    setIsCreating(true);
    
    const usersToCreate = [
      {
        email: 'clodenerc@yahoo.fr',
        password: 'SecurePass2024!',
        metadata: {
          first_name: 'Clodener',
          last_name: 'C',
          role: 'client'
        }
      },
      {
        email: 'claircl18@gmail.com',
        password: 'SecurePass2024!',
        metadata: {
          first_name: 'Clair',
          last_name: 'CL',
          role: 'store_manager'
        }
      },
      {
        email: 'desirdelia@gmail.com',
        password: 'SecurePass2024!',
        metadata: {
          first_name: 'Desire',
          last_name: 'Delia',
          role: 'livreur'
        }
      },
      {
        email: 'engligoclervil9@gmail.com',
        password: 'SecurePass2024!',
        metadata: {
          first_name: 'Engligo',
          last_name: 'Clervil',
          role: 'admin'
        }
      }
    ];

    try {
      const { data, error } = await supabase.functions.invoke('create-users', {
        body: { users: usersToCreate }
      });

      if (error) {
        throw error;
      }

      const creations = data.results || [];
      setOperationResults(prev => ({ ...prev, creations }));

      toast({
        title: "Création terminée",
        description: `${data.createdCount || 0} utilisateurs créés, ${data.errorCount || 0} erreurs`,
        variant: data.createdCount > 0 ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast({
        title: "Erreur",
        description: "Échec de la création des utilisateurs",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const retryFailedDeletions = () => {
    const failedIds = operationResults.deletions
      .filter(result => result.status === 'error')
      .map(result => result.id);
    
    if (failedIds.length > 0) {
      handleDeleteUsers(failedIds);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Gestion des Utilisateurs Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Status Check */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Utilisateurs test :</h4>
            <Button
              onClick={handleCheckUserStatus}
              disabled={isChecking}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              {isChecking ? 'Vérification...' : 'Vérifier le statut'}
            </Button>
          </div>
          
          <div className="space-y-2">
            {testUsers.map((user, index) => {
              const status = userStatuses.find(s => s.id === user.id);
              return (
                <div key={user.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Badge variant="outline">User {index + 1}</Badge>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{user.email}</div>
                    <code className="text-xs text-muted-foreground">{user.id}</code>
                  </div>
                  <Badge variant="secondary">{user.role}</Badge>
                  {status && (
                    <Badge variant={status.status === 'success' ? 'default' : 'destructive'}>
                      {status.status === 'success' ? 'Existe' : 'Supprimé'}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Operation Results */}
        {(operationResults.deletions.length > 0 || operationResults.creations.length > 0) && (
          <div className="space-y-4">
            <h4 className="font-medium">Résultats des opérations :</h4>
            
            {operationResults.deletions.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Suppressions :</h5>
                <div className="space-y-1">
                  {operationResults.deletions.map((result) => (
                    <div key={result.id} className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded">
                      <Badge variant={result.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                        {result.status}
                      </Badge>
                      <span>{result.email}</span>
                      {result.message && <span className="text-muted-foreground">- {result.message}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {operationResults.creations.length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-2">Créations :</h5>
                <div className="space-y-1">
                  {operationResults.creations.map((result) => (
                    <div key={result.id} className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded">
                      <Badge variant={result.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                        {result.status}
                      </Badge>
                      <span>{result.email}</span>
                      {result.message && <span className="text-muted-foreground">- {result.message}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => handleDeleteUsers()}
            disabled={isDeleting}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Suppression...' : 'Supprimer les utilisateurs'}
          </Button>

          <Button
            onClick={handleCreateUsers}
            disabled={isCreating}
            variant="default"
            className="flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            {isCreating ? 'Création...' : 'Recréer les utilisateurs'}
          </Button>

          <Button
            onClick={resetProblematicPasswords}
            disabled={isCreating}
            variant="secondary"
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white"
          >
            <RefreshCw className="w-4 h-4" />
            {isCreating ? 'Réinitialisation...' : '🔑 Réinitialiser mots de passe'}
          </Button>

          {operationResults.deletions.some(r => r.status === 'error') && (
            <Button
              onClick={retryFailedDeletions}
              disabled={isDeleting}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer les échecs
            </Button>
          )}
        </div>

        <EmailUserTools />

        <AuthDebugger />

        {/* Avertissement */}
        <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
              Attention - Actions administrateur
            </p>
            <p className="text-yellow-700 dark:text-yellow-300">
              Ces actions utilisent la Service Role Key et sont irréversibles. 
              La suppression efface définitivement les utilisateurs de Supabase Auth.
            </p>
            <p className="text-yellow-700 dark:text-yellow-300 mt-2">
              <strong>📋 Mot de passe test :</strong> <code>SecurePass2024!</code>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserManagement;