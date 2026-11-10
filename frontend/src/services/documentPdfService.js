/**
 * documentPdfService.js
 * Generador y exportador de documentos PDF oficiales de HandStats Pro:
 * - Política de Privacidad
 * - Términos y Condiciones
 * - Manual de Usuario y Guía Táctica
 *
 * Genera PDFs vectoriales puros, de alta resolución, fondo 100% blanco (#ffffff),
 * tipografía nítida, encabezados/pies de página con numeración dinámica "Página X de Y",
 * y soporte multilingüe completo (ES, EN, DE, FR, DA, PL).
 */

import { jsPDF } from "jspdf";
import { privacyContent, termsContent } from "../components/legal/legalContent.js";
import { manualNav, manualChapters } from "../components/manual/manualContent.js";

// Paleta de colores oficial para impresión profesional
const PDF_COLORS = {
  primary: [234, 88, 12],     // #ea580c (Naranja Balonmano HandStats)
  primarySubtle: [255, 237, 213], // #ffedd5
  dark: [15, 23, 42],          // #0f172a (Navy oscuro)
  text: [30, 41, 59],          // #1e293b
  textMuted: [100, 116, 139],  // #64748b
  border: [226, 232, 240],     // #e2e8f0
  bgLight: [248, 250, 252],    // #f8fafc
  white: [255, 255, 255]       // #ffffff
};

// Traducción de pie de página para numeración
const PAGE_TEXTS = {
  es: { pageOf: "Página {{current}} de {{total}}", officialDoc: "HandStats Pro · www.handstats.pro · Documento Oficial", confidentiality: "Documentación y Directrices Técnicas" },
  en: { pageOf: "Page {{current}} of {{total}}", officialDoc: "HandStats Pro · www.handstats.pro · Official Document", confidentiality: "Technical Documentation & Guidelines" },
  de: { pageOf: "Seite {{current}} von {{total}}", officialDoc: "HandStats Pro · www.handstats.pro · Offizielles Dokument", confidentiality: "Technische Dokumentation & Richtlinien" },
  fr: { pageOf: "Page {{current}} sur {{total}}", officialDoc: "HandStats Pro · www.handstats.pro · Document Officiel", confidentiality: "Documentation et Directives Techniques" },
  da: { pageOf: "Side {{current}} af {{total}}", officialDoc: "HandStats Pro · www.handstats.pro · Officielt Dokument", confidentiality: "Teknisk Dokumentation & Retningslinjer" },
  pl: { pageOf: "Strona {{current}} z {{total}}", officialDoc: "HandStats Pro · www.handstats.pro · Oficjalny Dokument", confidentiality: "Dokumentacja i Wytyczne Techniczne" }
};

/**
 * Inicializa un documento jsPDF en A4 vertical con márgenes estandarizados.
 */
function createBasePdf() {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true
  });
  return pdf;
}

/**
 * Aplica los encabezados y pies de página a todas las hojas una vez completado el documento.
 */
function applyHeadersAndFooters(pdf, docTitle, lang = "es") {
  const totalPages = pdf.internal.getNumberOfPages();
  const langKey = PAGE_TEXTS[lang] ? lang : "es";
  const pText = PAGE_TEXTS[langKey];

  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);

    // Barra superior decorativa en todas las páginas
    pdf.setFillColor(...PDF_COLORS.primary);
    pdf.rect(0, 0, 210, 3, "F");

    // Encabezado en páginas 2 en adelante
    if (i > 1) {
      pdf.setDrawColor(...PDF_COLORS.border);
      pdf.setLineWidth(0.3);
      pdf.line(18, 14, 192, 14);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(...PDF_COLORS.primary);
      pdf.text("HANDSTATS PRO", 18, 11);

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...PDF_COLORS.textMuted);
      pdf.text(`·  ${docTitle}`, 48, 11);
    }

    // Pie de página en todas las páginas
    pdf.setDrawColor(...PDF_COLORS.border);
    pdf.setLineWidth(0.3);
    pdf.line(18, 283, 192, 283);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...PDF_COLORS.textMuted);
    pdf.text(pText.officialDoc, 18, 288);

    const pageStr = pText.pageOf.replace("{{current}}", i).replace("{{total}}", totalPages);
    pdf.setFont("helvetica", "bold");
    pdf.text(pageStr, 192, 288, { align: "right" });
  }
}

/**
 * Dibuja la cabecera / portada visual en la primera página
 */
function drawDocumentCoverHeader(pdf, {
  badge,
  title,
  subtitle,
  metadataItems = [],
  highlightBox = null
}) {
  let y = 16;

  // Marca y Logotipo vectorial elegante
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(...PDF_COLORS.dark);
  pdf.text("HAND", 18, y + 6);

  pdf.setTextColor(...PDF_COLORS.primary);
  pdf.text("STATS", 43, y + 6);

  // Insignia PRO
  pdf.setFillColor(...PDF_COLORS.primary);
  pdf.roundedRect(73, y, 16, 8, 2, 2, "F");
  pdf.setFontSize(9);
  pdf.setTextColor(...PDF_COLORS.white);
  pdf.text("PRO", 81, y + 5.5, { align: "center" });

  // Tagline
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(...PDF_COLORS.textMuted);
  pdf.text("SUITE DE ANÁLISIS DE BALONMANO DE ÉLITE // ASOBAL & IHF READY", 18, y + 12);

  y += 20;

  // Badge del tipo de documento
  if (badge) {
    pdf.setFillColor(...PDF_COLORS.bgLight);
    pdf.setDrawColor(...PDF_COLORS.border);
    pdf.roundedRect(18, y, 75, 6, 2, 2, "FD");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...PDF_COLORS.primary);
    pdf.text(badge.toUpperCase(), 22, y + 4.2);
    y += 10;
  }

  // Título Principal
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(17);
  pdf.setTextColor(...PDF_COLORS.dark);
  const titleLines = pdf.splitTextToSize(title, 174);
  pdf.text(titleLines, 18, y);
  y += titleLines.length * 7 + 2;

  // Subtítulo si existe
  if (subtitle) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(...PDF_COLORS.textMuted);
    const subLines = pdf.splitTextToSize(subtitle, 174);
    pdf.text(subLines, 18, y);
    y += subLines.length * 5 + 3;
  }

  // Fila de metadatos (Versión, Fecha, Ámbito)
  if (metadataItems.length > 0) {
    pdf.setFillColor(...PDF_COLORS.bgLight);
    pdf.setDrawColor(...PDF_COLORS.border);
    pdf.roundedRect(18, y, 174, 9, 2, 2, "FD");

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...PDF_COLORS.text);

    const metaStr = metadataItems.join("   ·   ");
    pdf.text(metaStr, 22, y + 5.8);
    y += 15;
  }

  // Cuadro destacado (ej: Compromiso RGPD o Acuerdo Legal)
  if (highlightBox && highlightBox.title && highlightBox.text) {
    const boxWidth = 174;
    const highlightLines = pdf.splitTextToSize(highlightBox.text, boxWidth - 16);
    const boxHeight = 10 + highlightLines.length * 4.6 + 4;

    pdf.setFillColor(...PDF_COLORS.bgLight);
    pdf.setDrawColor(...PDF_COLORS.border);
    pdf.roundedRect(18, y, boxWidth, boxHeight, 3, 3, "FD");

    // Línea vertical izquierda de énfasis naranja
    pdf.setFillColor(...PDF_COLORS.primary);
    pdf.rect(18, y, 3, boxHeight, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9.5);
    pdf.setTextColor(...PDF_COLORS.primary);
    pdf.text(highlightBox.title, 26, y + 6);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...PDF_COLORS.text);
    pdf.text(highlightLines, 26, y + 12);

    y += boxHeight + 8;
  }

  return y;
}

/**
 * ==========================================================
 * 1. GENERADOR: POLÍTICA DE PRIVACIDAD
 * ==========================================================
 */
export function generatePrivacyPolicyPdf(lang = "es") {
  const pdf = createBasePdf();
  const currentLang = privacyContent[lang] ? lang : "es";
  const data = privacyContent[currentLang] || privacyContent.es;

  let y = drawDocumentCoverHeader(pdf, {
    badge: data.badge || "POLÍTICA DE PRIVACIDAD",
    title: data.title,
    metadataItems: [
      `Versión: ${data.version}`,
      `Fecha: ${data.updatedDate}`,
      `Ámbito: ${data.scopeText}`
    ],
    highlightBox: {
      title: data.highlightTitle,
      text: data.highlightText
    }
  });

  const contentWidth = 174;
  const bottomMargin = 275;
  const topMargin = 22;

  // Función auxiliar para renderizar una sección legal completa (intro, cardInfo, items, paragraphs, extra)
  function renderLegalSection(section) {
    // Verificar si cabe el título de sección con al menos 2 líneas
    if (y + 24 > bottomMargin) {
      pdf.addPage();
      y = topMargin;
    }

    // Cabecera de Sección
    pdf.setFillColor(...PDF_COLORS.primary);
    pdf.circle(20.5, y - 1, 1.8, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(...PDF_COLORS.dark);
    pdf.text(section.title, 26, y);
    y += 7;

    // Intro
    if (section.intro) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.8);
      pdf.setTextColor(...PDF_COLORS.text);
      const lines = pdf.splitTextToSize(section.intro, contentWidth);
      if (y + lines.length * 4.5 > bottomMargin) {
        pdf.addPage();
        y = topMargin;
      }
      pdf.text(lines, 18, y);
      y += lines.length * 4.5 + 2.5;
    }

    // CardInfo (ej: Responsable del tratamiento)
    if (section.cardInfo && Array.isArray(section.cardInfo)) {
      section.cardInfo.forEach((info) => {
        const fullLine = `${info.label}: ${info.value}`;
        const lines = pdf.splitTextToSize(fullLine, contentWidth - 8);
        const cardHeight = lines.length * 4.4 + 2;

        if (y + cardHeight > bottomMargin) {
          pdf.addPage();
          y = topMargin;
        }

        pdf.setFillColor(...PDF_COLORS.bgLight);
        pdf.setDrawColor(...PDF_COLORS.border);
        pdf.roundedRect(18, y - 3, contentWidth, cardHeight + 1, 1.5, 1.5, "FD");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8.2);
        pdf.setTextColor(...PDF_COLORS.primary);
        pdf.text(info.label + ":", 22, y + 1.2);

        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...PDF_COLORS.text);
        const valX = 24 + pdf.getTextWidth(info.label + ":");
        if (valX < 110) {
          pdf.text(info.value, valX, y + 1.2);
        } else {
          pdf.text(info.value, 22, y + 5.5);
          y += 4;
        }

        y += cardHeight + 2;
      });
      y += 2;
    }

    // Items con viñeta (bold + text)
    if (section.items && Array.isArray(section.items)) {
      section.items.forEach((item) => {
        const fullItemText = item.bold ? `${item.bold} ${item.text}` : item.text;
        const lines = pdf.splitTextToSize(fullItemText, contentWidth - 6);
        const itemHeight = lines.length * 4.4;

        if (y + itemHeight > bottomMargin) {
          pdf.addPage();
          y = topMargin;
        }

        // Viñeta naranja
        pdf.setFillColor(...PDF_COLORS.primary);
        pdf.circle(20, y - 0.8, 1.2, "F");

        pdf.setFont("helvetica", item.bold ? "bold" : "normal");
        pdf.setFontSize(8.6);
        pdf.setTextColor(...PDF_COLORS.text);
        pdf.text(lines, 24, y);
        y += itemHeight + 2.5;
      });
      y += 2;
    }

    // Paragraphs (si existen)
    if (section.paragraphs && Array.isArray(section.paragraphs)) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.8);
      pdf.setTextColor(...PDF_COLORS.text);

      section.paragraphs.forEach((pText) => {
        const lines = pdf.splitTextToSize(pText, contentWidth);
        const textHeight = lines.length * 4.5;

        if (y + textHeight > bottomMargin) {
          pdf.addPage();
          y = topMargin;
        }

        pdf.text(lines, 18, y);
        y += textHeight + 3;
      });
    }

    // Extra
    if (section.extra) {
      const lines = pdf.splitTextToSize(section.extra, contentWidth);
      if (y + lines.length * 4.5 > bottomMargin) {
        pdf.addPage();
        y = topMargin;
      }
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.setTextColor(...PDF_COLORS.primary);
      pdf.text(lines, 18, y);
      y += lines.length * 4.5 + 3;
    }

    y += 4;
  }

  // Secciones
  data.sections.forEach(renderLegalSection);

  applyHeadersAndFooters(pdf, data.title, currentLang);
  return pdf;
}

/**
 * ==========================================================
 * 2. GENERADOR: TÉRMINOS Y CONDICIONES
 * ==========================================================
 */
export function generateTermsPdf(lang = "es") {
  const pdf = createBasePdf();
  const currentLang = termsContent[lang] ? lang : "es";
  const data = termsContent[currentLang] || termsContent.es;

  let y = drawDocumentCoverHeader(pdf, {
    badge: data.badge || "TÉRMINOS Y CONDICIONES",
    title: data.title,
    metadataItems: [
      `Versión: ${data.version}`,
      `Fecha: ${data.updatedDate}`,
      `Ámbito: ${data.scopeText}`
    ],
    highlightBox: {
      title: data.highlightTitle,
      text: data.highlightText
    }
  });

  const contentWidth = 174;
  const bottomMargin = 275;
  const topMargin = 22;

  function renderLegalSection(section) {
    if (y + 24 > bottomMargin) {
      pdf.addPage();
      y = topMargin;
    }

    pdf.setFillColor(...PDF_COLORS.primary);
    pdf.circle(20.5, y - 1, 1.8, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(...PDF_COLORS.dark);
    pdf.text(section.title, 26, y);
    y += 7;

    if (section.intro) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.8);
      pdf.setTextColor(...PDF_COLORS.text);
      const lines = pdf.splitTextToSize(section.intro, contentWidth);
      if (y + lines.length * 4.5 > bottomMargin) {
        pdf.addPage();
        y = topMargin;
      }
      pdf.text(lines, 18, y);
      y += lines.length * 4.5 + 2.5;
    }

    if (section.cardInfo && Array.isArray(section.cardInfo)) {
      section.cardInfo.forEach((info) => {
        const fullLine = `${info.label}: ${info.value}`;
        const lines = pdf.splitTextToSize(fullLine, contentWidth - 8);
        const cardHeight = lines.length * 4.4 + 2;

        if (y + cardHeight > bottomMargin) {
          pdf.addPage();
          y = topMargin;
        }

        pdf.setFillColor(...PDF_COLORS.bgLight);
        pdf.setDrawColor(...PDF_COLORS.border);
        pdf.roundedRect(18, y - 3, contentWidth, cardHeight + 1, 1.5, 1.5, "FD");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8.2);
        pdf.setTextColor(...PDF_COLORS.primary);
        pdf.text(info.label + ":", 22, y + 1.2);

        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...PDF_COLORS.text);
        const valX = 24 + pdf.getTextWidth(info.label + ":");
        if (valX < 110) {
          pdf.text(info.value, valX, y + 1.2);
        } else {
          pdf.text(info.value, 22, y + 5.5);
          y += 4;
        }

        y += cardHeight + 2;
      });
      y += 2;
    }

    if (section.items && Array.isArray(section.items)) {
      section.items.forEach((item) => {
        const fullItemText = item.bold ? `${item.bold} ${item.text}` : item.text;
        const lines = pdf.splitTextToSize(fullItemText, contentWidth - 6);
        const itemHeight = lines.length * 4.4;

        if (y + itemHeight > bottomMargin) {
          pdf.addPage();
          y = topMargin;
        }

        pdf.setFillColor(...PDF_COLORS.primary);
        pdf.circle(20, y - 0.8, 1.2, "F");

        pdf.setFont("helvetica", item.bold ? "bold" : "normal");
        pdf.setFontSize(8.6);
        pdf.setTextColor(...PDF_COLORS.text);
        pdf.text(lines, 24, y);
        y += itemHeight + 2.5;
      });
      y += 2;
    }

    if (section.paragraphs && Array.isArray(section.paragraphs)) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.8);
      pdf.setTextColor(...PDF_COLORS.text);

      section.paragraphs.forEach((pText) => {
        const lines = pdf.splitTextToSize(pText, contentWidth);
        const textHeight = lines.length * 4.5;

        if (y + textHeight > bottomMargin) {
          pdf.addPage();
          y = topMargin;
        }

        pdf.text(lines, 18, y);
        y += textHeight + 3;
      });
    }

    if (section.extra) {
      const lines = pdf.splitTextToSize(section.extra, contentWidth);
      if (y + lines.length * 4.5 > bottomMargin) {
        pdf.addPage();
        y = topMargin;
      }
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.setTextColor(...PDF_COLORS.primary);
      pdf.text(lines, 18, y);
      y += lines.length * 4.5 + 3;
    }

    y += 4;
  }

  data.sections.forEach(renderLegalSection);

  applyHeadersAndFooters(pdf, data.title, currentLang);
  return pdf;
}

/**
 * ==========================================================
 * 3. GENERADOR: MANUAL DE USUARIO Y GUÍA TÁCTICA
 * ==========================================================
 */
export function generateUserManualPdf(lang = "es") {
  const pdf = createBasePdf();
  const currentLang = manualChapters[lang] ? lang : "es";
  const navData = manualNav[currentLang] || manualNav.es;
  const chapters = manualChapters[currentLang] || manualChapters.es;

  let y = drawDocumentCoverHeader(pdf, {
    badge: navData.versionBadge || "VERSIÓN 2.0 · SUITE ÉLITE",
    title: navData.manualTitle || "Manual de Usuario y Guía Táctica",
    subtitle: navData.manualSubtitle || "Documentación oficial del sistema HandStats Pro v2.0 para analistas y entrenadores.",
    metadataItems: [
      navData.lastUpdated || "Revisión: Octubre 2026",
      "7 Capítulos Oficiales",
      "Modelos Biomecánicos xG / xSaves / NPS"
    ],
    highlightBox: {
      title: "GUÍA TÁCTICA & METODOLOGÍA OFICIAL",
      text: "Este manual describe exhaustivamente los procedimientos de registro a pie de pista en 4 toques, la calibración de modelos biomecánicos validados para balonmano y la generación de dossieres técnicos para el cuerpo técnico."
    }
  });

  const contentWidth = 174;
  const bottomMargin = 275;
  const topMargin = 22;

  // Renderizar cada capítulo
  chapters.forEach((chapter, chIdx) => {
    // Si no es el primer capítulo, forzar salto de página limpio para cada capítulo
    if (chIdx > 0) {
      pdf.addPage();
      y = topMargin;
    } else if (y + 40 > bottomMargin) {
      pdf.addPage();
      y = topMargin;
    }

    // Encabezado de Capítulo con tarjeta elegante
    pdf.setFillColor(...PDF_COLORS.bgLight);
    pdf.setDrawColor(...PDF_COLORS.border);
    pdf.roundedRect(18, y, contentWidth, 18, 3, 3, "FD");

    // Número de capítulo en pastilla naranja
    pdf.setFillColor(...PDF_COLORS.primary);
    pdf.roundedRect(22, y + 3.5, 12, 11, 2, 2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...PDF_COLORS.white);
    pdf.text(chapter.number, 28, y + 10.5, { align: "center" });

    // Título de capítulo
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12.5);
    pdf.setTextColor(...PDF_COLORS.dark);
    pdf.text(chapter.title, 38, y + 8);

    // Resumen de capítulo
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...PDF_COLORS.textMuted);
    const sumLines = pdf.splitTextToSize(chapter.summary, contentWidth - 24);
    pdf.text(sumLines[0] || "", 38, y + 13.5);

    y += 24;

    // Secciones del capítulo
    chapter.sections.forEach((section) => {
      // Verificar espacio para título de subsección y líneas de inicio
      if (y + 20 > bottomMargin) {
        pdf.addPage();
        y = topMargin;
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(...PDF_COLORS.primary);
      pdf.text(section.subtitle, 18, y);
      y += 5.5;

      // Párrafos del contenido
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.8);
      pdf.setTextColor(...PDF_COLORS.text);

      const paragraphs = section.content.split("\n");
      paragraphs.forEach((pText) => {
        if (!pText.trim()) return;

        const isBullet = pText.trim().startsWith("•") || pText.trim().startsWith("1.") || pText.trim().startsWith("2.") || pText.trim().startsWith("3.") || pText.trim().startsWith("4.");
        const textX = isBullet ? 22 : 18;
        const widthLimit = isBullet ? contentWidth - 4 : contentWidth;

        const lines = pdf.splitTextToSize(pText, widthLimit);
        const textHeight = lines.length * 4.5;

        if (y + textHeight > bottomMargin) {
          pdf.addPage();
          y = topMargin;
        }

        pdf.text(lines, textX, y);
        y += textHeight + 2.8;
      });

      y += 3;
    });

    y += 4;
  });

  applyHeadersAndFooters(pdf, navData.manualTitle || "Manual de Usuario", currentLang);
  return pdf;
}

/**
 * ==========================================================
 * DESCARGA DIRECTA DE ARCHIVOS PDF OFICIALES (public/docs)
 * ==========================================================
 */

export const OFFICIAL_PDF_DOCS = {
  privacy: {
    path: "docs/HandStats-Pro_Politica-de-Privacidad.pdf",
    filename: "HandStats-Pro_Politica-de-Privacidad.pdf"
  },
  terms: {
    path: "docs/HandStats-Pro_Terminos-y-Condiciones.pdf",
    filename: "HandStats-Pro_Terminos-y-Condiciones.pdf"
  },
  manual: {
    path: "docs/HandStats-Pro_Manual-de-Usuario.pdf",
    filename: "HandStats-Pro_Manual-de-Usuario.pdf"
  }
};

/**
 * Resuelve la URL pública y el nombre de archivo del PDF oficial para cada sección.
 */
export function getOfficialPdfConfig(docType) {
  const docConfig = OFFICIAL_PDF_DOCS[docType];
  if (!docConfig) {
    throw new Error(`Tipo de documento desconocido: ${docType}`);
  }

  const baseUrl =
    typeof import.meta !== "undefined" && import.meta.env?.BASE_URL
      ? import.meta.env.BASE_URL
      : "/";
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  return {
    url: `${normalizedBase}${docConfig.path}`,
    filename: docConfig.filename
  };
}

/**
 * Descarga directamente el documento PDF oficial almacenado en public/docs.
 */
export async function downloadDocumentPdf(docType, _lang = "es") {
  const { url, filename } = getOfficialPdfConfig(docType);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`No se pudo descargar el PDF oficial (${response.status}): ${url}`);
  }

  const contentType = response.headers?.get?.("content-type") || "";
  if (contentType.toLowerCase().includes("text/html")) {
    throw new Error(`El recurso devuelto no es un PDF válido: ${url}`);
  }

  const blob = await response.blob();
  if (!blob || blob.size === 0) {
    throw new Error(`El archivo PDF descargado está vacío: ${url}`);
  }

  const blobUrl = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    link.rel = "noopener noreferrer";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  }

  return { success: true, filename, url };
}
