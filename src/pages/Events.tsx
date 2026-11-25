<<<<<<< HEAD

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
  const [allEvents,setAllEvents]=useState<Event[]>([]);
  const {t,language}=useApp();

  useEffect(()=>{fetch('http://127.0.0.1:8000/api/events.php').then(r=>r.json()).then(setAllEvents).catch(()=>setAllEvents([]));},[]);

  const categories=useMemo(()=>[...new Set(allEvents.map(event=>event.category).filter(Boolean))],[allEvents]);
  const filteredEvents=useMemo(()=>{
    const search=searchTerm.trim().toLocaleLowerCase();
    const matches=allEvents.filter(event=>{
      const text=`${event.title} ${event.location} ${event.category}`.toLocaleLowerCase();
      return (!search||text.includes(search))&&(selectedCategory==="all"||event.category===selectedCategory);
    });
    return [...matches].sort((a,b)=>{
      if(sortBy==="price-asc")return a.price-b.price;
      if(sortBy==="price-desc")return b.price-a.price;
      const delta=new Date(a.date).getTime()-new Date(b.date).getTime();
      return sortBy==="date-desc"?-delta:delta;
    });
  },[allEvents,searchTerm,selectedCategory,sortBy]);

  const canCreate=["admin","organizer"].includes(localStorage.getItem("userRole")||"");

  return <div className="min-h-screen bg-transparent text-foreground">
    
    <HeroSection/>
    <section id="event-list" className="scroll-mt-20 bg-black/70 py-12 text-white backdrop-blur-sm md:py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="motion-safe:animate-fade-up mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div><h2 className="text-3xl font-bold tracking-tight">{t("events.featured")}</h2><p className="mt-2 text-sm text-white/60">{t("events.description")}</p></div>
        </div>

        <div className="motion-safe:animate-fade-up mb-7 grid gap-3 rounded-2xl border border-white/10 bg-white/[.04] p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_minmax(190px,.8fr)_minmax(180px,.7fr)]">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55"/><Input aria-label={language==='fr'?"Rechercher par nom d’événement":"Search by event name"} value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder={language==='fr'?"Rechercher par nom d’événement…":"Search event name…"} className="border-white/15 bg-black/20 pl-9 text-white placeholder:text-white/45"/></div>
          <div className="relative"><ListFilter className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 text-white/60"/><Select value={selectedCategory} onValueChange={setSelectedCategory}><SelectTrigger aria-label={language==='fr'?"Filtrer par catégorie":"Filter by category"} className="border-white/15 bg-black/20 pl-9 text-white"><SelectValue placeholder={t("events.all")}/></SelectTrigger><SelectContent><SelectItem value="all">{t("events.all")}</SelectItem>{categories.map(category=><SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent></Select></div>
          <div className="relative"><ArrowDownWideNarrow className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 text-white/60"/><Select value={sortBy} onValueChange={setSortBy}><SelectTrigger aria-label={language==='fr'?"Trier les événements":"Sort events"} className="border-white/15 bg-black/20 pl-9 text-white"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="date-asc">{t("events.nearest")}</SelectItem><SelectItem value="date-desc">{t("events.farthest")}</SelectItem><SelectItem value="price-asc">{t("events.lowPrice")}</SelectItem><SelectItem value="price-desc">{t("events.highPrice")}</SelectItem></SelectContent></Select></div>
        </div>
        {(searchTerm||selectedCategory!=="all")&&<div className="mb-5 flex items-center justify-between text-sm text-white/65"><span>{filteredEvents.length} {language==='fr'?'événement(s) trouvé(s)':'event(s) found'}</span><Button variant="ghost" size="sm" className="text-violet-300 hover:bg-white/5 hover:text-white" onClick={()=>{setSearchTerm("");setSelectedCategory("all");}}>{t("events.clear")}</Button></div>}

        {filteredEvents.length>0?<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{filteredEvents.map((event,index)=><div key={event.id} style={{animationDelay:`${Math.min(index*75,450)}ms`}} className="motion-safe:animate-fade-up"><EventCard {...event}/></div>)}</div>:<div className="motion-safe:animate-fade-in rounded-2xl border border-dashed border-white/15 py-16 text-center"><Search className="mx-auto h-8 w-8 text-white/40"/><p className="mt-3 text-white/70">{t("events.noResults")}</p><Button variant="ghost" className="mt-2 text-violet-300 hover:bg-white/5 hover:text-white" onClick={()=>{setSearchTerm("");setSelectedCategory("all");}}>{t("events.clear")}</Button></div>}

        {canCreate&&<div className="mt-12 flex justify-center"><Link to="/create-event"><Button variant="hero"><Plus className="mr-2 h-4 w-4"/>Créer un événement</Button></Link></div>}
      </div>
    </section>
  </div>;
};

export default Events;
=======
import { Header } from "@/components/Header";
import { EventCard } from "@/components/EventCard";
import { mockEvents, Event } from "@/data/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Search, SortAsc } from "lucide-react";
import { useState, useEffect } from "react";

const Events = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [allEvents, setAllEvents] = useState<Event[]>(mockEvents);

  useEffect(() => {
    // Récupérer les événements créés par l'utilisateur
    const userEvents = JSON.parse(localStorage.getItem('userEvents') || '[]');
    setAllEvents([...mockEvents, ...userEvents]);
  }, []);

  const filteredEvents = allEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...new Set(allEvents.map(event => event.category))];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Tous les événements</h1>
          <p className="text-muted-foreground">Découvrez tous nos événements disponibles</p>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-lg p-6 mb-8 border border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Rechercher un événement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories.slice(1).map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline">
              <SortAsc className="w-4 h-4 mr-2" />
              Trier par date
            </Button>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} {...event} />
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Aucun événement trouvé</p>
          </div>
        )}

        {/* Create Event Button */}
        {localStorage.getItem('isLoggedIn') === 'true' && (
          <div className="text-center mt-12">
            <a href="/create-event">
              <Button variant="hero" size="lg">
                Créer mon événement
              </Button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
