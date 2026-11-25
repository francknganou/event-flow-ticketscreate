import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Menu, QrCode, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";

export const Header = () => {
  const [isLoggedIn,setIsLoggedIn]=useState(false);const [userRole,setUserRole]=useState("");const [mobileOpen,setMobileOpen]=useState(false);
  const navigate=useNavigate();const location=useLocation();const {t}=useApp();
  useEffect(()=>{setIsLoggedIn(localStorage.getItem("isLoggedIn")==="true");setUserRole(localStorage.getItem("userRole")||"");setMobileOpen(false);},[location.pathname]);
  const handleLogout=async()=>{try{await fetch("http://127.0.0.1:8000/api/auth.php?action=logout",{method:"POST",headers:{Authorization:`Bearer ${localStorage.getItem("sessionToken")||""}`}});}catch{/* Clear the local session even if the API is offline. */} ["isLoggedIn","userRole","userEmail","sessionToken","userFirstName","userLastName"].forEach(k=>localStorage.removeItem(k));setIsLoggedIn(false);setUserRole("");navigate("/");};
  const showBack=location.pathname!=="/";
  const linkClass="rounded-lg px-3 py-2 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white";
  const accountActions=<>
    {showBack&&<Button variant="ghost" size="sm" className="text-white/80 hover:bg-white/10 hover:text-white" onClick={()=>navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4"/>{t("nav.back")}</Button>}
    {isLoggedIn?<>
      {(["admin","organizer"].includes(userRole))&&<Link to="/dashboard" className={linkClass}><User className="mr-2 inline h-4 w-4"/>{t("nav.dashboard")}</Link>}
      {(["admin","organizer","staff"].includes(userRole))&&<Link to="/scanner" className={linkClass}><QrCode className="mr-2 inline h-4 w-4"/>{t("nav.scanner")}</Link>}
      {userRole==="user"&&<Link to="/organizer-request" className={linkClass}>{t("nav.organizer")}</Link>}
      <Button variant="outline" size="sm" className="border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white" onClick={handleLogout}>{t("nav.logout")}</Button>
    </>:<><Link to="/login" className={linkClass}>{t("nav.login")}</Link><Link to="/signup"><Button variant="hero" size="sm">{t("nav.signup")}</Button></Link></>}
  </>;
  return <header className="motion-safe:animate-fade-in sticky top-0 z-50 border-b border-white/10 bg-black/80 text-white backdrop-blur-xl">
    <div className="container mx-auto flex min-h-16 items-center justify-between gap-3 px-4 py-2 sm:gap-5">
      <Link to="/" className="flex min-w-0 shrink-0 items-center" aria-label="EventFlow, accueil"><img src="/eventflow-logo-fond-sombre.svg" alt="EventFlow — Billetterie et événements" className="h-9 w-auto max-w-[150px] object-contain sm:h-10 sm:max-w-[190px]"/></Link>
      <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale"><Link to="/events" className={linkClass}>{t("nav.events")}</Link>{isLoggedIn&&<Link to="/my-tickets" className={linkClass}>{t("nav.tickets")}</Link>}<Link to="/about" className={linkClass}>{t("nav.about")}</Link></nav>
      <div className="hidden shrink-0 items-center gap-1 lg:flex">{accountActions}</div>
      <Button variant="outline" size="icon" className="shrink-0 border-white/25 bg-white/5 text-white hover:bg-white/10 hover:text-white lg:hidden" aria-label={mobileOpen?t("nav.close"):t("nav.menu")} aria-expanded={mobileOpen} onClick={()=>setMobileOpen(v=>!v)}>{mobileOpen?<X className="h-5 w-5"/>:<Menu className="h-5 w-5"/>}</Button>
    </div>
    {mobileOpen&&<div className="border-t border-white/10 bg-black px-4 pb-4 pt-3 shadow-xl motion-safe:animate-fade-in lg:hidden">
      <nav className="mb-3 grid gap-1" aria-label="Navigation principale"><Link to="/events" onClick={()=>setMobileOpen(false)} className={linkClass}>{t("nav.events")}</Link>{isLoggedIn&&<Link to="/my-tickets" onClick={()=>setMobileOpen(false)} className={linkClass}>{t("nav.tickets")}</Link>}<Link to="/about" onClick={()=>setMobileOpen(false)} className={linkClass}>{t("nav.about")}</Link></nav>
      <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">{accountActions}</div>
    </div>}
  </header>;
};
