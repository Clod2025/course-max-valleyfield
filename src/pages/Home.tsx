import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/header";
import { AppFooter } from "@/components/AppFooter";
import { Truck, Clock, Star, MapPin, CheckCircle, Shield, Users, Zap, Package, User, ShoppingCart, ArrowRight, Sparkles, ThumbsUp, MessageCircle, Award, TrendingUp, Heart, Phone, Mail, Edit, Send } from "lucide-react";
import deliveryCarHero from "@/assets/delivery-car-hero.jpg";
import deliveryHero from "@/assets/delivery-hero.jpg";
import { useAuth } from "@/hooks/useAuth";

const Home = () => {
  const { user } = useAuth();
  const [testimonialText, setTestimonialText] = useState("");
  const [isTestimonialOpen, setIsTestimonialOpen] = useState(false);

  // Données des avis clients
  const customerReviews = [
    {
      id: 1,
      name: "Marie Dubois",
      rating: 5,
      comment: "Service exceptionnel! Livraison en 30 minutes exactement. Je recommande vivement!",
      date: "Il y a 2 jours"
    },
    {
      id: 2,
      name: "Jean Tremblay",
      rating: 5,
      comment: "Très pratique, j'ai pu commander de plusieurs magasins en une seule fois. Parfait!",
      date: "Il y a 1 semaine"
    },
    {
      id: 3,
      name: "Sophie Martin",
      rating: 5,
      comment: "Livreur très professionnel et sympathique. Service de qualité!",
      date: "Il y a 3 jours"
    },
    {
      id: 4,
      name: "Pierre Gagnon",
      rating: 5,
      comment: "Rapide, fiable et économique. CourseMax a changé ma façon de faire mes courses!",
      date: "Il y a 5 jours"
    },
    {
      id: 5,
      name: "Isabelle Roy",
      rating: 5,
      comment: "Application intuitive et service client réactif. Je suis très satisfaite!",
      date: "Il y a 1 semaine"
    }
  ];

  const handleSubmitTestimonial = () => {
    // TODO: Implementer l'envoi du témoignage
    console.log("Témoignage:", testimonialText);
    setTestimonialText("");
    setIsTestimonialOpen(false);
  };

  const handleViewTestimonials = (e: React.MouseEvent) => {
    e.preventDefault();
    // Scroll vers la section des avis
    const reviewsSection = document.getElementById('avis-clients-section');
    if (reviewsSection) {
      reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* ============================================
            HERO SECTION 1 - Optimisée pour confiance
            ============================================ */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0">
            <img 
              src={deliveryCarHero} 
              alt="Livraison rapide CourseMax" 
              className="w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-black/50"></div>
          </div>
          
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 animate-float" style={{animationDelay: '0s', animationDuration: '3s'}}>
              <Package className="w-8 h-8 text-white/20" />
            </div>
            <div className="absolute top-40 right-20 animate-float" style={{animationDelay: '1s', animationDuration: '4s'}}>
              <Zap className="w-6 h-6 text-accent/30" />
            </div>
            <div className="absolute bottom-32 left-20 animate-float" style={{animationDelay: '2s', animationDuration: '3.5s'}}>
              <Clock className="w-7 h-7 text-white/15" />
            </div>
          </div>
          
          {/* Hero Content - Centré pour meilleur impact */}
          <div className="relative container mx-auto px-4 py-20">
            <div className="flex items-center justify-center">
              <div className="max-w-5xl space-y-10 text-center">
                {/* Logo et Brand */}
                <div className="space-y-8 animate-slide-up">
                  <div className="flex items-center justify-center gap-4 mb-8">
                    <div className="relative">
                      <img 
                        src="/lovable-uploads/482dd564-f9a1-48f4-bef4-6569e9c64c0b.png" 
                        alt="CourseMax" 
                        className="h-24 w-auto filter drop-shadow-2xl animate-float"
                      />
                      <div className="absolute -inset-2 bg-white/20 blur-md rounded-full -z-10"></div>
                    </div>
                    <div>
                      <h1 className="text-6xl lg:text-7xl font-black text-white tracking-tight leading-tight">
                        Course<span className="text-accent">Max</span>
                      </h1>
                      <div className="w-32 h-1 bg-accent rounded-full mt-3 mx-auto"></div>
                    </div>
                  </div>
                  
                  {/* Main Headline - Plus impactant */}
                  <div className="space-y-6">
                    <h2 className="text-5xl lg:text-8xl font-black leading-none text-white">
                      <span className="block">Livraison</span>
                      <span className="block text-accent drop-shadow-2xl mt-2">Ultra-Rapide</span>
                      <span className="block text-5xl lg:text-6xl font-bold opacity-90 mt-3">à Valleyfield</span>
                    </h2>
                    
                    {/* Badge Timer amélioré */}
                    <div className="flex items-center justify-center gap-4 py-6">
                      <div className="flex items-center gap-3 bg-accent/20 backdrop-blur-md rounded-full px-8 py-4 border-2 border-accent/40 shadow-coursemax">
                        <Zap className="w-8 h-8 text-accent animate-pulse-gentle" />
                        <span className="text-accent font-bold text-2xl">25-45 min</span>
                      </div>
                      <div className="text-white/90 text-xl font-medium">Garantie de livraison ⚡</div>
                    </div>
                  </div>
                  
                  <p className="text-2xl lg:text-3xl text-white/90 max-w-3xl mx-auto font-semibold leading-relaxed">
                    Tous vos magasins préférés réunis en une seule app. 
                    <span className="block mt-4 text-accent font-bold text-2xl flex items-center justify-center gap-3">
                      <CheckCircle className="w-8 h-8" /> Fiable • <Zap className="w-8 h-8" /> Rapide • <Award className="w-8 h-8" /> Professionnel
                    </span>
                  </p>
                </div>
                
                {/* Call to Action Buttons - Plus visibles */}
                <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
                  <Link to="/stores" className="transform transition-all duration-300 hover:scale-105">
                    <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-2xl px-16 py-10 text-2xl font-black rounded-2xl w-full sm:w-auto hover:shadow-white/40 transition-all">
                      <ShoppingCart className="w-8 h-8 mr-4" />
                      Commander maintenant
                    </Button>
                  </Link>
                  <Link to="/register" className="transform transition-all duration-300 hover:scale-105">
                    <Button size="lg" className="bg-accent text-white hover:bg-accent/90 shadow-2xl px-16 py-10 text-2xl font-black rounded-2xl w-full sm:w-auto hover:shadow-accent/40 transition-all">
                      <User className="w-8 h-8 mr-4" />
                      Gratuit • S'inscrire
                    </Button>
                  </Link>
                </div>
                
                {/* Trust Indicators - ULTRA VISIBLES avec fond blanc */}
                <div className="flex flex-wrap items-center justify-center gap-6 pt-12 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                  <div className="flex items-center gap-3 bg-white rounded-full px-8 py-4 shadow-2xl border-4 border-green-400">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                    <span className="text-gray-900 font-black text-xl">100% Gratuit</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white rounded-full px-8 py-4 shadow-2xl border-4 border-blue-400">
                    <Shield className="w-10 h-10 text-blue-600" />
                    <span className="text-gray-900 font-black text-xl">Paiement sécurisé</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white rounded-full px-8 py-4 shadow-2xl border-4 border-purple-400">
                    <Users className="w-10 h-10 text-purple-600" />
                    <span className="text-gray-900 font-black text-xl">+1000 clients satisfaits</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Wave separator */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-20 lg:h-28">
              <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" className="fill-background"></path>
              <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" className="fill-background"></path>
              <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" className="fill-background"></path>
            </svg>
          </div>
        </section>

        {/* ============================================
            SECTION AVIS CLIENTS - Réorganisée avec ID pour scroll
            ============================================ */}
        <section id="avis-clients-section" className="py-24 bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 mb-6">
                <Star className="w-8 h-8 text-yellow-500" />
                <h2 className="text-5xl lg:text-6xl font-black text-gradient">
                  Ce que disent nos clients
                </h2>
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
              <p className="text-2xl text-gray-700 max-w-3xl mx-auto font-medium">
                Découvrez pourquoi +1000 clients font confiance à CourseMax
              </p>
              
              {/* Note moyenne mise en avant */}
              <div className="mt-8 inline-flex items-center gap-4 bg-white rounded-2xl px-10 py-6 shadow-lg">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-8 h-8 text-yellow-400 fill-current" />
                  ))}
                </div>
                <div>
                  <p className="text-4xl font-black text-gray-900">4.9/5</p>
                  <p className="text-sm text-gray-600 font-medium">sur 150+ avis vérifiés</p>
                </div>
              </div>
            </div>
            
            {/* Grille des avis améliorée */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {customerReviews.map((review, index) => (
                <Card key={review.id} className="hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-2 animate-slide-up bg-white border-2 border-transparent hover:border-accent/30" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardContent className="p-8">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-800 mb-6 italic text-lg leading-relaxed">"{review.comment}"</p>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">{review.name}</h4>
                        <p className="text-sm text-gray-500">{review.date}</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-full">
                        <ThumbsUp className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* CTA amélioré avec bouton témoignage */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button
                onClick={handleViewTestimonials}
                className="bg-gradient-coursemax text-white hover:opacity-90 shadow-coursemax hover:shadow-coursemax-hover px-12 py-6 text-xl font-bold rounded-xl transition-all transform hover:scale-105 flex items-center gap-3"
              >
                <MessageCircle className="w-6 h-6" />
                Voir tous les avis et témoignages
              </button>
              
              {/* Dialog pour laisser un témoignage */}
              <Dialog open={isTestimonialOpen} onOpenChange={setIsTestimonialOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" variant="outline" className="border-2 border-accent text-accent hover:bg-accent hover:text-white shadow-lg px-12 py-6 text-xl font-bold rounded-xl transition-all transform hover:scale-105">
                    <Edit className="w-6 h-6 mr-3" />
                    Laisser mon témoignage
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle className="text-3xl font-black flex items-center gap-3">
                      <Star className="w-8 h-8 text-yellow-500" />
                      Partagez votre expérience CourseMax
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    {!user ? (
                      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
                        <p className="text-lg font-semibold text-gray-800 mb-4">
                          Pour laisser un témoignage, vous devez être connecté
                        </p>
                        <div className="flex gap-4 justify-center">
                          <Link to="/login">
                            <Button className="bg-accent text-white hover:bg-accent/90">
                              Se connecter
                            </Button>
                          </Link>
                          <Link to="/register">
                            <Button variant="outline">
                              Créer un compte
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="text-lg font-semibold mb-2 block">
                            Votre témoignage *
                          </label>
                          <Textarea 
                            placeholder="Parlez-nous de votre expérience avec CourseMax..."
                            value={testimonialText}
                            onChange={(e) => setTestimonialText(e.target.value)}
                            rows={6}
                            className="text-lg resize-none"
                          />
                        </div>
                        <Button 
                          onClick={handleSubmitTestimonial}
                          disabled={!testimonialText.trim()}
                          className="w-full bg-gradient-coursemax text-white hover:opacity-90 text-xl font-bold py-6"
                        >
                          <Send className="w-6 h-6 mr-3" />
                          Publier mon témoignage
                        </Button>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </section>

        {/* ============================================
            HERO SECTION 2 - Stats & Premium Service
            ============================================ */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Background Image with Parallax Effect */}
          <div className="absolute inset-0">
            <img 
              src={deliveryHero} 
              alt="Service de livraison professionnel" 
              className="w-full h-full object-cover transform scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/70 via-primary/50 to-accent/70"></div>
          </div>
          
          {/* Parallax Content */}
          <div className="relative container mx-auto px-4 py-24 text-center">
            <div className="max-w-5xl mx-auto space-y-16">
              {/* Section Title */}
              <div className="space-y-8 animate-slide-up">
                <div className="flex items-center justify-center gap-4 mb-8">
                  <Sparkles className="w-10 h-10 text-accent animate-pulse-gentle" />
                  <h2 className="text-5xl lg:text-7xl font-black text-white">
                    Service <span className="text-accent">Premium</span>
                  </h2>
                  <Sparkles className="w-10 h-10 text-accent animate-pulse-gentle" />
                </div>
                
                <p className="text-3xl lg:text-4xl text-white/95 max-w-4xl mx-auto font-bold leading-relaxed">
                  Des livreurs professionnels dédiés à votre satisfaction
                </p>
              </div>
              
              {/* Stats Grid - Amélioré */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <Card className="bg-white/20 backdrop-blur-lg border-2 border-white/30 text-white hover:bg-white/30 transition-all duration-300 hover:scale-110 hover:shadow-2xl shadow-coursemax">
                  <CardContent className="p-10 text-center">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-accent animate-pulse-gentle" />
                    <div className="text-6xl font-black text-accent mb-2">25-45</div>
                    <div className="text-base font-bold opacity-90">Min de livraison</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/20 backdrop-blur-lg border-2 border-white/30 text-white hover:bg-white/30 transition-all duration-300 hover:scale-110 hover:shadow-2xl shadow-coursemax">
                  <CardContent className="p-10 text-center">
                    <MapPin className="w-12 h-12 mx-auto mb-4 text-accent animate-pulse-gentle" />
                    <div className="text-6xl font-black text-accent mb-2">15+</div>
                    <div className="text-base font-bold opacity-90">Magasins partenaires</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/20 backdrop-blur-lg border-2 border-white/30 text-white hover:bg-white/30 transition-all duration-300 hover:scale-110 hover:shadow-2xl shadow-coursemax">
                  <CardContent className="p-10 text-center">
                    <Zap className="w-12 h-12 mx-auto mb-4 text-accent animate-pulse-gentle" />
                    <div className="text-6xl font-black text-accent mb-2">24/7</div>
                    <div className="text-base font-bold opacity-90">Service disponible</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/20 backdrop-blur-lg border-2 border-white/30 text-white hover:bg-white/30 transition-all duration-300 hover:scale-110 hover:shadow-2xl shadow-coursemax">
                  <CardContent className="p-10 text-center">
                    <Star className="w-12 h-12 mx-auto mb-4 text-accent animate-pulse-gentle" />
                    <div className="text-6xl font-black text-accent mb-2">5★</div>
                    <div className="text-base font-bold opacity-90">Note moyenne</div>
                  </CardContent>
                </Card>
              </div>
              
              {/* CTA Section améliorée - TRÈS VISIBLES */}
              <div className="space-y-12 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                <h3 className="text-4xl lg:text-5xl font-black text-white">
                  Prêt à gagner du temps?
                </h3>
                <p className="text-2xl text-white/90 max-w-3xl mx-auto font-medium">
                  Rejoignez les +1000 clients qui font confiance à CourseMax pour leurs livraisons quotidiennes
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <Link to="/stores" className="transform transition-all duration-300 hover:scale-105">
                    <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-2xl px-16 py-10 text-2xl font-black rounded-2xl hover:shadow-white/40 transition-all border-4 border-white">
                      <ShoppingCart className="w-8 h-8 mr-4" />
                      Voir les magasins
                    </Button>
                  </Link>
                  <Link to="/register" className="transform transition-all duration-300 hover:scale-105">
                    <Button size="lg" className="bg-accent text-white hover:bg-accent/90 shadow-2xl px-16 py-10 text-2xl font-black rounded-2xl hover:shadow-accent/40 transition-all border-4 border-accent">
                      <User className="w-8 h-8 mr-4" />
                      Créer un compte
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-24 lg:h-32">
              <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" className="fill-background"></path>
              <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" className="fill-background"></path>
              <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" className="fill-background"></path>
            </svg>
          </div>
        </section>

        {/* ============================================
            FEATURES SECTION - Pourquoi choisir CourseMax
            ============================================ */}
        <section className="py-24 bg-gradient-to-b from-background to-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <h2 className="text-5xl lg:text-6xl font-black mb-6 text-gradient">
                Pourquoi choisir CourseMax?
              </h2>
              <p className="text-2xl text-muted-foreground max-w-3xl mx-auto font-medium">
                La solution de livraison la plus rapide et fiable de Valleyfield
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-12">
              <Card className="text-center hover:shadow-coursemax-hover transition-all duration-300 hover:scale-105 animate-slide-up bg-white border-2 border-transparent hover:border-primary/20">
                <CardContent className="p-12">
                  <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                    <Truck className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-black mb-6 text-foreground">Livraison Express</h3>
                  <p className="text-muted-foreground text-xl leading-relaxed">
                    Recevez vos commandes en 25-45 minutes maximum, 7 jours sur 7
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center hover:shadow-coursemax-hover transition-all duration-300 hover:scale-105 animate-slide-up bg-white border-2 border-transparent hover:border-accent/20" style={{ animationDelay: '0.1s' }}>
                <CardContent className="p-12">
                  <div className="w-20 h-20 bg-gradient-accent rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                    <MapPin className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-black mb-6 text-foreground">Tous vos magasins</h3>
                  <p className="text-muted-foreground text-xl leading-relaxed">
                    Épiceries, pharmacies, et plus encore réunis en une seule application
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center hover:shadow-coursemax-hover transition-all duration-300 hover:scale-105 animate-slide-up bg-white border-2 border-transparent hover:border-primary/20" style={{ animationDelay: '0.2s' }}>
                <CardContent className="p-12">
                  <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                    <Star className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-black mb-6 text-foreground">Service Premium</h3>
                  <p className="text-muted-foreground text-xl leading-relaxed">
                    Livreurs professionnels et service client réactif disponible 24/7
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ============================================
            HOW IT WORKS - Comment ça marche
            ============================================ */}
        <section className="py-24 bg-accent/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <h2 className="text-5xl lg:text-6xl font-black mb-6 text-gradient">
                Comment ça marche?
              </h2>
              <p className="text-2xl text-muted-foreground font-medium">
                Commandez en 3 étapes simples
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
              <div className="text-center animate-slide-up relative">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-12 w-24 h-24 bg-gradient-primary text-white rounded-full flex items-center justify-center text-4xl font-black shadow-coursemax mb-6">
                  1
                </div>
                <div className="pt-12">
                  <div className="w-32 h-32 bg-gradient-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
                    <MapPin className="w-16 h-16 text-primary" />
                  </div>
                  <h3 className="text-2xl font-black mb-4">Choisissez votre magasin</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">Sélectionnez parmi nos 15+ magasins partenaires près de chez vous</p>
                </div>
              </div>
              
              <div className="text-center animate-slide-up relative" style={{ animationDelay: '0.1s' }}>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-12 w-24 h-24 bg-gradient-accent text-white rounded-full flex items-center justify-center text-4xl font-black shadow-coursemax mb-6">
                  2
                </div>
                <div className="pt-12">
                  <div className="w-32 h-32 bg-gradient-accent/10 rounded-full flex items-center justify-center mx-auto mb-8">
                    <ShoppingCart className="w-16 h-16 text-accent" />
                  </div>
                  <h3 className="text-2xl font-black mb-4">Passez votre commande</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">Décrivez vos besoins et payez uniquement les frais de livraison</p>
                </div>
              </div>
              
              <div className="text-center animate-slide-up relative" style={{ animationDelay: '0.2s' }}>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-12 w-24 h-24 bg-gradient-primary text-white rounded-full flex items-center justify-center text-4xl font-black shadow-coursemax mb-6">
                  3
                </div>
                <div className="pt-12">
                  <div className="w-32 h-32 bg-gradient-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Package className="w-16 h-16 text-primary" />
                  </div>
                  <h3 className="text-2xl font-black mb-4">Recevez rapidement</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">Votre livreur vous apporte tout en 25-45 minutes</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
            FINAL CTA SECTION - Conversion finale
            ============================================ */}
        <section className="py-32 bg-gradient-coursemax text-white relative overflow-hidden">
          {/* Effet de fond animé */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent rounded-full blur-3xl animate-float" style={{animationDelay: '1.5s'}}></div>
          </div>
          
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-5xl lg:text-7xl font-black mb-8 leading-tight">
              Prêt à gagner du temps?
            </h2>
            <p className="text-3xl mb-12 opacity-95 max-w-4xl mx-auto font-bold leading-relaxed">
              Rejoignez les +1000 clients qui font confiance à CourseMax pour leurs livraisons quotidiennes
            </p>
            
            {/* Stats rapides */}
            <div className="flex flex-wrap items-center justify-center gap-8 mb-16">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-300" />
                <span className="text-2xl font-bold">Livraison gratuite*</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-300" />
                <span className="text-2xl font-bold">Garantie satisfaction</span>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-purple-300" />
                <span className="text-2xl font-bold">-50% de temps perdu</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link to="/stores" className="transform transition-all duration-300 hover:scale-105">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-2xl px-14 py-8 text-2xl font-black rounded-2xl hover:shadow-white/40 transition-all border-4 border-white">
                  <ShoppingCart className="w-8 h-8 mr-4" />
                  Voir les magasins disponibles
                </Button>
              </Link>
              <Link to="/register" className="transform transition-all duration-300 hover:scale-105">
                <Button size="lg" variant="outline" className="border-4 border-white text-white hover:bg-white/10 shadow-2xl px-14 py-8 text-2xl font-black rounded-2xl transition-all bg-transparent">
                  <User className="w-8 h-8 mr-4" />
                  Créer un compte gratuit
                </Button>
              </Link>
            </div>
            
            {/* Contact rapide */}
            <div className="mt-16 pt-12 border-t border-white/20 flex flex-wrap items-center justify-center gap-8 text-xl">
              <div className="flex items-center gap-3">
                <Phone className="w-6 h-6" />
                <span className="font-bold">1-800-COURSEMAX</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-6 h-6" />
                <span className="font-bold">support@coursemax.ca</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6" />
                <span className="font-bold">Disponible 24/7</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
};

export default Home;