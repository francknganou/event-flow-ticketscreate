import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


const api = "/api/organizers.php";
const OrganizerRequest = () => {
  const [status,setStatus]=useState("loading"); const [name,setName]=useState(""); const [phone,setPhone]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  const headers={Authorization:`Bearer ${localStorage.getItem("sessionToken")||""}`};
  const refresh=()=>fetch(api,{headers}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||"Chargement impossible");setStatus(d.status);setName(d.organization_name||"");setPhone(d.phone||"");}).catch(e=>setError(e.message));
  useEffect(()=>{void refresh();},[]);
  const submit=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setError("");try{const r=await fetch(`${api}?action=request`,{method:"POST",headers:{...headers,"Content-Type":"application/json"},body:JSON.stringify({organizationName:name,phone})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Demande impossible");setStatus(d.status);}catch(e){setError(e instanceof Error?e.message:"Demande impossible");}finally{setBusy(false);}};
  const message=status==="approved"?"Votre compte organisateur est activé. Vous pouvez créer et gérer vos événements.":status==="pending"?"Votre demande est en attente de validation par l’administration.":status==="rejected"?"Votre précédente demande a été refusée. Vous pouvez la soumettre à nouveau.":"Présentez votre organisation pour demander l’accès à la création d’événements.";
  return <div className="min-h-screen bg-transparent"><main className="container mx-auto max-w-2xl px-4 py-12"><div className="mx-auto max-w-2xl"><Card className="rounded-2xl"><CardHeader><CardTitle>Devenir organisateur</CardTitle><p className="text-sm text-muted-foreground">{message}</p></CardHeader><CardContent>{status!=="approved"&&status!=="pending"&&<form onSubmit={submit} className="space-y-5"><div className="space-y-2"><Label htmlFor="org">Nom de l’organisation</Label><Input id="org" value={name} onChange={e=>setName(e.target.value)} required maxLength={160}/></div><div className="space-y-2"><Label htmlFor="phone">Téléphone</Label><Input id="phone" value={phone} onChange={e=>setPhone(e.target.value)} required maxLength={30}/></div>{error&&<p className="text-sm text-destructive">{error}</p>}<Button disabled={busy||status==="loading"}>{busy?"Envoi…":"Soumettre la demande"}</Button></form>}{status==="approved"&&<Link to="/dashboard"><Button>Ouvrir mon espace organisateur</Button></Link>}{status==="pending"&&<div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Vous serez notifié dans cet espace après la décision de l’administrateur.</div>}{status==="loading"&&<p className="text-sm text-muted-foreground">Chargement…</p>}</CardContent></Card></div></main></div>;
};
export default OrganizerRequest;
