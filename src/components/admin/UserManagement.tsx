import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trash2, UserPlus, AlertTriangle, Shield } from 'lucide-react';

const UserManagement = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // UUIDs des utilisateurs à gérer
  const userIds = [
    '52fdfc2f-aebc-43cb-a1b8-4b1d5d4a11f0',
    'baed7cf6-d07e-457c-adb5-214dd5111565',
    'b6d46d77-465a-4f9a-aa8f-a939ccbdd40c',
    '0a414ac4-138b-4026-a5a5-2d6afd8e1692'
  ];

  const handleDeleteUsers = async () => {
    setIsDeleting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('delete-users', {
        body: { userIds }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Suppression réussie",
        description: `${data.successCount} utilisateurs supprimés sur ${userIds.length}`,
        variant: "default"
      });

      if (data.errorCount > 0) {
        toast({
          title: "Erreurs détectées",
          description: `${data.errorCount} erreurs lors de la suppression`,
          variant: "destructive"
        });
      }
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
        email: 'user1@test.com',
        password: 'TestPassword123!',
        metadata: {
          first_name: 'Test',
          last_name: 'User1',
          role: 'client'
        }
      },
      {
        email: 'user2@test.com',
        password: 'TestPassword123!',
        metadata: {
          first_name: 'Test',
          last_name: 'User2',
          role: 'store_manager'
        }
      },
      {
        email: 'user3@test.com',
        password: 'TestPassword123!',
        metadata: {
          first_name: 'Test',
          last_name: 'User3',
          role: 'livreur'
        }
      },
      {
        email: 'user4@test.com',
        password: 'TestPassword123!',
        metadata: {
          first_name: 'Test',
          last_name: 'User4',
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

      toast({
        title: "Création réussie",
        description: `${data.successCount} utilisateurs créés sur ${usersToCreate.length}`,
        variant: "default"
      });

      if (data.errorCount > 0) {
        toast({
          title: "Erreurs détectées",
          description: `${data.errorCount} erreurs lors de la création`,
          variant: "destructive"
        });
      }
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Gestion des Utilisateurs Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Liste des UUIDs */}
        <div>
          <h4 className="font-medium mb-3">UUIDs des utilisateurs test :</h4>
          <div className="space-y-2">
            {userIds.map((id, index) => (
              <div key={id} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                <Badge variant="outline">User {index + 1}</Badge>
                <code className="text-sm font-mono flex-1">{id}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleDeleteUsers}
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
        </div>

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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserManagement;