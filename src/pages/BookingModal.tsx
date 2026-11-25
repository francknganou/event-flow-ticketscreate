<<<<<<< HEAD
import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, Check, Clock3, Download, LockKeyhole, MapPin, Minus, Plus, ShieldCheck, Ticket, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Event, TicketType } from '@/data/events';
import QRCode from 'qrcode';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';

interface BookingModalProps { event: Event; isOpen: boolean; onClose: () => void; }
type Pass = {code:string;image:string};

export const BookingModal = ({event,isOpen,onClose}:BookingModalProps) => {
  const {toast}=useToast(); const {formatPrice,language}=useApp(); const locale=language==='fr'?'fr-FR':'en-US'; const ticketTypes:TicketType[]=event.ticketTypes?.length?event.ticketTypes:[{id:'standard',name:'Standard',price:event.price,quantity:event.availableTickets,availableQuantity:event.availableTickets,description:'Entrée standard'}];
  const [selected,setSelected]=useState<Record<string,number>>(()=>ticketTypes.length?{[ticketTypes[0].id]:1}:{}); const quantity=Object.values(selected).reduce((sum,n)=>sum+n,0); const [phone,setPhone]=useState(''); const [busy,setBusy]=useState(false);
  const [bookingId,setBookingId]=useState('');const [pending,setPending]=useState(false);const [expiresAt,setExpiresAt]=useState('');const [passes,setPasses]=useState<Pass[]>([]);
  const firstName=localStorage.getItem('userFirstName')||'';const lastName=localStorage.getItem('userLastName')||'';const email=localStorage.getItem('userEmail')||'';
  const total=useMemo(()=>Object.entries(selected).reduce((sum,[id,n])=>sum+(ticketTypes.find(t=>t.id===id)?.price||0)*n,0),[selected,ticketTypes]);
  const format=formatPrice;
  const submit=async()=>{
    setBusy(true);
    try {
      const response=await fetch('http://127.0.0.1:8000/api/bookings.php',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${localStorage.getItem('sessionToken')||''}`},body:JSON.stringify({eventId:event.id,user:{phone},tickets:selected})});
      const result=await response.json();if(!response.ok)throw new Error(result.error||'Réservation impossible');setBookingId(result.id);setPending(result.status==='pending_payment');setExpiresAt(result.expiresAt||'');
      const images=await Promise.all((result.ticketCodes||[]).map(async(code:string)=>({code,image:await QRCode.toDataURL(code,{width:300,margin:1,color:{dark:'#17132b',light:'#ffffff'}})})));setPasses(images);
      toast({title:result.status==='confirmed'?'Réservation confirmée':'Places réservées temporairement',description:result.status==='confirmed'?'Vos billets sécurisés sont prêts.':'La réservation attend un paiement confirmé.'});
    }catch(error){toast({title:'Réservation impossible',description:error instanceof Error?error.message:'Service temporairement indisponible',variant:'destructive'});}finally{setBusy(false);}
  };
  const downloadPass=(pass:Pass,index:number)=>{const a=document.createElement('a');a.href=pass.image;a.download=`EventFlow-billet-${bookingId}-${index+1}.png`;a.click();};
  if(!isOpen)return null;
  return createPortal(<div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-0 backdrop-blur-sm motion-safe:animate-fade-in sm:p-5" role="dialog" aria-modal="true" aria-label="Réservation">
    <Card className="motion-safe:animate-fade-up my-auto w-full max-w-5xl overflow-hidden rounded-none border-0 shadow-2xl sm:rounded-3xl">
      <div className="flex items-center justify-between border-b px-5 py-4 sm:px-7"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">EventFlow · Billetterie</p><h2 className="mt-1 text-xl font-bold">{bookingId?(pending?'Réservation en attente':'Votre réservation est prête'):'Finaliser la réservation'}</h2></div><Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer"><X className="h-5 w-5"/></Button></div>
      {!bookingId ? <div className="grid md:grid-cols-[1.15fr_.85fr]">
        <section className="p-5 sm:p-8"><div className="mb-7 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><Ticket className="h-5 w-5"/></span><div><h3 className="font-semibold">Choisissez vos places</h3><p className="text-sm text-muted-foreground">Les disponibilités sont revérifiées au moment de réserver.</p></div></div>
          <div className="mb-6 rounded-2xl border bg-card p-4 sm:p-5"><div className="mb-4 flex flex-wrap items-center gap-2"><Badge variant="secondary">{event.category}</Badge><span className="text-sm font-medium">{event.title}</span></div><div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2"><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary"/>{new Date(event.date).toLocaleString(locale,{dateStyle:'medium',timeStyle:'short'})}</span><span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary"/>{event.location}</span></div></div>
          <div className="space-y-3">{ticketTypes.map(ticket=><div key={ticket.id} className="rounded-2xl border p-4 sm:p-5"><div className="flex items-center justify-between gap-4"><div><h4 className="font-semibold">{ticket.name}</h4><p className="mt-1 text-sm text-muted-foreground">{ticket.description||'Accès à l’événement · billet individuel'}</p><p className="mt-3 text-lg font-bold">{format(ticket.price)} <span className="text-sm font-normal text-muted-foreground">/ personne</span></p></div><div className="flex items-center gap-3 rounded-xl bg-muted/60 p-1"><Button variant="ghost" size="icon" className="h-9 w-9" onClick={()=>setSelected(s=>({...s,[ticket.id]:Math.max(0,(s[ticket.id]||0)-1)}))} disabled={!selected[ticket.id]} aria-label={`Retirer un ticket ${ticket.name}`}><Minus className="h-4 w-4"/></Button><span className="w-5 text-center font-semibold">{selected[ticket.id]||0}</span><Button variant="ghost" size="icon" className="h-9 w-9" onClick={()=>setSelected(s=>({...s,[ticket.id]:Math.min(ticket.availableQuantity,10-(quantity-(s[ticket.id]||0)),(s[ticket.id]||0)+1)}))} disabled={(selected[ticket.id]||0)>=ticket.availableQuantity||quantity>=10} aria-label={`Ajouter un ticket ${ticket.name}`}><Plus className="h-4 w-4"/></Button></div></div><p className="mt-3 text-xs text-muted-foreground">{ticket.availableQuantity.toLocaleString(locale)} disponibles</p></div>)}</div><p className="mt-2 text-xs text-muted-foreground">Maximum de 10 billets par commande.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label>Nom du participant</Label><Input value={`${firstName} ${lastName}`.trim()} readOnly className="bg-muted/40"/></div><div className="space-y-1.5"><Label>Adresse e-mail</Label><Input value={email} readOnly className="bg-muted/40"/></div></div><div className="mt-4 space-y-1.5"><Label htmlFor="booking-phone">Téléphone <span className="font-normal text-muted-foreground">(facultatif)</span></Label><Input id="booking-phone" type="tel" placeholder="+237 6XX XXX XXX" value={phone} onChange={e=>setPhone(e.target.value)}/></div>
        </section>
        <aside className="flex flex-col border-t bg-muted/25 p-5 sm:p-8 md:border-l md:border-t-0"><div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">Récapitulatif</p><h3 className="mt-2 text-lg font-semibold">Votre commande</h3></div><div className="space-y-3 border-b pb-5 text-sm">{Object.entries(selected).filter(([,n])=>n>0).map(([id,n])=><div key={id} className="flex justify-between gap-3"><span className="text-muted-foreground">{n} × {ticketTypes.find(t=>t.id===id)?.name}</span><span className="font-medium">{format((ticketTypes.find(t=>t.id===id)?.price||0)*n)}</span></div>)}<div className="flex justify-between gap-3"><span className="text-muted-foreground">Frais de service</span><span className="font-medium">Inclus</span></div></div><div className="flex justify-between py-5 text-base font-bold"><span>Total</span><span>{format(total)}</span></div><div className="mb-5 rounded-xl bg-emerald-500/10 p-3 text-xs leading-relaxed text-emerald-800 dark:text-emerald-200"><span className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4"/>Réservation sécurisée</span><span className="mt-1 block">Le stock est vérifié et réservé côté serveur afin d’éviter les doubles ventes.</span></div><Button className="h-12 w-full" onClick={submit} disabled={busy||quantity<1}>{busy?'Réservation en cours…':total===0?'Confirmer la réservation':`Continuer · ${format(total)}`}</Button><p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground"><LockKeyhole className="h-3.5 w-3.5"/>Connexion sécurisée à votre compte</p><p className="mt-auto pt-8 text-center text-xs leading-relaxed text-muted-foreground">En continuant, vous confirmez les informations de votre commande.</p></aside>
      </div> : <div className="mx-auto max-w-2xl p-6 text-center sm:p-10"><span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${pending?'bg-amber-100 text-amber-700':'bg-emerald-100 text-emerald-700'}`}>{pending?<Clock3 className="h-7 w-7"/>:<Check className="h-7 w-7"/>}</span><h3 className="mt-4 text-2xl font-bold">{pending?'Vos places sont retenues':'C’est confirmé !'}</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">{pending?'Le paiement en ligne n’est pas encore activé. Cette réservation temporaire ne constitue pas un billet et expirera automatiquement.':`Votre réservation n° ${bookingId} est confirmée. Présentez un QR code par participant à l’entrée.`}</p>{pending&&expiresAt&&<p className="mt-4 text-sm font-medium">Expiration prévue : {new Date(expiresAt).toLocaleString('fr-FR',{dateStyle:'medium',timeStyle:'short'})}</p>}{passes.length>0&&<div className="mt-7 grid gap-4 sm:grid-cols-2">{passes.map((pass,index)=><div key={pass.code} className="rounded-2xl border p-4"><img src={pass.image} alt={`QR code sécurisé, billet ${index+1}`} className="mx-auto h-44 w-44"/><p className="font-semibold">Billet {index+1}</p><p className="text-xs text-muted-foreground">Événement · {event.title}</p><Button variant="outline" className="mt-3 w-full" onClick={()=>downloadPass(pass,index)}><Download className="mr-2 h-4 w-4"/>Télécharger le billet</Button></div>)}</div>}{pending&&<div className="mt-6 rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-left text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">Aucun billet QR n’est émis avant confirmation du paiement par un prestataire de paiement.</div>}<Button variant="outline" className="mt-7 w-full sm:w-auto" onClick={onClose}>Fermer</Button></div>}
    </Card>
  </div>, document.body);
};
=======
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
      id: '0',
      name: 'Gratuit',
      price: 0,
      quantity: event.availableTickets,
      availableQuantity: event.availableTickets,
      description: 'Ticket gratuit'
    },
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
        user: {
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          email: userInfo.email,
          phone: userInfo.phone
        },
        tickets: selectedTickets,
        total: calculateTotal(),
        bookingId: Date.now().toString(),
        purchaseDate: new Date().toISOString(),
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
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-y-auto">
      <Card className="w-full h-full rounded-none border-0 bg-background">
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
        
        <CardContent className="space-y-6 p-6 max-w-4xl mx-auto">
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
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
