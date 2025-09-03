import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";

export const Footer = () => {
  const { getSettingValue, loading } = useSettings('footer');

  // Get footer content from settings
  const companyInfo = getSettingValue('footer_company_info', {
    name: "CourseMax",
    address: "123 Rue Principale",
    city: "Salaberry-de-Valleyfield",
    postal_code: "J6T 1A1",
    phone: "(450) 123-4567",
    email: "info@coursemax.ca"
  });

  const navigationLinks = getSettingValue('footer_navigation_links', {
    links: [
      { label: "Accueil", url: "/home" },
      { label: "Magasins", url: "/stores" },
      { label: "À propos", url: "/about" },
      { label: "Contact", url: "/contact" }
    ]
  });

  const socialMedia = getSettingValue('footer_social_media', {
    facebook: "https://facebook.com/coursemax",
    instagram: "https://instagram.com/coursemax",
    twitter: "https://twitter.com/coursemax",
    linkedin: "https://linkedin.com/company/coursemax"
  });

  const legalLinks = getSettingValue('footer_legal_links', {
    links: [
      { label: "Mentions légales", url: "/legal" },
      { label: "Politique de confidentialité", url: "/privacy" },
      { label: "Conditions d'utilisation", url: "/terms" }
    ]
  });

  if (loading) {
    return (
      <footer className="bg-card border-t">
        <div className="container mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                    <div className="h-4 bg-muted rounded w-4/5"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-card border-t mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
          
          {/* Company Info Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="/lovable-uploads/482dd564-f9a1-48f4-bef4-6569e9c64c0b.png" 
                alt="CourseMax" 
                className="h-10 w-auto"
              />
              <h3 className="text-xl font-bold text-foreground">
                Course<span className="text-primary">Max</span>
              </h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Livraison ultra-rapide à Valleyfield. Tous vos magasins préférés en une seule app.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                <div className="text-muted-foreground">
                  <div>{companyInfo.address}</div>
                  <div>{companyInfo.city}, {companyInfo.postal_code}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                <a 
                  href={`tel:${companyInfo.phone}`}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {companyInfo.phone}
                </a>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                <a 
                  href={`mailto:${companyInfo.email}`}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {companyInfo.email}
                </a>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">Navigation</h4>
            <nav className="space-y-2">
              {navigationLinks.links?.map((link: any, index: number) => (
                <Link
                  key={index}
                  to={link.url}
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">Services</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>✓ Livraison en 25-45 min</div>
              <div>✓ Plus de 15 magasins</div>
              <div>✓ Service 24/7</div>
              <div>✓ Paiement sécurisé</div>
              <div>✓ Support client dédié</div>
            </div>
          </div>

          {/* Social Media & Legal */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground">Suivez-nous</h4>
            
            {/* Social Media Links */}
            <div className="flex gap-3">
              {socialMedia.facebook && (
                <a
                  href={socialMedia.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors group"
                >
                  <Facebook className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                </a>
              )}
              {socialMedia.instagram && (
                <a
                  href={socialMedia.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors group"
                >
                  <Instagram className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                </a>
              )}
              {socialMedia.twitter && (
                <a
                  href={socialMedia.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors group"
                >
                  <Twitter className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                </a>
              )}
              {socialMedia.linkedin && (
                <a
                  href={socialMedia.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors group"
                >
                  <Linkedin className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                </a>
              )}
            </div>

            {/* Legal Links */}
            <div className="pt-4 border-t border-border">
              <div className="space-y-2">
                {legalLinks.links?.map((link: any, index: number) => (
                  <Link
                    key={index}
                    to={link.url}
                    className="block text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              © {new Date().getFullYear()} CourseMax. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Powered by Lovable</span>
              <span>•</span>
              <span>Made in Valleyfield 🇨🇦</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};