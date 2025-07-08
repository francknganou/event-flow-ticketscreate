import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Ticket, Download } from "lucide-react";

const MyTickets = () => {
  const userTickets = [
    {
      id: "1",
      eventTitle: "Festival Électro Summer",
      date: "2024-08-15T20:00:00",
      location: "Parc des Expositions, Paris",
      ticketType: "VIP",
      quantity: 2,
      totalPrice: 90,
      status: "confirmed",
      qrCode: "QR123456789"
    },
    {
      id: "2",
      eventTitle: "Concert Jazz & Blues",
      date: "2024-07-20T19:30:00",
      location: "Théâtre National, Lyon",
      ticketType: "Standard",
      quantity: 1,
      totalPrice: 35,
      status: "confirmed",
      qrCode: "QR987654321"
    }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
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
          <h1 className="text-4xl font-bold text-foreground mb-4">Mes tickets</h1>
          <p className="text-muted-foreground">Gérez vos réservations et téléchargez vos billets</p>
        </div>

        <div className="space-y-6">
          {userTickets.map((ticket) => (
            <Card key={ticket.id} className="border border-border">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{ticket.eventTitle}</CardTitle>
                  <Badge variant={ticket.status === 'confirmed' ? 'default' : 'secondary'}>
                    {ticket.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(ticket.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{ticket.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Ticket className="w-4 h-4" />
                      <span>{ticket.quantity} x {ticket.ticketType}</span>
                    </div>
                    <div className="text-lg font-semibold text-foreground">
                      Total: {ticket.totalPrice}€
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <Button variant="hero" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger le billet
                    </Button>
                    <Button variant="outline" className="w-full">
                      Voir les détails
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {userTickets.length === 0 && (
          <div className="text-center py-12">
            <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Aucun ticket</h3>
            <p className="text-muted-foreground mb-4">Vous n'avez pas encore de billets réservés</p>
            <Button variant="hero">Explorer les événements</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTickets;