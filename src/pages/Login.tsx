<<<<<<< HEAD

=======
import { Header } from "@/components/Header";
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
<<<<<<< HEAD
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
=======
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Ticket } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
<<<<<<< HEAD
  const navigate = useNavigate();
  const {t}=useApp();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth.php', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
      const user = await response.json();
      if (!response.ok) throw new Error(user.error || 'Connexion impossible');
      localStorage.setItem('isLoggedIn','true'); localStorage.setItem('userRole',user.role); localStorage.setItem('userEmail',user.email); localStorage.setItem('sessionToken',user.token); localStorage.setItem('userFirstName',user.first_name); localStorage.setItem('userLastName',user.last_name);
      navigate('/events');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'API indisponible.'); }
  };

  return (
    <div className="min-h-screen bg-transparent">
      
=======
  const [userRole, setUserRole] = useState("user");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Supprimer toutes les connexions précédentes
    localStorage.clear();
    // Simulation de connexion réussie avec un seul rôle
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', userRole);
    localStorage.setItem('userEmail', email);
    navigate('/events');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card className="border border-border">
            <CardHeader className="text-center">
<<<<<<< HEAD
              <img src="/eventflow-icon.svg" alt="EventFlow" className="mx-auto mb-4 h-12 w-12" />
              <CardTitle className="text-2xl font-bold">{t("login.title")}</CardTitle>
              <p className="text-muted-foreground">{t("login.subtitle")}</p>
=======
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
              <p className="text-muted-foreground">Connectez-vous à votre compte EventFlow</p>
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
<<<<<<< HEAD
                  <Label htmlFor="email">{t("login.email")}</Label>
=======
                  <Label htmlFor="email">Email</Label>
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
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
<<<<<<< HEAD
                  <Label htmlFor="password">{t("login.password")}</Label>
=======
                  <Label htmlFor="password">Mot de passe</Label>
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                
<<<<<<< HEAD
                <Button type="submit" variant="hero" className="w-full">
                  {t("login.submit")}
=======
                <div className="space-y-3">
                  <Label>Type de compte</Label>
                  <RadioGroup value={userRole} onValueChange={setUserRole} className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="user" id="user" />
                      <Label htmlFor="user">Utilisateur</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="admin" id="admin" />
                      <Label htmlFor="admin">Administrateur</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <Button type="submit" variant="hero" className="w-full">
                  Se connecter
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-muted-foreground">
<<<<<<< HEAD
                  {t("login.noAccount")}{" "}
                  <Link to="/signup" className="text-primary hover:underline font-medium">
                    {t("login.signup")}
=======
                  Pas encore de compte ?{" "}
                  <Link to="/signup" className="text-primary hover:underline font-medium">
                    Créer un compte
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
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

<<<<<<< HEAD
export default Login;
=======
export default Login;
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
