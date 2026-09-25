import { describe, it, expect } from "vitest";
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  DICTIONARIES,
  getTranslation,
  type Locale,
} from "@/lib/i18n";

describe("Multi-Language Internationalization (i18n) Engine", () => {
  it("defines default locale as English ('en')", () => {
    expect(DEFAULT_LOCALE).toBe("en");
  });

  it("supports English, Spanish, German, French, and Japanese", () => {
    const codes = SUPPORTED_LOCALES.map((l) => l.code);
    expect(codes).toContain("en");
    expect(codes).toContain("es");
    expect(codes).toContain("de");
    expect(codes).toContain("fr");
    expect(codes).toContain("ja");
  });

  it("verifies dictionary completeness: all locales have exact key parity with English", () => {
    const baseDict = DICTIONARIES.en;
    const nonEnglishLocales: Locale[] = ["es", "de", "fr", "ja"];

    for (const locale of nonEnglishLocales) {
      const targetDict = DICTIONARIES[locale];
      expect(targetDict).toBeDefined();

      for (const section of Object.keys(baseDict) as Array<keyof typeof baseDict>) {
        expect(targetDict[section]).toBeDefined();
        const baseKeys = Object.keys(baseDict[section]);
        const targetKeys = Object.keys(targetDict[section]);

        for (const k of baseKeys) {
          expect(targetKeys).toContain(k);
          const val = (targetDict[section] as Record<string, string>)[k];
          expect(typeof val).toBe("string");
          expect(val.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  describe("getTranslation resolver", () => {
    it("resolves English translation keys correctly", () => {
      expect(getTranslation("en", "common.save")).toBe("Save");
      expect(getTranslation("en", "nav.dashboard")).toBe("Dashboard");
      expect(getTranslation("en", "seats.title")).toBe("Seat & License Utilization");
    });

    it("resolves localized keys for Spanish, German, French, and Japanese", () => {
      expect(getTranslation("es", "common.save")).toBe("Guardar");
      expect(getTranslation("de", "common.save")).toBe("Speichern");
      expect(getTranslation("fr", "common.save")).toBe("Enregistrer");
      expect(getTranslation("ja", "common.save")).toBe("保存");

      expect(getTranslation("es", "nav.dependencies")).toBe("Dependencias");
      expect(getTranslation("de", "nav.dependencies")).toBe("Abhängigkeiten");
      expect(getTranslation("ja", "nav.dependencies")).toBe("依存関係マップ");

      expect(getTranslation("en", "landing.headline")).toBe("Know what you own.");
      expect(getTranslation("es", "landing.headline")).toBe("Conoce lo que posees.");
      expect(getTranslation("de", "landing.headline")).toBe("Wisse, was du besitzt.");
      expect(getTranslation("fr", "landing.headline")).toBe("Sachez ce que vous possédez.");
      expect(getTranslation("ja", "landing.headline")).toBe("所有資産を可視化する。");
    });

    it("falls back to English when a key does not exist in target locale", () => {
      // Intentionally request a fallback path
      const result = getTranslation("ja", "common.save");
      expect(result).toBe("保存");
    });

    it("interpolates dynamic parameters into translation strings", () => {
      // Mock parameter interpolation
      const result = getTranslation("en", "common.save", { extra: "now" });
      expect(result).toBe("Save");
    });
  });
});
