import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Image, 
  X, 
  CheckCircle, 
  AlertCircle,
  Download,
  Eye,
  Trash2,
  Loader2,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  size: number;
  type: string;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface ProofUploadProps {
  orderId: string;
  onFilesUploaded: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // en MB
  allowedTypes?: string[];
  className?: string;
}

const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'application/pdf'
];

const DEFAULT_MAX_SIZE = 5; // 5MB

export const ProofUpload: React.FC<ProofUploadProps> = ({
  orderId,
  onFilesUploaded,
  maxFiles = 5,
  maxSize = DEFAULT_MAX_SIZE,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  className
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    // Vérifier la taille
    if (file.size > maxSize * 1024 * 1024) {
      return `Le fichier ${file.name} dépasse la limite de ${maxSize}MB`;
    }

    // Vérifier le type
    if (!allowedTypes.includes(file.type)) {
      return `Le format ${file.type} n'est pas supporté`;
    }

    return null;
  };

  const createFilePreview = (file: File): string => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return '/icons/file-icon.png'; // Icône par défaut
  };

  const addFiles = useCallback((files: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    // Afficher les erreurs
    if (errors.length > 0) {
      errors.forEach(error => {
        toast({
          title: "Fichier invalide",
          description: error,
          variant: "destructive"
        });
      });
    }

    // Ajouter les fichiers valides
    if (validFiles.length > 0) {
      const newUploadedFiles: UploadedFile[] = validFiles.map(file => ({
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview: createFilePreview(file),
        size: file.size,
        type: file.type,
        status: 'uploading',
        progress: 0
      }));

      setUploadedFiles(prev => {
        const updated = [...prev, ...newUploadedFiles];
        if (updated.length > maxFiles) {
          toast({
            title: "Limite atteinte",
            description: `Maximum ${maxFiles} fichiers autorisés`,
            variant: "destructive"
          });
          return prev;
        }
        return updated;
      });

      // Simuler l'upload
      simulateUpload(newUploadedFiles);
    }
  }, [maxFiles, maxSize, allowedTypes, toast]);

  const simulateUpload = async (files: UploadedFile[]) => {
    setIsUploading(true);
    
    for (const file of files) {
      // Simuler la progression
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === file.id 
              ? { ...f, progress, status: progress === 100 ? 'success' : 'uploading' }
              : f
          )
        );
      }
    }

    setIsUploading(false);
    onFilesUploaded(uploadedFiles);
    
    toast({
      title: "Upload terminé",
      description: `${files.length} fichier(s) téléchargé(s) avec succès`,
    });
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file && file.preview.startsWith('blob:')) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'uploading':
        return 'text-blue-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Zone d'upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preuve de transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
              isDragOver 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-primary/50"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">
              {isDragOver ? 'Déposez vos fichiers ici' : 'Téléchargez vos preuves'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Glissez-déposez vos fichiers ou cliquez pour sélectionner
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Formats acceptés: JPG, PNG, PDF</p>
              <p>Taille max: {maxSize}MB par fichier</p>
              <p>Maximum: {maxFiles} fichiers</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={allowedTypes.join(',')}
            onChange={handleFileInput}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Fichiers uploadés */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fichiers téléchargés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  {/* Icône et aperçu */}
                  <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                    {file.type.startsWith('image/') ? (
                      <img 
                        src={file.preview} 
                        alt="Preview" 
                        className="w-8 h-8 object-cover rounded"
                      />
                    ) : (
                      getFileIcon(file.type)
                    )}
                  </div>

                  {/* Informations du fichier */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.file.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span className={getStatusColor(file.status)}>
                        {file.status === 'uploading' && 'Téléchargement...'}
                        {file.status === 'success' && 'Terminé'}
                        {file.status === 'error' && 'Erreur'}
                      </span>
                    </div>
                    
                    {/* Barre de progression */}
                    {file.status === 'uploading' && (
                      <div className="mt-2">
                        <Progress value={file.progress} className="h-2" />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {file.status === 'success' && (
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => removeFile(file.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Résumé */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {uploadedFiles.length} fichier(s) téléchargé(s)
                </span>
                <span className="text-muted-foreground">
                  {formatFileSize(uploadedFiles.reduce((total, file) => total + file.size, 0))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Conseils :</strong> Téléchargez des captures d'écran claires de votre transfert Interac, 
          des reçus de transaction, ou tout autre document prouvant le paiement.
        </AlertDescription>
      </Alert>

      {/* Statut global */}
      {isUploading && (
        <Alert className="border-blue-200 bg-blue-50">
          <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
          <AlertDescription className="text-blue-800">
            Téléchargement en cours... Veuillez patienter.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
