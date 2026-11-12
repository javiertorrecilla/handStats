import React from "react";
import { captureError } from "../../services/errorTrackingService";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || "Unexpected application error"
    };
  }

  componentDidCatch(error, errorInfo) {
    captureError(error, {
      source: "react_error_boundary",
      componentStack: errorInfo?.componentStack,
      fatal: true
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background: "var(--bg-canvas, #0f172a)",
          color: "var(--text-primary, #f8fafc)"
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: "100%",
            padding: 28,
            borderRadius: 16,
            background: "var(--bg-surface, #1e293b)",
            border: "1px solid var(--border-color, rgba(255,255,255,0.12))",
            textAlign: "center",
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.25)"
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>Handtix</div>
          <h2 style={{ margin: "0 0 8px", fontSize: "1.2rem" }}>
            Se ha producido un error inesperado
          </h2>
          <p style={{ margin: "0 0 20px", fontSize: "0.9rem", color: "var(--text-muted, #94a3b8)" }}>
            El incidente se ha registrado automáticamente en nuestro sistema de diagnóstico para resolverlo lo antes posible.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button type="button" className="btn btn-primary" onClick={this.handleReload}>
              Recargar aplicación
            </button>
            <button type="button" className="btn btn-secondary" onClick={this.handleGoHome}>
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;

