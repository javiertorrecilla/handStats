import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logoHorizontal from "../../assets/logoHorizontal.png";
import LanguageSelector from "../common/LanguageSelector";
import { legalNav, privacyContent } from "./legalContent";
import { downloadDocumentPdf } from "../../services/documentPdfService";
import { toast } from "../../context/ToastContext";
import "./LegalPages.css";

const IconSun = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const IconMoon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const IconPrint = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconArrowUp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

const IconShield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const LegalSectionIcon = ({ id = "" }) => {
  const iconProps = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  };
  const key = String(id).toLowerCase();

  if (key.includes("responsable") || key.includes("controller") || key.includes("seguridad") || key.includes("security")) {
    return (
      <svg {...iconProps}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    );
  }
  if (key.includes("datos") || key.includes("data")) {
    return (
      <svg {...iconProps}>
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    );
  }
  if (key.includes("finalidad") || key.includes("purpose") || key.includes("servicio") || key.includes("service")) {
    return (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    );
  }
  if (key.includes("legitimacion") || key.includes("legal") || key.includes("aceptacion") || key.includes("acceptance")) {
    return (
      <svg {...iconProps}>
        <path d="m9 12 2 2 4-4" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    );
  }
  if (key.includes("conservacion") || key.includes("retention") || key.includes("modificaciones") || key.includes("duration")) {
    return (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    );
  }
  if (key.includes("destinatarios") || key.includes("recipients") || key.includes("cloud") || key.includes("proveedores")) {
    return (
      <svg {...iconProps}>
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" />
        <line x1="6" y1="18" x2="6.01" y2="18" />
      </svg>
    );
  }
  if (key.includes("derechos") || key.includes("rights") || key.includes("cuentas") || key.includes("accounts")) {
    return (
      <svg {...iconProps}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <polyline points="17 11 19 13 23 9" />
      </svg>
    );
  }
  if (key.includes("contacto") || key.includes("contact") || key.includes("soporte") || key.includes("support")) {
    return (
      <svg {...iconProps}>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    );
  }
  return (
    <svg {...iconProps}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
};

export default function PrivacyPolicyPage({ theme = "light", toggleTheme, onBack, user }) {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();

  const currentLang = (i18n.language || "es").slice(0, 2);
  const nav = legalNav[currentLang] || legalNav.es;
  const content = privacyContent[currentLang] || privacyContent.es;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeSectionId, setActiveSectionId] = useState(content.sections[0]?.id || "");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);

      // Detect active section on scroll (ScrollSpy)
      const sectionElements = content.sections.map((s) => document.getElementById(s.id)).filter(Boolean);
      const scrollPos = window.scrollY + 140;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const el = sectionElements[i];
        if (el.offsetTop <= scrollPos) {
          setActiveSectionId(el.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [content.sections]);

  const handleReturn = () => {
    if (onBack) {
      onBack();
    } else if (user) {
      navigate("/matches");
    } else {
      navigate("/");
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      await downloadDocumentPdf("privacy", currentLang);
      toast.success(t("pdf.privacy_download_success", nav.pdfDownloadSuccess || "Política de Privacidad en PDF descargada con éxito"));
    } catch (err) {
      console.error("Error al descargar PDF de la política de privacidad:", err);
      toast.error(t("pdf.download_error", nav.pdfDownloadError || "Error al generar el documento PDF"));
    } finally {
      setDownloading(false);
    }
  };

  const handleScrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveSectionId(sectionId);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Filtrado reactivo por término de búsqueda
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return content.sections;
    const q = searchQuery.toLowerCase().trim();

    return content.sections
      .map((sec) => {
        const titleMatch = sec.title?.toLowerCase().includes(q);
        const introMatch = sec.intro?.toLowerCase().includes(q);
        const paragraphMatch = sec.paragraphs?.some((p) => p.toLowerCase().includes(q));
        const itemMatch = sec.items?.some((it) => (it.bold?.toLowerCase().includes(q) || it.text?.toLowerCase().includes(q)));
        const cardMatch = sec.cardInfo?.some((ci) => (ci.label?.toLowerCase().includes(q) || ci.value?.toLowerCase().includes(q)));
        const extraMatch = sec.extra?.toLowerCase().includes(q);

        if (titleMatch || introMatch || paragraphMatch || itemMatch || cardMatch || extraMatch) {
          return sec;
        }
        return null;
      })
      .filter(Boolean);
  }, [content.sections, searchQuery]);

  return (
    <div className="legal-page-container">
      {/* HEADER DE NAVEGACIÓN */}
      <header className="legal-header-nav">
        <div className="legal-header-content">
          <div className="legal-header-left">
            <button
              type="button"
              className="legal-back-btn"
              onClick={handleReturn}
              title={user ? nav.backToApp : nav.backToHome}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>{user ? nav.backToApp : nav.backToHome}</span>
            </button>
            <img
              src={logoHorizontal}
              alt="HandStats"
              className="legal-brand-logo"
              onClick={() => navigate("/")}
            />
          </div>

          <div className="legal-header-right">
            <button
              type="button"
              className="legal-action-btn print-btn"
              onClick={handleDownloadPdf}
              disabled={downloading}
              title={nav.downloadPdf || nav.printPdf}
            >
              <IconPrint />
              <span className="btn-text-full">
                {downloading ? t("pdf.generating", nav.downloading || "Generando PDF...") : (nav.downloadPdf || nav.printPdf || "Descargar PDF")}
              </span>
            </button>

            <LanguageSelector compact />

            {toggleTheme && (
              <button
                type="button"
                className="legal-theme-btn"
                onClick={toggleTheme}
                title={theme === "dark" ? (nav.themeLight || "Modo Claro") : (nav.themeDark || "Modo Oscuro")}
                aria-label={theme === "dark" ? (nav.themeLight || "Modo Claro") : (nav.themeDark || "Modo Oscuro")}
              >
                {theme === "dark" ? <IconMoon /> : <IconSun />}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* HERO BANNER & BÚSQUEDA */}
      <div className="legal-hero-banner">
        <div className="legal-hero-inner">
          <div className="legal-badge-pill">
            <span className="legal-dot-pulse"></span>
            <span>{content.badge}</span>
          </div>
          <h1 className="legal-hero-title">{content.title}</h1>
          <p className="legal-hero-subtitle">
            Marco regulatorio oficial y compromiso técnico de protección de datos para clubes, entrenadores y analistas de HandStats.
          </p>

          <div className="legal-search-box">
            <div className="search-icon-wrap">
              <IconSearch />
            </div>
            <input
              type="text"
              className="legal-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={nav.searchPlaceholderPrivacy || "Buscar en la política de privacidad (ej: RGPD, datos, derechos)..."}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery("")}
                aria-label="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          <div className="legal-hero-meta">
            <span>{nav.lastUpdated} {content.updatedDate}</span>
            <span>·</span>
            <span>{content.sections.length} {nav.sectionsCount || "Secciones Oficiales"}</span>
            <span>·</span>
            <span>{content.scopeText}</span>
            <span>·</span>
            <span>{nav.version} {content.version}</span>
          </div>
        </div>
      </div>

      {/* CUERPO PRINCIPAL: SIDEBAR TOC + CONTENIDO */}
      <div className="legal-layout-wrapper">
        <aside className="legal-toc-sidebar">
          <div className="legal-toc-card">
            <div className="toc-title-row">
              <span className="toc-title">{nav.tableOfContents || nav.tocTitle || "ÍNDICE DE SECCIONES"}</span>
            </div>

            <nav className="toc-nav-list">
              {content.sections.map((sec) => {
                const isActive = activeSectionId === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    className={`toc-item-btn ${isActive ? "active" : ""}`}
                    onClick={() => handleScrollToSection(sec.id)}
                  >
                    <span className="toc-num">{String(sec.number).padStart(2, "0")}</span>
                    <span className="toc-name">{sec.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="legal-sections-main">
          {searchQuery && (
            <div className="search-feedback-banner">
              <span>
                {filteredSections.length > 0
                  ? `Mostrando ${filteredSections.length} sección(es) con coincidencias para "${searchQuery}"`
                  : (nav.noSearchResults || "No se encontraron secciones que coincidan con tu búsqueda.")}
              </span>
              <button
                type="button"
                className="reset-search-link"
                onClick={() => setSearchQuery("")}
              >
                {nav.clearSearch || "Ver documento completo"}
              </button>
            </div>
          )}

          {/* CUADRO DESTACADO DE COMPROMISO */}
          {!searchQuery && (
            <div className="legal-highlight-box">
              <div className="legal-highlight-badge">
                <IconShield />
                <span>{content.highlightTitle}</span>
              </div>
              <p className="legal-highlight-text">{content.highlightText}</p>
            </div>
          )}

          {/* SECCIONES LEGALES FORMATO TARJETA */}
          {filteredSections.map((sec) => (
            <section key={sec.id} id={sec.id} className="legal-chapter-card">
              <div className="chapter-card-header">
                <div className="chapter-icon-circle">
                  <LegalSectionIcon id={sec.id} />
                </div>

                <div className="chapter-title-wrap">
                  <h2 className="chapter-title">
                    <span className="chapter-num-badge">{String(sec.number).padStart(2, "0")}</span>
                    <span>{sec.title}</span>
                  </h2>
                  {sec.intro && <p className="chapter-summary">{sec.intro}</p>}
                </div>
              </div>

              <div className="chapter-card-body">
                {sec.paragraphs && sec.paragraphs.length > 0 && (
                  <div className="section-content-text">
                    {sec.paragraphs.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>
                )}

                {sec.cardInfo && sec.cardInfo.length > 0 && (
                  <div className="legal-card-info">
                    {sec.cardInfo.map((info, idx) => (
                      <div key={idx} className="legal-card-info-item">
                        <span className="legal-card-info-label">{info.label}:</span>
                        <strong className="legal-card-info-value">{info.value}</strong>
                      </div>
                    ))}
                  </div>
                )}

                {sec.items && sec.items.length > 0 && (
                  <ul className="legal-section-list">
                    {sec.items.map((it, idx) => (
                      <li key={idx}>
                        {it.bold && <strong>{it.bold} </strong>}
                        <span>{it.text}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {sec.extra && (
                  <div className="legal-extra-guarantee">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span>{sec.extra}</span>
                  </div>
                )}
              </div>
            </section>
          ))}
        </main>
      </div>

      {/* BOTÓN FLOTANTE VOLVER ARRIBA */}
      {showScrollTop && (
        <button
          type="button"
          className="legal-scroll-top-btn"
          onClick={scrollToTop}
          title={nav.scrollTopBtn || "Volver arriba"}
          aria-label={nav.scrollTopBtn || "Volver arriba"}
        >
          <IconArrowUp />
        </button>
      )}

      {/* FOOTER LEGAL */}
      <footer className="legal-page-footer">
        <div className="legal-page-footer-content">
          <div className="legal-footer-links">
            <button type="button" onClick={() => navigate("/privacy")}>
              {nav.viewPrivacy}
            </button>
            <span>·</span>
            <button type="button" onClick={() => navigate("/terms")}>
              {nav.viewTerms}
            </button>
            <span>·</span>
            <button type="button" onClick={() => navigate("/manual")}>
              {nav.viewManual || "Manual de Usuario"}
            </button>
            <span>·</span>
            <button type="button" onClick={handleReturn}>
              {user ? nav.backToApp : nav.backToHome}
            </button>
          </div>
          <div className="legal-footer-copy">
            © {new Date().getFullYear()} HandStats Analytics. {nav.rightsReserved}
          </div>
        </div>
      </footer>
    </div>
  );
}
