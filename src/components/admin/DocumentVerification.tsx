import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  Download,
  Eye,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DriverDocument {
  id: string;
  driver_id: string;
  driver_name: string;
  document_type: 'license' | 'insurance' | 'registration' | 'background_check';
  document_name: string;
  file_url: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  reviewer_notes?: string;
}

const DocumentVerification = () => {
  const [documents, setDocuments] = useState<DriverDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('driver_documents')
        .select(`
          id,
          driver_id,
          document_type,
          document_name,
          file_url,
          status,
          submitted_at,
          reviewed_at,
          reviewer_notes,
          driver:profiles!driver_documents_driver_id_fkey(first_name,last_name)
        `)
        .order('submitted_at', { ascending: false });

      if (error) {
        throw error;
      }

      const mapped: DriverDocument[] = (data || []).map((doc: any) => ({
        id: doc.id,
        driver_id: doc.driver_id,
        driver_name: `${doc.driver?.first_name ?? ''} ${doc.driver?.last_name ?? ''}`.trim() || 'Livreur',
        document_type: doc.document_type,
        document_name: doc.document_name,
        file_url: doc.file_url,
        status: doc.status,
        submitted_at: doc.submitted_at,
        reviewed_at: doc.reviewed_at || undefined,
        reviewer_notes: doc.reviewer_notes || undefined,
      }));

      setDocuments(mapped);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      setDocuments([]);
      toast({
        title: "Erreur",
        description: "Impossible de charger les documents des livreurs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Approuvé</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejeté</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const types = {
      license: { label: 'Permis de conduire', color: 'bg-blue-500' },
      insurance: { label: 'Assurance', color: 'bg-green-500' },
      registration: { label: 'Immatriculation', color: 'bg-orange-500' },
      background_check: { label: 'Vérification', color: 'bg-purple-500' }
    };
    const typeInfo = types[type as keyof typeof types] || types.license;
    return <Badge className={typeInfo.color}>{typeInfo.label}</Badge>;
  };

  const updateDocumentStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('driver_documents')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      setDocuments(prev =>
        prev.map(doc =>
          doc.id === id
            ? { ...doc, status, reviewed_at: new Date().toISOString() }
            : doc
        )
      );

      toast({
        title: "Statut mis à jour",
        description: `Le document a été ${status === 'approved' ? 'approuvé' : 'rejeté'}.`,
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du document:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut du document.",
        variant: "destructive",
      });
    }
  };

  const handleApprove = (id: string) => updateDocumentStatus(id, 'approved');
  const handleReject = (id: string) => updateDocumentStatus(id, 'rejected');

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.document_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    const matchesType = filterType === 'all' || doc.document_type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vérification des Documents</h2>
          <p className="text-muted-foreground">Vérifiez les documents des livreurs</p>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <Input
                placeholder="Rechercher un document..."
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
              <option value="pending">En attente</option>
              <option value="approved">Approuvés</option>
              <option value="rejected">Rejetés</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">Tous les types</option>
              <option value="license">Permis de conduire</option>
              <option value="insurance">Assurance</option>
              <option value="registration">Immatriculation</option>
              <option value="background_check">Vérification</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des documents */}
      <div className="grid gap-4">
        {filteredDocuments.map((document) => (
          <Card key={document.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{document.driver_name}</h3>
                    <p className="text-muted-foreground">{document.document_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {getTypeBadge(document.document_type)}
                      {getStatusBadge(document.status)}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Soumis: {new Date(document.submitted_at).toLocaleDateString()}</span>
                      </div>
                      {document.reviewed_at && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Révisé: {new Date(document.reviewed_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    {document.reviewer_notes && (
                      <p className="text-sm text-muted-foreground mt-2">
                        <strong>Notes:</strong> {document.reviewer_notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                  {document.status === 'pending' && (
                    <>
                      <Button 
                        size="sm"
                        onClick={() => handleApprove(document.id)}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approuver
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleReject(document.id)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Rejeter
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun document trouvé</h3>
            <p className="text-muted-foreground">
              Aucun document ne correspond à vos critères de recherche.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentVerification;
