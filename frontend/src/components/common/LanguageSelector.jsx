import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "../../i18n/i18n";
import "./LanguageSelector.css";

export default function LanguageSelector({
  compact = false,
  direction = "down", // "down" | "up"
  className = ""
}) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Normalize current language (e.g., 'es-ES' -> 'es')
  const currentLangCode = (i18n.language || "es").split("-")[0].toLowerCase();
  const currentLang =
    SUPPORTED_LANGUAGES.find((lang) => lang.code === currentLangCode) ||
    SUPPORTED_LANGUAGES[0];

  const handleSelectLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    try {
      localStorage.setItem("hs_language", langCode);
    } catch {
      // localStorage may be disabled
    }
    setIsOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={`hs-lang-selector ${compact ? "hs-lang-compact" : ""} ${className}`}
    >
      <button
        type="button"
        className="hs-lang-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Seleccionar idioma / Select language"
        title={`Idioma actual: ${currentLang.name}`}
      >
        <span className="hs-lang-flag" aria-hidden="true">
          {currentLang.flag}
        </span>
        <span className="hs-lang-code">{currentLang.code.toUpperCase()}</span>
        <svg
          className={`hs-lang-chevron ${isOpen ? "open" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className={`hs-lang-dropdown hs-lang-drop-${direction}`} role="menu">
          <div className="hs-lang-dropdown-header">
            <span>Idioma / Language</span>
          </div>
          <div className="hs-lang-list">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="menuitem"
                  className={`hs-lang-option ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelectLanguage(lang.code)}
                >
                  <span className="hs-lang-option-flag">{lang.flag}</span>
                  <span className="hs-lang-option-name">{lang.name}</span>
                  <span className="hs-lang-option-code">({lang.code.toUpperCase()})</span>
                  {isSelected && (
                    <svg
                      className="hs-lang-check"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
