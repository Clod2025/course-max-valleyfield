import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Footer } from "@/components/Footer";
import { Truck, Clock, Star, MapPin, CheckCircle, Shield, Users, Zap, Package } from "lucide-react";
import deliveryCarHero from "@/assets/delivery-car-hero.jpg";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-accent min-h-[90vh] flex items-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src={deliveryCarHero} 
            alt="Livraison rapide CourseMax" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/70 via-primary/65 to-accent/70"></div>
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating Elements */}
          <div className="absolute top-20 left-10 animate-bounce" style={{animationDelay: '0s', animationDuration: '3s'}}>
            <Package className="w-8 h-8 text-white/20" />
          </div>
          <div className="absolute top-40 right-20 animate-bounce" style={{animationDelay: '1s', animationDuration: '4s'}}>
            <Zap className="w-6 h-6 text-accent/30" />
          </div>
          <div className="absolute bottom-32 left-20 animate-bounce" style={{animationDelay: '2s', animationDuration: '3.5s'}}>
            <Clock className="w-7 h-7 text-white/15" />
          </div>
          
          {/* Geometric Shapes */}
          <div className="absolute top-32 right-32 w-32 h-32 border border-white/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-48 right-10 w-20 h-20 bg-accent/10 rounded-lg rotate-45 animate-spin" style={{animationDuration: '20s'}}></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content - Enhanced */}
            <div className="space-y-8 animate-slide-up">
              {/* Logo and Brand */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-8">
                  <div className="relative">
                    <img 
                      src="/lovable-uploads/482dd564-f9a1-48f4-bef4-6569e9c64c0b.png" 
                      alt="CourseMax" 
                      className="h-16 w-auto filter drop-shadow-2xl"
                    />
                    <div className="absolute -inset-2 bg-white/20 blur-md rounded-full -z-10"></div>
                  </div>
                  <div>
                    <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight">
                      Course<span className="text-accent">Max</span>
                    </h1>
                    <div className="w-24 h-1 bg-accent rounded-full mt-2"></div>
                  </div>
                </div>
                
                {/* Main Headline */}
                <div className="space-y-4">
                  <h2 className="text-5xl lg:text-7xl font-black leading-none text-white">
                    <span className="block">Livraison</span>
                    <span className="block text-accent drop-shadow-lg">Ultra-Rapide</span>
                    <span className="block text-3xl lg:text-4xl font-semibold opacity-90">à Valleyfield</span>
                  </h2>
                  
                  <div className="flex items-center gap-3 py-4">
                    <div className="flex items-center gap-2 bg-accent/20 backdrop-blur-sm rounded-full px-4 py-2 border border-accent/30">
                      <Zap className="w-5 h-5 text-accent" />
                      <span className="text-accent font-semibold text-lg">25-45 min</span>
                    </div>
                    <div className="text-white/80 text-lg">garantie de livraison</div>
                  </div>
                </div>
                
                <p className="text-xl lg:text-2xl text-white/90 max-w-lg font-medium leading-relaxed">
                  Tous vos magasins préférés réunis en une seule app. 
                  <span className="block mt-2 text-accent font-semibold">
                    Fiable • Rapide • Professionnel
                  </span>
                </p>
              </div>
              
              {/* Call to Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/stores">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-2xl px-10 py-6 text-xl font-bold rounded-xl transition-all hover:scale-105 hover:shadow-white/20">
                    <Truck className="w-6 h-6 mr-3" />
                    Commander maintenant
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="lg" variant="outline" className="border-2 border-white/80 text-white hover:bg-white/10 backdrop-blur-sm px-10 py-6 text-xl font-semibold rounded-xl transition-all hover:scale-105">
                    Créer un compte gratuit
                  </Button>
                </Link>
              </div>
              
              {/* Enhanced Trust Indicators */}
              <div className="flex items-center gap-8 pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/20 rounded-full">
                    <CheckCircle className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-white font-medium">100% Gratuit</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/20 rounded-full">
                    <Shield className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-white font-medium">Paiement sécurisé</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/20 rounded-full">
                    <Users className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-white font-medium">+1000 clients</span>
                </div>
              </div>
            </div>
            
            {/* Right Content - Enhanced Stats Cards */}
            <div className="grid grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Card className="bg-white/15 backdrop-blur-md border-white/20 text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <CardContent className="p-8 text-center">
                  <div className="text-4xl font-black text-accent mb-2">25-45</div>
                  <div className="text-sm font-medium opacity-90">Minutes de livraison</div>
                  <Clock className="w-6 h-6 mx-auto mt-3 text-accent/60" />
                </CardContent>
              </Card>
              
              <Card className="bg-white/15 backdrop-blur-md border-white/20 text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <CardContent className="p-8 text-center">
                  <div className="text-4xl font-black text-accent mb-2">15+</div>
                  <div className="text-sm font-medium opacity-90">Magasins partenaires</div>
                  <MapPin className="w-6 h-6 mx-auto mt-3 text-accent/60" />
                </CardContent>
              </Card>
              
              <Card className="bg-white/15 backdrop-blur-md border-white/20 text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <CardContent className="p-8 text-center">
                  <div className="text-4xl font-black text-accent mb-2">24/7</div>
                  <div className="text-sm font-medium opacity-90">Service disponible</div>
                  <Zap className="w-6 h-6 mx-auto mt-3 text-accent/60" />
                </CardContent>
              </Card>
              
              <Card className="bg-white/15 backdrop-blur-md border-white/20 text-white hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <CardContent className="p-8 text-center">
                  <div className="text-4xl font-black text-accent mb-2">5★</div>
                  <div className="text-sm font-medium opacity-90">Note moyenne</div>
                  <Star className="w-6 h-6 mx-auto mt-3 text-accent/60" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Enhanced Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-16 lg:h-24">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" className="fill-background"></path>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" className="fill-background"></path>
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" className="fill-background"></path>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gradient">
              Pourquoi choisir CourseMax?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              La solution de livraison la plus rapide et fiable de Valleyfield
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-coursemax transition-all duration-300 hover:scale-105 animate-slide-up">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Truck className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">Livraison Express</h3>
                <p className="text-muted-foreground text-lg">
                  Recevez vos commandes en 25-45 minutes maximum, 7 jours sur 7
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-coursemax transition-all duration-300 hover:scale-105 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-accent rounded-full flex items-center justify-center mx-auto mb-6">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">Tous vos magasins</h3>
                <p className="text-muted-foreground text-lg">
                  Épiceries, pharmacies, et plus encore réunis en une seule application
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-coursemax transition-all duration-300 hover:scale-105 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-foreground">Service Premium</h3>
                <p className="text-muted-foreground text-lg">
                  Livreurs professionnels et service client réactif disponible 24/7
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-accent/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gradient">
              Comment ça marche?
            </h2>
            <p className="text-xl text-muted-foreground">
              Commandez en 3 étapes simples
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center animate-slide-up">
              <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Choisissez votre magasin</h3>
              <p className="text-muted-foreground">Sélectionnez parmi nos 15+ magasins partenaires près de chez vous</p>
            </div>
            
            <div className="text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Passez votre commande</h3>
              <p className="text-muted-foreground">Décrivez vos besoins et payez uniquement les frais de livraison</p>
            </div>
            
            <div className="text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Recevez rapidement</h3>
              <p className="text-muted-foreground">Votre livreur vous apporte tout en 25-45 minutes</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Prêt à gagner du temps?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Rejoignez les +1000 clients qui font confiance à CourseMax pour leurs livraisons quotidiennes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/stores">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 px-8 py-4 text-lg font-semibold">
                Voir les magasins disponibles
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg">
                Créer un compte gratuit
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;