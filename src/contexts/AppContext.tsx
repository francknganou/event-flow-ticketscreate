import React, { createContext, useContext, useState, useEffect } from 'react';
<<<<<<< HEAD
import { translate, TranslationKey, Language } from '@/lib/translations';

interface AppContextType {
  currency: string;
  currencies: {code:string;name:string}[];
  language: Language;
  t: (key: TranslationKey) => string;
  theme: 'light' | 'dark' | 'system';
  setCurrency: (currency: string) => void;
  setLanguage: (language: Language) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
=======

interface AppContextType {
  currency: 'FCFA' | 'EURO' | 'DOLLARS';
  language: 'fr' | 'en';
  setCurrency: (currency: 'FCFA' | 'EURO' | 'DOLLARS') => void;
  setLanguage: (language: 'fr' | 'en') => void;
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
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
<<<<<<< HEAD
  const [currency, setCurrency] = useState<string>('EUR');
  const [currencies,setCurrencies]=useState<{code:string;name:string}[]>([{code:'EUR',name:'Euro'},{code:'USD',name:'US Dollar'},{code:'XAF',name:'CFA Franc BEAC'}]);
  const [rates,setRates]=useState<Record<string,number>>({EUR:1,USD:1.1,XAF:655.957});
  const [language, setLanguage] = useState<Language>('fr');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    const savedCurrency = localStorage.getItem('currency');
    const savedLanguage = localStorage.getItem('language') as Language;
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    
    if (savedCurrency) setCurrency(({FCFA:'XAF',EURO:'EUR',DOLLARS:'USD'} as Record<string,string>)[savedCurrency]||savedCurrency);
    if (savedLanguage && ['fr','en','es','pt','de','ar','zh','sw'].includes(savedLanguage)) setLanguage(savedLanguage);
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(()=>{
    const cacheKey='eventflow-currency-data';const now=Date.now();
    try{const cached=JSON.parse(localStorage.getItem(cacheKey)||'null');if(cached?.rates&&cached?.currencies&&now-cached.savedAt<12*60*60*1000){setRates(cached.rates);setCurrencies(cached.currencies);return;}}catch{}
    let cancelled=false;
    Promise.all([fetch('https://api.frankfurter.dev/v2/currencies'),fetch('https://api.frankfurter.dev/v2/rates?base=EUR')]).then(async([cr,rr])=>{if(!cr.ok||!rr.ok)throw new Error('Currency reference unavailable');const currencyRows=await cr.json();const rateRows=await rr.json();const nextRates:Record<string,number>={EUR:1};for(const row of rateRows){if(row.quote&&Number(row.rate)>0)nextRates[row.quote]=Number(row.rate);}const nextCurrencies=currencyRows.map((row:any)=>({code:String(row.iso_code||row.code||'').toUpperCase(),name:String(row.name||row.iso_code||row.code||'')})).filter((row:any)=>row.code&&nextRates[row.code]).sort((a:any,b:any)=>a.name.localeCompare(b.name));if(!nextCurrencies.some((c:any)=>c.code==='EUR'))nextCurrencies.unshift({code:'EUR',name:'Euro'});if(!cancelled){setRates(nextRates);setCurrencies(nextCurrencies);localStorage.setItem(cacheKey,JSON.stringify({rates:nextRates,currencies:nextCurrencies,savedAt:now}));}}).catch(()=>{});
    return()=>{cancelled=true;};
  },[]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    };
    applyTheme();
    if (theme !== 'system') return;
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [theme]);

  useEffect(() => { document.documentElement.lang = language;document.documentElement.dir=language==='ar'?'rtl':'ltr'; }, [language]);

  const handleSetCurrency = (newCurrency: string) => {
=======
  const [currency, setCurrency] = useState<'FCFA' | 'EURO' | 'DOLLARS'>('EURO');
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  useEffect(() => {
    const savedCurrency = localStorage.getItem('currency') as 'FCFA' | 'EURO' | 'DOLLARS';
    const savedLanguage = localStorage.getItem('language') as 'fr' | 'en';
    
    if (savedCurrency) setCurrency(savedCurrency);
    if (savedLanguage) setLanguage(savedLanguage);
  }, []);

  const handleSetCurrency = (newCurrency: 'FCFA' | 'EURO' | 'DOLLARS') => {
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
    setCurrency(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

<<<<<<< HEAD
  const handleSetLanguage = (newLanguage: Language) => {
=======
  const handleSetLanguage = (newLanguage: 'fr' | 'en') => {
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

<<<<<<< HEAD
  const handleSetTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const formatPrice = (price: number) => {
    const convertedPrice=price*(rates[currency]||1);
    try{return new Intl.NumberFormat(language,{style:'currency',currency,maximumFractionDigits:currency==='XAF'?0:2}).format(convertedPrice);}catch{return `${convertedPrice.toFixed(2)} ${currency}`;}
=======
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
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
  };

  return (
    <AppContext.Provider value={{
      currency,
<<<<<<< HEAD
      currencies,
      language,
      t: (key) => translate(language, key),
      theme,
      setCurrency: handleSetCurrency,
      setLanguage: handleSetLanguage,
      setTheme: handleSetTheme,
=======
      language,
      setCurrency: handleSetCurrency,
      setLanguage: handleSetLanguage,
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
      formatPrice
    }}>
      {children}
    </AppContext.Provider>
  );
<<<<<<< HEAD
};
=======
};
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
