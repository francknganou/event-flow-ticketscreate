import { useState } from 'react';
import { Settings as SettingsIcon, Globe, DollarSign, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';

export const Settings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currency, language, setCurrency, setLanguage } = useApp();

  const texts = {
    fr: {
      settings: 'Paramètres',
      language: 'Langue',
      currency: 'Devise',
      french: 'Français',
      english: 'English',
      close: 'Fermer'
    },
    en: {
      settings: 'Settings',
      language: 'Language',
      currency: 'Currency',
      french: 'Français',
      english: 'English',
      close: 'Close'
    }
  };

  const t = texts[language];

  return (
    <>
      {/* Settings Button */}
      <div className="fixed bottom-4 left-4 z-50">
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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4 border-border">
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
                <Select value={language} onValueChange={(value: 'fr' | 'en') => setLanguage(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">{t.french}</SelectItem>
                    <SelectItem value="en">{t.english}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <label className="text-sm font-medium">{t.currency}</label>
                </div>
                <Select value={currency} onValueChange={(value: 'FCFA' | 'EURO' | 'DOLLARS') => setCurrency(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EURO">Euro (€)</SelectItem>
                    <SelectItem value="DOLLARS">Dollar ($)</SelectItem>
                    <SelectItem value="FCFA">FCFA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
    </>
  );
};