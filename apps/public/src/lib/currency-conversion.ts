/**
 * Currency Conversion Utilities
 * 
 * Real-time currency conversion with caching, fallback rates, and 
 * localized formatting for the MINIMALL platform.
 */

import { z } from "zod";

export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rate: number; // Rate to USD
  lastUpdated: Date;
}

export interface ConversionResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  convertedCurrency: string;
  rate: number;
  formatted: string;
  lastUpdated: Date;
}

export interface CurrencyFormatOptions {
  showSymbol?: boolean;
  showCode?: boolean;
  decimalPlaces?: number;
  locale?: string;
}

const currencyRateSchema = z.object({
  code: z.string().length(3),
  name: z.string(),
  symbol: z.string(),
  rate: z.number().positive(),
  lastUpdated: z.coerce.date(),
});

// In-memory cache for exchange rates
const ratesCache = new Map<string, CurrencyRate>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Get current exchange rates with caching
 */
export async function getExchangeRates(baseCurrency = "USD"): Promise<Map<string, CurrencyRate>> {
  const cacheKey = `rates_${baseCurrency}`;
  const cached = ratesCache.get(cacheKey);
  
  // Return cached rates if still valid
  if (cached && isRateFresh(cached)) {
    return new Map([[cached.code, cached]]);
  }
  
  try {
    // Fetch fresh rates from API
    const rates = await fetchExchangeRates(baseCurrency);
    
    // Update cache
    for (const [code, rate] of rates.entries()) {
      ratesCache.set(`rates_${code}`, rate);
    }
    
    return rates;
  } catch (error) {
    console.warn("[Currency] Failed to fetch exchange rates:", error);
    
    // Return cached rates even if stale, or fallback rates
    if (cached) {
      return new Map([[cached.code, cached]]);
    }
    
    return getFallbackRates(baseCurrency);
  }
}

/**
 * Fetch exchange rates from external API
 */
async function fetchExchangeRates(baseCurrency: string): Promise<Map<string, CurrencyRate>> {
  const rates = new Map<string, CurrencyRate>();
  
  // Try primary API (Fixer.io or similar)
  if (process.env.EXCHANGE_RATE_API_KEY) {
    try {
      const response = await fetch(
        `https://api.fixer.io/v1/latest?access_key=${process.env.EXCHANGE_RATE_API_KEY}&base=${baseCurrency}`,
        { 
          headers: { "User-Agent": "MINIMALL/1.0" },
        }
      );
      
      const data = await response.json();
      
      if (data.success && data.rates) {
        const now = new Date();
        
        for (const [code, rate] of Object.entries(data.rates)) {
          const currencyInfo = getCurrencyInfo(code);
          
          rates.set(code, {
            code,
            name: currencyInfo.name,
            symbol: currencyInfo.symbol,
            rate: rate as number,
            lastUpdated: now,
          });
        }
        
        return rates;
      }
    } catch (error) {
      console.warn("[Currency] Primary API failed:", error);
    }
  }
  
  // Try fallback API (exchangerate-api.com - free tier)
  try {
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`,
      {
        headers: { "User-Agent": "MINIMALL/1.0" },
      }
    );
    
    const data = await response.json();
    
    if (data.rates) {
      const now = new Date();
      
      for (const [code, rate] of Object.entries(data.rates)) {
        const currencyInfo = getCurrencyInfo(code);
        
        rates.set(code, {
          code,
          name: currencyInfo.name,
          symbol: currencyInfo.symbol,
          rate: rate as number,
          lastUpdated: now,
        });
      }
      
      return rates;
    }
  } catch (error) {
    console.warn("[Currency] Fallback API failed:", error);
  }
  
  throw new Error("All exchange rate APIs failed");
}

/**
 * Get fallback exchange rates (static rates updated periodically)
 */
function getFallbackRates(baseCurrency: string): Map<string, CurrencyRate> {
  const fallbackRates: Record<string, number> = {
    // Major currencies (approximate rates to USD)
    USD: 1.0,
    EUR: 0.85,
    GBP: 0.73,
    JPY: 110.0,
    CAD: 1.25,
    AUD: 1.35,
    CHF: 0.92,
    CNY: 6.45,
    INR: 74.5,
    BRL: 5.2,
    MXN: 20.1,
    SGD: 1.35,
    HKD: 7.8,
    NOK: 8.5,
    SEK: 8.7,
    DKK: 6.3,
    PLN: 3.8,
    CZK: 21.5,
    HUF: 295.0,
    RUB: 73.0,
    TRY: 8.5,
    ZAR: 14.2,
    NZD: 1.42,
    KRW: 1185.0,
    THB: 31.5,
    MYR: 4.1,
    PHP: 50.5,
    IDR: 14250.0,
    VND: 23100.0,
  };
  
  const rates = new Map<string, CurrencyRate>();
  const now = new Date();
  
  // Convert rates if base currency is not USD
  const baseRate = fallbackRates[baseCurrency] || 1.0;
  
  for (const [code, rate] of Object.entries(fallbackRates)) {
    const convertedRate = baseCurrency === "USD" ? rate : rate / baseRate;
    const currencyInfo = getCurrencyInfo(code);
    
    rates.set(code, {
      code,
      name: currencyInfo.name,
      symbol: currencyInfo.symbol,
      rate: convertedRate,
      lastUpdated: now,
    });
  }
  
  return rates;
}

/**
 * Convert amount between currencies
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<ConversionResult> {
  if (fromCurrency === toCurrency) {
    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: amount,
      convertedCurrency: toCurrency,
      rate: 1,
      formatted: formatCurrency(amount, toCurrency),
      lastUpdated: new Date(),
    };
  }
  
  try {
    // Get exchange rates
    const rates = await getExchangeRates("USD");
    
    // Get rates for both currencies
    const fromRate = fromCurrency === "USD" ? 1 : (rates.get(fromCurrency)?.rate || 1);
    const toRate = toCurrency === "USD" ? 1 : (rates.get(toCurrency)?.rate || 1);
    
    // Convert: amount -> USD -> target currency
    const usdAmount = amount / fromRate;
    const convertedAmount = usdAmount * toRate;
    const conversionRate = toRate / fromRate;
    
    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount,
      convertedCurrency: toCurrency,
      rate: conversionRate,
      formatted: formatCurrency(convertedAmount, toCurrency),
      lastUpdated: rates.get(toCurrency)?.lastUpdated || new Date(),
    };
  } catch (error) {
    console.error("[Currency] Conversion failed:", error);
    
    // Return original amount if conversion fails
    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: amount,
      convertedCurrency: fromCurrency,
      rate: 1,
      formatted: formatCurrency(amount, fromCurrency),
      lastUpdated: new Date(),
    };
  }
}

/**
 * Format currency amount according to local conventions
 */
export function formatCurrency(
  amount: number,
  currencyCode: string,
  options: CurrencyFormatOptions = {}
): string {
  const {
    showSymbol = true,
    showCode = false,
    decimalPlaces,
    locale = "en-US",
  } = options;
  
  const currencyInfo = getCurrencyInfo(currencyCode);
  const finalDecimalPlaces = decimalPlaces ?? currencyInfo.decimalPlaces;
  
  try {
    // Use Intl.NumberFormat for proper localization
    const formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: finalDecimalPlaces,
      maximumFractionDigits: finalDecimalPlaces,
    });
    
    let formatted = formatter.format(amount);
    
    // Modify format based on options
    if (!showSymbol && !showCode) {
      // Remove currency symbol/code
      formatted = formatted.replace(/[^\d.,\s-]/g, "").trim();
    } else if (showCode && !showSymbol) {
      // Replace symbol with code
      formatted = `${amount.toFixed(finalDecimalPlaces)} ${currencyCode}`;
    }
    
    return formatted;
  } catch (error) {
    // Fallback formatting
    const symbol = showSymbol ? currencyInfo.symbol : "";
    const code = showCode ? ` ${currencyCode}` : "";
    return `${symbol}${amount.toFixed(finalDecimalPlaces)}${code}`;
  }
}

/**
 * Get currency information
 */
export function getCurrencyInfo(currencyCode: string): {
  name: string;
  symbol: string;
  decimalPlaces: number;
} {
  const currencies: Record<string, any> = {
    USD: { name: "US Dollar", symbol: "$", decimalPlaces: 2 },
    EUR: { name: "Euro", symbol: "€", decimalPlaces: 2 },
    GBP: { name: "British Pound", symbol: "£", decimalPlaces: 2 },
    JPY: { name: "Japanese Yen", symbol: "¥", decimalPlaces: 0 },
    CAD: { name: "Canadian Dollar", symbol: "C$", decimalPlaces: 2 },
    AUD: { name: "Australian Dollar", symbol: "A$", decimalPlaces: 2 },
    CHF: { name: "Swiss Franc", symbol: "CHF", decimalPlaces: 2 },
    CNY: { name: "Chinese Yuan", symbol: "¥", decimalPlaces: 2 },
    INR: { name: "Indian Rupee", symbol: "₹", decimalPlaces: 2 },
    BRL: { name: "Brazilian Real", symbol: "R$", decimalPlaces: 2 },
    MXN: { name: "Mexican Peso", symbol: "MX$", decimalPlaces: 2 },
    SGD: { name: "Singapore Dollar", symbol: "S$", decimalPlaces: 2 },
    HKD: { name: "Hong Kong Dollar", symbol: "HK$", decimalPlaces: 2 },
    NOK: { name: "Norwegian Krone", symbol: "kr", decimalPlaces: 2 },
    SEK: { name: "Swedish Krona", symbol: "kr", decimalPlaces: 2 },
    DKK: { name: "Danish Krone", symbol: "kr", decimalPlaces: 2 },
    PLN: { name: "Polish Zloty", symbol: "zł", decimalPlaces: 2 },
    CZK: { name: "Czech Koruna", symbol: "Kč", decimalPlaces: 2 },
    HUF: { name: "Hungarian Forint", symbol: "Ft", decimalPlaces: 0 },
    RUB: { name: "Russian Ruble", symbol: "₽", decimalPlaces: 2 },
    TRY: { name: "Turkish Lira", symbol: "₺", decimalPlaces: 2 },
    ZAR: { name: "South African Rand", symbol: "R", decimalPlaces: 2 },
    NZD: { name: "New Zealand Dollar", symbol: "NZ$", decimalPlaces: 2 },
    KRW: { name: "South Korean Won", symbol: "₩", decimalPlaces: 0 },
    THB: { name: "Thai Baht", symbol: "฿", decimalPlaces: 2 },
    MYR: { name: "Malaysian Ringgit", symbol: "RM", decimalPlaces: 2 },
    PHP: { name: "Philippine Peso", symbol: "₱", decimalPlaces: 2 },
    IDR: { name: "Indonesian Rupiah", symbol: "Rp", decimalPlaces: 0 },
    VND: { name: "Vietnamese Dong", symbol: "₫", decimalPlaces: 0 },
  };
  
  return currencies[currencyCode] || {
    name: currencyCode,
    symbol: currencyCode,
    decimalPlaces: 2,
  };
}

/**
 * Get popular currencies list
 */
export function getPopularCurrencies(): Array<{
  code: string;
  name: string;
  symbol: string;
  region: string;
}> {
  return [
    { code: "USD", name: "US Dollar", symbol: "$", region: "North America" },
    { code: "EUR", name: "Euro", symbol: "€", region: "Europe" },
    { code: "GBP", name: "British Pound", symbol: "£", region: "Europe" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥", region: "Asia" },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$", region: "North America" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$", region: "Oceania" },
    { code: "CHF", name: "Swiss Franc", symbol: "CHF", region: "Europe" },
    { code: "CNY", name: "Chinese Yuan", symbol: "¥", region: "Asia" },
    { code: "INR", name: "Indian Rupee", symbol: "₹", region: "Asia" },
    { code: "BRL", name: "Brazilian Real", symbol: "R$", region: "South America" },
    { code: "MXN", name: "Mexican Peso", symbol: "MX$", region: "North America" },
    { code: "SGD", name: "Singapore Dollar", symbol: "S$", region: "Asia" },
  ];
}

/**
 * Check if exchange rate is still fresh
 */
function isRateFresh(rate: CurrencyRate): boolean {
  const now = Date.now();
  const rateTime = rate.lastUpdated.getTime();
  return (now - rateTime) < CACHE_DURATION;
}

/**
 * Batch convert multiple amounts
 */
export async function batchConvert(
  conversions: Array<{
    amount: number;
    fromCurrency: string;
    toCurrency: string;
  }>
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = [];
  
  // Get all unique currency pairs
  const currenciesNeeded = new Set<string>();
  for (const conv of conversions) {
    currenciesNeeded.add(conv.fromCurrency);
    currenciesNeeded.add(conv.toCurrency);
  }
  
  // Fetch rates once for all currencies
  const rates = await getExchangeRates("USD");
  
  // Perform conversions
  for (const conv of conversions) {
    const result = await convertCurrency(conv.amount, conv.fromCurrency, conv.toCurrency);
    results.push(result);
  }
  
  return results;
}

/**
 * Get currency by country code
 */
export function getCurrencyByCountry(countryCode: string): string {
  const countryToCurrency: Record<string, string> = {
    US: "USD", CA: "CAD", MX: "MXN",
    GB: "GBP", DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR",
    JP: "JPY", CN: "CNY", IN: "INR", AU: "AUD", SG: "SGD", HK: "HKD",
    BR: "BRL", ZA: "ZAR", CH: "CHF", NO: "NOK", SE: "SEK", DK: "DKK",
    PL: "PLN", CZ: "CZK", HU: "HUF", RU: "RUB", TR: "TRY", NZ: "NZD",
    KR: "KRW", TH: "THB", MY: "MYR", PH: "PHP", ID: "IDR", VN: "VND",
  };
  
  return countryToCurrency[countryCode] || "USD";
}

/**
 * Validate currency code
 */
export function isValidCurrencyCode(code: string): boolean {
  return code.length === 3 && /^[A-Z]{3}$/.test(code);
}

/**
 * Clear exchange rate cache
 */
export function clearRatesCache(): void {
  ratesCache.clear();
}