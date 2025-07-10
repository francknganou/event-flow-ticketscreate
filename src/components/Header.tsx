import { Ticket, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const role = localStorage.getItem('userRole') || '';
    setIsLoggedIn(loggedIn);
    setUserRole(role);
  }, []);

  const handleLogout = () => {
    localStorage.clear(); // Supprimer toutes les données stockées
    setIsLoggedIn(false);
    setUserRole("");
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const showBackButton = location.pathname !== '/';

  return (
    <header className="bg-background/95 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Ticket className="w-5 h-5 text-primary-foreground" />
          </div>
          <a href="/" className="text-xl font-bold text-foreground">EventFlow</a>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <a href="/events" className="text-muted-foreground hover:text-foreground transition-colors">
            Événements
          </a>
          {isLoggedIn && (
            <a href="/my-tickets" className="text-muted-foreground hover:text-foreground transition-colors">
              Mes tickets
            </a>
          )}
          <a href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
            À propos
          </a>
        </nav>
        
        <div className="flex items-center gap-2">
          {showBackButton && (
            <Button variant="ghost" size="sm" onClick={handleGoBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          )}
          {isLoggedIn ? (
            <>
              {userRole === 'admin' && (
                <a href="/dashboard">
                  <Button variant="ghost" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </a>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Déconnexion
              </Button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </header>
  );
};