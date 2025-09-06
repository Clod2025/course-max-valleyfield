import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  User,
  Calendar
} from 'lucide-react';

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

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      // Simuler des données pour l'instant
      const mockDocuments: DriverDocument[] = [
        {
          id: '1',
          driver_id: '1',
          driver_name: 'Jean Dupuis',
          document_type: 'license',
          document_name: 'Permis de conduire - Jean Dupuis.pdf',
          file_url: '/documents/license_jean_dupuis.pdf',
          status: 'approved',
          submitted_at: '2024-01-15T10:30:00Z',
          reviewed_at: '2024-01-15T14:20:00Z',
          reviewer_notes: 'Permis valide et en règle'
        },
        {
          id: '2',
          driver_id: '1',
          driver_name: 'Jean Dupuis',
          document_type: 'insurance',
          document_name: 'Assurance automobile - Jean Dupuis.pdf',
          file_url: '/documents/insurance_jean_dupuis.pdf',
          status: 'approved',
          submitted_at: '2024-01-15T10:35:00Z',
          reviewed_at: '2024-01-15T14:25:00Z',
          reviewer_notes: 'Assurance valide jusqu\'en décembre 2024'
        },
        {
          id: '3',
          driver_id: '2',
          driver_name: 'Marie Tremblay',
          document_type: 'license',
          document_name: 'Permis de conduire - Marie Tremblay.pdf',
          file_url: '/documents/license_marie_tremblay.pdf',
          status: 'pending',
          submitted_at: '2024-01-20T09:15:00Z'
        },
        {
          id: '4',
          driver_id: '3',
          driver_name: 'Pierre Gagnon',
          document_type: 'license',
          document_name: 'Permis de conduire - Pierre Gagnon.pdf',
          file_url: '/documents/license_pierre_gagnon.pdf',
          status: 'rejected',
          submitted_at: '2024-01-18T16:45:00Z',
          reviewed_at: '2024-01-19T10:30:00Z',
          reviewer_notes: 'Permis expiré, veuillez fournir un permis valide'
        }
      ];
      setDocuments(mockDocuments);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
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

  const handleApprove = (id: string) => {
    setDocuments(documents.map(doc => 
      doc.id === id 
        ? { ...doc, status: 'approved' as const, reviewed_at: new Date().toISOString() }
        : doc
    ));
  };

  const handleReject = (id: string) => {
    setDocuments(documents.map(doc => 
      doc.id === id 
        ? { ...doc, status: 'rejected' as const, reviewed_at: new Date().toISOString() }
        : doc
    ));
  };

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
