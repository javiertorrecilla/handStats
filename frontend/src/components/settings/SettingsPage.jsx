import React, { useState, useEffect, useMemo } from "react";
import {
  getSettings,
  saveSettings,
  resetSettings,
  calculateUserEmpiricalXG,
  DEFAULT_SETTINGS
} from "../../services/settingsService";
import {
  IconTarget,
  IconGlove,
  IconStar,
  IconSliders
} from "../../stats/components/common/Icons";
import "./SettingsPage.css";

const IconSave = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const IconRefresh = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16 }}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const IconInfo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16, verticalAlign: "middle", marginRight: 6 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const IconZap = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 16, height: 16, verticalAlign: "middle", marginRight: 6 }}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export default function SettingsPage({ matchesList = [] }) {
  const [activeTab, setActiveTab] = useState("xg"); // "xg" | "xsaves" | "rating"
  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setForm(getSettings());
  }, []);

  // Calcular estadísticas empíricas del usuario sobre sus partidos registrados
  const empiricalData = useMemo(() => {
    return calculateUserEmpiricalXG(matchesList);
  }, [matchesList]);

  const handleChange = (field, value) => {
    setSavedSuccess(false);
    setForm((prev) => ({
      ...prev,
      [field]: typeof value === "number" ? value : parseFloat(value) || 0
    }));
  };

  const handleToggleAutoMode = (enabled) => {
    setSavedSuccess(false);
    const updated = { ...form, autoEmpiricalMode: enabled };
    setForm(updated);
    saveSettings(updated);
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    saveSettings(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleReset = () => {
    if (!confirm("¿Deseas restablecer todos los parámetros a sus valores predeterminados?")) return;
    const defaults = resetSettings();
    setForm(defaults);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const tabs = [
    { id: "xg", icon: <IconTarget size={16} />, label: "xGoals" },
    { id: "xsaves", icon: <IconGlove size={16} />, label: "xSaves" }
  ];

  const categoriesList = [
    { key: "7m", label: "Penalti 7m", paramKey: "xg7m", defaultVal: 0.75 },
    { key: "counter", label: "Contraataque / 1ª Oleada", paramKey: "xgCounter", defaultVal: 0.80 },
    { key: "pivot", label: "Pivote (6m)", paramKey: "xgPivot", defaultVal: 0.72 },
    { key: "penetration", label: "Penetración (6m)", paramKey: "xgPenetration", defaultVal: 0.64 },
    { key: "wing", label: "Extremo (6m)", paramKey: "xgWing", defaultVal: 0.56 },
    { key: "9m", label: "Primera Línea / 9m", paramKey: "xg9m", defaultVal: 0.34 },
  ];

  const goalZoneLabels = {
    TL: "Sup. Izq", TC: "Sup. Cen", TR: "Sup. Der",
    ML: "Med. Izq", C: "Centro", MR: "Med. Der",
    BL: "Inf. Izq", BC: "Inf. Cen", BR: "Inf. Der"
  };

  const isAutoActive = form.autoEmpiricalMode && empiricalData.isEligible;

  return (
    <div className="settings-page">
      {/* ENCABEZADO PRINCIPAL DE LA PÁGINA */}
      <div className="settings-header">
        <div>
          <h2>
            <IconSliders size={22} />
            <span>Ajustes de Parámetros Tácticos</span>
          </h2>
          <p className="settings-subtitle">
            Calibración de algoritmos analíticos, modelos xG/xSaves empíricos y cálculo de valoraciones.
          </p>
        </div>

        <div className="settings-header-actions">
          <button type="button" className="btn btn-secondary" onClick={handleReset}>
            <IconRefresh />
            <span>Restablecer</span>
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            <IconSave />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>

      {/* MENSAJE DE NOTIFICACIÓN DE ÉXITO */}
      {savedSuccess && (
        <div className="settings-alert-success">
          ✓ Configuración actualizada correctamente. Los nuevos parámetros se han aplicado a los motores analíticos de HandStats.
        </div>
      )}

      {/* BOTONERA NAVEGABLE ENTRE SECCIONES DE CONFIGURACIÓN */}
      <div className="settings-tabs-bar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`settings-tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* CONTENIDO EDITABLE SEGÚN EL SUB-MÓDULO SELECCIONADO */}
      <form onSubmit={handleSave} className="settings-form-container">
        {/* SECCIÓN 1: xGoals */}
        {activeTab === "xg" && (
          <div className="hs-card settings-card">
            <div className="settings-card-header">
              <div className="settings-card-header-avatar">
                <IconTarget size={20} />
              </div>
              <div>
                <h4 className="hs-card-title" style={{ margin: 0 }}>MODELO DE EXPECTED GOALS (xGOALS)</h4>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", fontWeight: 500 }}>
                  Calibración empírica y probabilidades calculadas por posición y cuadrante 3x3
                </span>
              </div>
            </div>

            {/* PANEL DE CALIBRACIÓN EMPÍRICA AUTOMÁTICA */}
            <div className={`empirical-status-panel ${isAutoActive ? "active" : "pending"}`}>
              <div className="empirical-status-header">
                <div>
                  <span className="empirical-badge">
                    <IconZap />
                    {isAutoActive ? "CALIBRACIÓN EMPÍRICA AUTOMÁTICA ACTIVA" : "MODO DE CALIBRACIÓN POR TIROS REALES"}
                  </span>
                  <p className="empirical-status-subtext">
                    {empiricalData.isEligible
                      ? `Basada en ${empiricalData.totalShots} lanzamientos reales de tus partidos. Próxima actualización automática (+25% volumen) a los ${empiricalData.nextCheckpoint} tiros (Faltan ${empiricalData.shotsUntilNextRecalc} tiros).`
                      : `Acumula 500 lanzamientos en HandStats para activar el recalibrado automático con tus datos reales. Proceso actual: ${empiricalData.totalShots} / 500 tiros (Faltan ${500 - empiricalData.totalShots} tiros).`}
                  </p>
                </div>

                <div className="empirical-toggle-box">
                  <button
                    type="button"
                    className={`btn btn-sm ${form.autoEmpiricalMode ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => handleToggleAutoMode(true)}
                  >
                    Automático (Empírico)
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${!form.autoEmpiricalMode ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => handleToggleAutoMode(false)}
                  >
                    Manual
                  </button>
                </div>
              </div>

              {/* BARRA DE PROGRESO HACIA LOS 500 O SIGUIENTE HITO DE +25% */}
              <div className="empirical-progress-container">
                <div className="empirical-progress-label">
                  <span>Progreso de tiros registrados en partidos</span>
                  <strong>{empiricalData.totalShots} tiros</strong>
                </div>
                <div className="empirical-progress-bar">
                  <div
                    className="empirical-progress-fill"
                    style={{
                      width: `${Math.min(100, Math.round((empiricalData.totalShots / (empiricalData.isEligible ? empiricalData.nextCheckpoint : 500)) * 100))}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* CAJA EXPLICATIVA CON LA FÓRMULA DE xG Y EL SISTEMA EMPÍRICO */}
            <div className="formula-callout-box">
              <div className="formula-header-banner">
                <div className="formula-title-badge">
                  <IconInfo /> MODELO Y SISTEMA DE CALIBRACIÓN AUTOMÁTICA
                </div>
                <span className="formula-subtitle-tag">Hitos Incrementales +25%</span>
              </div>

              {/* FILA DE TARJETAS DE FÓRMULAS */}
              <div className="formula-cards-row">
                <div className="formula-card">
                  <span className="formula-card-title">1. Probabilidad Base xG</span>
                  <div className="formula-card-code">
                    Goles en Posición / Tiros Totales
                  </div>
                </div>
                <div className="formula-card">
                  <span className="formula-card-title">2. Modificador Zona 3x3</span>
                  <div className="formula-card-code">
                    Efectividad Zona - Efec. Global
                  </div>
                </div>
                <div className="formula-card">
                  <span className="formula-card-title">3. Hitos Recalibración (+25%)</span>
                  <div className="formula-card-code">
                    500 → 625 → 782 → 977 → 1221...
                  </div>
                </div>
              </div>

              {/* BLOQUE EXPLICATIVO INFERIOR */}
              <div className="formula-explanation-block">
                <p>
                  <strong>¿Cómo funciona la autocalibración proporcional por volumen?</strong> Al alcanzar <strong>500 lanzamientos</strong>, HandStats activa un modelo empírico basado en tus propios datos. A partir de ese momento, el modelo se <strong>recalibra automáticamente</strong> cada vez que el número total de lanzamientos aumenta un <strong>25%</strong> respecto a la última actualización (500, 625, 782, 977, 1221 tiros...). En cada recalibración se utilizan todos los <strong>datos acumulados</strong>, permitiendo que las probabilidades de gol se <strong>ajusten progresivamente y ganen precisión y estabilidad</strong> conforme aumenta la muestra disponible.
                </p>
              </div>
            </div>

            {/* BLOQUE PARALELO LADO A LADO: MARCO 3X3 DE PORTERÍA (IZQ) Y TABLA DESGLOSADA (DER) */}
            <div className="empirical-side-by-side-grid">
              {/* COLUMNA IZQUIERDA: MARCO DE PORTERÍA 3X3 */}
              <div className="empirical-breakdown-card" style={{ marginTop: 0 }}>
                <h5 style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: "var(--text-primary)", textTransform: "uppercase", marginBottom: "var(--space-12)", textAlign: "center" }}>
                  MODIFICADORES POR ZONA (MARCO 3X3)
                </h5>

                <div className="empirical-goal-grid-3x3" style={{ maxWidth: "540px", margin: "0 auto" }}>
                  {["TL", "TC", "TR", "ML", "C", "MR", "BL", "BC", "BR"].map((zKey) => {
                    const zData = empiricalData.zoneCounts[zKey] || { shots: 0, goals: 0 };
                    const modVal = empiricalData.zoneModifiers[zKey] ?? 0;
                    const ratePct = zData.shots > 0 ? Math.round((zData.goals / zData.shots) * 100) : 0;

                    const isPositive = modVal > 0;
                    const isNegative = modVal < 0;

                    return (
                      <div
                        key={zKey}
                        className="empirical-goal-cell-3x3"
                        style={{
                          border: `1px solid ${isPositive ? "rgba(16, 185, 129, 0.4)" : isNegative ? "rgba(239, 68, 68, 0.4)" : "var(--border-color)"}`,
                          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, var(--bg-surface) 100%)",
                          padding: "12px 8px"
                        }}
                      >
                        <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
                          {goalZoneLabels[zKey]}
                        </span>
                        <span style={{ fontSize: "14px", fontWeight: 900, fontFamily: "var(--font-mono)", margin: "3px 0", color: "var(--color-primary)" }}>
                          {zData.goals}/{zData.shots} Goles
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--text-primary)" }}>
                          Eficacia: {ratePct}%
                        </span>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: isPositive ? "var(--color-primary)" : isNegative ? "var(--color-danger)" : "var(--text-muted)", marginTop: "3px" }}>
                          {modVal > 0 ? `+${modVal} xG` : `${modVal} xG`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* COLUMNA DERECHA: TABLA DESGLOSADA DE EFECTIVIDAD SIN SCROLL */}
              <div className="empirical-breakdown-card empirical-table-card-expanded" style={{ marginTop: 0 }}>
                <h5 style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: "var(--text-primary)", textTransform: "uppercase", marginBottom: "var(--space-12)" }}>
                  HISTORIAL Y EFECTIVIDAD EMPÍRICA POR TIPO DE TIRO
                </h5>

                <div className="empirical-full-height-table-container">
                  <table className="empirical-full-height-table">
                    <thead>
                      <tr>
                        <th>Tipo Lanzamiento</th>
                        <th>Tiros</th>
                        <th>Goles</th>
                        <th>xG Base</th>
                        <th>xSaves</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoriesList.map((cat) => {
                        const data = empiricalData.counts[cat.key];
                        const empiricalVal = data.shots >= 5 ? Math.round((data.goals / data.shots) * 100) / 100 : cat.defaultVal;
                        const empiricalSaveVal = Math.round((1 - empiricalVal) * 100) / 100;

                        return (
                          <tr key={cat.key}>
                            <td><strong>{cat.label}</strong></td>
                            <td>{data.shots}</td>
                            <td>{data.goals}</td>
                            <td><strong>{data.shots >= 5 ? `${Math.round(empiricalVal * 100)}%` : "—"}</strong></td>
                            <td><span style={{ color: "var(--color-primary)", fontWeight: 700 }}>{data.shots >= 5 ? `${Math.round(empiricalSaveVal * 100)}%` : "—"}</span></td>
                            <td>
                              <span className={`empirical-tag-status ${isAutoActive && data.shots >= 5 ? "auto" : "manual"}`}>
                                {isAutoActive && data.shots >= 5 ? `Empírico` : `Manual`}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* CONFIGURACIÓN MANUAL DE PESOS */}
            <h5 style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: "var(--text-primary)", textTransform: "uppercase", marginTop: "var(--space-16)", marginBottom: "var(--space-8)" }}>
              AJUSTE MANUAL DE VALORES BASE xG
            </h5>

            <div className="settings-inputs-grid">
              <div className="form-group">
                <label>Lanzamiento de 7m (Penalti)</label>
                <div className="input-group-unit">
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    max="1.0"
                    className="input-field"
                    value={form.xg7m}
                    onChange={(e) => handleChange("xg7m", e.target.value)}
                  />
                  <span className="unit-tag">xG</span>
                </div>
              </div>

              <div className="form-group">
                <label>Contraataque / 1ª Oleada</label>
                <div className="input-group-unit">
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    max="1.0"
                    className="input-field"
                    value={form.xgCounter}
                    onChange={(e) => handleChange("xgCounter", e.target.value)}
                  />
                  <span className="unit-tag">xG</span>
                </div>
              </div>

              <div className="form-group">
                <label>Tiro de Pivote (6m)</label>
                <div className="input-group-unit">
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    max="1.0"
                    className="input-field"
                    value={form.xgPivot}
                    onChange={(e) => handleChange("xgPivot", e.target.value)}
                  />
                  <span className="unit-tag">xG</span>
                </div>
              </div>

              <div className="form-group">
                <label>Tiro de Penetración (6m)</label>
                <div className="input-group-unit">
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    max="1.0"
                    className="input-field"
                    value={form.xgPenetration}
                    onChange={(e) => handleChange("xgPenetration", e.target.value)}
                  />
                  <span className="unit-tag">xG</span>
                </div>
              </div>

              <div className="form-group">
                <label>Tiro de Extremo (6m)</label>
                <div className="input-group-unit">
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    max="1.0"
                    className="input-field"
                    value={form.xgWing}
                    onChange={(e) => handleChange("xgWing", e.target.value)}
                  />
                  <span className="unit-tag">xG</span>
                </div>
              </div>

              <div className="form-group">
                <label>Primera Línea / Distancia (9m)</label>
                <div className="input-group-unit">
                  <input
                    type="number"
                    step="0.01"
                    min="0.05"
                    max="1.0"
                    className="input-field"
                    value={form.xg9m}
                    onChange={(e) => handleChange("xg9m", e.target.value)}
                  />
                  <span className="unit-tag">xG</span>
                </div>
              </div>

              <div className="form-group">
                <label>Bonus Superioridad Numérica (+)</label>
                <div className="input-group-unit">
                  <input
                    type="number"
                    step="0.01"
                    min="0.0"
                    max="0.3"
                    className="input-field"
                    value={form.xgSuperiorityBonus}
                    onChange={(e) => handleChange("xgSuperiorityBonus", e.target.value)}
                  />
                  <span className="unit-tag">+xG</span>
                </div>
              </div>

              <div className="form-group">
                <label>Penalización Inferioridad (-)</label>
                <div className="input-group-unit">
                  <input
                    type="number"
                    step="0.01"
                    min="0.0"
                    max="0.3"
                    className="input-field"
                    value={form.xgInferiorityPenalty}
                    onChange={(e) => handleChange("xgInferiorityPenalty", e.target.value)}
                  />
                  <span className="unit-tag">-xG</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN 2: xSaves */}
        {activeTab === "xsaves" && (
          <div className="hs-card settings-card">
            <div className="settings-card-header">
              <div className="settings-card-header-avatar">
                <IconGlove size={20} />
              </div>
              <div>
                <h4 className="hs-card-title" style={{ margin: 0 }}>EXPECTED SAVES (xSAVES) & MODIFICADOR DE PORTERÍA</h4>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", fontWeight: 500 }}>
                  Modificador empírico por cuadrante (3x3) y paradas esperadas del portero
                </span>
              </div>
            </div>

            {/* CAJA EXPLICATIVA CON LA FÓRMULA DE xSaves Y MODIFICADOR DE PORTERÍA POR ZONA 3X3 */}
            <div className="formula-callout-box">
              <div className="formula-header-banner">
                <div className="formula-title-badge">
                  <IconInfo /> MODELO DE PORTERÍA Y MODIFICADOR DE CUADRANTES (3X3)
                </div>
                <span className="formula-subtitle-tag">xSaves = (1 - xG) + Modificadores</span>
              </div>

              {/* FILA DE TARJETAS DE FÓRMULAS */}
              <div className="formula-cards-row">
                <div className="formula-card">
                  <span className="formula-card-title">1. xSaves por Zona (z)</span>
                  <div className="formula-card-code">
                    (1 - xG) + ModificadorZona(z)
                  </div>
                </div>
                <div className="formula-card">
                  <span className="formula-card-title">2. Modificador Portería (z)</span>
                  <div className="formula-card-code">
                    TasaParadas(z) - TasaGlobal
                  </div>
                </div>
                <div className="formula-card">
                  <span className="formula-card-title">3. Evaluación Cuadrantes</span>
                  <div className="formula-card-code">
                    Desviación vs Eficiencia Global
                  </div>
                </div>
              </div>

              {/* BLOQUE EXPLICATIVO INFERIOR */}
              <div className="formula-explanation-block">
                <p>
                  Las paradas esperadas del portero se calculan como <strong>(1 - xG) + ModificadorZonaXSaves</strong>. El <strong>Modificador de Portería por Zona 3x3</strong> evalúa el rendimiento empírico del portero en cada cuadrante de la portería (diferenciando por ejemplo entre <strong>Arriba al Centro TC</strong> y <strong>Abajo al Centro BC</strong>) restando su porcentaje de paradas reales en ese cuadrante respecto a su efectividad global.
                </p>
              </div>
            </div>

            {/* MARCO DE PORTERÍA 3X3 CON VALORES xSAVES Y MODIFICADORES AUTOMÁTICOS */}
            <div style={{ marginTop: "var(--space-12)" }}>
              <div className="empirical-breakdown-card" style={{ marginTop: 0 }}>
                <h5 style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: "var(--text-primary)", textTransform: "uppercase", marginBottom: "var(--space-12)", textAlign: "center" }}>
                  MODIFICADORES DE PORTERÍA POR CUADRANTE (MARCO 3X3)
                </h5>

                <div className="empirical-goal-grid-3x3" style={{ maxWidth: "540px", margin: "0 auto" }}>
                  {["TL", "TC", "TR", "ML", "C", "MR", "BL", "BC", "BR"].map((zKey) => {
                    const zData = empiricalData.zoneCounts[zKey] || { shots: 0, goals: 0 };
                    const saves = Math.max(0, zData.shots - zData.goals);
                    const modXSaves = empiricalData.zoneXSavesModifiers[zKey] ?? 0;
                    const xSaveEmpiricalVal = empiricalData.zoneXSaves[zKey] ?? 0.40;
                    const xSavePct = Math.round(xSaveEmpiricalVal * 100);

                    const isPositive = modXSaves > 0;
                    const isNegative = modXSaves < 0;

                    return (
                      <div
                        key={zKey}
                        className="empirical-goal-cell-3x3"
                        style={{
                          border: `1px solid ${isPositive ? "rgba(16, 185, 129, 0.4)" : isNegative ? "rgba(239, 68, 68, 0.4)" : "var(--border-color)"}`,
                          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, var(--bg-surface) 100%)",
                          padding: "12px 8px"
                        }}
                      >
                        <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
                          {goalZoneLabels[zKey]}
                        </span>
                        <span style={{ fontSize: "14px", fontWeight: 900, fontFamily: "var(--font-mono)", margin: "3px 0", color: "var(--color-primary)" }}>
                          {saves}/{zData.shots} Paradas
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--text-primary)" }}>
                          xSaves: {xSavePct}%
                        </span>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: isPositive ? "var(--color-primary)" : isNegative ? "var(--color-danger)" : "var(--text-muted)", marginTop: "3px" }}>
                          {modXSaves > 0 ? `+${modXSaves} xSaves` : `${modXSaves} xSaves`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ACCIONES INFERIORES DE FORMULARIO */}
        <div className="settings-footer-actions">
          <button type="button" className="btn btn-secondary" onClick={handleReset}>
            <IconRefresh />
            <span>Restablecer Todo</span>
          </button>
          <button type="submit" className="btn btn-primary">
            <IconSave />
            <span>Guardar Ajustes</span>
          </button>
        </div>
      </form>
    </div>
  );
}
