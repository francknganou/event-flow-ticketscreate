import { Button } from "@/components/ui/button";
import { Search, CalendarCheck, Users, Star } from "lucide-react";
import heroImage from "@/assets/hero-concert.jpg";

export const HeroSection = () => {
  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      {/* Background Image avec overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-hero/80"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            Vos événements
            <span className="bg-gradient-primary bg-clip-text text-transparent"> préférés</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Découvrez et réservez vos places pour les meilleurs événements : concerts, théâtres, festivals et bien plus encore.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button variant="hero" size="lg" className="font-semibold">
              <Search className="w-5 h-5 mr-2" />
              Explorer les événements
            </Button>
            <Button variant="outline" size="lg" className="bg-background/10 backdrop-blur-sm border-white/20 text-foreground hover:bg-background/20">
              <CalendarCheck className="w-5 h-5 mr-2" />
              Mes réservations
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-12 max-w-lg mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground">50K+</div>
              <div className="text-sm text-muted-foreground">Utilisateurs</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CalendarCheck className="w-6 h-6 text-accent" />
              </div>
              <div className="text-2xl font-bold text-foreground">1200+</div>
              <div className="text-sm text-muted-foreground">Événements</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground">4.8/5</div>
              <div className="text-sm text-muted-foreground">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};