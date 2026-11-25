import { useState, useRef, useEffect } from 'react';
import { QrCode, X, User, Phone, Mail, Calendar, MapPin, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  const [verdict, setVerdict] = useState<string>('');
  const [manualCode, setManualCode] = useState('');
  const [events, setEvents] = useState<{id:string;title:string}[]>([]);
  const [eventId, setEventId] = useState('');
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
      invalidQR: 'QR Code invalide', manual: 'Saisir le code du billet', validate: 'Vérifier le billet', gate: 'Porte / événement',
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
      invalidQR: 'Invalid QR Code', manual: 'Enter ticket code', validate: 'Validate ticket', gate: 'Gate / event',
    }
  };

  const t = (texts as any)[language] || texts.en;

  useEffect(() => {
    if(isOpen) fetch('/api/events.php',{headers:{Authorization:`Bearer ${localStorage.getItem('sessionToken')||''}`}}).then(r=>r.ok?r.json():[]).then((rows:any[])=>setEvents(rows.map(e=>({id:String(e.id),title:e.title})))).catch(()=>setEvents([]));
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
    stopScanner();
    fetch('/api/scan.php',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${localStorage.getItem('sessionToken')||''}`},body:JSON.stringify({token:data,eventId:eventId||undefined})})
      .then(async response=>{const result=await response.json();if(!response.ok){setVerdict(result.verdict||'unknown');setError(result.error||t.invalidQR);return;}setVerdict('valid');setScannedData({...result,purchaseDate:new Date().toISOString()});setError('');})
      .catch(err=>{setVerdict('unknown');setError(err instanceof Error?err.message:t.invalidQR);});
  };

  const handleStartScan = () => {
    setIsScanning(true);
    setScannedData(null);
    setError('');
    setVerdict('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto motion-safe:animate-fade-in">
      <Card className="motion-safe:animate-fade-up w-full max-w-2xl mx-4 my-8 border-border shadow-2xl">
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
              {events.length>0&&<label className="block text-left text-sm font-medium">{t.gate}<select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" value={eventId} onChange={e=>setEventId(e.target.value)}><option value="">{language==='fr'?'Tous les événements accessibles':'All accessible events'}</option>{events.map(ev=><option key={ev.id} value={ev.id}>{ev.title}</option>)}</select></label>}
              <div className="flex gap-2"><Input aria-label={t.manual} placeholder={t.manual} value={manualCode} onChange={e=>setManualCode(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&manualCode.trim())handleScanResult(manualCode.trim());}}/><Button variant="outline" disabled={!manualCode.trim()} onClick={()=>handleScanResult(manualCode.trim())}>{t.validate}</Button></div>
              {error&&<div role="alert" className={`rounded-xl p-4 text-center text-sm font-semibold ${verdict==='other_event'?'border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300':'border border-destructive/30 bg-destructive/10 text-destructive'}`}><span className="mb-1 block uppercase tracking-wide">{verdict==='other_event'?'Autre événement':verdict==='forged'?'Falsifié':verdict==='used'?'Déjà utilisé':verdict==='cancelled'?'Annulé':verdict==='refunded'?'Remboursé':verdict==='expired'?'Expiré':'Inconnu'}</span>{error}</div>}
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
                <div role="alert" className={`rounded-xl p-4 text-center text-sm font-semibold ${verdict==='other_event'?'border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300':'border border-destructive/30 bg-destructive/10 text-destructive'}`}>{verdict&&<span className="mb-1 block uppercase tracking-wide">{verdict==='other_event'?'Autre événement':verdict==='forged'?'Falsifié':verdict==='used'?'Déjà utilisé':verdict==='cancelled'?'Annulé':verdict==='refunded'?'Remboursé':verdict==='expired'?'Expiré':'Inconnu'}</span>}{error}</div>
              )}
            </div>
          )}

          {scannedData && (
            <div className="space-y-6">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                <h3 className="font-semibold text-emerald-700 dark:text-emerald-300 text-lg mb-2">{t.ticketInfo} · Entrée validée</h3>
                <Badge variant="secondary" className="mb-4">
                  {t.bookingId}: {scannedData.bookingId}
                </Badge>
                <p className="text-sm font-medium">Zone / catégorie : {(scannedData as any).zone || (scannedData as any).ticketType || 'Standard'}</p>
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
