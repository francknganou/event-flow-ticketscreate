
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const {t}=useApp();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth.php', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
      const user = await response.json();
      if (!response.ok) throw new Error(user.error || 'Connexion impossible');
      localStorage.setItem('isLoggedIn','true'); localStorage.setItem('userRole',user.role); localStorage.setItem('userEmail',user.email); localStorage.setItem('sessionToken',user.token); localStorage.setItem('userFirstName',user.first_name); localStorage.setItem('userLastName',user.last_name);
      navigate('/events');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'API indisponible.'); }
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
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("login.email")}</Label>
                  <Input
                    id="email"
                    type="email"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                
                <Button type="submit" variant="hero" className="w-full">
                  {t("login.submit")}
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
