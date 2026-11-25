import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Globe, DollarSign, X, Users, Shield, QrCode, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useApp } from '@/contexts/AppContext';
import type { Language } from '@/lib/translations';
import { QRScanner } from './QRScanner';

export const Settings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [maxUsers, setMaxUsers] = useState('100');
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const { currency, currencies, language, theme, setCurrency, setLanguage, setTheme, t:translateText } = useApp();

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    setIsAdmin(userRole === 'admin');
    
    // Charger les paramètres admin
    const savedMaxUsers = localStorage.getItem('maxUsers') || '100';
    const savedRegistrationEnabled = localStorage.getItem('registrationEnabled') !== 'false';
    setMaxUsers(savedMaxUsers);
    setRegistrationEnabled(savedRegistrationEnabled);
  }, []);

  const texts = {
    fr: {
      settings: 'Paramètres',
      language: 'Langue',
      currency: 'Devise',
      theme: 'Thème',
      light: 'Clair',
      dark: 'Sombre',
      system: 'Selon l’appareil',
      french: 'Français',
      english: 'English',
      close: 'Fermer',
      scanQR: 'Scanner QR Code',
      adminSettings: 'Paramètres Administrateur',
      maxUsers: 'Nombre maximum d\'utilisateurs',
      enableRegistration: 'Autoriser les inscriptions',
      save: 'Sauvegarder'
    },
    en: {
      settings: 'Settings',
      language: 'Language',
      currency: 'Currency',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      system: 'Use device setting',
      french: 'Français',
      english: 'English',
      close: 'Close',
      scanQR: 'Scan QR Code',
      adminSettings: 'Administrator Settings',
      maxUsers: 'Maximum number of users',
      enableRegistration: 'Enable registrations',
      save: 'Save'
    }
  };

  const t = {...(texts[language as 'fr'|'en'] || texts.en),settings:translateText('settings.title'),language:translateText('settings.language'),currency:translateText('settings.currency'),theme:translateText('settings.theme'),close:translateText('settings.close')};
  const languageNames:Record<Language,string>={fr:'Français',en:'English',es:'Español',pt:'Português',de:'Deutsch',ar:'العربية',zh:'中文',sw:'Kiswahili'};

  const handleSaveAdminSettings = () => {
    localStorage.setItem('maxUsers', maxUsers);
    localStorage.setItem('registrationEnabled', registrationEnabled.toString());
  };

  return (
    <>
      {/* Settings Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          variant="hero"
          size="sm"
          className="rounded-full w-12 h-12 p-0 shadow-glow"
        >
          <SettingsIcon className="w-5 h-5" />
        </Button>
      </div>

      {/* Settings Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center motion-safe:animate-fade-in">
          <Card className="motion-safe:animate-fade-up my-3 max-h-[calc(100dvh-1.5rem)] w-full max-w-md mx-3 overflow-y-auto border-border shadow-2xl sm:mx-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                {t.settings}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  <label className="text-sm font-medium">{t.language}</label>
                </div>
                <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(languageNames).map(([code,name])=><SelectItem key={code} value={code}>{name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-primary" />
                  <label className="text-sm font-medium">{t.theme}</label>
                </div>
                <Select value={theme} onValueChange={(value: 'light' | 'dark' | 'system') => setTheme(value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{t.light}</SelectItem>
                    <SelectItem value="dark">{t.dark}</SelectItem>
                    <SelectItem value="system">{t.system}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <label className="text-sm font-medium">{t.currency}</label>
                </div>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {currencies.map(({code,name})=><SelectItem key={code} value={code}>{code} — {name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Taux de référence en euros. Données indicatives, actualisées automatiquement.</p>
              </div>

              {/* QR Scanner Button */}
              <div className="space-y-2">
                <Button 
                  onClick={() => setIsQRScannerOpen(true)} 
                  variant="outline" 
                  className="w-full"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  {t.scanQR}
                </Button>
              </div>

              {/* Admin Settings */}
              {isAdmin && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <label className="text-sm font-medium">{t.adminSettings}</label>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxUsers">{t.maxUsers}</Label>
                      <Input
                        id="maxUsers"
                        type="number"
                        value={maxUsers}
                        onChange={(e) => setMaxUsers(e.target.value)}
                        min="1"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        <Label htmlFor="registration">{t.enableRegistration}</Label>
                      </div>
                      <Switch
                        id="registration"
                        checked={registrationEnabled}
                        onCheckedChange={setRegistrationEnabled}
                      />
                    </div>

                    <Button 
                      onClick={handleSaveAdminSettings}
                      variant="outline" 
                      className="w-full"
                    >
                      {t.save}
                    </Button>
                  </div>
                </>
              )}

              <Button 
                onClick={() => setIsOpen(false)} 
                variant="hero" 
                className="w-full"
              >
                {t.close}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* QR Scanner Modal */}
      <QRScanner 
        isOpen={isQRScannerOpen} 
        onClose={() => setIsQRScannerOpen(false)} 
      />
    </>
  );
};
