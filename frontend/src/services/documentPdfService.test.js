import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generatePrivacyPolicyPdf,
  generateTermsPdf,
  generateUserManualPdf
} from "./documentPdfService.js";

describe("documentPdfService - Generación de Documentos PDF Oficiales", () => {
  it("Debe generar la Política de Privacidad en PDF con fondo blanco y múltiples páginas", () => {
    const pdf = generatePrivacyPolicyPdf("es");
    assert.ok(pdf, "El PDF debe ser instanciado");
    const numPages = pdf.internal.getNumberOfPages();
    assert.ok(numPages >= 2, `La política de privacidad debe abarcar varias páginas (obtenidas: ${numPages})`);
  });

  it("Debe generar los Términos y Condiciones en PDF en inglés y español", () => {
    const pdfEs = generateTermsPdf("es");
    const pdfEn = generateTermsPdf("en");
    assert.ok(pdfEs.internal.getNumberOfPages() >= 2);
    assert.ok(pdfEn.internal.getNumberOfPages() >= 2);
  });

  it("Debe generar el Manual de Usuario en PDF con los 7 capítulos", () => {
    const pdfManual = generateUserManualPdf("es");
    assert.ok(pdfManual, "El PDF del manual debe ser instanciado");
    const numPages = pdfManual.internal.getNumberOfPages();
    // Con 7 capítulos y saltos de página limpios, debe tener al menos 7 páginas
    assert.ok(numPages >= 7, `El manual debe tener al menos 7 páginas para los 7 capítulos (obtenidas: ${numPages})`);
  });

  it("Debe soportar los 6 idiomas del sistema sin errores (es, en, de, fr, da, pl)", () => {
    const langs = ["es", "en", "de", "fr", "da", "pl"];
    langs.forEach((lang) => {
      const pdf = generatePrivacyPolicyPdf(lang);
      assert.ok(pdf.internal.getNumberOfPages() >= 1, `Debe generar páginas para el idioma ${lang}`);
    });
  });

  it("Debe tener los textos y avisos de descarga PDF traducidos a los 6 idiomas", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { legalNav } = await import("../components/legal/legalContent.js");
    const { manualNav } = await import("../components/manual/manualContent.js");

    const langs = ["es", "en", "de", "fr", "da", "pl"];
    const requiredPdfKeys = [
      "download_success",
      "manual_download_success",
      "report_download_success",
      "download_error",
      "generating"
    ];

    for (const lang of langs) {
      // 1. Verificar legalNav
      assert.ok(legalNav[lang], `legalNav debe tener configuración para ${lang}`);
      assert.ok(legalNav[lang].pdfDownloadSuccess, `legalNav.${lang}.pdfDownloadSuccess debe existir`);
      assert.ok(legalNav[lang].pdfDownloadError, `legalNav.${lang}.pdfDownloadError debe existir`);
      assert.ok(legalNav[lang].downloadPdf, `legalNav.${lang}.downloadPdf debe existir`);

      // 2. Verificar manualNav
      assert.ok(manualNav[lang], `manualNav debe tener configuración para ${lang}`);
      assert.ok(manualNav[lang].pdfDownloadSuccess, `manualNav.${lang}.pdfDownloadSuccess debe existir`);
      assert.ok(manualNav[lang].pdfDownloadError, `manualNav.${lang}.pdfDownloadError debe existir`);
      assert.ok(manualNav[lang].downloadPdf, `manualNav.${lang}.downloadPdf debe existir`);

      // 3. Verificar archivos JSON i18n
      const filePath = path.resolve(process.cwd(), `src/i18n/locales/${lang}.json`);
      const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      assert.ok(content.pdf, `El archivo ${lang}.json debe contener la sección "pdf"`);
      for (const key of requiredPdfKeys) {
        assert.ok(content.pdf[key], `El archivo ${lang}.json debe definir pdf.${key}`);
        assert.ok(typeof content.pdf[key] === "string" && content.pdf[key].length > 0);
      }
    }
  });
});
