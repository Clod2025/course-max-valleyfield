import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  AlertTriangle,
  Info,
  CheckCircle,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'maintenance';
  target_audience: 'all' | 'clients' | 'drivers' | 'merchants';
  is_active: boolean;
  created_at: string;
  expires_at?: string;
}

export function AnnouncementManager() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'maintenance',
    target_audience: 'all' as 'all' | 'clients' | 'drivers' | 'merchants',
    expires_at: '',
  });

  const announcementTypes = [
    { value: 'info', label: 'Information', icon: Info, color: 'blue' },
    { value: 'warning', label: 'Avertissement', icon: AlertTriangle, color: 'orange' },
    { value: 'success', label: 'Succès', icon: CheckCircle, color: 'green' },
    { value: 'maintenance', label: 'Maintenance', icon: AlertTriangle, color: 'red' }
  ];

  const targetAudiences = [
    { value: 'all', label: 'Tous les utilisateurs' },
    { value: 'clients', label: 'Clients uniquement' },
    { value: 'drivers', label: 'Livreurs uniquement' },
    { value: 'merchants', label: 'Marchands uniquement' }
  ];

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    // Simuler le chargement
    setTimeout(() => {
      setAnnouncements([
        {
          id: '1',
          title: 'Maintenance programmée',
          message: 'Une maintenance du système aura lieu dimanche de 2h à 4h du matin. Le service pourrait être temporairement indisponible.',
          type: 'maintenance',
          target_audience: 'all',
          is_active: true,
          created_at: '2024-01-15T10:00:00Z',
          expires_at: '2024-01-21T04:00:00Z'
        },
        {
          id: '2',
          title: 'Nouvelle zone de livraison',
          message: 'Nous desservons maintenant le secteur de Beauharnois ! Découvrez les nouveaux marchands disponibles.',
          type: 'success',
          target_audience: 'clients',
          is_active: true,
          created_at: '2024-01-14T15:30:00Z'
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.message) {
      toast({
        title: "Erreur",
        description: "Le titre et le message sont obligatoires",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const newAnnouncement: Announcement = {
        id: Date.now().toString(),
        title: formData.title,
        message: formData.message,
        type: formData.type,
        target_audience: formData.target_audience,
        is_active: true,
        created_at: new Date().toISOString(),
        expires_at: formData.expires_at || undefined
      };

      if (editingAnnouncement) {
        setAnnouncements(prev => prev.map(ann => 
          ann.id === editingAnnouncement.id 
            ? { ...newAnnouncement, id: editingAnnouncement.id }
            : ann
        ));
        toast({
          title: "Succès",
          description: "Annonce mise à jour",
        });
      } else {
        setAnnouncements(prev => [newAnnouncement, ...prev]);
        toast({
          title: "Succès",
          description: "Annonce publiée avec succès",
        });
      }

      setFormData({
        title: '',
        message: '',
        type: 'info',
        target_audience: 'all',
        expires_at: '',
      });
      setShowAddForm(false);
      setEditingAnnouncement(null);

    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de publier l'annonce",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      target_audience: announcement.target_audience,
      expires_at: announcement.expires_at?.split('T')[0] || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = (announcementId: string) => {
    setAnnouncements(prev => prev.filter(ann => ann.id !== announcementId));
    toast({
      title: "Succès",
      description: "Annonce supprimée",
    });
  };

  const toggleActive = (announcementId: string) => {
    setAnnouncements(prev => prev.map(ann => 
      ann.id === announcementId 
        ? { ...ann, is_active: !ann.is_active }
        : ann
    ));
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = announcementTypes.find(t => t.value === type);
    if (!typeConfig) return Info;
    return typeConfig.icon;
  };

  const getTypeColor = (type: string) => {
    const typeConfig = announcementTypes.find(t => t.value === type);
    return typeConfig?.color || 'blue';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Gestion des Annonces</h2>
            <p className="text-muted-foreground">
              Publiez des annonces pour informer vos utilisateurs
            </p>
          </div>
        </div>
        
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Annonce
        </Button>
      </div>

      {/* Formulaire d'ajout/modification */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {editingAnnouncement ? 'Modifier l\'Annonce' : 'Nouvelle Annonce'}
              <Button variant="ghost" size="sm" onClick={() => {
                setShowAddForm(false);
                setEditingAnnouncement(null);
                setFormData({ title: '', message: '', type: 'info', target_audience: 'all', expires_at: '' });
              }}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Titre de l'annonce"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Type d'annonce</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      type: e.target.value as 'info' | 'warning' | 'success' | 'maintenance' 
                    }))}
                    className="w-full p-2 border rounded-md"
                  >
                    {announcementTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="target_audience">Public cible</Label>
                  <select
                    id="target_audience"
                    value={formData.target_audience}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      target_audience: e.target.value as 'all' | 'clients' | 'drivers' | 'merchants'
                    }))}
                    className="w-full p-2 border rounded-md"
                  >
                    {targetAudiences.map(audience => (
                      <option key={audience.value} value={audience.value}>{audience.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="expires_at">Date d'expiration (optionnel)</Label>
                  <Input
                    id="expires_at"
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Contenu de l'annonce..."
                  rows={4}
                  required
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingAnnouncement(null);
                    setFormData({ title: '', message: '', type: 'info', target_audience: 'all', expires_at: '' });
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingAnnouncement ? 'Mettre à jour' : 'Publier'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Liste des annonces */}
      <div className="grid gap-4">
        {announcements.map((announcement) => {
          const TypeIcon = getTypeIcon(announcement.type);
          const typeColor = getTypeColor(announcement.type);
          
          return (
            <Card key={announcement.id} className={`border-l-4 border-l-${typeColor}-500`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <TypeIcon className={`w-5 h-5 text-${typeColor}-600 mt-0.5`} />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{announcement.title}</h3>
                      <p className="text-muted-foreground mt-1">{announcement.message}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={announcement.is_active ? 'default' : 'secondary'}>
                      {announcement.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <span className="font-medium">Public cible:</span>
                    <p className="text-muted-foreground">
                      {targetAudiences.find(a => a.value === announcement.target_audience)?.label}
                    </p>
                  </div>
                  
                  <div>
                    <span className="font-medium">Créée le:</span>
                    <p className="text-muted-foreground">
                      {new Date(announcement.created_at).toLocaleDateString('fr-CA')}
                    </p>
                  </div>
                  
                  {announcement.expires_at && (
                    <div>
                      <span className="font-medium">Expire le:</span>
                      <p className="text-muted-foreground">
                        {new Date(announcement.expires_at).toLocaleDateString('fr-CA')}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toggleActive(announcement.id)}
                  >
                    {announcement.is_active ? 'Désactiver' : 'Activer'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEdit(announcement)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600"
                    onClick={() => handleDelete(announcement.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {announcements.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucune annonce</h3>
            <p className="text-muted-foreground mb-4">
              Créez votre première annonce pour informer vos utilisateurs
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer une annonce
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
