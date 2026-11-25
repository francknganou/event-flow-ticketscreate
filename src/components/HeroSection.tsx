import { Button } from "@/components/ui/button";
import { Search, CalendarCheck, Users, Star } from "lucide-react";
import heroImage from "@/assets/hero-concert.jpg";
<<<<<<< HEAD
import { useApp } from "@/contexts/AppContext";

export const HeroSection = () => {
  const {t}=useApp();
=======

export const HeroSection = () => {
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      {/* Background Image avec overlay */}
      <div 
<<<<<<< HEAD
        className="absolute inset-0 bg-cover bg-center bg-no-repeat motion-safe:animate-hero-zoom"
        style={{ backgroundImage: `url(${heroImage})`, filter: "brightness(1.2) contrast(1.25) saturate(1.25)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/25 via-violet-950/25 to-slate-950/35"></div>
=======
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-hero/80"></div>
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
<<<<<<< HEAD
          <h1 style={{ animationDelay: "80ms" }} className="motion-safe:animate-fade-up text-4xl md:text-6xl font-bold text-white mb-4">
            {t("hero.title")}
            <span className="bg-gradient-primary bg-clip-text text-transparent">{t("hero.highlight")}</span>
          </h1>
          
          <p style={{ animationDelay: "180ms" }} className="motion-safe:animate-fade-up text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            {t("hero.description")}
          </p>
          
          <div style={{ animationDelay: "280ms" }} className="motion-safe:animate-fade-up flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <a href="/events#event-list">
              <Button variant="hero" size="lg" className="font-semibold">
                <Search className="w-5 h-5 mr-2" />
                {t("hero.explore")}
              </Button>
            </a>
            <a href="/my-tickets">
              <Button variant="outline" size="lg" className="bg-background/10 backdrop-blur-sm border-white/20 text-white hover:bg-background/20 hover:text-white">
                <CalendarCheck className="w-5 h-5 mr-2" />
                {t("hero.reservations")}
=======
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            Vos événements
            <span className="bg-gradient-primary bg-clip-text text-transparent"> préférés</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Découvrez et réservez vos places pour les meilleurs événements : concerts, théâtres, festivals et bien plus encore.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <a href="/login">
              <Button variant="hero" size="lg" className="font-semibold">
                <Search className="w-5 h-5 mr-2" />
                Explorer les événements
              </Button>
            </a>
            <a href="/my-tickets">
              <Button variant="outline" size="lg" className="bg-background/10 backdrop-blur-sm border-white/20 text-foreground hover:bg-background/20">
                <CalendarCheck className="w-5 h-5 mr-2" />
                Mes réservations
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
              </Button>
            </a>
          </div>
          
          {/* Stats */}
<<<<<<< HEAD
          <div style={{ animationDelay: "380ms" }} className="motion-safe:animate-fade-up grid grid-cols-3 gap-6 mt-12 max-w-lg mx-auto">
=======
          <div className="grid grid-cols-3 gap-6 mt-12 max-w-lg mx-auto">
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-primary" />
              </div>
<<<<<<< HEAD
              <div className="text-2xl font-bold text-white">50K+</div>
              <div className="text-sm text-white/65">{t("hero.users")}</div>
=======
              <div className="text-2xl font-bold text-foreground">50K+</div>
              <div className="text-sm text-muted-foreground">Utilisateurs</div>
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CalendarCheck className="w-6 h-6 text-accent" />
              </div>
<<<<<<< HEAD
              <div className="text-2xl font-bold text-white">1200+</div>
              <div className="text-sm text-white/65">{t("hero.events")}</div>
=======
              <div className="text-2xl font-bold text-foreground">1200+</div>
              <div className="text-sm text-muted-foreground">Événements</div>
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="w-6 h-6 text-primary" />
              </div>
<<<<<<< HEAD
              <div className="text-2xl font-bold text-white">4.8/5</div>
              <div className="text-sm text-white/65">{t("hero.satisfaction")}</div>
=======
              <div className="text-2xl font-bold text-foreground">4.8/5</div>
              <div className="text-sm text-muted-foreground">Satisfaction</div>
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
            </div>
          </div>
        </div>
      </div>
    </section>
  );
<<<<<<< HEAD
};
=======
};
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
