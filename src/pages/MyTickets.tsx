import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Ticket, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";

const MyTickets = () => {
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const { formatPrice, language } = useApp();

  useEffect(() => {
    const bookings = JSON.parse(localStorage.getItem('userBookings') || '[]');
    setUserBookings(bookings);
  }, []);

  const texts = {
    fr: {
      myTickets: 'Mes tickets',
      manageReservations: 'Gérez vos réservations et téléchargez vos billets',
      confirmed: 'Confirmé',
      pending: 'En attente',
      downloadTicket: 'Télécharger le billet',
      viewDetails: 'Voir les détails',
      noTickets: 'Aucun ticket',
      noTicketsDesc: 'Vous n\'avez pas encore de billets réservés',
      exploreEvents: 'Explorer les événements',
      total: 'Total',
      tickets: 'tickets'
    },
    en: {
      myTickets: 'My Tickets',
      manageReservations: 'Manage your reservations and download your tickets',
      confirmed: 'Confirmed',
      pending: 'Pending',
      downloadTicket: 'Download Ticket',
      viewDetails: 'View Details',
      noTickets: 'No Tickets',
      noTicketsDesc: 'You don\'t have any reserved tickets yet',
      exploreEvents: 'Explore Events',
      total: 'Total',
      tickets: 'tickets'
    }
  };

  const t = texts[language];

  const formatDate = (dateString: string) => {
    const locale = language === 'fr' ? 'fr-FR' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">{t.myTickets}</h1>
          <p className="text-muted-foreground">{t.manageReservations}</p>
        </div>

        <div className="space-y-6">
          {userBookings.map((booking) => (
            <Card key={booking.id} className="border border-border">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{booking.eventTitle}</CardTitle>
                  <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                    {booking.status === 'confirmed' ? t.confirmed : t.pending}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(booking.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{booking.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Ticket className="w-4 h-4" />
                      <span>
                        {Object.entries(booking.tickets || {}).map(([ticketId, quantity]: [string, any]) => 
                          `${quantity} ${t.tickets}`
                        ).join(', ')}
                      </span>
                    </div>
                    <div className="text-lg font-semibold text-foreground">
                      {t.total}: {formatPrice(booking.total)}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <Button variant="hero" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      {t.downloadTicket}
                    </Button>
                    <Button variant="outline" className="w-full">
                      {t.viewDetails}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {userBookings.length === 0 && (
          <div className="text-center py-12">
            <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">{t.noTickets}</h3>
            <p className="text-muted-foreground mb-4">{t.noTicketsDesc}</p>
            <a href="/events">
              <Button variant="hero">{t.exploreEvents}</Button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTickets;