import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/header";
import { Truck, Clock, Star, MapPin } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-primary text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Livraison rapide à Valleyfield
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Commandez de tous vos magasins préférés et recevez vos achats en 25-45 minutes
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/stores">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                Commander maintenant
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Créer un compte
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gradient">
            Pourquoi choisir CourseMax?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="p-6">
                <Truck className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Livraison rapide</h3>
                <p className="text-muted-foreground">
                  Recevez vos commandes en 25-45 minutes maximum
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Tous vos magasins</h3>
                <p className="text-muted-foreground">
                  Épiceries, pharmacies, et plus encore en un seul endroit
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <Star className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Service de qualité</h3>
                <p className="text-muted-foreground">
                  Livreurs professionnels et service client réactif
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-accent/20 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 text-gradient">
            Prêt à commander?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Créez votre compte et commencez à économiser du temps dès aujourd'hui
          </p>
          <Link to="/stores">
            <Button size="lg" className="gradient-primary text-white">
              Voir les magasins disponibles
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;