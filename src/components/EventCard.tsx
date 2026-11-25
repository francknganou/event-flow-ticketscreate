import { Calendar, MapPin, Users, Ticket, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BookingModal } from "@/pages/BookingModal";
import { useApp } from "@/contexts/AppContext";
import { Event } from "@/data/events";

interface EventCardProps extends Event {}

export const EventCard = (props: EventCardProps) => {
  const { title, date, location, price, image, capacity, availableTickets, category } = props;
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [userRole, setUserRole] = useState("");
  const { formatPrice, language } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem('userRole') || '';
    setUserRole(role);
  }, []);
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = language === 'fr' ? 'fr-FR' : 'en-US';
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const locale = language === 'fr' ? 'fr-FR' : 'en-US';
    return date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleReservation = () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setIsBookingOpen(true);
  };

  const handleDeleteEvent = () => {
    if (!window.confirm(`Supprimer l’événement « ${title} » ? Cette action est définitive.`)) return;
    fetch(`http://127.0.0.1:8000/api/events.php?id=${encodeURIComponent(props.id)}`,{method:'DELETE',headers:{Authorization:`Bearer ${localStorage.getItem('sessionToken')||''}`}})
      .then(async response=>{const result=await response.json();if(!response.ok)throw new Error(result.error||'Suppression impossible');window.location.reload();})
      .catch(error=>window.alert(error instanceof Error?error.message:'Service indisponible.'));
  };

  const texts = {
    fr: { reserve: 'Réserver', full: 'Complet' },
    en: { reserve: 'Book', full: 'Sold Out' }
  };

  const t = (texts as any)[language] || texts.en;

  return (
    <Card className="group overflow-hidden bg-card border-border shadow-card transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl">
      <div className="relative">
        <img 
          src={image} 
          alt={title}
          className="w-full h-48 object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm px-2 py-1 rounded-md">
          <span className="text-xs font-medium text-primary-foreground">{category}</span>
        </div>
        <div className="absolute top-3 right-3 bg-accent/90 backdrop-blur-sm px-2 py-1 rounded-md">
          <span className="text-xs font-bold text-accent-foreground">{formatPrice(price)}</span>
        </div>
      </div>
      
      <CardContent className="p-4 space-y-3">
        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{formatDate(date)} à {formatTime(date)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-accent" />
            <span>{location}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span>{capacity - availableTickets} / {capacity} places</span>
          </div>
        </div>
        
        <div className="pt-2 space-y-2">
          <Button 
            variant="hero" 
            size="sm" 
            className="w-full"
            disabled={availableTickets === 0}
            onClick={handleReservation}
          >
            <Ticket className="w-4 h-4 mr-2" />
            {availableTickets === 0 ? t.full : t.reserve}
          </Button>
          
          {userRole === 'admin' && (
            <Button 
              variant="destructive" 
              size="sm" 
              className="w-full"
              onClick={handleDeleteEvent}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {language === 'fr' ? 'Supprimer' : 'Delete'}
            </Button>
          )}
        </div>
      
      <BookingModal 
        event={props}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
      </CardContent>
    </Card>
  );
};
