import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  OFFICIAL_PDF_DOCS,
  getOfficialPdfConfig,
  downloadDocumentPdf,
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

  it("Debe asociar cada sección con su archivo PDF real en public/docs/", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");

    const expected = {
      manual: {
        url: "/docs/HandStats-Pro_Manual-de-Usuario.pdf",
        filename: "HandStats-Pro_Manual-de-Usuario.pdf"
      },
      privacy: {
        url: "/docs/HandStats-Pro_Politica-de-Privacidad.pdf",
        filename: "HandStats-Pro_Politica-de-Privacidad.pdf"
      },
      terms: {
        url: "/docs/HandStats-Pro_Terminos-y-Condiciones.pdf",
        filename: "HandStats-Pro_Terminos-y-Condiciones.pdf"
      }
    };

    for (const [docType, exp] of Object.entries(expected)) {
      const cfg = getOfficialPdfConfig(docType);
      assert.deepEqual(cfg, exp);

      const diskPath = path.resolve(process.cwd(), "public", OFFICIAL_PDF_DOCS[docType].path);
      assert.ok(fs.existsSync(diskPath), `Debe existir el PDF físico en ${diskPath}`);
      const head = fs.readFileSync(diskPath).subarray(0, 5).toString("utf-8");
      assert.equal(head, "%PDF-", `El archivo ${diskPath} debe ser un PDF válido`);
    }
  });

  it("downloadDocumentPdf debe descargar el archivo estático de public/docs y fallar ante errores", async () => {
    await assert.rejects(() => downloadDocumentPdf("unknown"), /Tipo de documento desconocido/);

    const originalFetch = globalThis.fetch;
    const originalDocument = globalThis.document;
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;

    try {
      const clickedLinks = [];
      URL.createObjectURL = () => "blob:mock-pdf-url";
      URL.revokeObjectURL = () => {};
      globalThis.document = {
        createElement: () => ({ style: {} }),
        body: {
          appendChild: () => {},
          removeChild: () => {}
        }
      };
      globalThis.document.createElement = () => {
        const el = {
          style: {},
          click() {
            clickedLinks.push({ href: this.href, download: this.download });
          }
        };
        return el;
      };

      const fetchedUrls = [];
      globalThis.fetch = async (url) => {
        fetchedUrls.push(url);
        return {
          ok: true,
          headers: { get: () => "application/pdf" },
          blob: async () => new Blob(["%PDF-1.4"], { type: "application/pdf" })
        };
      };

      const resManual = await downloadDocumentPdf("manual");
      assert.equal(resManual.url, "/docs/HandStats-Pro_Manual-de-Usuario.pdf");
      assert.equal(resManual.filename, "HandStats-Pro_Manual-de-Usuario.pdf");

      const resPrivacy = await downloadDocumentPdf("privacy");
      assert.equal(resPrivacy.url, "/docs/HandStats-Pro_Politica-de-Privacidad.pdf");
      assert.equal(resPrivacy.filename, "HandStats-Pro_Politica-de-Privacidad.pdf");

      const resTerms = await downloadDocumentPdf("terms");
      assert.equal(resTerms.url, "/docs/HandStats-Pro_Terminos-y-Condiciones.pdf");
      assert.equal(resTerms.filename, "HandStats-Pro_Terminos-y-Condiciones.pdf");

      assert.deepEqual(fetchedUrls, [
        "/docs/HandStats-Pro_Manual-de-Usuario.pdf",
        "/docs/HandStats-Pro_Politica-de-Privacidad.pdf",
        "/docs/HandStats-Pro_Terminos-y-Condiciones.pdf"
      ]);

      assert.equal(clickedLinks.length, 3);
      assert.equal(clickedLinks[0].download, "HandStats-Pro_Manual-de-Usuario.pdf");
      assert.equal(clickedLinks[1].download, "HandStats-Pro_Politica-de-Privacidad.pdf");
      assert.equal(clickedLinks[2].download, "HandStats-Pro_Terminos-y-Condiciones.pdf");

      // Error si el servidor devuelve HTML fallback en lugar de PDF
      globalThis.fetch = async () => ({
        ok: true,
        headers: { get: () => "text/html; charset=utf-8" },
        blob: async () => new Blob(["<html></html>"], { type: "text/html" })
      });
      await assert.rejects(() => downloadDocumentPdf("manual"), /no es un PDF válido/);
    } finally {
      globalThis.fetch = originalFetch;
      globalThis.document = originalDocument;
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    }
  });
});
