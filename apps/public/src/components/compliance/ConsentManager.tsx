"use client";

import React, { useState, useEffect, useCallback } from "react";
import { detectGeoLocation, getComplianceRequirements, type GeoLocation } from "../../lib/geo-detection";
import { getLocalizedString, getDefaultTranslations, type LocalizedString } from "../../lib/i18n-utils";

interface ConsentState {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  timestamp: Date;
  version: string;
}

interface ConsentManagerProps {
  onConsentChange: (consent: ConsentState) => void;
  cookieDomain?: string;
  privacyPolicyUrl?: string;
  termsUrl?: string;
  locale?: string;
}

const CONSENT_COOKIE = "minimall_consent";
const CONSENT_VERSION = "1.0";

export function ConsentManager({
  onConsentChange,
  cookieDomain,
  privacyPolicyUrl,
  termsUrl,
  locale = "en",
}: ConsentManagerProps) {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    necessary: true,
    analytics: false,
    marketing: false,
    personalization: false,
    timestamp: new Date(),
    version: CONSENT_VERSION,
  });

  const translations = getDefaultTranslations();

  // Consent banner translations
  const consentTexts: Record<string, LocalizedString> = {
    bannerTitle: {
      en: "We value your privacy",
      es: "Valoramos tu privacidad",
      fr: "Nous respectons votre vie privée",
      de: "Wir schätzen Ihre Privatsphäre",
      it: "Rispettiamo la tua privacy",
      pt: "Valorizamos sua privacidade",
      ja: "プライバシーを大切にします",
      ko: "개인정보를 소중히 여깁니다",
      zh: "我们重视您的隐私",
      ar: "نحن نقدر خصوصيتك",
    },
    bannerDescription: {
      en: "We use cookies and similar technologies to enhance your browsing experience, analyze site traffic, and personalize content. You can choose which cookies to accept.",
      es: "Utilizamos cookies y tecnologías similares para mejorar su experiencia de navegación, analizar el tráfico del sitio y personalizar el contenido.",
      fr: "Nous utilisons des cookies et des technologies similaires pour améliorer votre expérience de navigation, analyser le trafic du site et personnaliser le contenu.",
      de: "Wir verwenden Cookies und ähnliche Technologien, um Ihr Surferlebnis zu verbessern, den Website-Traffic zu analysieren und Inhalte zu personalisieren.",
      it: "Utilizziamo cookie e tecnologie simili per migliorare la tua esperienza di navigazione, analizzare il traffico del sito e personalizzare i contenuti.",
      pt: "Usamos cookies e tecnologias similares para melhorar sua experiência de navegação, analisar o tráfego do site e personalizar o conteúdo.",
      ja: "ブラウジング体験を向上させ、サイトのトラフィックを分析し、コンテンツをパーソナライズするために、Cookieと同様の技術を使用しています。",
      ko: "브라우징 경험을 향상시키고, 사이트 트래픽을 분석하며, 콘텐츠를 개인화하기 위해 쿠키 및 유사한 기술을 사용합니다.",
      zh: "我们使用Cookie和类似技术来改善您的浏览体验、分析网站流量并个性化内容。",
      ar: "نستخدم ملفات تعريف الارتباط والتقنيات المماثلة لتحسين تجربة التصفح وتحليل حركة المرور على الموقع وتخصيص المحتوى.",
    },
    acceptAll: {
      en: "Accept All",
      es: "Aceptar Todo",
      fr: "Tout Accepter",
      de: "Alle Akzeptieren",
      it: "Accetta Tutto",
      pt: "Aceitar Tudo",
      ja: "すべて受け入れる",
      ko: "모두 수락",
      zh: "全部接受",
      ar: "قبول الكل",
    },
    acceptNecessary: {
      en: "Necessary Only",
      es: "Solo Necesarias",
      fr: "Nécessaires Uniquement",
      de: "Nur Notwendige",
      it: "Solo Necessari",
      pt: "Apenas Necessários",
      ja: "必要なもののみ",
      ko: "필수만",
      zh: "仅必要",
      ar: "الضروري فقط",
    },
    customize: {
      en: "Customize",
      es: "Personalizar",
      fr: "Personnaliser",
      de: "Anpassen",
      it: "Personalizza",
      pt: "Personalizar",
      ja: "カスタマイズ",
      ko: "사용자 정의",
      zh: "自定义",
      ar: "تخصيص",
    },
  };

  // Check for existing consent and location on mount
  useEffect(() => {
    checkExistingConsent();
    detectUserLocation();
  }, []);

  const detectUserLocation = useCallback(async () => {
    try {
      const userLocation = await detectGeoLocation();
      setLocation(userLocation);
      
      const compliance = getComplianceRequirements(userLocation);
      
      // Show banner if compliance is required and no consent exists
      if (compliance.cookieConsent && !hasValidConsent()) {
        setShowBanner(true);
      }
    } catch (error) {
      console.warn("[ConsentManager] Location detection failed:", error);
      // Assume GDPR compliance as safest default
      if (!hasValidConsent()) {
        setShowBanner(true);
      }
    }
  }, []);

  const checkExistingConsent = useCallback(() => {
    try {
      const consentCookie = document.cookie
        .split(';')
        .find(row => row.trim().startsWith(`${CONSENT_COOKIE}=`));
      
      if (consentCookie) {
        const cookieValue = consentCookie.split('=')[1];
        if (!cookieValue) return;
        
        const consentData = JSON.parse(
          decodeURIComponent(cookieValue)
        );
        
        // Check if consent is still valid (version match)
        if (consentData.version === CONSENT_VERSION) {
          setConsent(consentData);
          onConsentChange(consentData);
          return;
        }
      }
    } catch (error) {
      console.warn("[ConsentManager] Failed to parse existing consent:", error);
    }
  }, [onConsentChange]);

  const hasValidConsent = useCallback((): boolean => {
    try {
      const consentCookie = document.cookie
        .split(';')
        .find(row => row.trim().startsWith(`${CONSENT_COOKIE}=`));
      
      if (!consentCookie) return false;
      
      const cookieValue = consentCookie.split('=')[1];
      if (!cookieValue) return false;
      
      const consentData = JSON.parse(
        decodeURIComponent(cookieValue)
      );
      
      return consentData.version === CONSENT_VERSION;
    } catch {
      return false;
    }
  }, []);

  const saveConsent = useCallback((newConsent: Partial<ConsentState>) => {
    const updatedConsent: ConsentState = {
      ...consent,
      ...newConsent,
      timestamp: new Date(),
      version: CONSENT_VERSION,
      necessary: true, // Always true
    };
    
    setConsent(updatedConsent);
    onConsentChange(updatedConsent);
    
    // Save to cookie
    const cookieValue = encodeURIComponent(JSON.stringify(updatedConsent));
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1); // 1 year expiry
    
    let cookieString = `${CONSENT_COOKIE}=${cookieValue}; expires=${expiry.toUTCString()}; path=/; SameSite=Lax`;
    
    if (cookieDomain) {
      cookieString += `; domain=${cookieDomain}`;
    }
    
    document.cookie = cookieString;
    
    setShowBanner(false);
    setShowPreferences(false);
  }, [consent, onConsentChange, cookieDomain]);

  const handleAcceptAll = useCallback(() => {
    saveConsent({
      analytics: true,
      marketing: true,
      personalization: true,
    });
  }, [saveConsent]);

  const handleAcceptNecessary = useCallback(() => {
    saveConsent({
      analytics: false,
      marketing: false,
      personalization: false,
    });
  }, [saveConsent]);

  const handleCustomize = useCallback(() => {
    setShowPreferences(true);
  }, []);

  const handleSavePreferences = useCallback(() => {
    saveConsent(consent);
  }, [consent, saveConsent]);

  if (!showBanner && !showPreferences) {
    return null;
  }

  return (
    <>
      {/* Consent Banner */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="max-w-6xl mx-auto p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {getLocalizedString(consentTexts.bannerTitle || { en: "We value your privacy" }, locale)}
                </h3>
                <p className="text-sm text-gray-600">
                  {getLocalizedString(consentTexts.bannerDescription || { en: "We use cookies to improve your experience." }, locale)}
                </p>
                
                {(privacyPolicyUrl || termsUrl) && (
                  <div className="mt-2 flex gap-4 text-sm">
                    {privacyPolicyUrl && (
                      <a
                        href={privacyPolicyUrl}
                        className="text-blue-600 hover:text-blue-800 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {getLocalizedString(translations.legal.privacy, locale)}
                      </a>
                    )}
                    {termsUrl && (
                      <a
                        href={termsUrl}
                        className="text-blue-600 hover:text-blue-800 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {getLocalizedString(translations.legal.terms, locale)}
                      </a>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 min-w-fit">
                <button
                  onClick={handleAcceptNecessary}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {getLocalizedString(consentTexts.acceptNecessary || { en: "Accept Necessary" }, locale)}
                </button>
                
                <button
                  onClick={handleCustomize}
                  className="px-4 py-2 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  {getLocalizedString(consentTexts.customize || { en: "Customize" }, locale)}
                </button>
                
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {getLocalizedString(consentTexts.acceptAll || { en: "Accept All" }, locale)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Cookie Preferences
              </h2>
              
              <div className="space-y-6">
                {/* Necessary Cookies */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Necessary Cookies</h3>
                    <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      Always Active
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    These cookies are essential for the website to function properly. They enable basic features like page navigation and access to secure areas.
                  </p>
                </div>

                {/* Analytics Cookies */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Analytics Cookies</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consent.analytics}
                        onChange={(e) => setConsent(prev => ({ ...prev, analytics: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600">
                    Help us understand how visitors interact with our website by collecting and reporting information anonymously.
                  </p>
                </div>

                {/* Marketing Cookies */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Marketing Cookies</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consent.marketing}
                        onChange={(e) => setConsent(prev => ({ ...prev, marketing: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600">
                    Used to track visitors across websites to display relevant advertisements and measure campaign effectiveness.
                  </p>
                </div>

                {/* Personalization Cookies */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Personalization Cookies</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consent.personalization}
                        onChange={(e) => setConsent(prev => ({ ...prev, personalization: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600">
                    Remember your preferences and settings to provide a more personalized experience.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6 justify-end">
                <button
                  onClick={() => setShowPreferences(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Hook for accessing consent state
export function useConsent() {
  const [consent, setConsent] = useState<ConsentState | null>(null);
  
  useEffect(() => {
    // Check for existing consent cookie
    try {
      const consentCookie = document.cookie
        .split(';')
        .find(row => row.trim().startsWith(`${CONSENT_COOKIE}=`));
      
      if (consentCookie) {
        const cookieValue = consentCookie.split('=')[1];
        if (!cookieValue) return;
        
        const consentData = JSON.parse(
          decodeURIComponent(cookieValue)
        );
        setConsent(consentData);
      }
    } catch (error) {
      console.warn("[useConsent] Failed to parse consent cookie:", error);
    }
  }, []);
  
  const hasConsent = useCallback((type: keyof Omit<ConsentState, 'timestamp' | 'version'>): boolean => {
    return consent?.[type] || false;
  }, [consent]);
  
  return {
    consent,
    hasConsent,
    hasAnalytics: hasConsent('analytics'),
    hasMarketing: hasConsent('marketing'),
    hasPersonalization: hasConsent('personalization'),
  };
}