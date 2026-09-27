import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { pdfService } from "../../services/handstatsService";

const IconUploadCloud = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M12 12v9" />
    <path d="m16 16-4-4-4 4" />
  </svg>
);

const IconCheckCircle = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconAlertCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconSparkles = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
  </svg>
);

export default function PdfUploader({ onParsed }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parsedSummary, setParsedSummary] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const processFile = async (file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError(t("pdf_uploader.invalid_file_error"));
      return;
    }

    setFileName(file.name);
    setError("");
    setLoading(true);
    setParsedSummary(null);

    try {
      const result = await pdfService.parseActa(file);
      const homeCount = result.home_players?.length || 0;
      const awayCount = result.away_players?.length || 0;

      setParsedSummary({
        homeTeam: result.home_team,
        awayTeam: result.away_team,
        homeCount,
        awayCount
      });

      onParsed(result);
    } catch (err) {
      console.error(err);
      setError(t("pdf_uploader.parse_error"));
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="pdf-uploader-wrapper">
      <div
        className={`pdf-dropzone ${isDragging ? "dragging" : ""} ${loading ? "loading" : ""} ${parsedSummary ? "success" : ""} ${error ? "has-error" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !loading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="pdf-input-hidden"
          disabled={loading}
        />

        <div className="pdf-dropzone-content">
          {loading ? (
            <div className="pdf-status-loading">
              <div className="pdf-spinner" />
              <div className="pdf-loading-text">
                <strong>{t("pdf_uploader.analyzing_title")}</strong>
                <span>{t("pdf_uploader.analyzing_subtitle")}</span>
              </div>
            </div>
          ) : parsedSummary ? (
            <div className="pdf-status-success">
              <div className="pdf-success-icon-wrap">
                <IconCheckCircle />
              </div>
              <div className="pdf-success-info">
                <div className="pdf-file-title">
                  <strong>{fileName}</strong>
                  <span className="pdf-badge-success">{t("pdf_uploader.parsed_badge")}</span>
                </div>
                <p className="pdf-summary-text">
                  {t("pdf_uploader.players_summary", {
                    home: parsedSummary.homeTeam || t("common.home"),
                    homeCount: parsedSummary.homeCount,
                    away: parsedSummary.awayTeam || t("common.away"),
                    awayCount: parsedSummary.awayCount
                  })}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm pdf-change-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                {t("pdf_uploader.change_pdf")}
              </button>
            </div>
          ) : (
            <div className="pdf-status-idle">
              <div className="pdf-upload-icon-container">
                <IconUploadCloud />
              </div>
              <div className="pdf-idle-text">
                <div className="pdf-idle-headline">
                  <strong>{t("pdf_uploader.drag_headline")}</strong>
                  <span className="pdf-browse-link">{t("pdf_uploader.browse_link")}</span>
                </div>
                <p className="pdf-idle-sub">
                  {t("pdf_uploader.drag_sub")}
                </p>
              </div>
              <div className="pdf-ai-tag">
                <IconSparkles /> {t("pdf_uploader.smart_reading")}
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="pdf-error-banner">
          <IconAlertCircle />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
