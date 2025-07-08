import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Header = () => {
  return (
    <header className="bg-background/95 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Ticket className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">EventFlow</h1>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <a href="/events" className="text-muted-foreground hover:text-foreground transition-colors">
            Événements
          </a>
          <a href="/my-tickets" className="text-muted-foreground hover:text-foreground transition-colors">
            Mes tickets
          </a>
          <a href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
            À propos
          </a>
        </nav>
        
        <div className="flex items-center gap-2">
          <a href="/login">
            <Button variant="ghost" size="sm">
              Connexion
            </Button>
          </a>
          <a href="/signup">
            <Button variant="hero" size="sm">
              Inscription
            </Button>
          </a>
        </div>
      </div>
    </header>
  );
};