
import { HeroSection } from "@/components/HeroSection";
import { EventCard } from "@/components/EventCard";
import { Event } from "@/data/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowDownWideNarrow, Plus, ListFilter } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";

const Events = () => {
  const [searchTerm,setSearchTerm]=useState("");
  const [selectedCategory,setSelectedCategory]=useState("all");
  const [sortBy,setSortBy]=useState("date-asc");
  const [dateFilter,setDateFilter]=useState("all");
  const [priceFilter,setPriceFilter]=useState("all");
  const [allEvents,setAllEvents]=useState<Event[]>([]);
  const {t,language}=useApp();

  useEffect(()=>{let active=true;fetch('/api/events.php').then(async r=>{const data=await r.json();if(!r.ok)throw new Error('Events API unavailable');return data;}).then(data=>{if(active)setAllEvents(Array.isArray(data)?data:[]);}).catch(()=>{if(active)setAllEvents([]);});return()=>{active=false;};},[]);

  const categories=useMemo(()=>[...new Set(allEvents.map(event=>event.category).filter(Boolean))],[allEvents]);
  const filteredEvents=useMemo(()=>{
    const search=searchTerm.trim().toLocaleLowerCase();
    const matches=allEvents.filter(event=>{
      const text=`${event.title} ${event.location} ${event.category}`.toLocaleLowerCase();
      const eventDate=new Date(event.date);const today=new Date();today.setHours(0,0,0,0);const weekEnd=new Date(today);weekEnd.setDate(weekEnd.getDate()+7);
      return !Number.isNaN(eventDate.getTime())&&eventDate>=today&&(!search||text.includes(search))&&(selectedCategory==="all"||event.category===selectedCategory)&&
        (dateFilter==="all"||(!Number.isNaN(eventDate.getTime())&&eventDate>=today&&(dateFilter==="upcoming"||eventDate<weekEnd)))&&
        (priceFilter==="all"||(priceFilter==="free"?event.price===0:event.price>0));
    });
    return [...matches].sort((a,b)=>{
      if(sortBy==="price-asc")return a.price-b.price;
      if(sortBy==="price-desc")return b.price-a.price;
      const delta=new Date(a.date).getTime()-new Date(b.date).getTime();
      return sortBy==="date-desc"?-delta:delta;
    });
  },[allEvents,searchTerm,selectedCategory,sortBy,dateFilter,priceFilter]);

  const canCreate=["admin","organizer"].includes(localStorage.getItem("userRole")||"");

  return <div className="min-h-screen bg-transparent text-foreground">
    
    <HeroSection/>
    <section id="event-list" className="scroll-mt-20 bg-black/70 py-12 text-white backdrop-blur-sm md:py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="motion-safe:animate-fade-up mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div><h2 className="text-3xl font-bold tracking-tight">{t("events.featured")}</h2><p className="mt-2 text-sm text-white/60">{t("events.description")}</p></div>
        </div>

        <div className="motion-safe:animate-fade-up mb-7 grid gap-3 rounded-2xl border border-white/10 bg-white/[.04] p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(140px,.8fr))]">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55"/><Input aria-label={language==='fr'?"Rechercher par nom d’événement":"Search by event name"} value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder={language==='fr'?"Rechercher par nom d’événement…":"Search event name…"} className="border-white/15 bg-black/20 pl-9 text-white placeholder:text-white/45"/></div>
          <div className="relative"><ListFilter className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 text-white/60"/><Select value={selectedCategory} onValueChange={setSelectedCategory}><SelectTrigger aria-label={language==='fr'?"Filtrer par catégorie":"Filter by category"} className="border-white/15 bg-black/20 pl-9 text-white"><SelectValue placeholder={t("events.all")}/></SelectTrigger><SelectContent><SelectItem value="all">{t("events.all")}</SelectItem>{categories.map(category=><SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent></Select></div>
          <Select value={dateFilter} onValueChange={setDateFilter}><SelectTrigger aria-label={language==='fr'?"Filtrer par date":"Filter by date"} className="border-white/15 bg-black/20 text-white"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">{language==='fr'?"Toutes les dates":"All dates"}</SelectItem><SelectItem value="upcoming">{language==='fr'?"À venir":"Upcoming"}</SelectItem><SelectItem value="week">{language==='fr'?"Cette semaine":"This week"}</SelectItem></SelectContent></Select>
          <Select value={priceFilter} onValueChange={setPriceFilter}><SelectTrigger aria-label={language==='fr'?"Filtrer par tarif":"Filter by price"} className="border-white/15 bg-black/20 text-white"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">{language==='fr'?"Gratuit et payant":"Free and paid"}</SelectItem><SelectItem value="free">{language==='fr'?"Gratuit":"Free"}</SelectItem><SelectItem value="paid">{language==='fr'?"Payant":"Paid"}</SelectItem></SelectContent></Select>
          <div className="relative"><ArrowDownWideNarrow className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 text-white/60"/><Select value={sortBy} onValueChange={setSortBy}><SelectTrigger aria-label={language==='fr'?"Trier les événements":"Sort events"} className="border-white/15 bg-black/20 pl-9 text-white"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="date-asc">{t("events.nearest")}</SelectItem><SelectItem value="date-desc">{t("events.farthest")}</SelectItem><SelectItem value="price-asc">{t("events.lowPrice")}</SelectItem><SelectItem value="price-desc">{t("events.highPrice")}</SelectItem></SelectContent></Select></div>
        </div>
        {(searchTerm||selectedCategory!=="all"||dateFilter!=="all"||priceFilter!=="all")&&<div className="mb-5 flex items-center justify-between text-sm text-white/65"><span>{filteredEvents.length} {language==='fr'?'événement(s) trouvé(s)':'event(s) found'}</span><Button variant="ghost" size="sm" className="text-violet-300 hover:bg-white/5 hover:text-white" onClick={()=>{setSearchTerm("");setSelectedCategory("all");setDateFilter("all");setPriceFilter("all");}}>{t("events.clear")}</Button></div>}

        {filteredEvents.length>0?<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{filteredEvents.map((event,index)=><div key={event.id} style={{animationDelay:`${Math.min(index*75,450)}ms`}} className="motion-safe:animate-fade-up"><EventCard {...event}/></div>)}</div>:<div className="motion-safe:animate-fade-in rounded-2xl border border-dashed border-white/15 py-16 text-center"><Search className="mx-auto h-8 w-8 text-white/40"/><p className="mt-3 text-white/70">{t("events.noResults")}</p><Button variant="ghost" className="mt-2 text-violet-300 hover:bg-white/5 hover:text-white" onClick={()=>{setSearchTerm("");setSelectedCategory("all");setDateFilter("all");setPriceFilter("all");}}>{t("events.clear")}</Button></div>}

        {canCreate&&<div className="mt-12 flex justify-center"><Link to="/create-event"><Button variant="hero"><Plus className="mr-2 h-4 w-4"/>Créer un événement</Button></Link></div>}
      </div>
    </section>
  </div>;
};

export default Events;
