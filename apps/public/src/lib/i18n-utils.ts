/**
 * Internationalization (i18n) Utilities
 * 
 * Multi-language content management utilities for the MINIMALL platform
 * supporting dynamic content translation, locale detection, and formatting.
 */

import { z } from "zod";

export interface TranslatedContent {
  [key: string]: string | TranslatedContent;
}

export interface LocalizedString {
  en: string; // English is the default/fallback
  [locale: string]: string;
}

export interface SiteContentTranslations {
  categories: Array<{
    id: string;
    title: LocalizedString;
    description?: LocalizedString;
  }>;
  products: Array<{
    id: string;
    title: LocalizedString;
    description?: LocalizedString;
    tags?: LocalizedString[];
  }>;
  ui: {
    buttons: {
      addToCart: LocalizedString;
      buyNow: LocalizedString;
      viewMore: LocalizedString;
      close: LocalizedString;
      back: LocalizedString;
      next: LocalizedString;
    };
    labels: {
      price: LocalizedString;
      quantity: LocalizedString;
      total: LocalizedString;
      shipping: LocalizedString;
      tax: LocalizedString;
      currency: LocalizedString;
    };
    messages: {
      loading: LocalizedString;
      error: LocalizedString;
      success: LocalizedString;
      addedToCart: LocalizedString;
      cartEmpty: LocalizedString;
    };
  };
  legal: {
    privacy: LocalizedString;
    terms: LocalizedString;
    cookies: LocalizedString;
    gdprNotice?: LocalizedString;
    ccpaNotice?: LocalizedString;
  };
}

export interface LocaleConfig {
  code: string; // ISO 639-1 language code (e.g., 'en', 'es', 'fr')
  name: string; // Display name
  nativeName: string; // Native language name
  flag: string; // Flag emoji or country code
  rtl: boolean; // Right-to-left writing direction
  dateFormat: string; // Date format pattern
  timeFormat: string; // Time format pattern
  numberFormat: {
    decimal: string;
    thousands: string;
    grouping: number[];
  };
  currency?: string; // Default currency for this locale
  region?: string; // Geographic region
}

const localizedStringSchema = z.record(z.string());
const localeConfigSchema = z.object({
  code: z.string().min(2).max(5),
  name: z.string(),
  nativeName: z.string(),
  flag: z.string(),
  rtl: z.boolean(),
  dateFormat: z.string(),
  timeFormat: z.string(),
  numberFormat: z.object({
    decimal: z.string(),
    thousands: z.string(),
    grouping: z.array(z.number()),
  }),
  currency: z.string().optional(),
  region: z.string().optional(),
});

/**
 * Get supported locales configuration
 */
export function getSupportedLocales(): LocaleConfig[] {
  return [
    {
      code: "en",
      name: "English",
      nativeName: "English",
      flag: "🇺🇸",
      rtl: false,
      dateFormat: "MM/dd/yyyy",
      timeFormat: "h:mm a",
      numberFormat: { decimal: ".", thousands: ",", grouping: [3] },
      currency: "USD",
      region: "US",
    },
    {
      code: "es",
      name: "Spanish",
      nativeName: "Español",
      flag: "🇪🇸",
      rtl: false,
      dateFormat: "dd/MM/yyyy",
      timeFormat: "HH:mm",
      numberFormat: { decimal: ",", thousands: ".", grouping: [3] },
      currency: "EUR",
      region: "ES",
    },
    {
      code: "fr",
      name: "French",
      nativeName: "Français",
      flag: "🇫🇷",
      rtl: false,
      dateFormat: "dd/MM/yyyy",
      timeFormat: "HH:mm",
      numberFormat: { decimal: ",", thousands: " ", grouping: [3] },
      currency: "EUR",
      region: "FR",
    },
    {
      code: "de",
      name: "German",
      nativeName: "Deutsch",
      flag: "🇩🇪",
      rtl: false,
      dateFormat: "dd.MM.yyyy",
      timeFormat: "HH:mm",
      numberFormat: { decimal: ",", thousands: ".", grouping: [3] },
      currency: "EUR",
      region: "DE",
    },
    {
      code: "it",
      name: "Italian",
      nativeName: "Italiano",
      flag: "🇮🇹",
      rtl: false,
      dateFormat: "dd/MM/yyyy",
      timeFormat: "HH:mm",
      numberFormat: { decimal: ",", thousands: ".", grouping: [3] },
      currency: "EUR",
      region: "IT",
    },
    {
      code: "pt",
      name: "Portuguese",
      nativeName: "Português",
      flag: "🇧🇷",
      rtl: false,
      dateFormat: "dd/MM/yyyy",
      timeFormat: "HH:mm",
      numberFormat: { decimal: ",", thousands: ".", grouping: [3] },
      currency: "BRL",
      region: "BR",
    },
    {
      code: "ja",
      name: "Japanese",
      nativeName: "日本語",
      flag: "🇯🇵",
      rtl: false,
      dateFormat: "yyyy/MM/dd",
      timeFormat: "HH:mm",
      numberFormat: { decimal: ".", thousands: ",", grouping: [3] },
      currency: "JPY",
      region: "JP",
    },
    {
      code: "ko",
      name: "Korean",
      nativeName: "한국어",
      flag: "🇰🇷",
      rtl: false,
      dateFormat: "yyyy.MM.dd",
      timeFormat: "HH:mm",
      numberFormat: { decimal: ".", thousands: ",", grouping: [3] },
      currency: "KRW",
      region: "KR",
    },
    {
      code: "zh",
      name: "Chinese (Simplified)",
      nativeName: "简体中文",
      flag: "🇨🇳",
      rtl: false,
      dateFormat: "yyyy/MM/dd",
      timeFormat: "HH:mm",
      numberFormat: { decimal: ".", thousands: ",", grouping: [3] },
      currency: "CNY",
      region: "CN",
    },
    {
      code: "ar",
      name: "Arabic",
      nativeName: "العربية",
      flag: "🇸🇦",
      rtl: true,
      dateFormat: "dd/MM/yyyy",
      timeFormat: "HH:mm",
      numberFormat: { decimal: ".", thousands: ",", grouping: [3] },
      currency: "SAR",
      region: "SA",
    },
  ];
}

/**
 * Detect user's preferred language from various sources
 */
export function detectUserLanguage(request?: Request): string {
  // Try URL parameter first
  if (request) {
    const url = new URL(request.url);
    const langParam = url.searchParams.get("lang");
    if (langParam && isValidLocale(langParam)) {
      return langParam;
    }
  }
  
  // Try Accept-Language header
  if (request) {
    const acceptLanguage = request.headers.get("accept-language");
    if (acceptLanguage) {
      const preferred = parseAcceptLanguage(acceptLanguage);
      const supported = getSupportedLocales().map(l => l.code);
      
      for (const lang of preferred) {
        if (supported.includes(lang)) {
          return lang;
        }
        
        // Try language without region (e.g., 'en' from 'en-US')
        const baseLang = lang.split("-")[0];
        if (baseLang && supported.includes(baseLang)) {
          return baseLang;
        }
      }
    }
  }
  
  // Try localStorage (client-side only)
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("preferred-language");
    if (saved && isValidLocale(saved)) {
      return saved;
    }
    
    // Try browser language
    const browserLang = navigator.language || "en";
    const baseLang = browserLang.split("-")[0];
    if (baseLang && isValidLocale(baseLang)) {
      return baseLang;
    }
  }
  
  // Default fallback
  return "en";
}

/**
 * Parse Accept-Language header
 */
function parseAcceptLanguage(acceptLanguage: string): string[] {
  return acceptLanguage
    .split(",")
    .map(lang => {
      const [code, q] = lang.trim().split(";q=");
      return {
        code: code ? code.toLowerCase() : '',
        quality: q ? parseFloat(q) : 1,
      };
    })
    .sort((a, b) => b.quality - a.quality)
    .map(item => item.code);
}

/**
 * Get localized string with fallback to English
 */
export function getLocalizedString(
  localizedContent: LocalizedString,
  locale: string
): string {
  return localizedContent[locale] || localizedContent.en || Object.values(localizedContent)[0] || "";
}

/**
 * Get localized content for a specific locale
 */
export function localizeContent<T extends Record<string, any>>(
  content: T,
  locale: string
): T {
  const localized = { ...content };
  
  function localizeValue(value: any): any {
    if (value && typeof value === "object") {
      // Check if it's a localized string object
      if (value.en && typeof value.en === "string") {
        return getLocalizedString(value as LocalizedString, locale);
      }
      
      // Recursively localize nested objects
      if (Array.isArray(value)) {
        return value.map(localizeValue);
      } else {
        const localizedObj: any = {};
        for (const [key, val] of Object.entries(value)) {
          localizedObj[key] = localizeValue(val);
        }
        return localizedObj;
      }
    }
    
    return value;
  }
  
  for (const [key, value] of Object.entries(localized)) {
    (localized as any)[key] = localizeValue(value);
  }
  
  return localized;
}

/**
 * Format date according to locale
 */
export function formatLocalizedDate(
  date: Date,
  locale: string,
  format?: "short" | "medium" | "long" | "full"
): string {
  const localeConfig = getSupportedLocales().find(l => l.code === locale);
  
  try {
    const options: Intl.DateTimeFormatOptions = {};
    
    switch (format) {
      case "short":
        options.dateStyle = "short";
        break;
      case "medium":
        options.dateStyle = "medium";
        break;
      case "long":
        options.dateStyle = "long";
        break;
      case "full":
        options.dateStyle = "full";
        break;
      default:
        options.year = "numeric";
        options.month = "2-digit";
        options.day = "2-digit";
    }
    
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch (error) {
    // Fallback to English formatting
    return date.toLocaleDateString("en-US");
  }
}

/**
 * Format time according to locale
 */
export function formatLocalizedTime(
  date: Date,
  locale: string,
  format?: "short" | "medium" | "long"
): string {
  try {
    const options: Intl.DateTimeFormatOptions = {};
    
    switch (format) {
      case "short":
        options.timeStyle = "short";
        break;
      case "medium":
        options.timeStyle = "medium";
        break;
      case "long":
        options.timeStyle = "long";
        break;
      default:
        options.hour = "2-digit";
        options.minute = "2-digit";
    }
    
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch (error) {
    return date.toLocaleTimeString("en-US");
  }
}

/**
 * Format number according to locale
 */
export function formatLocalizedNumber(
  number: number,
  locale: string,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    useGrouping?: boolean;
  }
): string {
  try {
    return new Intl.NumberFormat(locale, options).format(number);
  } catch (error) {
    return number.toLocaleString("en-US", options);
  }
}

/**
 * Get default translations for UI elements
 */
export function getDefaultTranslations(): SiteContentTranslations {
  return {
    categories: [],
    products: [],
    ui: {
      buttons: {
        addToCart: {
          en: "Add to Cart",
          es: "Añadir al Carrito",
          fr: "Ajouter au Panier",
          de: "In den Warenkorb",
          it: "Aggiungi al Carrello",
          pt: "Adicionar ao Carrinho",
          ja: "カートに追加",
          ko: "장바구니에 추가",
          zh: "加入购物车",
          ar: "أضف إلى السلة",
        },
        buyNow: {
          en: "Buy Now",
          es: "Comprar Ahora",
          fr: "Acheter Maintenant",
          de: "Jetzt Kaufen",
          it: "Acquista Ora",
          pt: "Comprar Agora",
          ja: "今すぐ購入",
          ko: "지금 구매",
          zh: "立即购买",
          ar: "اشتري الآن",
        },
        viewMore: {
          en: "View More",
          es: "Ver Más",
          fr: "Voir Plus",
          de: "Mehr Anzeigen",
          it: "Vedi Di Più",
          pt: "Ver Mais",
          ja: "もっと見る",
          ko: "더 보기",
          zh: "查看更多",
          ar: "عرض المزيد",
        },
        close: {
          en: "Close",
          es: "Cerrar",
          fr: "Fermer",
          de: "Schließen",
          it: "Chiudi",
          pt: "Fechar",
          ja: "閉じる",
          ko: "닫기",
          zh: "关闭",
          ar: "إغلاق",
        },
        back: {
          en: "Back",
          es: "Atrás",
          fr: "Retour",
          de: "Zurück",
          it: "Indietro",
          pt: "Voltar",
          ja: "戻る",
          ko: "뒤로",
          zh: "返回",
          ar: "رجوع",
        },
        next: {
          en: "Next",
          es: "Siguiente",
          fr: "Suivant",
          de: "Weiter",
          it: "Avanti",
          pt: "Próximo",
          ja: "次へ",
          ko: "다음",
          zh: "下一个",
          ar: "التالي",
        },
      },
      labels: {
        price: {
          en: "Price",
          es: "Precio",
          fr: "Prix",
          de: "Preis",
          it: "Prezzo",
          pt: "Preço",
          ja: "価格",
          ko: "가격",
          zh: "价格",
          ar: "السعر",
        },
        quantity: {
          en: "Quantity",
          es: "Cantidad",
          fr: "Quantité",
          de: "Menge",
          it: "Quantità",
          pt: "Quantidade",
          ja: "数量",
          ko: "수량",
          zh: "数量",
          ar: "الكمية",
        },
        total: {
          en: "Total",
          es: "Total",
          fr: "Total",
          de: "Gesamt",
          it: "Totale",
          pt: "Total",
          ja: "合計",
          ko: "총계",
          zh: "总计",
          ar: "المجموع",
        },
        shipping: {
          en: "Shipping",
          es: "Envío",
          fr: "Livraison",
          de: "Versand",
          it: "Spedizione",
          pt: "Envio",
          ja: "配送",
          ko: "배송",
          zh: "运费",
          ar: "الشحن",
        },
        tax: {
          en: "Tax",
          es: "Impuesto",
          fr: "Taxe",
          de: "Steuer",
          it: "Tassa",
          pt: "Taxa",
          ja: "税金",
          ko: "세금",
          zh: "税费",
          ar: "الضريبة",
        },
        currency: {
          en: "Currency",
          es: "Moneda",
          fr: "Devise",
          de: "Währung",
          it: "Valuta",
          pt: "Moeda",
          ja: "通貨",
          ko: "통화",
          zh: "货币",
          ar: "العملة",
        },
      },
      messages: {
        loading: {
          en: "Loading...",
          es: "Cargando...",
          fr: "Chargement...",
          de: "Laden...",
          it: "Caricamento...",
          pt: "Carregando...",
          ja: "読み込み中...",
          ko: "로딩 중...",
          zh: "加载中...",
          ar: "جاري التحميل...",
        },
        error: {
          en: "An error occurred",
          es: "Ocurrió un error",
          fr: "Une erreur est survenue",
          de: "Ein Fehler ist aufgetreten",
          it: "Si è verificato un errore",
          pt: "Ocorreu um erro",
          ja: "エラーが発生しました",
          ko: "오류가 발생했습니다",
          zh: "发生错误",
          ar: "حدث خطأ",
        },
        success: {
          en: "Success!",
          es: "¡Éxito!",
          fr: "Succès !",
          de: "Erfolgreich!",
          it: "Successo!",
          pt: "Sucesso!",
          ja: "成功！",
          ko: "성공!",
          zh: "成功！",
          ar: "نجح!",
        },
        addedToCart: {
          en: "Added to cart",
          es: "Añadido al carrito",
          fr: "Ajouté au panier",
          de: "Zum Warenkorb hinzugefügt",
          it: "Aggiunto al carrello",
          pt: "Adicionado ao carrinho",
          ja: "カートに追加されました",
          ko: "장바구니에 추가되었습니다",
          zh: "已加入购物车",
          ar: "تمت الإضافة إلى السلة",
        },
        cartEmpty: {
          en: "Your cart is empty",
          es: "Tu carrito está vacío",
          fr: "Votre panier est vide",
          de: "Ihr Warenkorb ist leer",
          it: "Il tuo carrello è vuoto",
          pt: "Seu carrinho está vazio",
          ja: "カートは空です",
          ko: "장바구니가 비어있습니다",
          zh: "您的购物车为空",
          ar: "سلتك فارغة",
        },
      },
    },
    legal: {
      privacy: {
        en: "Privacy Policy",
        es: "Política de Privacidad",
        fr: "Politique de Confidentialité",
        de: "Datenschutzrichtlinie",
        it: "Informativa sulla Privacy",
        pt: "Política de Privacidade",
        ja: "プライバシーポリシー",
        ko: "개인정보처리방침",
        zh: "隐私政策",
        ar: "سياسة الخصوصية",
      },
      terms: {
        en: "Terms of Service",
        es: "Términos de Servicio",
        fr: "Conditions d'Utilisation",
        de: "Nutzungsbedingungen",
        it: "Termini di Servizio",
        pt: "Termos de Serviço",
        ja: "利用規約",
        ko: "서비스 약관",
        zh: "服务条款",
        ar: "شروط الخدمة",
      },
      cookies: {
        en: "Cookie Policy",
        es: "Política de Cookies",
        fr: "Politique des Cookies",
        de: "Cookie-Richtlinie",
        it: "Politica sui Cookie",
        pt: "Política de Cookies",
        ja: "クッキーポリシー",
        ko: "쿠키 정책",
        zh: "Cookie政策",
        ar: "سياسة ملفات تعريف الارتباط",
      },
    },
  };
}

/**
 * Validate locale code
 */
export function isValidLocale(locale: string): boolean {
  const supported = getSupportedLocales();
  return supported.some(l => l.code === locale);
}

/**
 * Get locale configuration
 */
export function getLocaleConfig(locale: string): LocaleConfig | null {
  const supported = getSupportedLocales();
  return supported.find(l => l.code === locale) || null;
}

/**
 * Get text direction for locale
 */
export function getTextDirection(locale: string): "ltr" | "rtl" {
  const config = getLocaleConfig(locale);
  return config?.rtl ? "rtl" : "ltr";
}

/**
 * Generate language selector options
 */
export function getLanguageSelectorOptions(): Array<{
  value: string;
  label: string;
  nativeLabel: string;
  flag: string;
}> {
  return getSupportedLocales().map(locale => ({
    value: locale.code,
    label: locale.name,
    nativeLabel: locale.nativeName,
    flag: locale.flag,
  }));
}