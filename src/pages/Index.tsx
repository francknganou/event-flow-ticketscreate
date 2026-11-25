
import { HeroSection } from "@/components/HeroSection";
import { EventCard } from "@/components/EventCard";
import { Event } from "@/data/events";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Filter, SortAsc } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

const Index = () => {
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const {t,language}=useApp();
  useEffect(() => { fetch('http://127.0.0.1:8000/api/events.php').then(r=>r.json()).then((events: Event[])=>setFeaturedEvents(events.slice(0,6))).catch(()=>setFeaturedEvents([])); }, []);
  
  return (
    <div className="min-h-screen bg-transparent">
      
      <HeroSection />
      
      {/* Events Section */}
      <section className="py-16 container mx-auto px-4">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {t("events.featured")}
            </h2>
            <p className="text-muted-foreground">
              {t("events.description")}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              {t("events.filter")}
            </Button>
            <Button variant="outline" size="sm">
              <SortAsc className="w-4 h-4 mr-2" />
              {t("events.nearest")}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredEvents.map((event) => (
            <EventCard key={event.id} {...event} />
          ))}
        </div>
        
        <div className="text-center mt-12">
          <a href="/events">
            <Button variant="hero" size="lg">
              {language === "fr" ? "Voir tous les événements" : "View all events"}
            </Button>
          </a>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="mt-16 border-t border-white/10 bg-black/65 backdrop-blur-md">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="mb-4 flex items-center gap-2"><img src="/eventflow-icon.svg" alt="" className="h-8 w-8" /><h3 className="font-bold text-foreground">EventFlow</h3></div>
              <p className="text-sm text-muted-foreground">
                La plateforme de réservation d'événements la plus simple et la plus fiable.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Événements</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Concerts</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Théâtres</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Festivals</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Sport</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Centre d'aide</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Remboursements</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Légal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">CGU</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Confidentialité</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 EventFlow. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
