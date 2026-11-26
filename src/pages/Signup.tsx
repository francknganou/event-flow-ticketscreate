
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false
  });
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [busy,setBusy]=useState(false);
  const [formError,setFormError]=useState("");
  const navigate = useNavigate();
  const {t,language}=useApp();

  useEffect(() => {
    const isEnabled = localStorage.getItem('registrationEnabled') !== 'false';
    setRegistrationEnabled(isEnabled);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationEnabled) {
      return;
    }
    if(!formData.acceptTerms){toast.error(language==='fr'?"Veuillez accepter les conditions d’utilisation.":"Please accept the terms of use.");return;}
    if (formData.password !== formData.confirmPassword) { toast.error('Les mots de passe ne correspondent pas.'); return; }
    if(formData.password.length<8){toast.error(language==='fr'?"Le mot de passe doit contenir au moins 8 caractères.":"Password must contain at least 8 characters.");return;}
    setBusy(true);setFormError("");
    try {
      const response = await fetch('/api/auth.php?action=signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(formData)});
      const user=await response.json(); if(!response.ok) throw new Error(user.error || 'Inscription impossible');
      localStorage.setItem('isLoggedIn','true');localStorage.setItem('userRole',user.role);localStorage.setItem('userEmail',user.email);localStorage.setItem('sessionToken',user.token);localStorage.setItem('userFirstName',formData.firstName);localStorage.setItem('userLastName',formData.lastName);navigate('/events');
    } catch(error) { const message=error instanceof Error?error.message:(language==='fr'?'API indisponible.':'API unavailable.');setFormError(message);toast.error(message); } finally {setBusy(false);}
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-transparent">
      
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          {!registrationEnabled && (
            <Alert className="mb-6 border-destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Les inscriptions sont actuellement désactivées par l'administrateur.
              </AlertDescription>
            </Alert>
          )}
          <Card className="border border-border">
            <CardHeader className="text-center">
              <img src="/eventflow-icon.svg" alt="EventFlow" className="mx-auto mb-4 h-12 w-12" />
              <CardTitle className="text-2xl font-bold">{t("signup.title")}</CardTitle>
              <p className="text-muted-foreground">{language === "fr" ? "Créez votre compte EventFlow" : "Create your EventFlow account"}</p>
            </CardHeader>
            <CardContent>
              {formError&&<Alert variant="destructive" className="mb-5"><AlertCircle className="h-4 w-4"/><AlertDescription>{formError}</AlertDescription></Alert>}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t("signup.firstName")}</Label>
                    <Input
                      id="firstName"
                      autoComplete="given-name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder={t("signup.firstName")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t("signup.lastName")}</Label>
                    <Input
                      id="lastName"
                      autoComplete="family-name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder={t("signup.lastName")}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">{t("signup.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="votre@email.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">{t("signup.password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) => handleInputChange("acceptTerms", checked as boolean)}
                    required
                  />
                  <Label htmlFor="terms" className="text-sm">
                    J'accepte les{" "}
                    <Link to="/terms" className="text-primary hover:underline">
                      conditions d'utilisation
                    </Link>
                  </Label>
                </div>
                
                <Button 
                  type="submit" 
                  variant="hero" 
                  className="w-full"
                  disabled={!registrationEnabled||busy}
                >
                  {busy&&<Loader2 className="mr-2 h-4 w-4 animate-spin"/>}{busy?(language==='fr'?'Création du compte…':'Creating account…'):(language==='fr'?'Créer mon compte':'Create account')}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-muted-foreground">
                  Déjà un compte ?{" "}
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Se connecter
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Signup;
