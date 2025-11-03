import { Header } from "@/components/header";
import { AppFooter } from "@/components/AppFooter";

const Help = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-24 max-w-5xl">
        <h1 className="text-5xl font-black mb-8 text-foreground">Centre d'Aide</h1>
        
        <p className="text-lg mb-12">
          Bienvenue dans le centre d'aide de <strong>CourseMax</strong>. Trouvez rapidement les réponses à vos questions.
        </p>

        <h2 className="text-3xl font-bold mt-12 mb-6">Questions Fréquentes</h2>

        <div className="space-y-8">
          <div>
            <h3 className="text-2xl font-bold mb-3">Comment créer un compte ?</h3>
            <p className="text-lg mb-4">
              Cliquez sur "Créer un compte" dans le menu ou sur la page d'accueil. Vous devrez fournir votre nom, courriel et un mot de passe sécurisé.
            </p>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-3">Comment passer une commande ?</h3>
            <p className="text-lg mb-4">
              1. Sélectionnez votre magasin partenaire<br />
              2. Parcourez les produits disponibles<br />
              3. Ajoutez les articles à votre panier<br />
              4. Passez à la caisse et confirmez votre commande
            </p>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-3">Quels sont les frais de livraison ?</h3>
            <p className="text-lg mb-4">
              Les frais de livraison varient selon la distance et le type de magasin. Ils sont clairement affichés avant la confirmation de votre commande.
            </p>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-3">Comment suivre ma commande ?</h3>
            <p className="text-lg mb-4">
              Une fois votre commande confirmée, vous recevrez un e-mail de confirmation avec un numéro de suivi. Vous pouvez également suivre votre commande depuis votre tableau de bord.
            </p>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-3">Puis-je annuler ou modifier ma commande ?</h3>
            <p className="text-lg mb-4">
              Vous pouvez annuler votre commande dans un délai de 5 minutes après l'avoir passée. Contactez notre service client pour toute modification après ce délai.
            </p>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-3">Quels sont les modes de paiement acceptés ?</h3>
            <p className="text-lg mb-4">
              Nous acceptons les cartes de crédit (Visa, Mastercard, American Express), les cartes de débit et PayPal.
            </p>
          </div>
        </div>

        <h2 className="text-3xl font-bold mt-16 mb-6">Besoin d'aide supplémentaire ?</h2>
        <p className="text-lg mb-4">
          Notre équipe est là pour vous aider ! Contactez-nous via :
        </p>
        <ul className="list-disc list-inside mb-6 space-y-2">
          <li className="text-lg"><strong>E-mail :</strong> support@coursemax.ca</li>
          <li className="text-lg"><strong>Téléphone :</strong> 438-558-7872</li>
          <li className="text-lg"><strong>Heures d'ouverture :</strong> Lundi - Vendredi, 9h - 18h</li>
        </ul>

        <div className="bg-primary/10 border-l-4 border-primary p-6 mt-12 rounded-lg">
          <h3 className="text-2xl font-bold mb-3">💡 Astuce</h3>
          <p className="text-lg">
            Créez un compte pour accéder à vos commandes passées, gérer vos adresses de livraison et bénéficier d'offres exclusives !
          </p>
        </div>
      </main>

      <AppFooter />
    </div>
  );
};

export default Help;
