import { Calendar, MapPin, Users, Ticket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookingModal } from "@/pages/BookingModal";
import { useApp } from "@/contexts/AppContext";
import { Event } from "@/data/events";

interface EventCardProps extends Event {}

export const EventCard = (props: EventCardProps) => {
  const { title, date, location, price, image, capacity, availableTickets, category } = props;
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const { formatPrice, language } = useApp();
  const navigate = useNavigate();
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

  const texts = {
    fr: { reserve: 'Réserver', full: 'Complet' },
    en: { reserve: 'Book', full: 'Sold Out' }
  };

  const t = texts[language];

  return (
    <Card className="group overflow-hidden bg-card border-border hover:shadow-glow transition-all duration-300 hover:scale-[1.02]">
      <div className="relative">
        <img 
          src={image} 
          alt={title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
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
        
        <div className="pt-2">
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