import { useState, useEffect } from 'react';
import { X, Plus, Minus, QrCode, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { Event, TicketType } from '@/data/events';
import QRCode from 'qrcode';
import { useToast } from '@/hooks/use-toast';

interface BookingModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingModal = ({ event, isOpen, onClose }: BookingModalProps) => {
  const { formatPrice, language } = useApp();
  const { toast } = useToast();
  const [selectedTickets, setSelectedTickets] = useState<{[key: string]: number}>({});
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [bookingComplete, setBookingComplete] = useState(false);
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  const texts = {
    fr: {
      booking: 'Réservation',
      userInfo: 'Informations personnelles',
      firstName: 'Prénom',
      lastName: 'Nom',
      email: 'Email',
      phone: 'Téléphone',
      selectTickets: 'Sélection des tickets',
      total: 'Total',
      confirm: 'Confirmer la réservation',
      success: 'Réservation confirmée !',
      downloadQR: 'Télécharger le QR Code',
      close: 'Fermer',
      ticketPrice: 'Prix',
      quantity: 'Quantité'
    },
    en: {
      booking: 'Booking',
      userInfo: 'Personal Information',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      phone: 'Phone',
      selectTickets: 'Select Tickets',
      total: 'Total',
      confirm: 'Confirm Booking',
      success: 'Booking Confirmed!',
      downloadQR: 'Download QR Code',
      close: 'Close',
      ticketPrice: 'Price',
      quantity: 'Quantity'
    }
  };

  const t = texts[language];

  const defaultTicketTypes: TicketType[] = [
    {
      id: '1',
      name: 'Standard',
      price: event.price,
      quantity: event.availableTickets,
      availableQuantity: event.availableTickets,
      description: 'Ticket standard'
    },
    {
      id: '2',
      name: 'VIP',
      price: event.price * 2,
      quantity: Math.floor(event.availableTickets * 0.2),
      availableQuantity: Math.floor(event.availableTickets * 0.2),
      description: 'Ticket VIP avec avantages'
    }
  ];

  const ticketTypes = event.ticketTypes || defaultTicketTypes;

  const updateTicketQuantity = (ticketId: string, change: number) => {
    setSelectedTickets(prev => {
      const newQuantity = Math.max(0, (prev[ticketId] || 0) + change);
      const ticket = ticketTypes.find(t => t.id === ticketId);
      const maxQuantity = ticket?.availableQuantity || 0;
      
      return {
        ...prev,
        [ticketId]: Math.min(newQuantity, maxQuantity)
      };
    });
  };

  const calculateTotal = () => {
    return Object.entries(selectedTickets).reduce((total, [ticketId, quantity]) => {
      const ticket = ticketTypes.find(t => t.id === ticketId);
      return total + (ticket?.price || 0) * quantity;
    }, 0);
  };

  const generateQRCode = async (bookingData: any) => {
    try {
      const qrData = JSON.stringify({
        eventId: event.id,
        eventTitle: event.title,
        date: event.date,
        location: event.location,
        user: userInfo,
        tickets: selectedTickets,
        total: calculateTotal(),
        bookingId: Date.now().toString(),
        timestamp: new Date().toISOString()
      });
      
      const qrCodeUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeDataUrl(qrCodeUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleBooking = async () => {
    if (!userInfo.firstName || !userInfo.lastName || !userInfo.email) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    const hasSelectedTickets = Object.values(selectedTickets).some(qty => qty > 0);
    if (!hasSelectedTickets) {
      toast({
        title: "Aucun ticket sélectionné",
        description: "Veuillez sélectionner au moins un ticket",
        variant: "destructive"
      });
      return;
    }

    // Save booking to localStorage
    const existingBookings = JSON.parse(localStorage.getItem('userBookings') || '[]');
    const newBooking = {
      id: Date.now().toString(),
      eventId: event.id,
      eventTitle: event.title,
      date: event.date,
      location: event.location,
      user: userInfo,
      tickets: selectedTickets,
      total: calculateTotal(),
      status: 'confirmed',
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('userBookings', JSON.stringify([...existingBookings, newBooking]));
    
    await generateQRCode(newBooking);
    setBookingComplete(true);
    
    toast({
      title: "Réservation confirmée !",
      description: "Votre réservation a été enregistrée avec succès"
    });
  };

  const downloadQRCode = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement('a');
      link.download = `ticket-${event.title}-${Date.now()}.png`;
      link.href = qrCodeDataUrl;
      link.click();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto">
      <Card className="w-full max-w-2xl mx-4 my-8 border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{bookingComplete ? t.success : t.booking}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!bookingComplete ? (
            <>
              {/* Event Info */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg">{event.title}</h3>
                <p className="text-muted-foreground">
                  {new Date(event.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')} - {event.location}
                </p>
              </div>

              {/* User Information */}
              <div className="space-y-4">
                <h4 className="font-medium">{t.userInfo}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">{t.firstName} *</Label>
                    <Input
                      id="firstName"
                      value={userInfo.firstName}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">{t.lastName} *</Label>
                    <Input
                      id="lastName"
                      value={userInfo.lastName}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userInfo.email}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">{t.phone}</Label>
                    <Input
                      id="phone"
                      value={userInfo.phone}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Ticket Selection */}
              <div className="space-y-4">
                <h4 className="font-medium">{t.selectTickets}</h4>
                {ticketTypes.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <p className="font-medium">{ticket.name}</p>
                      <p className="text-sm text-muted-foreground">{ticket.description}</p>
                      <p className="text-sm font-medium">{t.ticketPrice}: {formatPrice(ticket.price)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateTicketQuantity(ticket.id, -1)}
                        disabled={(selectedTickets[ticket.id] || 0) === 0}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center">{selectedTickets[ticket.id] || 0}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateTicketQuantity(ticket.id, 1)}
                        disabled={(selectedTickets[ticket.id] || 0) >= ticket.availableQuantity}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>{t.total}:</span>
                  <span>{formatPrice(calculateTotal())}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  {t.close}
                </Button>
                <Button 
                  variant="hero" 
                  onClick={handleBooking}
                  className="flex-1"
                  disabled={calculateTotal() === 0}
                >
                  {t.confirm}
                </Button>
              </div>
            </>
          ) : (
            /* Booking Success with QR Code */
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-primary">{t.success}</h3>
                <p className="text-muted-foreground">
                  Votre réservation pour "{event.title}" a été confirmée
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p><strong>{t.total}:</strong> {formatPrice(calculateTotal())}</p>
                </div>
              </div>

              {qrCodeDataUrl && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img src={qrCodeDataUrl} alt="QR Code" className="border border-border rounded-lg" />
                  </div>
                  <Button 
                    variant="hero" 
                    onClick={downloadQRCode}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t.downloadQR}
                  </Button>
                </div>
              )}

              <Button variant="outline" onClick={onClose} className="w-full">
                {t.close}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};