/**
 * Compliance Rules Engine
 * 
 * Handles regional compliance requirements including GDPR, CCPA, and other
 * privacy regulations with automatic rule application based on user location.
 */

import { z } from "zod";
import { type GeoLocation } from "./geo-detection";

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  regions: string[]; // Country codes or regions
  requirements: {
    cookieConsent: boolean;
    explicitConsent: boolean;
    ageVerification: boolean;
    rightToDelete: boolean;
    rightToPortability: boolean;
    rightToRectification: boolean;
    dataProcessingDisclosure: boolean;
    consentWithdrawal: boolean;
    minimumAge?: number;
    penalties?: {
      currency: string;
      maxAmount: number;
    };
  };
  exemptions?: {
    businessSize?: "small" | "medium" | "large";
    dataTypes?: string[];
    processingPurposes?: string[];
  };
  validFrom: Date;
  validUntil?: Date;
}

export interface ComplianceStatus {
  applicableRules: ComplianceRule[];
  requirements: {
    cookieConsent: boolean;
    explicitConsent: boolean;
    ageVerification: boolean;
    rightToDelete: boolean;
    rightToPortability: boolean;
    rightToRectification: boolean;
    dataProcessingDisclosure: boolean;
    consentWithdrawal: boolean;
    minimumAge: number;
  };
  riskLevel: "low" | "medium" | "high";
  recommendations: string[];
}

export interface DataProcessingActivity {
  id: string;
  purpose: string;
  dataTypes: string[];
  retentionPeriod: number; // Days
  thirdPartySharing: boolean;
  crossBorderTransfer: boolean;
  legalBasis: string;
  consentRequired: boolean;
}

const complianceRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  regions: z.array(z.string()),
  requirements: z.object({
    cookieConsent: z.boolean(),
    explicitConsent: z.boolean(),
    ageVerification: z.boolean(),
    rightToDelete: z.boolean(),
    rightToPortability: z.boolean(),
    rightToRectification: z.boolean(),
    dataProcessingDisclosure: z.boolean(),
    consentWithdrawal: z.boolean(),
    minimumAge: z.number().optional(),
    penalties: z.object({
      currency: z.string(),
      maxAmount: z.number(),
    }).optional(),
  }),
  exemptions: z.object({
    businessSize: z.enum(["small", "medium", "large"]).optional(),
    dataTypes: z.array(z.string()).optional(),
    processingPurposes: z.array(z.string()).optional(),
  }).optional(),
  validFrom: z.coerce.date(),
  validUntil: z.coerce.date().optional(),
});

/**
 * Get all available compliance rules
 */
export function getComplianceRules(): ComplianceRule[] {
  return [
    // GDPR - European Union
    {
      id: "gdpr",
      name: "General Data Protection Regulation",
      description: "EU regulation on data protection and privacy for individuals within the European Union and European Economic Area",
      regions: [
        "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
        "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
        "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO"
      ],
      requirements: {
        cookieConsent: true,
        explicitConsent: true,
        ageVerification: true,
        rightToDelete: true,
        rightToPortability: true,
        rightToRectification: true,
        dataProcessingDisclosure: true,
        consentWithdrawal: true,
        minimumAge: 16,
        penalties: {
          currency: "EUR",
          maxAmount: 20000000, // €20 million or 4% of global turnover
        },
      },
      validFrom: new Date("2018-05-25"),
    },
    
    // CCPA - California
    {
      id: "ccpa",
      name: "California Consumer Privacy Act",
      description: "California state statute intended to enhance privacy rights and consumer protection for residents of California",
      regions: ["US-CA"],
      requirements: {
        cookieConsent: true,
        explicitConsent: false,
        ageVerification: true,
        rightToDelete: true,
        rightToPortability: true,
        rightToRectification: false,
        dataProcessingDisclosure: true,
        consentWithdrawal: true,
        minimumAge: 13,
        penalties: {
          currency: "USD",
          maxAmount: 7500, // Per violation
        },
      },
      exemptions: {
        businessSize: "small", // Applies to businesses with revenue > $25M or 50k+ consumers
      },
      validFrom: new Date("2020-01-01"),
    },
    
    // LGPD - Brazil
    {
      id: "lgpd",
      name: "Lei Geral de Proteção de Dados",
      description: "Brazilian data protection regulation similar to GDPR",
      regions: ["BR"],
      requirements: {
        cookieConsent: true,
        explicitConsent: true,
        ageVerification: true,
        rightToDelete: true,
        rightToPortability: true,
        rightToRectification: true,
        dataProcessingDisclosure: true,
        consentWithdrawal: true,
        minimumAge: 13,
        penalties: {
          currency: "BRL",
          maxAmount: 50000000, // R$50 million
        },
      },
      validFrom: new Date("2020-09-18"),
    },
    
    // PIPEDA - Canada
    {
      id: "pipeda",
      name: "Personal Information Protection and Electronic Documents Act",
      description: "Canadian federal privacy law for private-sector organizations",
      regions: ["CA"],
      requirements: {
        cookieConsent: true,
        explicitConsent: true,
        ageVerification: false,
        rightToDelete: false,
        rightToPortability: false,
        rightToRectification: true,
        dataProcessingDisclosure: true,
        consentWithdrawal: true,
        minimumAge: 13,
      },
      validFrom: new Date("2001-01-01"),
    },
    
    // PDPA - Singapore
    {
      id: "pdpa-sg",
      name: "Personal Data Protection Act (Singapore)",
      description: "Singapore's data protection law governing the collection, use, and disclosure of personal data",
      regions: ["SG"],
      requirements: {
        cookieConsent: true,
        explicitConsent: true,
        ageVerification: false,
        rightToDelete: false,
        rightToPortability: true,
        rightToRectification: true,
        dataProcessingDisclosure: true,
        consentWithdrawal: true,
        penalties: {
          currency: "SGD",
          maxAmount: 1000000, // S$1 million
        },
      },
      validFrom: new Date("2014-07-02"),
    },
    
    // COPPA - United States (Children)
    {
      id: "coppa",
      name: "Children's Online Privacy Protection Act",
      description: "US federal law designed to protect the privacy of children under 13",
      regions: ["US"],
      requirements: {
        cookieConsent: true,
        explicitConsent: true,
        ageVerification: true,
        rightToDelete: true,
        rightToPortability: false,
        rightToRectification: false,
        dataProcessingDisclosure: true,
        consentWithdrawal: true,
        minimumAge: 13,
        penalties: {
          currency: "USD",
          maxAmount: 43792, // Per violation (2023 amount)
        },
      },
      validFrom: new Date("2000-04-21"),
    },
  ];
}

/**
 * Determine applicable compliance rules for a location
 */
export function getApplicableRules(location: GeoLocation): ComplianceRule[] {
  const rules = getComplianceRules();
  const applicableRules: ComplianceRule[] = [];
  
  for (const rule of rules) {
    const isApplicable = rule.regions.some(region => {
      // Handle country codes
      if (region.length === 2) {
        return region === location.countryCode;
      }
      
      // Handle region with state (e.g., "US-CA")
      if (region.includes("-")) {
        const [country, state] = region.split("-");
        return country === location.countryCode && state === location.region;
      }
      
      return false;
    });
    
    if (isApplicable) {
      // Check if rule is currently valid
      const now = new Date();
      const validFrom = rule.validFrom;
      const validUntil = rule.validUntil;
      
      if (now >= validFrom && (!validUntil || now <= validUntil)) {
        applicableRules.push(rule);
      }
    }
  }
  
  return applicableRules;
}

/**
 * Get consolidated compliance status for a location
 */
export function getComplianceStatus(
  location: GeoLocation,
  businessProfile?: {
    size: "small" | "medium" | "large";
    revenue: number;
    customerCount: number;
  }
): ComplianceStatus {
  const applicableRules = getApplicableRules(location);
  
  // Consolidate requirements (most restrictive wins)
  const requirements = {
    cookieConsent: false,
    explicitConsent: false,
    ageVerification: false,
    rightToDelete: false,
    rightToPortability: false,
    rightToRectification: false,
    dataProcessingDisclosure: false,
    consentWithdrawal: false,
    minimumAge: 0,
  };
  
  const recommendations: string[] = [];
  let riskLevel: "low" | "medium" | "high" = "low";
  
  for (const rule of applicableRules) {
    // Check exemptions
    let isExempt = false;
    if (rule.exemptions && businessProfile) {
      if (rule.exemptions.businessSize && businessProfile.size === rule.exemptions.businessSize) {
        isExempt = true;
      }
    }
    
    if (!isExempt) {
      // Apply most restrictive requirements
      requirements.cookieConsent = requirements.cookieConsent || rule.requirements.cookieConsent;
      requirements.explicitConsent = requirements.explicitConsent || rule.requirements.explicitConsent;
      requirements.ageVerification = requirements.ageVerification || rule.requirements.ageVerification;
      requirements.rightToDelete = requirements.rightToDelete || rule.requirements.rightToDelete;
      requirements.rightToPortability = requirements.rightToPortability || rule.requirements.rightToPortability;
      requirements.rightToRectification = requirements.rightToRectification || rule.requirements.rightToRectification;
      requirements.dataProcessingDisclosure = requirements.dataProcessingDisclosure || rule.requirements.dataProcessingDisclosure;
      requirements.consentWithdrawal = requirements.consentWithdrawal || rule.requirements.consentWithdrawal;
      
      if (rule.requirements.minimumAge && rule.requirements.minimumAge > requirements.minimumAge) {
        requirements.minimumAge = rule.requirements.minimumAge;
      }
      
      // Assess risk level based on penalties
      if (rule.requirements.penalties) {
        const penalty = rule.requirements.penalties.maxAmount;
        if (penalty > 1000000) { // > $1M or equivalent
          riskLevel = "high";
        } else if (penalty > 50000 && riskLevel !== "high") { // > $50K
          riskLevel = "medium";
        }
      }
      
      // Add specific recommendations
      recommendations.push(...getRecommendationsForRule(rule));
    }
  }
  
  return {
    applicableRules,
    requirements,
    riskLevel,
    recommendations: [...new Set(recommendations)], // Remove duplicates
  };
}

/**
 * Get specific recommendations for a compliance rule
 */
function getRecommendationsForRule(rule: ComplianceRule): string[] {
  const recommendations: string[] = [];
  
  switch (rule.id) {
    case "gdpr":
      recommendations.push(
        "Implement explicit consent mechanisms for data processing",
        "Provide clear data processing disclosures in privacy policy",
        "Enable users to withdraw consent easily",
        "Implement data portability and deletion features",
        "Conduct regular data protection impact assessments",
        "Appoint a Data Protection Officer if required"
      );
      break;
      
    case "ccpa":
      recommendations.push(
        "Add 'Do Not Sell My Personal Information' link to homepage",
        "Implement opt-out mechanisms for data sales",
        "Provide clear categories of personal information collected",
        "Enable data deletion and portability requests"
      );
      break;
      
    case "lgpd":
      recommendations.push(
        "Implement explicit consent with granular options",
        "Provide data processing notifications in Portuguese",
        "Enable easy consent withdrawal",
        "Maintain data processing logs"
      );
      break;
      
    case "coppa":
      recommendations.push(
        "Implement age verification mechanisms",
        "Require parental consent for users under 13",
        "Limit data collection from children",
        "Provide parent access to child data"
      );
      break;
  }
  
  return recommendations;
}

/**
 * Get standard data processing activities
 */
export function getStandardDataProcessingActivities(): DataProcessingActivity[] {
  return [
    {
      id: "analytics",
      purpose: "Website analytics and performance monitoring",
      dataTypes: ["IP address", "browser information", "page views", "session duration"],
      retentionPeriod: 365, // 1 year
      thirdPartySharing: true,
      crossBorderTransfer: true,
      legalBasis: "Legitimate interest",
      consentRequired: true,
    },
    {
      id: "marketing",
      purpose: "Targeted advertising and marketing campaigns",
      dataTypes: ["email", "browsing behavior", "purchase history", "demographics"],
      retentionPeriod: 1095, // 3 years
      thirdPartySharing: true,
      crossBorderTransfer: true,
      legalBasis: "Consent",
      consentRequired: true,
    },
    {
      id: "personalization",
      purpose: "Personalizing user experience and content",
      dataTypes: ["preferences", "browsing history", "location", "device info"],
      retentionPeriod: 730, // 2 years
      thirdPartySharing: false,
      crossBorderTransfer: false,
      legalBasis: "Legitimate interest",
      consentRequired: true,
    },
    {
      id: "customer-support",
      purpose: "Providing customer support and service",
      dataTypes: ["name", "email", "support tickets", "chat logs"],
      retentionPeriod: 2555, // 7 years (legal requirement)
      thirdPartySharing: false,
      crossBorderTransfer: false,
      legalBasis: "Contract performance",
      consentRequired: false,
    },
    {
      id: "security",
      purpose: "Security monitoring and fraud prevention",
      dataTypes: ["IP address", "login attempts", "security events", "device fingerprints"],
      retentionPeriod: 90, // 3 months
      thirdPartySharing: false,
      crossBorderTransfer: false,
      legalBasis: "Legitimate interest",
      consentRequired: false,
    },
  ];
}

/**
 * Generate privacy policy sections based on compliance requirements
 */
export function generatePrivacyPolicySections(
  complianceStatus: ComplianceStatus,
  activities: DataProcessingActivity[]
): Array<{ title: string; content: string; required: boolean }> {
  const sections = [];
  
  // Data Collection section (always required)
  sections.push({
    title: "Information We Collect",
    content: generateDataCollectionSection(activities),
    required: true,
  });
  
  // Purpose and Legal Basis (GDPR requirement)
  if (complianceStatus.requirements.dataProcessingDisclosure) {
    sections.push({
      title: "How We Use Your Information",
      content: generatePurposeSection(activities),
      required: true,
    });
  }
  
  // Data Sharing (if applicable)
  const hasThirdPartySharing = activities.some(a => a.thirdPartySharing);
  if (hasThirdPartySharing) {
    sections.push({
      title: "Information Sharing and Disclosure",
      content: generateSharingSection(activities),
      required: true,
    });
  }
  
  // User Rights (GDPR, CCPA requirements)
  if (complianceStatus.requirements.rightToDelete || complianceStatus.requirements.rightToPortability) {
    sections.push({
      title: "Your Rights and Choices",
      content: generateRightsSection(complianceStatus),
      required: true,
    });
  }
  
  // Cookie Policy (if consent required)
  if (complianceStatus.requirements.cookieConsent) {
    sections.push({
      title: "Cookies and Tracking Technologies",
      content: generateCookieSection(),
      required: true,
    });
  }
  
  // Children's Privacy (COPPA, age verification)
  if (complianceStatus.requirements.ageVerification) {
    sections.push({
      title: "Children's Privacy",
      content: generateChildrenSection(complianceStatus.requirements.minimumAge),
      required: true,
    });
  }
  
  // Data Retention
  sections.push({
    title: "Data Retention",
    content: generateRetentionSection(activities),
    required: true,
  });
  
  // Security
  sections.push({
    title: "Data Security",
    content: generateSecuritySection(),
    required: true,
  });
  
  // Contact Information
  sections.push({
    title: "Contact Us",
    content: generateContactSection(),
    required: true,
  });
  
  return sections;
}

function generateDataCollectionSection(activities: DataProcessingActivity[]): string {
  const allDataTypes = [...new Set(activities.flatMap(a => a.dataTypes))];
  return `We collect the following types of information: ${allDataTypes.join(", ")}.`;
}

function generatePurposeSection(activities: DataProcessingActivity[]): string {
  return activities
    .map(a => `• ${a.purpose}: We process ${a.dataTypes.join(", ")} based on ${a.legalBasis.toLowerCase()}.`)
    .join("\n");
}

function generateSharingSection(activities: DataProcessingActivity[]): string {
  const sharingActivities = activities.filter(a => a.thirdPartySharing);
  if (sharingActivities.length === 0) return "We do not share your personal information with third parties.";
  
  return `We may share your information with third parties for: ${sharingActivities.map(a => a.purpose.toLowerCase()).join(", ")}.`;
}

function generateRightsSection(status: ComplianceStatus): string {
  const rights = [];
  if (status.requirements.rightToDelete) rights.push("delete your personal information");
  if (status.requirements.rightToPortability) rights.push("receive a copy of your personal information");
  if (status.requirements.rightToRectification) rights.push("correct inaccurate personal information");
  if (status.requirements.consentWithdrawal) rights.push("withdraw your consent");
  
  return `You have the right to: ${rights.join(", ")}.`;
}

function generateCookieSection(): string {
  return "We use cookies and similar technologies to enhance your browsing experience. You can manage your cookie preferences through our consent manager.";
}

function generateChildrenSection(minimumAge: number): string {
  return `Our services are not intended for children under ${minimumAge} years of age. We do not knowingly collect personal information from children under ${minimumAge}.`;
}

function generateRetentionSection(activities: DataProcessingActivity[]): string {
  return activities
    .map(a => `• ${a.purpose}: ${Math.floor(a.retentionPeriod / 365)} years`)
    .join("\n");
}

function generateSecuritySection(): string {
  return "We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.";
}

function generateContactSection(): string {
  return "If you have any questions about this Privacy Policy, please contact us at privacy@example.com.";
}

/**
 * Validate compliance rule structure
 */
export function validateComplianceRule(rule: unknown): rule is ComplianceRule {
  try {
    complianceRuleSchema.parse(rule);
    return true;
  } catch {
    return false;
  }
}