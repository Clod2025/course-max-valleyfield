import { Header } from "@/components/header";
import { AppFooter } from "@/components/AppFooter";

const Privacy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-24 max-w-5xl">
        <h1 className="text-5xl font-black mb-8 text-foreground">Politique de Confidentialité</h1>
        <p className="text-lg mb-6">
          Chez <strong>CourseMax</strong>, la protection de vos informations personnelles est notre priorité. Cette politique explique quelles données nous collectons, comment nous les utilisons et vos droits.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">1. Données collectées</h2>
        <ul className="list-disc list-inside mb-6">
          <li>Informations de compte : nom, courriel, mot de passe.</li>
          <li>Données de commande et historique d’achat.</li>
          <li>Informations de localisation pour les livraisons.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">2. Utilisation des données</h2>
        <ul className="list-disc list-inside mb-6">
          <li>Fournir et améliorer nos services de livraison.</li>
          <li>Communiquer avec vous à propos de vos commandes et mises à jour importantes.</li>
          <li>Analyser l’utilisation de notre plateforme pour optimiser votre expérience.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8 mb-4">3. Partage des données</h2>
        <p className="mb-6">
          Nous ne vendons jamais vos informations personnelles. Elles peuvent être partagées uniquement avec nos partenaires logistiques pour assurer la livraison de vos commandes.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">4. Sécurité</h2>
        <p className="mb-6">
          Nous mettons en œuvre des mesures techniques et organisationnelles pour protéger vos données contre tout accès non autorisé.
        </p>

        <h2 className="text-2xl font-bold mt-8 mb-4">5. Vos droits</h2>
        <p className="mb-6">
          Vous pouvez demander l’accès, la correction ou la suppression de vos données en nous contactant à <strong>contact@coursemax.ca</strong>.
        </p>

        <p className="text-lg mt-12">
          Pour toute question concernant cette politique, veuillez nous contacter à <strong>contact@coursemax.ca</strong> ou par téléphone au <strong>438-558-7872</strong>.
        </p>
      </main>

      <AppFooter />
    </div>
  );
};

export default Privacy;
