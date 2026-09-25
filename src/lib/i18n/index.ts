import { Locale, TranslationDictionary, DEFAULT_LOCALE } from "./types";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { de } from "./locales/de";
import { fr } from "./locales/fr";
import { ja } from "./locales/ja";

export * from "./types";

export const DICTIONARIES: Record<Locale, TranslationDictionary> = {
  en,
  es,
  de,
  fr,
  ja,
};

/**
 * Resolves a nested translation key (e.g. "common.save" or "dashboard.title").
 * Safely falls back to English if the key is missing in the target locale.
 */
export function getTranslation(
  locale: Locale,
  path: string,
  params?: Record<string, string | number>
): string {
  const dict = DICTIONARIES[locale] || DICTIONARIES[DEFAULT_LOCALE];
  const keys = path.split(".");

  let current: unknown = dict;
  for (const k of keys) {
    if (current && typeof current === "object" && k in current) {
      current = (current as Record<string, unknown>)[k];
    } else {
      current = undefined;
      break;
    }
  }

  // Fallback to English if not found
  if (typeof current !== "string" && locale !== DEFAULT_LOCALE) {
    let fallback: unknown = DICTIONARIES[DEFAULT_LOCALE];
    for (const k of keys) {
      if (fallback && typeof fallback === "object" && k in fallback) {
        fallback = (fallback as Record<string, unknown>)[k];
      } else {
        fallback = undefined;
        break;
      }
    }
    current = fallback;
  }

  if (typeof current !== "string") {
    return path;
  }

  // Parameter interpolation: "Hello {name}"
  if (params) {
    return Object.entries(params).reduce((str, [paramKey, paramVal]) => {
      return str.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramVal));
    }, current as string);
  }

  return current as string;
}
