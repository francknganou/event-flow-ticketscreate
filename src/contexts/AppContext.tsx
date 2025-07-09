import React, { createContext, useContext, useState, useEffect } from 'react';

interface AppContextType {
  currency: 'FCFA' | 'EURO' | 'DOLLARS';
  language: 'fr' | 'en';
  setCurrency: (currency: 'FCFA' | 'EURO' | 'DOLLARS') => void;
  setLanguage: (language: 'fr' | 'en') => void;
  formatPrice: (price: number) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<'FCFA' | 'EURO' | 'DOLLARS'>('EURO');
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  useEffect(() => {
    const savedCurrency = localStorage.getItem('currency') as 'FCFA' | 'EURO' | 'DOLLARS';
    const savedLanguage = localStorage.getItem('language') as 'fr' | 'en';
    
    if (savedCurrency) setCurrency(savedCurrency);
    if (savedLanguage) setLanguage(savedLanguage);
  }, []);

  const handleSetCurrency = (newCurrency: 'FCFA' | 'EURO' | 'DOLLARS') => {
    setCurrency(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

  const handleSetLanguage = (newLanguage: 'fr' | 'en') => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const formatPrice = (price: number) => {
    const rates = {
      EURO: 1,
      DOLLARS: 1.1,
      FCFA: 655.957
    };

    const convertedPrice = price * rates[currency];
    const symbols = {
      EURO: '€',
      DOLLARS: '$',
      FCFA: ' FCFA'
    };

    if (currency === 'FCFA') {
      return `${Math.round(convertedPrice)}${symbols[currency]}`;
    }
    return `${convertedPrice.toFixed(2)}${symbols[currency]}`;
  };

  return (
    <AppContext.Provider value={{
      currency,
      language,
      setCurrency: handleSetCurrency,
      setLanguage: handleSetLanguage,
      formatPrice
    }}>
      {children}
    </AppContext.Provider>
  );
};