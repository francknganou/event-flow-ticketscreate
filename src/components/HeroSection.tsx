import { Button } from "@/components/ui/button";
import { Search, CalendarCheck, Users, Star } from "lucide-react";
import heroImage from "@/assets/hero-concert.jpg";
import { useApp } from "@/contexts/AppContext";

export const HeroSection = () => {
  const {t}=useApp();
  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      {/* Background Image avec overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat motion-safe:animate-hero-zoom"
        style={{ backgroundImage: `url(${heroImage})`, filter: "brightness(1.2) contrast(1.25) saturate(1.25)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/25 via-violet-950/25 to-slate-950/35"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
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
              </Button>
            </a>
          </div>
          
          {/* Stats */}
          <div style={{ animationDelay: "380ms" }} className="motion-safe:animate-fade-up grid grid-cols-3 gap-6 mt-12 max-w-lg mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="text-2xl font-bold text-white">50K+</div>
              <div className="text-sm text-white/65">{t("hero.users")}</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CalendarCheck className="w-6 h-6 text-accent" />
              </div>
              <div className="text-2xl font-bold text-white">1200+</div>
              <div className="text-sm text-white/65">{t("hero.events")}</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <div className="text-2xl font-bold text-white">4.8/5</div>
              <div className="text-sm text-white/65">{t("hero.satisfaction")}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
