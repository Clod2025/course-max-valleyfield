import { Header } from "@/components/header";
import { AppFooter } from "@/components/AppFooter";

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-24 max-w-5xl">
        <h1 className="text-5xl font-black mb-8 text-foreground">Conditions Générales d’Utilisation</h1>

        <p className="text-lg mb-6">
          L’utilisation de <strong>CourseMax</strong> implique l’acceptation des présentes conditions. Merci de les lire attentivement.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">1. Services</h2>
        <p className="mb-6">
          CourseMax fournit une plateforme permettant la commande et la livraison de produits auprès de magasins partenaires. Les services sont disponibles selon nos zones de couverture.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">2. Compte utilisateur</h2>
        <p className="mb-6">
          La création d’un compte est nécessaire pour passer des commandes. Vous êtes responsable de la confidentialité de vos identifiants et de toutes les activités liées à votre compte.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">3. Paiement</h2>
        <p className="mb-6">
          Tous les paiements se font via notre système sécurisé. Les frais de livraison et autres coûts sont clairement indiqués avant la confirmation de la commande.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">4. Limitation de responsabilité</h2>
        <p className="mb-6">
          CourseMax ne peut être tenu responsable des retards ou incidents liés à la livraison imputables à des tiers ou à des circonstances indépendantes de notre volonté.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">5. Modification des conditions</h2>
        <p className="mb-6">
          Nous nous réservons le droit de modifier ces conditions à tout moment. Les utilisateurs seront informés via l’application ou le site web.
        </p>

        <p className="text-lg mt-12">
          Pour toute question ou clarification concernant ces conditions, contactez-nous à <strong>contact@coursemax.ca</strong> ou par téléphone au <strong>438-558-7872</strong>.
        </p>
      </main>

      <AppFooter />
    </div>
  );
};

export default Terms;