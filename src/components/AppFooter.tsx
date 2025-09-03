import { useSettings } from '@/hooks/useSettings';

export const AppFooter = () => {
  const { getSettingValue } = useSettings();

  const footerCTAs = {
    driver: getSettingValue('footer_cta_driver', { text: 'Devenir livreur', url: '/register?role=driver' }),
    client: getSettingValue('footer_cta_client', { text: 'Créer un compte client', url: '/register?role=client' }),
    merchant: getSettingValue('footer_cta_merchant', { text: 'Vous êtes marchand ?', url: '/register?role=merchant' })
  };

  const companyInfo = getSettingValue('company_info', {
    name: 'CourseMax',
    address: 'Valleyfield, QC',
    phone: '450-123-4567',
    email: 'info@coursemax.ca'
  });
  return (
    <footer className="bg-card border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CourseMax. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};