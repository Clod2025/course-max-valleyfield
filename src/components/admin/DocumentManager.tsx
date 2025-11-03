import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Eye, 
  Edit, 
  Check, 
  X,
  Download,
  Upload,
  Clock,
  User,
  Truck
} from 'lucide-react';
// Toast hook implementation
const useToast = () => {
  return {
    toast: ({ title, description, variant }: { title: string; description: string; variant?: string }) => {
      // Simple toast notification using browser alert for demo
      alert(`${title}\n${description}`);
    }
  };
};
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Document {
  id: string;
  user_id: string;
  user_name: string;
  user_role: 'driver' | 'merchant';
  document_type: 'driver_license' | 'insurance' | 'business_license' | 'tax_document';
  document_url: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  notes?: string;
}

export function DocumentManager() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    setTimeout(() => {
      setDocuments([
        {
          id: '1',
          user_id: 'user1',
          user_name: 'Jean Dupuis',
          user_role: 'driver',
          document_type: 'driver_license',
          document_url: '/documents/license_jean.pdf',
          status: 'pending',
          submitted_at: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          user_id: 'user2',
          user_name: 'Marie Tremblay',
          user_role: 'driver',
          document_type: 'insurance',
          document_url: '/documents/insurance_marie.pdf',
          status: 'pending',
          submitted_at: '2024-01-14T15:45:00Z'
        },
        {
          id: '3',
          user_id: 'user3',
          user_name: 'Épicerie Martin',
          user_role: 'merchant',
          document_type: 'business_license',
          document_url: '/documents/license_martin.pdf',
          status: 'approved',
          submitted_at: '2024-01-13T09:15:00Z',
          reviewed_at: '2024-01-13T14:20:00Z'
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  // ✅ NOUVELLE FONCTION : Ouvrir le document dans une nouvelle fenêtre
  const handleView = (document: Document) => {
    setViewingDocument(document);
    toast({
      title: "Ouverture du document",
      description: `Visualisation de ${getDocumentTypeLabel(document.document_type)}`,
    });
  };

  // ✅ NOUVELLE FONCTION : Télécharger le document
  const handleDownload = (document: Document) => {
    // Créer un lien de téléchargement
    const link = document.createElement('a');
    link.href = document.document_url;
    link.download = `${document.user_name}_${document.document_type}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Téléchargement démarré",
      description: `${getDocumentTypeLabel(document.document_type)} de ${document.user_name}`,
    });
  };

  const handleEdit = (documentId: string) => {
    const doc = documents.find(d => d.id === documentId);
    toast({
      title: "Modifier document",
      description: `Modification du document: ${doc?.document_type} de ${doc?.user_name}`,
    });
  };

  const handleApprove = (documentId: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId 
        ? { ...doc, status: 'approved', reviewed_at: new Date().toISOString() }
        : doc
    ));
    toast({
      title: "Document approuvé",
      description: "Le document a été approuvé avec succès",
    });
  };

  const handleReject = (documentId: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId 
        ? { ...doc, status: 'rejected', reviewed_at: new Date().toISOString() }
        : doc
    ));
    toast({
      title: "Document rejeté",
      description: "Le document a été rejeté",
      variant: "destructive"
    });
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'driver_license': return 'Permis de conduire';
      case 'insurance': return 'Assurance véhicule';
      case 'business_license': return 'Licence d\'affaires';
      case 'tax_document': return 'Document fiscal';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'approved':
        return <Badge className="bg-green-600"><Check className="w-3 h-3 mr-1" />Approuvé</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Rejeté</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredDocuments = documents.filter(doc => 
    filter === 'all' || doc.status === filter
  );

  const pendingCount = documents.filter(doc => doc.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Gestion des Documents</h2>
            <p className="text-muted-foreground">
              Vérifiez et approuvez les documents des livreurs et marchands
            </p>
          </div>
        </div>
        
        {pendingCount > 0 && (
          <Badge variant="destructive" className="text-lg px-3 py-1">
            {pendingCount} en attente
          </Badge>
        )}
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Filtrer par statut:</span>
        {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? 'Tous' :
             status === 'pending' ? 'En attente' :
             status === 'approved' ? 'Approuvés' : 'Rejetés'}
            {status === 'pending' && pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingCount}</Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Liste des documents */}
      <div className="grid gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))
        ) : filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {filter === 'pending' ? 'Aucun document en attente' : 'Aucun document trouvé'}
              </h3>
              <p className="text-muted-foreground">
                {filter === 'pending' 
                  ? 'Tous les documents ont été traités'
                  : 'Aucun document ne correspond aux critères sélectionnés'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredDocuments.map((document) => (
            <Card key={document.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {document.user_role === 'driver' ? (
                        <Truck className="w-5 h-5 text-blue-600" />
                      ) : (
                        <User className="w-5 h-5 text-green-600" />
                      )}
                      <div>
                        <h3 className="font-semibold">{document.user_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {document.user_role === 'driver' ? 'Livreur' : 'Marchand'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(document.status)}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <span className="text-sm font-medium">Type de document:</span>
                    <p className="text-sm text-muted-foreground">
                      {getDocumentTypeLabel(document.document_type)}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium">Soumis le:</span>
                    <p className="text-sm text-muted-foreground">
                      {new Date(document.submitted_at).toLocaleDateString('fr-CA')}
                    </p>
                  </div>
                  
                  {document.reviewed_at && (
                    <div>
                      <span className="text-sm font-medium">Traité le:</span>
                      <p className="text-sm text-muted-foreground">
                        {new Date(document.reviewed_at).toLocaleDateString('fr-CA')}
                      </p>
                    </div>
                  )}
                </div>
                
                {document.notes && (
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Notes:</span>
                    <p className="text-sm text-muted-foreground mt-1">{document.notes}</p>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleView(document)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Voir
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownload(document)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </Button>
                  
                  {document.status === 'pending' && (
                    <>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(document.id)}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Approuver
                      </Button>
                      
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleReject(document.id)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Rejeter
                      </Button>
                    </>
                  )}
                  
                  {document.status !== 'pending' && (
                    <Button variant="outline" size="sm" onClick={() => handleEdit(document.id)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* ✅ NOUVEAU: Dialog pour visualiser le document */}
      <Dialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {viewingDocument && (
                <>
                  {getDocumentTypeLabel(viewingDocument.document_type)} - {viewingDocument.user_name}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {viewingDocument && (
              <iframe
                src={viewingDocument.document_url}
                className="w-full h-full border rounded"
                title="Aperçu du document"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}