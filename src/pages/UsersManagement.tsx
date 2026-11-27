import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Loader2, Search, ShieldCheck, UserRound, UserRoundX, Users, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/contexts/AppContext";

type Account = { id:number;first_name:string;last_name:string;email:string;role:string;created_at:string;status:"active"|"disabled"|"deleted";email_verified:number };
type Payload = { users:Account[];stats:{total:number;active:number;disabled:number;deleted:number;pendingVerification:number};page:number;pageSize:number;pages:number;currentUserId:number };
const endpoint="/api/users.php";

export default function UsersManagement(){
  const navigate=useNavigate();
  const {language}=useApp();
  const fr=language==='fr';
  const [data,setData]=useState<Payload|null>(null);
  const [query,setQuery]=useState("");
  const [statusFilter,setStatusFilter]=useState("all");
  const [page,setPage]=useState(1);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState<number|null>(null);
  const [error,setError]=useState("");
  const token=()=>localStorage.getItem("sessionToken")||"";

  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try{
      const params=new URLSearchParams({page:String(page),status:statusFilter});
      if(query.trim())params.set('q',query.trim());
      const response=await fetch(`${endpoint}?${params}`,{headers:{Authorization:`Bearer ${token()}`}});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||"Chargement des utilisateurs impossible.");
      setData(result as Payload);
    }catch(e){setError(e instanceof Error?e.message:"Chargement impossible.");}
    finally{setLoading(false);}
  },[page,statusFilter,query]);

  useEffect(()=>{
    if(localStorage.getItem("userRole")!=="admin"){navigate(localStorage.getItem("isLoggedIn")==="true"?"/dashboard":"/login",{replace:true});return;}
    const timer=window.setTimeout(()=>void load(),250);
    return()=>window.clearTimeout(timer);
  },[load,navigate]);

  const updateStatus=async(account:Account,status:"active"|"disabled")=>{
    setBusy(account.id);setError("");
    try{
      const response=await fetch(`${endpoint}?id=${account.id}`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token()}`},body:JSON.stringify({status})});
      const result=await response.json();if(!response.ok)throw new Error(result.error||"Modification impossible.");
      await load();
    }catch(e){setError(e instanceof Error?e.message:"Modification impossible.");}
    finally{setBusy(null);}
  };

  const confirmAccount=async(account:Account)=>{
    setBusy(account.id);setError("");
    try{
      const response=await fetch(`${endpoint}?id=${account.id}`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token()}`},body:JSON.stringify({action:"confirm-email"})});
      const result=await response.json();if(!response.ok)throw new Error(result.error||"Confirmation impossible.");
      await load();
    }catch(e){setError(e instanceof Error?e.message:"Confirmation impossible.");}
    finally{setBusy(null);}
  };

  const deleteAccount=async(account:Account)=>{
    const name=`${account.first_name} ${account.last_name}`.trim();
    const prompt=fr?`Supprimer le compte de ${name} ? Son profil sera anonymisé. L’historique des billets et des ventes sera conservé.`:`Delete ${name}'s account? Their profile will be anonymized. Ticket and sales history will be retained.`;
    if(!window.confirm(prompt))return;
    setBusy(account.id);setError("");
    try{
      const response=await fetch(`${endpoint}?id=${account.id}`,{method:"DELETE",headers:{Authorization:`Bearer ${token()}`}});
      const result=await response.json();if(!response.ok)throw new Error(result.error||"Suppression impossible.");
      await load();
    }catch(e){setError(e instanceof Error?e.message:"Suppression impossible.");}
    finally{setBusy(null);}
  };

  const roleName=(role:string)=>({admin:fr?"Administrateur":"Administrator",organizer:fr?"Organisateur":"Organizer",staff:fr?"Contrôleur":"Controller",user:fr?"Participant":"Participant"}[role]||role);
  const statusName=(status:Account["status"])=>status==='active'?(fr?"Actif":"Active"):status==='disabled'?(fr?"Désactivé":"Disabled"):(fr?"Supprimé":"Deleted");
  const dateText=(value:string)=>new Date(value).toLocaleDateString(fr?"fr-FR":"en-US",{day:"numeric",month:"short",year:"numeric"});

  const statCards=data?[{label:fr?"Comptes inscrits":"Registered accounts",value:data.stats.total,icon:Users,color:"text-violet-700 bg-violet-500/10"},{label:fr?"Actifs":"Active",value:data.stats.active,icon:ShieldCheck,color:"text-emerald-700 bg-emerald-500/10"},{label:fr?"À confirmer par e-mail":"Awaiting email confirmation",value:data.stats.pendingVerification,icon:UserRound,color:"text-amber-700 bg-amber-500/10"},{label:fr?"Désactivés":"Disabled",value:data.stats.disabled,icon:UserRoundX,color:"text-rose-700 bg-rose-500/10"}]:[];

  return <main className="min-h-screen bg-transparent px-4 py-8 md:px-8 md:py-12"><div className="mx-auto max-w-7xl">
    <div className="motion-safe:animate-fade-up mb-8"><Badge variant="secondary">{fr?"Administration":"Administration"}</Badge><h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">{fr?"Gestion des utilisateurs":"User management"}</h1><p className="mt-2 text-muted-foreground">{fr?"Consultez les inscriptions, gérez les accès et supprimez les comptes si nécessaire.":"Review registrations, manage access, and remove accounts when needed."}</p></div>
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{statCards.map(({label,value,icon:Icon,color})=><Card key={label} className="rounded-2xl border-border/70 bg-card/90 shadow-sm"><CardContent className="flex items-center gap-4 p-5"><span className={`rounded-xl p-3 ${color}`}><Icon className="h-5 w-5"/></span><div><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold tabular-nums">{value.toLocaleString(fr?"fr-FR":"en-US")}</p></div></CardContent></Card>)}</div>
    <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/95 shadow-sm"><CardHeader className="flex flex-col gap-4 border-b sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>{fr?"Tous les comptes":"All accounts"}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{fr?"Les comptes existants sont actifs par défaut; la désactivation ferme les sessions en cours.":"Existing accounts are active by default; disabling an account closes its current sessions."}</p></div><div className="flex w-full flex-col gap-2 sm:max-w-xl sm:flex-row"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input value={query} onChange={event=>{setPage(1);setQuery(event.target.value);}} placeholder={fr?"Rechercher nom, e-mail ou rôle":"Search name, email, or role"} className="pl-9"/></div><Select value={statusFilter} onValueChange={value=>{setPage(1);setStatusFilter(value);}}><SelectTrigger className="sm:w-48"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">{fr?"Tous les statuts":"All statuses"}</SelectItem><SelectItem value="active">{fr?"Actifs":"Active"}</SelectItem><SelectItem value="disabled">{fr?"Désactivés":"Disabled"}</SelectItem><SelectItem value="deleted">{fr?"Supprimés":"Deleted"}</SelectItem></SelectContent></Select></div></CardHeader>
      {error&&<p role="alert" className="mx-5 mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {loading?<div className="space-y-3 p-5">{[1,2,3].map(n=><div key={n} className="h-24 animate-pulse rounded-xl bg-muted/70"/> )}</div>:!data?.users.length?<CardContent className="py-14 text-center"><Users className="mx-auto h-10 w-10 text-muted-foreground/60"/><p className="mt-3 font-medium">{query||statusFilter!=="all"?(fr?"Aucun compte ne correspond à ces filtres.":"No accounts match these filters."):(fr?"Aucun compte utilisateur.":"No user accounts.")}</p></CardContent>:<><div className="divide-y">{data.users.map(account=>{const own=account.id===data.currentUserId;const fullName=`${account.first_name} ${account.last_name}`.trim();return <article key={account.id} className={`flex flex-col justify-between gap-4 p-4 sm:p-5 lg:flex-row lg:items-center ${account.status==='deleted'?'opacity-70':''}`}><div className="flex min-w-0 items-start gap-3"><div className="mt-1 rounded-xl bg-muted p-2.5 text-muted-foreground"><UserRound className="h-5 w-5"/></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-semibold">{fullName}</h2><Badge variant="outline">{roleName(account.role)}</Badge><Badge variant={account.status==='active'?'default':account.status==='deleted'?'destructive':'secondary'}>{statusName(account.status)}</Badge>{!account.email_verified&&account.status!=='deleted'&&<Badge className="border-amber-500/30 bg-amber-500/10 text-amber-800 hover:bg-amber-500/10">{fr?"E-mail à confirmer":"Email unverified"}</Badge>}{own&&<Badge variant="outline">{fr?"Vous":"You"}</Badge>}</div><p className="mt-1 break-all text-sm text-muted-foreground">{account.email}</p><p className="mt-1 text-xs text-muted-foreground">{fr?"Inscrit le":"Registered"} {dateText(account.created_at)}</p></div></div><div className="flex flex-wrap gap-2 lg:shrink-0">{!account.email_verified&&account.status!=='deleted'&&!own&&<Button size="sm" variant="outline" disabled={busy===account.id} onClick={()=>void confirmAccount(account)}>{busy===account.id?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<ShieldCheck className="mr-2 h-4 w-4"/>}{fr?"Confirmer le compte":"Confirm account"}</Button>}{account.status!=='deleted'&&!own&&<Button size="sm" variant={account.status==='active'?'outline':'default'} disabled={busy===account.id} onClick={()=>void updateStatus(account,account.status==='active'?'disabled':'active')}><span className="mr-2">{account.status==='active'?<UserRoundX className="h-4 w-4"/>:<ShieldCheck className="h-4 w-4"/>}</span>{account.status==='active'?(fr?"Désactiver":"Disable"):(fr?"Activer":"Activate")}</Button>}{account.status!=='deleted'&&!own&&<Button size="sm" variant="destructive" disabled={busy===account.id} onClick={()=>void deleteAccount(account)}><Trash2 className="mr-2 h-4 w-4"/>{fr?"Supprimer":"Delete"}</Button>}{own&&<span className="self-center text-xs text-muted-foreground">{fr?"Compte protégé":"Protected account"}</span>}</div></article>;})}</div><div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">{fr?`Page ${data.page} sur ${data.pages} · ${data.stats.total} comptes au total`:`Page ${data.page} of ${data.pages} · ${data.stats.total} total accounts`}</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page<=1||loading} onClick={()=>setPage(current=>Math.max(1,current-1))}><ChevronLeft className="mr-1 h-4 w-4"/>{fr?"Précédent":"Previous"}</Button><Button variant="outline" size="sm" disabled={page>=data.pages||loading} onClick={()=>setPage(current=>Math.min(data.pages,current+1))}>{fr?"Suivant":"Next"}<ChevronRight className="ml-1 h-4 w-4"/></Button></div></div></>}
    </Card>
  </div></main>;
}
