import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import OnboardingTourModal from "../onboarding/OnboardingTourModal";
import { manualNav, manualChapters } from "./manualContent";
import { downloadDocumentPdf } from "../../services/documentPdfService";
import { trackEvent } from "../../services/analyticsService";
import { captureError } from "../../services/errorTrackingService";
import { IconDownload } from "../../stats/components/common/Icons";
import { toast } from "../../context/ToastContext";
import "./UserManualPage.css";

const IconBook = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const IconSparkles = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconArrowUp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

const ChapterIcon = ({ type }) => {
  switch (type) {
    case "layout":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
      );
    case "file-plus":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      );
    case "activity":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    case "cpu":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <rect x="9" y="9" width="6" height="6" />
          <line x1="9" y1="1" x2="9" y2="4" />
          <line x1="15" y1="1" x2="15" y2="4" />
          <line x1="9" y1="20" x2="9" y2="23" />
          <line x1="15" y1="20" x2="15" y2="23" />
          <line x1="20" y1="9" x2="23" y2="9" />
          <line x1="20" y1="14" x2="23" y2="14" />
          <line x1="1" y1="9" x2="4" y2="9" />
          <line x1="1" y1="14" x2="4" y2="14" />
        </svg>
      );
    case "users":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "printer":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
      );
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
  }
};

export default function UserManualPage({
  onStartTour,
}) {
  const { i18n, t } = useTranslation();

  const currentLang = (i18n.language || "es").slice(0, 2);
  const nav = manualNav[currentLang] || manualNav.es;
  const chapters = manualChapters[currentLang] || manualChapters.es;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeChapterId, setActiveChapterId] = useState(chapters[0]?.id || "ch1-intro");
  const [showTour, setShowTour] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);

      // Detect active section on scroll
      const chapterElements = chapters.map((c) => document.getElementById(c.id)).filter(Boolean);
      const scrollPos = window.scrollY + 140;

      for (let i = chapterElements.length - 1; i >= 0; i--) {
        const el = chapterElements[i];
        if (el.offsetTop <= scrollPos) {
          setActiveChapterId(el.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [chapters]);

  const [downloading, setDownloading] = useState(false);

  const handleOpenTour = () => {
    if (onStartTour) {
      onStartTour();
    } else {
      setShowTour(true);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      await downloadDocumentPdf("manual", currentLang);
      trackEvent("manual_pdf_downloaded", { lang: currentLang });
      toast.success(t("pdf.manual_download_success", nav.pdfDownloadSuccess || "Manual en PDF descargado con éxito"));
    } catch (err) {
      captureError(err, { source: "manual_pdf_download" });
      toast.error(t("pdf.download_error", nav.pdfDownloadError || "Error al descargar el PDF del manual"));
    } finally {
      setDownloading(false);
    }
  };

  const handleScrollToChapter = (chapterId) => {
    const el = document.getElementById(chapterId);
    if (el) {
      const yOffset = window.innerWidth <= 992 ? -80 : -24;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveChapterId(chapterId);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Filtrado reactivo por término de búsqueda
  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return chapters;
    const q = searchQuery.toLowerCase().trim();

    return chapters
      .map((ch) => {
        const titleMatch = ch.title.toLowerCase().includes(q);
        const summaryMatch = ch.summary.toLowerCase().includes(q);
        const matchingSections = ch.sections.filter(
          (s) => s.subtitle.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
        );

        if (titleMatch || summaryMatch || matchingSections.length > 0) {
          return {
            ...ch,
            sections: matchingSections.length > 0 ? matchingSections : ch.sections
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [chapters, searchQuery]);

  return (
    <div className="manual-page-container">
      {/* ENCABEZADO INTEGRADO EN EL PANEL PRINCIPAL */}
      <header className="manual-page-header">
        <div className="manual-page-title-block">
          <h1 className="manual-page-title">
            <IconBook />
            <span>{nav.manualTitle}</span>
          </h1>
          <p className="manual-page-subtitle">{nav.manualSubtitle}</p>
        </div>

        <div className="manual-header-right">
          <button
            type="button"
            className="manual-action-btn tour-btn"
            onClick={handleOpenTour}
            title={nav.startTourBtn}
          >
            <IconSparkles />
            <span>{nav.startTourBtn}</span>
          </button>

          <button
            type="button"
            className="manual-action-btn print-btn"
            onClick={handleDownloadPdf}
            disabled={downloading}
            title={nav.downloadPdf || nav.printBtn}
          >
            <IconDownload size={15} />
            <span>
              {downloading ? t("pdf.generating", nav.generatingPdf || "Descargando PDF...") : (nav.downloadPdf || nav.printBtn)}
            </span>
          </button>
        </div>
      </header>

      {/* CUERPO PRINCIPAL: SIDEBAR TOC + CONTENIDO */}
      <div className="manual-layout-wrapper">
        <aside className="manual-toc-sidebar">
          <div className="manual-toc-card">
            <div className="toc-title-row">
              <span className="toc-title">{nav.tableOfContents}</span>
            </div>

            <nav className="toc-nav-list">
              {chapters.map((ch) => {
                const isActive = activeChapterId === ch.id;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    className={`toc-item-btn ${isActive ? "active" : ""}`}
                    onClick={() => handleScrollToChapter(ch.id)}
                  >
                    <span className="toc-num">{ch.number}</span>
                    <span className="toc-name">{ch.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="manual-chapters-main">
          {searchQuery && (
            <div className="search-feedback-banner">
              <span>
                {filteredChapters.length > 0
                  ? `Mostrando ${filteredChapters.length} capítulo(s) con coincidencias para "${searchQuery}"`
                  : nav.noSearchResults}
              </span>
              <button
                type="button"
                className="reset-search-link"
                onClick={() => setSearchQuery("")}
              >
                Ver manual completo
              </button>
            </div>
          )}

          {filteredChapters.map((chapter) => (
            <section key={chapter.id} id={chapter.id} className="manual-chapter-card">
              <div className="chapter-card-header">
                <div className="chapter-icon-circle">
                  <ChapterIcon type={chapter.icon} />
                </div>

                <div className="chapter-title-wrap">
                  <h2 className="chapter-title">
                    <span className="chapter-num-badge">{chapter.number}</span>
                    <span>{chapter.title}</span>
                  </h2>
                  <p className="chapter-summary">{chapter.summary}</p>
                </div>
              </div>

              <div className="chapter-card-body">
                {chapter.sections.map((section) => (
                  <article key={section.id} id={section.id} className="manual-section-block">
                    <h3 className="section-subtitle">{section.subtitle}</h3>
                    <div className="section-content-text">
                      {section.content.split("\n").map((paragraph, pIdx) => (
                        <p key={pIdx}>{paragraph}</p>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>

      {/* BOTÓN VOLVER ARRIBA */}
      {showScrollTop && (
        <button
          type="button"
          className="manual-scroll-top-btn"
          onClick={scrollToTop}
          title="Volver arriba"
          aria-label="Volver arriba"
        >
          <IconArrowUp />
        </button>
      )}

      {/* TOUR GUIADO MODAL */}
      <OnboardingTourModal
        isOpen={showTour}
        onClose={() => setShowTour(false)}
      />
    </div>
  );
}
