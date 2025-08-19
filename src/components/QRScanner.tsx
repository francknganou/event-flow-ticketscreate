import { useState, useRef, useEffect } from 'react';
import { QrCode, X, User, Phone, Mail, Calendar, MapPin, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import QrScanner from 'qr-scanner';
import { useApp } from '@/contexts/AppContext';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TicketData {
  eventId: string;
  eventTitle: string;
  date: string;
  location: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  tickets: {[key: string]: number};
  total: number;
  bookingId: string;
  purchaseDate: string;
}

export const QRScanner = ({ isOpen, onClose }: QRScannerProps) => {
  const { formatPrice, language } = useApp();
  const [scannedData, setScannedData] = useState<TicketData | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  const texts = {
    fr: {
      scanner: 'Scanner QR Code',
      scanTicket: 'Scanner un ticket',
      startScan: 'Démarrer le scan',
      stopScan: 'Arrêter le scan',
      ticketInfo: 'Informations du ticket',
      customer: 'Client',
      event: 'Événement',
      purchaseDate: 'Date d\'achat',
      total: 'Total payé',
      bookingId: 'ID de réservation',
      close: 'Fermer',
      scanError: 'Erreur lors du scan',
      invalidQR: 'QR Code invalide'
    },
    en: {
      scanner: 'QR Code Scanner',
      scanTicket: 'Scan a ticket',
      startScan: 'Start Scan',
      stopScan: 'Stop Scan',
      ticketInfo: 'Ticket Information',
      customer: 'Customer',
      event: 'Event',
      purchaseDate: 'Purchase Date',
      total: 'Total Paid',
      bookingId: 'Booking ID',
      close: 'Close',
      scanError: 'Scan Error',
      invalidQR: 'Invalid QR Code'
    }
  };

  const t = texts[language];

  useEffect(() => {
    if (isOpen && isScanning && videoRef.current) {
      startScanner();
    }
    
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
    };
  }, [isOpen, isScanning]);

  const startScanner = async () => {
    try {
      if (videoRef.current) {
        qrScannerRef.current = new QrScanner(
          videoRef.current,
          (result) => handleScanResult(result.data),
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );
        await qrScannerRef.current.start();
      }
    } catch (err) {
      setError(t.scanError);
      console.error('Error starting scanner:', err);
    }
  };

  const stopScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleScanResult = (data: string) => {
    try {
      const parsedData = JSON.parse(data) as TicketData;
      setScannedData(parsedData);
      setError('');
      stopScanner();
    } catch (err) {
      setError(t.invalidQR);
    }
  };

  const handleStartScan = () => {
    setIsScanning(true);
    setScannedData(null);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto">
      <Card className="w-full max-w-2xl mx-4 my-8 border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            {t.scanner}
          </CardTitle>
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
          {!scannedData && !isScanning && (
            <div className="text-center space-y-4">
              <div className="bg-muted/50 p-8 rounded-lg">
                <QrCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t.scanTicket}</p>
              </div>
              <Button variant="hero" onClick={handleStartScan} className="w-full">
                {t.startScan}
              </Button>
            </div>
          )}

          {isScanning && (
            <div className="space-y-4">
              <div className="relative">
                <video 
                  ref={videoRef}
                  className="w-full h-64 object-cover rounded-lg border border-border"
                />
              </div>
              <Button variant="outline" onClick={stopScanner} className="w-full">
                {t.stopScan}
              </Button>
              {error && (
                <div className="text-destructive text-sm text-center">{error}</div>
              )}
            </div>
          )}

          {scannedData && (
            <div className="space-y-6">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <h3 className="font-semibold text-primary text-lg mb-2">{t.ticketInfo}</h3>
                <Badge variant="secondary" className="mb-4">
                  {t.bookingId}: {scannedData.bookingId}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Info */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="w-5 h-5" />
                      {t.customer}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="font-medium">{scannedData.user.firstName} {scannedData.user.lastName}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span>{scannedData.user.email}</span>
                    </div>
                    {scannedData.user.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{scannedData.user.phone}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Event Info */}
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Ticket className="w-5 h-5" />
                      {t.event}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="font-medium">{scannedData.eventTitle}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(scannedData.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{scannedData.location}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Purchase Details */}
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">{t.purchaseDate}:</p>
                      <p className="text-muted-foreground">
                        {new Date(scannedData.purchaseDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">{t.total}:</p>
                      <p className="text-muted-foreground">
                        {formatPrice(scannedData.total)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setScannedData(null)} className="flex-1">
                  Scanner un autre
                </Button>
                <Button variant="hero" onClick={onClose} className="flex-1">
                  {t.close}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};