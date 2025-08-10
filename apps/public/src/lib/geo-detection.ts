/**
 * Geographic Detection Utilities
 * 
 * Utilities for detecting user location and providing geo-specific functionality
 * including currency, language, and content localization for MINIMALL platform.
 */

import { z } from "zod";
import { conditionalProps, safeOptionalProp, safeArrayAccess } from "./type-utils";

export interface GeoLocation {
  country: string;
  countryCode: string;
  region?: string;
  city?: string;
  timezone: string;
  currency: string;
  language: string;
  continent: string;
  latitude?: number;
  longitude?: number;
}

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  rate: number; // Exchange rate to USD
  lastUpdated: Date;
}

export interface MarketConfig {
  countryCode: string;
  currency: string;
  language: string;
  timezone: string;
  taxRate?: number;
  shippingZone?: string;
  paymentMethods: string[];
  compliance: {
    gdpr?: boolean;
    ccpa?: boolean;
    ageVerification?: boolean;
    cookieConsent?: boolean;
  };
}

const geoLocationSchema = z.object({
  country: z.string(),
  countryCode: z.string().length(2),
  region: z.string().optional(),
  city: z.string().optional(),
  timezone: z.string(),
  currency: z.string().length(3),
  language: z.string(),
  continent: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

/**
 * Detect user's geographic location using multiple methods
 */
export async function detectGeoLocation(request?: Request): Promise<GeoLocation> {
  // Try Cloudflare headers first (most reliable for edge functions)
  if (request) {
    const cfLocation = getCloudflareLocation(request);
    if (cfLocation) {
      return cfLocation;
    }
  }
  
  // Try Vercel headers
  if (request) {
    const vercelLocation = getVercelLocation(request);
    if (vercelLocation) {
      return vercelLocation;
    }
  }
  
  // Fallback to IP geolocation service
  try {
    const ipLocation = await getIPGeolocation(request);
    if (ipLocation) {
      return ipLocation;
    }
  } catch (error) {
    console.warn("[GeoDetection] IP geolocation failed:", error);
  }
  
  // Final fallback to default (US)
  return getDefaultLocation();
}

/**
 * Extract location from Cloudflare headers
 */
function getCloudflareLocation(request: Request): GeoLocation | null {
  const headers = request.headers;
  
  const country = headers.get("cf-ipcountry");
  const timezone = headers.get("cf-timezone");
  const region = headers.get("cf-region");
  const city = headers.get("cf-city");
  const lat = headers.get("cf-latitude");
  const lon = headers.get("cf-longitude");
  
  if (!country) return null;
  
  const marketInfo = getMarketInfo(country);
  
  const result: GeoLocation = {
    country: marketInfo.countryName,
    countryCode: country,
    timezone: timezone || marketInfo.timezone,
    currency: marketInfo.currency,
    language: marketInfo.language,
    continent: marketInfo.continent,
  };
  
  // Add optional properties only if they exist
  if (region) result.region = region;
  if (city) result.city = city;
  if (lat) result.latitude = parseFloat(lat);
  if (lon) result.longitude = parseFloat(lon);
  
  return result;
}

/**
 * Extract location from Vercel headers
 */
function getVercelLocation(request: Request): GeoLocation | null {
  const headers = request.headers;
  
  const country = headers.get("x-vercel-ip-country");
  const region = headers.get("x-vercel-ip-country-region");
  const city = headers.get("x-vercel-ip-city");
  const timezone = headers.get("x-vercel-ip-timezone");
  const lat = headers.get("x-vercel-ip-latitude");
  const lon = headers.get("x-vercel-ip-longitude");
  
  if (!country) return null;
  
  const marketInfo = getMarketInfo(country);
  
  const result: GeoLocation = {
    country: marketInfo.countryName,
    countryCode: country,
    timezone: timezone || marketInfo.timezone,
    currency: marketInfo.currency,
    language: marketInfo.language,
    continent: marketInfo.continent,
  };
  
  // Add optional properties only if they exist
  if (region) result.region = region;
  if (city) result.city = city;
  if (lat) result.latitude = parseFloat(lat);
  if (lon) result.longitude = parseFloat(lon);
  
  return result;
}

/**
 * Get location using IP geolocation service
 */
async function getIPGeolocation(request?: Request): Promise<GeoLocation | null> {
  try {
    // Use ipapi.co or similar service
    const ip = request ? getClientIP(request) : undefined;
    const url = ip ? `https://ipapi.co/${ip}/json/` : "https://ipapi.co/json/";
    
    const response = await fetch(url, {
      headers: { "User-Agent": "MINIMALL/1.0" },
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.error) return null;
    
    const marketInfo = getMarketInfo(data.country_code);
    
    return {
      country: data.country_name || marketInfo.countryName,
      countryCode: data.country_code,
      region: data.region,
      city: data.city,
      timezone: data.timezone || marketInfo.timezone,
      currency: data.currency || marketInfo.currency,
      language: data.languages?.split(",")[0] || marketInfo.language,
      continent: data.continent_code || marketInfo.continent,
      latitude: data.latitude,
      longitude: data.longitude,
    };
  } catch (error) {
    console.warn("[GeoDetection] IP geolocation service failed:", error);
    return null;
  }
}

/**
 * Extract client IP from request
 */
function getClientIP(request: Request): string | null {
  const headers = request.headers;
  
  // Try various IP headers
  const ipHeaders = [
    "cf-connecting-ip", // Cloudflare
    "x-real-ip",
    "x-forwarded-for",
    "x-client-ip",
    "x-forwarded",
    "forwarded-for",
    "forwarded",
  ];
  
  for (const header of ipHeaders) {
    const ip = headers.get(header);
    if (ip) {
      // Handle comma-separated IPs (take first one)
      const firstIP = safeArrayAccess(ip.split(","), 0);
      return firstIP ? firstIP.trim() : null;
    }
  }
  
  return null;
}

/**
 * Get default location fallback
 */
function getDefaultLocation(): GeoLocation {
  return {
    country: "United States",
    countryCode: "US",
    timezone: "America/New_York",
    currency: "USD",
    language: "en",
    continent: "NA",
  };
}

/**
 * Get market information by country code
 */
function getMarketInfo(countryCode: string): {
  countryName: string;
  currency: string;
  language: string;
  timezone: string;
  continent: string;
} {
  const markets: Record<string, any> = {
    // North America
    US: { countryName: "United States", currency: "USD", language: "en", timezone: "America/New_York", continent: "NA" },
    CA: { countryName: "Canada", currency: "CAD", language: "en", timezone: "America/Toronto", continent: "NA" },
    MX: { countryName: "Mexico", currency: "MXN", language: "es", timezone: "America/Mexico_City", continent: "NA" },
    
    // Europe
    GB: { countryName: "United Kingdom", currency: "GBP", language: "en", timezone: "Europe/London", continent: "EU" },
    DE: { countryName: "Germany", currency: "EUR", language: "de", timezone: "Europe/Berlin", continent: "EU" },
    FR: { countryName: "France", currency: "EUR", language: "fr", timezone: "Europe/Paris", continent: "EU" },
    IT: { countryName: "Italy", currency: "EUR", language: "it", timezone: "Europe/Rome", continent: "EU" },
    ES: { countryName: "Spain", currency: "EUR", language: "es", timezone: "Europe/Madrid", continent: "EU" },
    NL: { countryName: "Netherlands", currency: "EUR", language: "nl", timezone: "Europe/Amsterdam", continent: "EU" },
    
    // Asia Pacific
    JP: { countryName: "Japan", currency: "JPY", language: "ja", timezone: "Asia/Tokyo", continent: "AS" },
    CN: { countryName: "China", currency: "CNY", language: "zh", timezone: "Asia/Shanghai", continent: "AS" },
    IN: { countryName: "India", currency: "INR", language: "en", timezone: "Asia/Kolkata", continent: "AS" },
    AU: { countryName: "Australia", currency: "AUD", language: "en", timezone: "Australia/Sydney", continent: "OC" },
    SG: { countryName: "Singapore", currency: "SGD", language: "en", timezone: "Asia/Singapore", continent: "AS" },
    HK: { countryName: "Hong Kong", currency: "HKD", language: "en", timezone: "Asia/Hong_Kong", continent: "AS" },
    
    // Others
    BR: { countryName: "Brazil", currency: "BRL", language: "pt", timezone: "America/Sao_Paulo", continent: "SA" },
    ZA: { countryName: "South Africa", currency: "ZAR", language: "en", timezone: "Africa/Johannesburg", continent: "AF" },
  };
  
  return markets[countryCode] || {
    countryName: "Unknown",
    currency: "USD",
    language: "en",
    timezone: "UTC",
    continent: "UN",
  };
}

/**
 * Get market configuration for a country
 */
export function getMarketConfig(countryCode: string): MarketConfig {
  const baseConfig: Record<string, MarketConfig> = {
    US: {
      countryCode: "US",
      currency: "USD",
      language: "en",
      timezone: "America/New_York",
      taxRate: 0.08,
      shippingZone: "domestic",
      paymentMethods: ["card", "paypal", "apple-pay", "google-pay"],
      compliance: {
        ccpa: true,
        cookieConsent: true,
      },
    },
    
    GB: {
      countryCode: "GB",
      currency: "GBP",
      language: "en",
      timezone: "Europe/London",
      taxRate: 0.20, // VAT
      shippingZone: "eu",
      paymentMethods: ["card", "paypal", "apple-pay"],
      compliance: {
        gdpr: true,
        cookieConsent: true,
      },
    },
    
    DE: {
      countryCode: "DE",
      currency: "EUR",
      language: "de",
      timezone: "Europe/Berlin",
      taxRate: 0.19, // VAT
      shippingZone: "eu",
      paymentMethods: ["card", "paypal", "sofort"],
      compliance: {
        gdpr: true,
        ageVerification: true,
        cookieConsent: true,
      },
    },
    
    JP: {
      countryCode: "JP",
      currency: "JPY",
      language: "ja",
      timezone: "Asia/Tokyo",
      taxRate: 0.10, // Consumption tax
      shippingZone: "asia",
      paymentMethods: ["card", "konbini", "bank-transfer"],
      compliance: {
        cookieConsent: false, // Different privacy laws
      },
    },
  };
  
  return baseConfig[countryCode] || {
    countryCode,
    currency: "USD",
    language: "en",
    timezone: "UTC",
    paymentMethods: ["card"],
    compliance: {},
  };
}

/**
 * Check if user is in EU for GDPR compliance
 */
export function isEUCountry(countryCode: string): boolean {
  const euCountries = [
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
    "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
    "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  ];
  
  return euCountries.includes(countryCode);
}

/**
 * Check if user is in California for CCPA compliance
 */
export function isCCPAApplicable(location: GeoLocation): boolean {
  return location.countryCode === "US" && 
         (location.region === "CA" || location.region === "California");
}

/**
 * Get appropriate privacy compliance requirements
 */
export function getComplianceRequirements(location: GeoLocation): {
  gdpr: boolean;
  ccpa: boolean;
  cookieConsent: boolean;
  ageVerification: boolean;
} {
  const isEU = isEUCountry(location.countryCode);
  const isCCPA = isCCPAApplicable(location);
  
  return {
    gdpr: isEU,
    ccpa: isCCPA,
    cookieConsent: isEU || isCCPA,
    ageVerification: isEU && ["DE", "FR", "IT"].includes(location.countryCode),
  };
}

/**
 * Format address according to local conventions
 */
export function formatAddress(
  address: {
    street: string;
    city: string;
    state?: string;
    postal: string;
    country: string;
  },
  countryCode: string
): string {
  switch (countryCode) {
    case "US":
    case "CA":
      return `${address.street}\n${address.city}, ${address.state} ${address.postal}\n${address.country}`;
    
    case "GB":
      return `${address.street}\n${address.city}\n${address.postal}\n${address.country}`;
    
    case "DE":
    case "FR":
    case "IT":
      return `${address.street}\n${address.postal} ${address.city}\n${address.country}`;
    
    case "JP":
      return `${address.country}\n${address.postal}\n${address.city}\n${address.street}`;
    
    default:
      return `${address.street}\n${address.city}\n${address.postal}\n${address.country}`;
  }
}

/**
 * Get phone number formatting pattern for country
 */
export function getPhoneFormat(countryCode: string): {
  pattern: string;
  placeholder: string;
  maxLength: number;
} {
  const formats: Record<string, any> = {
    US: { pattern: "+1 (###) ###-####", placeholder: "+1 (555) 123-4567", maxLength: 14 },
    GB: { pattern: "+44 #### ######", placeholder: "+44 1234 567890", maxLength: 14 },
    DE: { pattern: "+49 ### ########", placeholder: "+49 123 45678901", maxLength: 15 },
    JP: { pattern: "+81 ##-####-####", placeholder: "+81 90-1234-5678", maxLength: 13 },
    FR: { pattern: "+33 # ## ## ## ##", placeholder: "+33 1 23 45 67 89", maxLength: 14 },
  };
  
  return formats[countryCode] || {
    pattern: "+### ### ### ####",
    placeholder: "+123 456 789 0123",
    maxLength: 16,
  };
}

/**
 * Validate geo location data
 */
export function validateGeoLocation(location: unknown): location is GeoLocation {
  try {
    geoLocationSchema.parse(location);
    return true;
  } catch {
    return false;
  }
}