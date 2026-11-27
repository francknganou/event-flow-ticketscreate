import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, Mail, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";

type VerificationState = "loading" | "success" | "error";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<VerificationState>("loading");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const { language } = useApp();
  const isFr = language === "fr";

  useEffect(() => {
    let active = true;
    if (!token) {
      setState("error");
      setMessage("Le lien de confirmation est incomplet.");
      return () => { active = false; };
    }
    fetch("/api/auth.php?action=verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Confirmation impossible.");
      if (active) { setState("success"); setMessage(result.message); }
    }).catch((error) => {
      if (active) { setState("error"); setMessage(error instanceof Error ? error.message : "Confirmation impossible."); }
    });
    return () => { active = false; };
  }, [token]);

  const resend = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    try {
      const response = await fetch("/api/auth.php?action=resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Envoi impossible.");
      toast.success(result.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Envoi impossible.");
    } finally { setSending(false); }
  };

  return <main className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-12"><Card className="w-full max-w-lg border-border/80 shadow-xl"><CardHeader className="items-center text-center"><div className={`mb-2 grid h-14 w-14 place-items-center rounded-full ${state === "success" ? "bg-emerald-500/10 text-emerald-600" : state === "error" ? "bg-destructive/10 text-destructive" : "bg-violet-500/10 text-violet-600"}`}>{state === "loading" ? <Loader2 className="h-7 w-7 animate-spin"/> : state === "success" ? <CheckCircle2 className="h-7 w-7"/> : <XCircle className="h-7 w-7"/>}</div><CardTitle className="text-2xl">{state === "loading" ? (isFr ? "Confirmation en cours…" : "Confirming your email…") : state === "success" ? (isFr ? "Adresse confirmée" : "Email confirmed") : (isFr ? "Confirmation impossible" : "Confirmation failed")}</CardTitle></CardHeader><CardContent className="space-y-5 text-center"><p className="text-sm text-muted-foreground" role="status">{message}</p>{state === "success"?<Button asChild variant="hero" className="w-full"><Link to="/login">{isFr?"Se connecter":"Sign in"}</Link></Button>:state === "error"?<><form onSubmit={resend} className="space-y-3 text-left"><div className="space-y-2"><Label htmlFor="verification-email">{isFr?"Adresse e-mail":"Email address"}</Label><Input id="verification-email" type="email" autoComplete="email" required value={email} onChange={event=>setEmail(event.target.value)} placeholder="vous@exemple.com"/></div><Button type="submit" variant="hero" className="w-full" disabled={sending}>{sending?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<Mail className="mr-2 h-4 w-4"/>}{isFr?"Renvoyer un lien":"Send a new link"}</Button></form><Button asChild variant="link" className="w-full"><Link to="/signup">{isFr?"Retour à l’inscription":"Back to sign up"}</Link></Button></>:null}</CardContent></Card></main>;
}
