import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { 
  Smartphone, 
  Mail, 
  Phone, 
  Upload, 
  FileText, 
  CheckCircle,
  AlertCircle,
  Info,
  Copy,
  ExternalLink,
  Clock,
  DollarSign,
  X,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export interface MerchantInteracInfo {
  email: string;
  phone: string;
  businessName: string;
}

export interface InteracPaymentProps {
  amount: number;
  orderId: string;
  merchantInteracInfo: MerchantInteracInfo;
  onProofUploaded: (proofData: any) => void;
  onBack: () => void;
  className?: string;
}

interface UploadedFile {
  file: File;
  preview: string;
  id: string;
}

export const InteracPayment: React.FC<InteracPaymentProps> = ({
  amount,
  orderId,
  merchantInteracInfo,
  onProofUploaded,
  onBack,
  className
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // Validation des fichiers
    const validFiles = files.filter(file => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      
      if (file.size > maxSize) {
        toast({
          title: "Fichier trop volumineux",
          description: `${file.name} dépasse la limite de 5MB`,
          variant: "destructive"
        });
        return false;
      }
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Format non supporté",
          description: `${file.name} n'est pas un format supporté (JPG, PNG, PDF)`,
          variant: "destructive"
        });
        return false;
      }
      
      return true;
    });

    // Traitement des fichiers valides
    validFiles.forEach(file => {
      const id = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const preview = file.type.startsWith('image/') 
        ? URL.createObjectURL(file)
        : '/icons/pdf-icon.png'; // Icône par défaut pour PDF

      setUploadedFiles(prev => [...prev, { file, preview, id }]);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: "Copié",
        description: `${field} copié dans le presse-papiers`,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier dans le presse-papiers",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "Preuve requise",
        description: "Veuillez télécharger une preuve de transaction",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Simulation de l'upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const proofData = {
        orderId,
        amount,
        merchantInfo: merchantInteracInfo,
        files: uploadedFiles.map(f => ({
          id: f.id,
          name: f.file.name,
          size: f.file.size,
          type: f.file.type
        })),
        uploadedAt: new Date().toISOString()
      };
      
      onProofUploaded(proofData);
      
      toast({
        title: "Preuve téléchargée",
        description: "Votre preuve de paiement a été envoyée au marchand",
      });
    } catch (error) {
      toast({
        title: "Erreur d'upload",
        description: "Impossible de télécharger la preuve",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* En-tête avec montant */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Paiement Interac e-Transfer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Transfert vers {merchantInteracInfo.businessName}
              </p>
              <p className="text-2xl font-bold text-primary">
                {amount.toFixed(2)}$
              </p>
            </div>
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              <Clock className="w-3 h-3 mr-1" />
              Vérification manuelle
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Instructions :</strong> Effectuez votre transfert Interac avec les informations ci-dessous, 
          puis téléchargez une preuve de transaction (capture d'écran, reçu, etc.).
        </AlertDescription>
      </Alert>

      {/* Informations du marchand */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informations de transfert</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email Interac */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Email Interac du marchand
            </Label>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono text-sm flex-1">{merchantInteracInfo.email}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(merchantInteracInfo.email, 'Email')}
                className="h-8"
              >
                {copiedField === 'Email' ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>

          {/* Téléphone Interac */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Téléphone Interac du marchand
            </Label>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono text-sm flex-1">{merchantInteracInfo.phone}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(merchantInteracInfo.phone, 'Téléphone')}
                className="h-8"
              >
                {copiedField === 'Téléphone' ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>

          {/* Montant */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Montant exact à transférer
            </Label>
            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-lg font-bold text-primary">
                {amount.toFixed(2)}$
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(amount.toFixed(2), 'Montant')}
                className="h-8"
              >
                {copiedField === 'Montant' ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>

          {/* Message de sécurité */}
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Important :</strong> Utilisez exactement ces informations pour votre transfert. 
              Ne modifiez pas l'email ou le montant.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Upload de preuve */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preuve de transaction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Téléchargez une preuve de votre transfert Interac (capture d'écran, reçu, etc.)
          </div>

          {/* Zone d'upload */}
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-1">
              Cliquez pour télécharger ou glissez-déposez vos fichiers
            </p>
            <p className="text-xs text-muted-foreground">
              Formats acceptés: JPG, PNG, PDF (max 5MB)
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,application/pdf"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Fichiers uploadés */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Fichiers téléchargés:</h4>
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                    {file.file.type.startsWith('image/') ? (
                      <img 
                        src={file.preview} 
                        alt="Preview" 
                        className="w-6 h-6 object-cover rounded"
                      />
                    ) : (
                      <FileText className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(file.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informations sur le processus */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900 mb-1">
                Prochaines étapes
              </h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Effectuez votre transfert Interac avec les informations ci-dessus</li>
                <li>• Téléchargez une preuve de transaction</li>
                <li>• Le marchand vérifiera votre paiement</li>
                <li>• Vous recevrez une confirmation par email</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isUploading}
          className="flex-1"
        >
          Retour
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={uploadedFiles.length === 0 || isUploading}
          className="flex-1 bg-primary hover:bg-primary/90"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Envoyer la preuve
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
