import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Mail, Phone, X } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

const SUPPORT_SETTINGS_GROUP = 'support';

const LiveChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { settings } = useSettings(SUPPORT_SETTINGS_GROUP);

  const { supportEmail, supportPhone, supportHours } = useMemo(() => {
    const email = settings.find((setting) => setting.key === 'support_email')?.value as string | undefined;
    const phone = settings.find((setting) => setting.key === 'support_phone')?.value as string | undefined;
    const hours = settings.find((setting) => setting.key === 'support_hours')?.value as string | undefined;
    return {
      supportEmail: email || 'support@coursemax.ca',
      supportPhone: phone || '450-123-4567',
      supportHours: hours || 'Lundi au vendredi, 9h à 17h',
    };
  }, [settings]);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        className="fixed bottom-4 right-4 z-50 rounded-full w-14 h-14 shadow-lg"
        aria-label="Ouvrir le support"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 shadow-2xl border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-primary text-primary-foreground rounded-t-lg">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Support CourseMax
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="text-primary-foreground"
          aria-label="Fermer le support"
        >
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Assistance en direct temporairement indisponible</p>
          <p>
            Notre équipe de support répond rapidement par courriel ou téléphone. Laissez-nous un message et nous vous
            contacterons dans les plus brefs délais.
          </p>
        </div>

        <Separator />

        <div className="space-y-3 text-sm">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => (window.location.href = `mailto:${supportEmail}`)}
          >
            <Mail className="w-4 h-4" />
            {supportEmail}
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => (window.location.href = `tel:${supportPhone}`)}
          >
            <Phone className="w-4 h-4" />
            {supportPhone}
          </Button>
          <p className="text-xs text-muted-foreground">Heures d&apos;ouverture&nbsp;: {supportHours}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveChatWidget;

