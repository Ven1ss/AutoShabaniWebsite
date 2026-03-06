export type Locale = "sq" | "en";

export const translations = {
  sq: {
    // Hero
    heroTagline: "Pjesë Këmbimi për Makina",
    heroTitle1: "Saktësi.",
    heroTitle2: "Performancë.",
    heroTitle3: "Perfeksion.",
    heroSubtitle: "Pjesë këmbimi origjinale në Prishtinë",
    heroCta: "Eksploro Botën Tonë",

    // About
    aboutTitle1: "Ndërtuar mbi Besimin.",
    aboutTitle2: "Drejtuar nga Ekselenca.",
    aboutText:
      "AUTO SHABANI është ofruesi kryesor i pjesëve këmbimi premium për makina në Kosovë. Ne kombinojmë cilësinë origjinale, njohurinë e ekspertëve dhe besueshmërinë e patundur për t'u shërbyer profesionistëve dhe entuziastëve që kërkojnë më të mirën. Me qendër në Prishtinë, ne jemi zgjedhja e besuar për ata që refuzojnë të kompromentojnë.",

    // Brands
    brandsHeading: "Markat e Besuara me të cilat Partnerojmë",

    // Experience
    experienceLabel: "Pse AUTO SHABANI",
    experienceTitle: "Eksperienca",
    exp1Title: "Pjesë Origjinale & OEM",
    exp1Desc: "Vetëm përbërës autentikë që plotësojnë standardet e prodhuesit.",
    exp2Title: "Njohuri Ekspertësh",
    exp2Desc: "Dekada përvojë në drejtimin tuaj drejt pjesës së duhur.",
    exp3Title: "Disponueshmëri e Shpejtë",
    exp3Desc: "Qasje e shpejtë te pjesët që ju nevojiten, kur ju nevojiten.",
    exp4Title: "I Besuar nga Profesionistët",
    exp4Desc: "Zgjedhja e punishteve dhe entuziastëve në të gjithë rajonin.",

    // Vision
    visionQuote:
      "Ne jemi të përkushtuar ndaj rritjes afatgjatë, inovacionit të vazhdueshëm dhe bëhemi autoriteti vendimtar i pjesëve automobilistike në Ballkan—ku cilësia nuk është e negociueshme dhe besimi fitohet çdo ditë.",

    // Contact
    contactHeading: "Lidhuni me ne",
    contactTitle: "Na vizitoni në Prishtinë",
    contactPhone: "Telefoni",
    contactEmail: "Email",
    contactInstagram: "Instagram",
    contactLocation: "Lokacioni",
    contactMapLink: "Prishtinë, Kosovë — Shiko në hartë",

    // Footer
    footerRights: "Të gjitha të drejtat e rezervuara.",

    // Nav
    navAbout: "Rreth Nesh",
    navExperience: "Eksperienca",
    navContact: "Kontakt",

    // Brand (used in header, loading, footer)
    brandName: "AUTO SHABANI",
  },
  en: {
    heroTagline: "Car Spare Parts",
    heroTitle1: "Precision.",
    heroTitle2: "Performance.",
    heroTitle3: "Perfection.",
    heroSubtitle: "Original Car Spare Parts in Prishtina",
    heroCta: "Explore Our World",

    aboutTitle1: "Built on Trust.",
    aboutTitle2: "Driven by Excellence.",
    aboutText:
      "AUTO SHABANI is Kosovo's leading provider of premium car spare parts. We combine genuine quality, expert knowledge, and unwavering reliability to serve professionals and enthusiasts who demand the best. Based in Prishtina, we are the trusted choice for those who refuse to compromise.",

    brandsHeading: "Trusted Brands We Partner With",

    experienceLabel: "Why AUTO SHABANI",
    experienceTitle: "The Experience",
    exp1Title: "Genuine & OEM Parts",
    exp1Desc: "Only authentic components that meet manufacturer standards.",
    exp2Title: "Expert Knowledge",
    exp2Desc: "Decades of experience guiding you to the right part.",
    exp3Title: "Fast Availability",
    exp3Desc: "Quick access to the parts you need, when you need them.",
    exp4Title: "Trusted by Professionals",
    exp4Desc: "The choice of workshops and enthusiasts across the region.",

    visionQuote:
      "We are committed to long-term growth, continuous innovation, and becoming the definitive automotive parts authority in the Balkans—where quality is non-negotiable and trust is earned every day.",

    contactHeading: "Get in Touch",
    contactTitle: "Visit Us in Prishtina",
    contactPhone: "Phone",
    contactEmail: "Email",
    contactInstagram: "Instagram",
    contactLocation: "Location",
    contactMapLink: "Prishtina, Kosovo — View on map",

    footerRights: "All rights reserved.",

    navAbout: "About",
    navExperience: "Experience",
    navContact: "Contact",

    brandName: "AUTO SHABANI",
  },
} as const;

export const defaultLocale: Locale = "sq";

const STORAGE_KEY = "auto-shabani-locale";

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "sq") return stored;
  return defaultLocale;
}

export function setStoredLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, locale);
}
