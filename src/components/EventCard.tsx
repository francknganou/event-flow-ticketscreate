import { Calendar, MapPin, Users, Ticket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  location: string;
  price: number;
  image: string;
  capacity: number;
  availableTickets: number;
  category: string;
}

export const EventCard = ({ 
  title, 
  date, 
  location, 
  price, 
  image, 
  capacity, 
  availableTickets,
  category 
}: EventCardProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
          <span className="text-xs font-bold text-accent-foreground">{price}€</span>
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
          >
            <Ticket className="w-4 h-4 mr-2" />
            {availableTickets === 0 ? 'Complet' : 'Réserver'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};