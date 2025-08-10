"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  getPopularCurrencies,
  convertCurrency,
  formatCurrency,
  type ConversionResult,
} from "../../lib/currency-conversion";
import { detectGeoLocation, type GeoLocation } from "../../lib/geo-detection";

interface CurrencySwitchProps {
  currentCurrency: string;
  onCurrencyChange: (currency: string) => void;
  className?: string;
  showDetectedCurrency?: boolean;
}

export function CurrencySwitch({
  currentCurrency,
  onCurrencyChange,
  className,
  showDetectedCurrency = true,
}: CurrencySwitchProps) {
  const [loading, setLoading] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<GeoLocation | null>(null);
  const [conversionRates, setConversionRates] = useState<Map<string, number>>(new Map());

  const currencies = getPopularCurrencies();

  // Detect user's location and currency on mount
  useEffect(() => {
    if (showDetectedCurrency) {
      detectUserLocation();
    }
  }, [showDetectedCurrency]);

  // Load conversion rates for display
  useEffect(() => {
    loadConversionRates();
  }, [currentCurrency]);

  const detectUserLocation = useCallback(async () => {
    try {
      const location = await detectGeoLocation();
      setDetectedLocation(location);
      
      // Auto-switch to detected currency if it's different and we haven't set a preference
      if (location.currency !== currentCurrency && 
          !localStorage.getItem('preferred-currency')) {
        onCurrencyChange(location.currency);
      }
    } catch (error) {
      console.warn("[CurrencySwitch] Location detection failed:", error);
    }
  }, [currentCurrency, onCurrencyChange]);

  const loadConversionRates = useCallback(async () => {
    if (currencies.length === 0) return;
    
    try {
      const rates = new Map<string, number>();
      
      // Load rates for popular currencies
      const sampleAmount = 100;
      const conversions = currencies.map(currency => ({
        amount: sampleAmount,
        fromCurrency: currentCurrency,
        toCurrency: currency.code,
      }));
      
      // For demo purposes, we'll use simplified conversion
      // In production, you'd batch fetch real rates
      for (const currency of currencies) {
        if (currency.code === currentCurrency) {
          rates.set(currency.code, 1);
        } else {
          try {
            const result = await convertCurrency(sampleAmount, currentCurrency, currency.code);
            rates.set(currency.code, result.rate);
          } catch (error) {
            console.warn(`[CurrencySwitch] Failed to get rate for ${currency.code}:`, error);
          }
        }
      }
      
      setConversionRates(rates);
    } catch (error) {
      console.warn("[CurrencySwitch] Failed to load conversion rates:", error);
    }
  }, [currentCurrency, currencies]);

  const handleCurrencyChange = useCallback((newCurrency: string) => {
    setLoading(true);
    
    // Store user preference
    localStorage.setItem('preferred-currency', newCurrency);
    
    onCurrencyChange(newCurrency);
    
    // Small delay for better UX
    setTimeout(() => setLoading(false), 300);
  }, [onCurrencyChange]);

  const getCurrencyDisplayName = useCallback((currency: typeof currencies[0]) => {
    const rate = conversionRates.get(currency.code);
    const rateText = rate && rate !== 1 ? ` (${rate.toFixed(3)})` : "";
    return `${currency.symbol} ${currency.code} - ${currency.name}${rateText}`;
  }, [conversionRates]);

  const currencyOptions = currencies.map(currency => ({
    label: getCurrencyDisplayName(currency),
    value: currency.code,
  }));

  // Add detected currency to options if not already included
  if (detectedLocation && 
      detectedLocation.currency && 
      !currencies.some(c => c.code === detectedLocation.currency)) {
    currencyOptions.unshift({
      label: `${detectedLocation.currency} (Detected)`,
      value: detectedLocation.currency,
    });
  }

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9-3-9m-9 9a9 9 0 019-9" />
      </svg>
      
      <select
        value={currentCurrency}
        onChange={(e) => handleCurrencyChange(e.target.value)}
        disabled={loading}
        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select currency...</option>
        {currencyOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {detectedLocation && showDetectedCurrency && (
        <div className="text-xs text-gray-500 ml-2">
          {detectedLocation.country}
        </div>
      )}
    </div>
  );
}

interface PriceDisplayProps {
  amount: number;
  currency: string;
  originalCurrency?: string;
  showOriginal?: boolean;
  className?: string;
}

export function PriceDisplay({
  amount,
  currency,
  originalCurrency,
  showOriginal = false,
  className,
}: PriceDisplayProps) {
  const [convertedAmount, setConvertedAmount] = useState<number>(amount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (originalCurrency && originalCurrency !== currency) {
      convertPrice();
    } else {
      setConvertedAmount(amount);
    }
  }, [amount, currency, originalCurrency]);

  const convertPrice = useCallback(async () => {
    if (!originalCurrency || originalCurrency === currency) return;
    
    setLoading(true);
    
    try {
      const result = await convertCurrency(amount, originalCurrency, currency);
      setConvertedAmount(result.convertedAmount);
    } catch (error) {
      console.warn("[PriceDisplay] Conversion failed:", error);
      setConvertedAmount(amount);
    } finally {
      setLoading(false);
    }
  }, [amount, originalCurrency, currency]);

  const formattedPrice = formatCurrency(convertedAmount, currency);
  const originalFormatted = originalCurrency ? formatCurrency(amount, originalCurrency) : null;

  return (
    <div className={className}>
      <span className={`font-semibold ${loading ? "opacity-50" : ""}`}>
        {loading ? "..." : formattedPrice}
      </span>
      
      {showOriginal && originalFormatted && originalCurrency !== currency && (
        <span className="text-sm text-gray-500 ml-2">
          (orig. {originalFormatted})
        </span>
      )}
    </div>
  );
}

interface CurrencyConverterProps {
  fromCurrency: string;
  toCurrency: string;
  amount?: number;
  onConvert?: (result: ConversionResult) => void;
  className?: string;
}

export function CurrencyConverter({
  fromCurrency,
  toCurrency,
  amount = 1,
  onConvert,
  className,
}: CurrencyConverterProps) {
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    performConversion();
  }, [fromCurrency, toCurrency, amount]);

  const performConversion = useCallback(async () => {
    setLoading(true);
    
    try {
      const conversionResult = await convertCurrency(amount, fromCurrency, toCurrency);
      setResult(conversionResult);
      onConvert?.(conversionResult);
    } catch (error) {
      console.error("[CurrencyConverter] Conversion failed:", error);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [amount, fromCurrency, toCurrency, onConvert]);

  if (loading) {
    return (
      <div className={`text-sm text-gray-500 ${className || ""}`}>
        Converting...
      </div>
    );
  }

  if (!result) {
    return (
      <div className={`text-sm text-red-500 ${className || ""}`}>
        Conversion failed
      </div>
    );
  }

  return (
    <div className={`text-sm ${className || ""}`}>
      <div className="flex items-center gap-2">
        <span>{formatCurrency(result.originalAmount, result.originalCurrency)}</span>
        <span className="text-gray-400">=</span>
        <span className="font-semibold">{result.formatted}</span>
      </div>
      
      <div className="text-xs text-gray-500 mt-1">
        Rate: 1 {fromCurrency} = {result.rate.toFixed(4)} {toCurrency}
      </div>
      
      {result.lastUpdated && (
        <div className="text-xs text-gray-400 mt-1">
          Updated: {result.lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

// Hook for using currency context
export function useCurrency() {
  const [currency, setCurrency] = useState<string>("USD");
  const [location, setLocation] = useState<GeoLocation | null>(null);

  useEffect(() => {
    // Load saved preference or detect from location
    const saved = localStorage.getItem('preferred-currency');
    if (saved) {
      setCurrency(saved);
    } else {
      detectGeoLocation()
        .then(loc => {
          setLocation(loc);
          setCurrency(loc.currency);
        })
        .catch(error => {
          console.warn("[useCurrency] Location detection failed:", error);
        });
    }
  }, []);

  const updateCurrency = useCallback((newCurrency: string) => {
    setCurrency(newCurrency);
    localStorage.setItem('preferred-currency', newCurrency);
  }, []);

  return {
    currency,
    setCurrency: updateCurrency,
    location,
  };
}