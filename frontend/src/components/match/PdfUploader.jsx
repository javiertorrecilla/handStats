import { useState } from "react";
import { pdfService } from "../../services/handstatsService";

export default function PdfUploader({
  onParsed,
}) {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Solo se aceptan archivos PDF.");
      return;
    }

    setFileName(file.name);
    setError("");
    setLoading(true);

    try {
      const result = await pdfService.parseActa(file);
      onParsed(result);
    } catch (err) {
      console.error(err);
      setError("No se pudo leer el PDF. Intenta añadir los jugadores manualmente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pdf-uploader">

      <label className="pdf-upload-label">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="pdf-input-hidden"
        />

        <div className="pdf-upload-box">
          <span className="pdf-icon">📄</span>

          {loading ? (
            <span>Leyendo PDF...</span>
          ) : fileName ? (
            <span>{fileName}</span>
          ) : (
            <span>Subir acta PDF</span>
          )}
        </div>
      </label>

      {error && (
        <p className="pdf-error">{error}</p>
      )}

    </div>
  );
}
