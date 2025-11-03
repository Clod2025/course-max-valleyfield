import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Star,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { usePaymentMethods, PaymentMethod } from '@/hooks/usePaymentMethods';
import { useToast } from '@/hooks/use-toast';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PaymentSettings() {
  const { toast } = useToast();
  const { 
    paymentMethods, 
    loading, 
    addPaymentMethod, 
    updatePaymentMethod, 
    deletePaymentMethod, 
    togglePaymentMethod,
    setDefaultPaymentMethod 
  } = usePaymentMethods();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMethod, setEditingMethod] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'square' as PaymentMethod['type'],
    provider_account_id: '',
    is_enabled: true,
    is_default: false
  });

  const paymentMethodTypes = [
    { value: 'square', label: 'Square', description: 'Paiement par carte via Square' },
    { value: 'stripe', label: 'Stripe', description: 'Stripe Connect pour paiements' },
    { value: 'paypal', label: 'PayPal', description: 'Compte PayPal Business' },
    { value: 'interac', label: 'Interac', description: 'Transfert Interac' },
    { value: 'cash', label: 'Espèce', description: 'Paiement en espèces' }
  ];

  const handleSubmit = async () => {
    if (!formData.type) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un type de paiement",
        variant: "destructive"
      });
      return;
    }

    const success = await addPaymentMethod({
      type: formData.type,
      provider_account_id: formData.provider_account_id || undefined,
      is_enabled: formData.is_enabled,
      is_default: formData.is_default
    });

    if (success) {
      resetForm();
      setShowAddDialog(false);
      
      // Si cette méthode est définie comme par défaut, on s'assure qu'elle l'est bien
      if (formData.is_default) {
        const newMethod = paymentMethods[0]; // Le dernier ajouté sera en premier
        if (newMethod) {
          await setDefaultPaymentMethod(newMethod.id);
        }
      }
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method.id);
    setFormData({
      type: method.type,
      provider_account_id: method.provider_account_id || '',
      is_enabled: method.is_enabled,
      is_default: method.is_default
    });
    setShowAddDialog(true);
  };

  const handleUpdate = async () => {
    if (!editingMethod) return;

    const success = await updatePaymentMethod(editingMethod, {
      type: formData.type,
      provider_account_id: formData.provider_account_id || undefined,
      is_enabled: formData.is_enabled,
      is_default: formData.is_default
    });

    if (success) {
      resetForm();
      setShowAddDialog(false);
      setEditingMethod(null);
      
      if (formData.is_default) {
        await setDefaultPaymentMethod(editingMethod);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette méthode de paiement ?')) return;
    await deletePaymentMethod(id);
  };

  const resetForm = () => {
    setFormData({
      type: 'square',
      provider_account_id: '',
      is_enabled: true,
      is_default: false
    });
  };

  const enabledMethods = paymentMethods.filter(m => m.is_enabled).length;
  const defaultMethod = paymentMethods.find(m => m.is_default);

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total méthodes</p>
                <p className="text-2xl font-bold">{paymentMethods.length}</p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Méthodes actives</p>
                <p className="text-2xl font-bold text-green-600">{enabledMethods}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Par défaut</p>
                <p className="text-2xl font-bold text-orange-600">
                  {defaultMethod ? paymentMethodTypes.find(t => t.value === defaultMethod.type)?.label : 'Aucune'}
                </p>
              </div>
              <Star className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Méthodes de paiement</CardTitle>
          <Button onClick={() => { resetForm(); setEditingMethod(null); setShowAddDialog(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une méthode
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Aucune méthode de paiement configurée</p>
              <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter la première méthode
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map(method => (
                <div 
                  key={method.id} 
                  className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                    method.is_enabled ? 'bg-white' : 'bg-gray-50'
                  } ${method.is_default ? 'border-primary border-2' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <CreditCard className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {paymentMethodTypes.find(t => t.value === method.type)?.label}
                        </span>
                        {method.is_default && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Par défaut
                          </Badge>
                        )}
                        {method.is_enabled ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-400 border-gray-400">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                      {method.provider_account_id && (
                        <p className="text-sm text-muted-foreground mt-1">
                          ID: {method.provider_account_id}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {paymentMethodTypes.find(t => t.value === method.type)?.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={method.is_enabled}
                      onCheckedChange={() => togglePaymentMethod(method.id)}
                    />
                    {!method.is_default && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setDefaultPaymentMethod(method.id)}
                        title="Définir par défaut"
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEdit(method)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleDelete(method.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {defaultMethod && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Méthode de paiement par défaut
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    {paymentMethodTypes.find(t => t.value === defaultMethod.type)?.label} sera utilisée automatiquement pour les nouveaux paiements clients.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog pour ajouter/modifier */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? 'Modifier la méthode de paiement' : 'Nouvelle méthode de paiement'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type de paiement *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: PaymentMethod['type']) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethodTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.type !== 'cash' && (
              <div className="space-y-2">
                <Label htmlFor="provider_account_id">ID du compte fournisseur</Label>
                <Input
                  id="provider_account_id"
                  value={formData.provider_account_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, provider_account_id: e.target.value }))}
                  placeholder="Ex: acct_1234..."
                />
                <p className="text-xs text-muted-foreground">
                  Identifiant fourni par votre plateforme de paiement
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_enabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_enabled: checked }))}
              />
              <Label>Méthode activée</Label>
            </div>

            {!editingMethod && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
                />
                <Label>Définir comme méthode par défaut</Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); setEditingMethod(null); }}>
              Annuler
            </Button>
            <Button onClick={editingMethod ? handleUpdate : handleSubmit}>
              {editingMethod ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}