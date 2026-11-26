
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy,setBusy]=useState(false);
  const [formError,setFormError]=useState("");
  const navigate = useNavigate();
  const {t,language}=useApp();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);setFormError("");
    try {
      const response = await fetch('/api/auth.php', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
      const user = await response.json();
      if (!response.ok) throw new Error(user.error || 'Connexion impossible');
      localStorage.setItem('isLoggedIn','true'); localStorage.setItem('userRole',user.role); localStorage.setItem('userEmail',user.email); localStorage.setItem('sessionToken',user.token); localStorage.setItem('userFirstName',user.first_name); localStorage.setItem('userLastName',user.last_name);
      navigate('/events');
    } catch (error) { const message=error instanceof Error?error.message:'API indisponible.';setFormError(message);toast.error(message); } finally {setBusy(false);}
  };

  return (
    <div className="min-h-screen bg-transparent">
      
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card className="border border-border">
            <CardHeader className="text-center">
              <img src="/eventflow-icon.svg" alt="EventFlow" className="mx-auto mb-4 h-12 w-12" />
              <CardTitle className="text-2xl font-bold">{t("login.title")}</CardTitle>
              <p className="text-muted-foreground">{t("login.subtitle")}</p>
            </CardHeader>
            <CardContent>
              {formError&&<Alert variant="destructive" className="mb-5"><AlertCircle className="h-4 w-4"/><AlertDescription>{formError}</AlertDescription></Alert>}
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("login.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">{t("login.password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                
                <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                  {busy&&<Loader2 className="mr-2 h-4 w-4 animate-spin"/>}{busy?(language==='fr'?'Connexion…':'Signing in…'):t("login.submit")}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-muted-foreground">
                  {t("login.noAccount")}{" "}
                  <Link to="/signup" className="text-primary hover:underline font-medium">
                    {t("login.signup")}
                  </Link>
                </p>
              </div>
              
              <div className="mt-4 text-center">
                <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-foreground">
                  Mot de passe oublié ?
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
