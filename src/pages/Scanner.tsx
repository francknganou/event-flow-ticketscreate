import { useEffect } from "react";
import { useNavigate } from "react-router-dom";


import { QRScanner } from "@/components/QRScanner";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode } from "lucide-react";

const Scanner = () => {
  const navigate=useNavigate();
  const role=localStorage.getItem("userRole")||"";
  const allowed=["admin","organizer","staff"].includes(role);
  useEffect(()=>{if(!allowed)navigate(localStorage.getItem("isLoggedIn")==="true"?"/events":"/login",{replace:true});},[allowed,navigate]);
  return <div className="min-h-screen bg-transparent"><main className="container mx-auto max-w-3xl px-4 py-12"><Card className="mx-auto max-w-3xl rounded-2xl"><CardContent className="flex flex-col items-center p-8 text-center md:p-12"><span className="rounded-2xl bg-violet-100 p-4 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200"><QrCode className="h-8 w-8"/></span><h1 className="mt-5 text-2xl font-bold">Contrôle des accès</h1><p className="mt-2 max-w-lg text-sm text-muted-foreground">Scannez le QR code d’un billet. Seuls les billets des événements qui vous sont accessibles seront validés.</p></CardContent></Card></main><QRScanner isOpen={allowed} onClose={()=>navigate(role==="staff"?"/events":"/dashboard")}/></div>;
};
export default Scanner;
