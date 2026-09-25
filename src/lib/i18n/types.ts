export type Locale = "en" | "es" | "de" | "fr" | "ja";

export interface LocaleInfo {
  code: Locale;
  label: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LOCALES: LocaleInfo[] = [
  { code: "en", label: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "es", label: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "de", label: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "ja", label: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
];

export const DEFAULT_LOCALE: Locale = "en";

export interface TranslationDictionary {
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    loading: string;
    search: string;
    filter: string;
    actions: string;
    status: string;
    active: string;
    inactive: string;
    warning: string;
    critical: string;
    healthy: string;
    cost: string;
    currency: string;
    renewalDate: string;
    provider: string;
    viewAll: string;
    details: string;
    back: string;
  };
  nav: {
    dashboard: string;
    resources: string;
    domains: string;
    subscriptions: string;
    renewals: string;
    dependencies: string;
    calendar: string;
    reports: string;
    notifications: string;
    settings: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    totalSpend: string;
    monthlyBurn: string;
    upcomingRenewals: string;
    activeDomains: string;
    spendAtRisk: string;
    capacityNotice: string;
  };
  resources: {
    title: string;
    addResource: string;
    resourceName: string;
    billingCycle: string;
    monthly: string;
    quarterly: string;
    yearly: string;
    category: string;
    ownership: string;
    overview: string;
    notes: string;
    documents: string;
    dependencies: string;
  };
  dependencies: {
    title: string;
    subtitle: string;
    networkMap: string;
    blastRadius: string;
    prerequisites: string;
    dependents: string;
    spof: string;
    simulateOutage: string;
    exitSimulation: string;
  };
  seats: {
    title: string;
    subtitle: string;
    purchased: string;
    assigned: string;
    idle: string;
    utilization: string;
    annualWaste: string;
    costPerSeat: string;
    updateSeats: string;
    saveAllocation: string;
  };
  settings: {
    title: string;
    general: string;
    team: string;
    apiKeys: string;
    webhooks: string;
    language: string;
  };
  landing: {
    features: string;
    categories: string;
    selfHost: string;
    github: string;
    support: string;
    signIn: string;
    getStarted: string;
    startTrackingFree: string;
    goToDashboard: string;
    headline: string;
    headlineHighlight: string;
    subheadline: string;
    freeForever: string;
    noTelemetry: string;
    accurateMath: string;
    heroPill: string;
  };
}
