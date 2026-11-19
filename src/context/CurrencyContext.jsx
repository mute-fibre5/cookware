import { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

const EXCHANGE_RATES = {
  KSH: 1,
  USD: 0.0077,
  EUR: 0.0071,
  GBP: 0.0061,
  UGX: 28.5,
  TZS: 19.5
};

const CURRENCY_SYMBOLS = {
  KSH: 'Ksh',
  USD: '$',
  EUR: '€',
  GBP: '£',
  UGX: 'UGX',
  TZS: 'TZS'
};

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('selectedCurrency') || 'KSH';
  });

  useEffect(() => {
    localStorage.setItem('selectedCurrency', currency);
  }, [currency]);

  const formatPrice = (priceKSH) => {
    const rate = EXCHANGE_RATES[currency] || 1;
    const converted = priceKSH * rate;
    const symbol = CURRENCY_SYMBOLS[currency] || 'KSH';
    
    if (currency === 'KSH' || currency === 'UGX' || currency === 'TZS') {
      return `${symbol} ${Math.round(converted).toLocaleString()}`;
    }
    return `${symbol}${converted.toFixed(2)}`;
  };

  const convertPrice = (priceKSH) => {
    const rate = EXCHANGE_RATES[currency] || 1;
    return priceKSH * rate;
  };

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      setCurrency, 
      formatPrice, 
      convertPrice,
      availableCurrencies: Object.keys(EXCHANGE_RATES)
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);