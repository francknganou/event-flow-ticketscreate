<<<<<<< HEAD
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, CheckCircle2, Clock3, Download, MapPin, Printer, Ticket, TicketCheck } from "lucide-react";
import QRCode from "qrcode";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/contexts/AppContext";


type Pass={code:string;image:string;scannedAt:string|null};
type Booking={id:string;event_title:string;event_date:string;location:string;user_email:string;tickets:Record<string,number>;total:number;status:string;expires_at:string|null;created_at:string;passes:Pass[]};
const escapeHtml=(text:string)=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

const MyTickets = () => {
  const [bookings,setBookings]=useState<Booking[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const {formatPrice,language}=useApp();
  useEffect(()=>{fetch('http://127.0.0.1:8000/api/bookings.php',{headers:{Authorization:`Bearer ${localStorage.getItem('sessionToken')||''}`}}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error||'Chargement impossible');const rows=await Promise.all((data as any[]).map(async b=>({...b,event_title:b.event_title,event_date:b.event_date,total:Number(b.total),passes:await Promise.all((b.passes||[]).map(async(p:any)=>({...p,image:await QRCode.toDataURL(p.code,{width:260,margin:2,errorCorrectionLevel:'M',color:{dark:'#000000',light:'#FFFFFF'}})})))})));setBookings(rows);}).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
  const locale=language==='fr'?'fr-FR':'en-US';const confirmed=useMemo(()=>bookings.filter(b=>b.status==='confirmed'),[bookings]);const pending=useMemo(()=>bookings.filter(b=>b.status==='pending_payment'),[bookings]);
  const download=(p:Pass,id:string,index:number)=>{const a=document.createElement('a');a.href=p.image;a.download=`EventFlow-billet-${id}-${index+1}.png`;a.click();};
  const printBooking=(b:Booking)=>{const w=window.open('','_blank','width=760,height=850');if(!w)return;const passes=b.passes.map((p,i)=>`<article><img src="${p.image}" alt="QR billet ${i+1}"><strong>Billet ${i+1}</strong><small>${p.scannedAt?'Déjà contrôlé':'Valable une fois, à l’entrée'}</small></article>`).join('');w.document.write(`<!doctype html><html lang="fr"><meta charset="utf-8"><title>Billets EventFlow</title><style>body{font:16px Arial,sans-serif;color:#17132b;margin:36px}header{border-bottom:2px solid #6d45d9;padding-bottom:16px}h1{margin-bottom:4px}p{color:#555}.tickets{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:28px}article{border:1px solid #ddd;border-radius:16px;padding:18px;text-align:center;break-inside:avoid}img{display:block;width:220px;height:220px;object-fit:contain;margin:0 auto 12px}small{display:block;margin-top:6px;color:#666}@media print{body{margin:15mm}}</style><header><h1>EventFlow · Billets</h1><p>Réservation ${escapeHtml(b.id)} · ${escapeHtml(b.event_title)}</p></header><p>${new Date(b.event_date).toLocaleString('fr-FR',{dateStyle:'full',timeStyle:'short'})} · ${escapeHtml(b.location)}</p><p>Participant : ${escapeHtml(b.user_email)} · Total : ${escapeHtml(formatPrice(b.total))}</p><div class="tickets">${passes}</div><script>window.onload=()=>window.print()</script></html>`);w.document.close();};
  return <div className="min-h-screen bg-transparent"><main className="container mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12"><div className="mb-8 rounded-3xl bg-gradient-to-br from-violet-950/80 via-violet-900/75 to-indigo-900/80 p-6 text-white backdrop-blur-sm md:p-9"><Badge className="border-0 bg-white/10 text-white hover:bg-white/10">Espace participant</Badge><h1 className="mt-4 text-3xl font-bold md:text-4xl">Mes réservations</h1><p className="mt-2 max-w-xl text-sm text-white/70">Retrouvez vos billets, leurs codes d’accès et l’état de vos réservations.</p><div className="mt-6 flex flex-wrap gap-6 text-sm"><span className="flex items-center gap-2"><TicketCheck className="h-4 w-4"/>{confirmed.length} confirmée{confirmed.length===1?'':'s'}</span><span className="flex items-center gap-2"><Clock3 className="h-4 w-4"/>{pending.length} en attente</span></div></div>
    {error&&<Card className="mb-5 border-destructive/40"><CardContent className="p-5"><p className="font-medium">{error}</p><Link to="/login" className="mt-2 inline-block text-sm text-primary underline">Se connecter</Link></CardContent></Card>}
    {loading?<div className="space-y-4">{[1,2].map(n=><Card key={n} className="h-40 animate-pulse bg-muted/50"/>)}</div>:bookings.length===0?<Card className="rounded-2xl border-dashed"><CardContent className="flex flex-col items-center p-10 text-center"><Ticket className="h-12 w-12 text-muted-foreground"/><h2 className="mt-4 text-xl font-semibold">Aucun billet pour le moment</h2><p className="mt-2 text-sm text-muted-foreground">Explorez les événements et retrouvez vos réservations ici.</p><Link to="/events"><Button className="mt-5">Découvrir les événements</Button></Link></CardContent></Card>:<div className="space-y-5">{bookings.map(b=>{const isPending=b.status==='pending_payment';const expired=b.status==='expired';const date=new Date(b.event_date);return <Card key={b.id} className="overflow-hidden rounded-2xl border-border/70 shadow-sm"><div className="grid md:grid-cols-[minmax(0,1fr)_250px]"><div className="p-5 md:p-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.15em] text-muted-foreground">Réservation #{b.id}</p><h2 className="mt-2 text-xl font-bold">{b.event_title}</h2></div><Badge className={isPending?'bg-amber-100 text-amber-800 hover:bg-amber-100':expired?'bg-slate-100 text-slate-700 hover:bg-slate-100':'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'}>{isPending?'Paiement en attente':expired?'Expirée':'Confirmée'}</Badge></div><div className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2"><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary"/>{date.toLocaleString(locale,{dateStyle:'full',timeStyle:'short'})}</span><span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary"/>{b.location}</span><span className="flex items-center gap-2"><Ticket className="h-4 w-4 text-primary"/>{Object.values(b.tickets||{}).reduce((n,q)=>n+Number(q),0)} billet(s)</span><span className="font-semibold text-foreground">Total · {formatPrice(b.total)}</span></div>{isPending&&<p className="mt-5 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">Les places sont réservées temporairement; aucun billet ne sera émis avant confirmation du paiement.</p>}</div><aside className="flex flex-col justify-center gap-3 border-t bg-muted/25 p-5 md:border-l md:border-t-0">{b.passes.length? <><div className="flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="h-4 w-4 text-emerald-600"/>{b.passes.length} billet(s) prêt(s)</div>{b.passes.length===1&&<img src={b.passes[0].image} alt="QR du billet EventFlow" className="mx-auto h-32 w-32 rounded-lg bg-white p-1"/>}<Button variant="outline" onClick={()=>printBooking(b)}><Printer className="mr-2 h-4 w-4"/>Imprimer / enregistrer PDF</Button>{b.passes.length===1&&<Button variant="ghost" size="sm" onClick={()=>download(b.passes[0],b.id,0)}><Download className="mr-2 h-4 w-4"/>Télécharger le QR</Button>}</>:<p className="text-sm text-muted-foreground">Les billets sécurisés apparaîtront ici après confirmation.</p>}</aside></div></Card>})}</div>}
    </main></div>;
};
export default MyTickets;
=======
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
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
