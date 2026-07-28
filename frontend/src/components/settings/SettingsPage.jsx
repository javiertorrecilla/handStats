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
    { id: "xsaves", icon: <IconGlove size={16} />, label: "xSaves" },
    { id: "rating", icon: <IconStar size={16} />, label: "Acciones y Valoraciones para Rating" },
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
              <IconTarget size={18} className="settings-icon-header" />
              <h4 className="hs-card-title">MODELO DE EXPECTED GOALS (xGOALS)</h4>
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
              <div className="formula-title">
                <IconInfo /> FÓRMULA Y SISTEMA DE CALIBRACIÓN AUTOMÁTICA (500 TIROS + 25% INCREMENTAL)
              </div>
              <div className="formula-math">
                Probabilidad Base xG = Goles Anotados en Posición / Tiros Totales en Posición
                <br />
                Modificador Zona 3x3 = Efectividad Real en Zona - Efectividad Global de Portería
                <br />
                Hitos de Recalibración (+25% Muestra): 500 → 625 → 782 → 977 → 1221 tiros...
              </div>
              <p className="formula-desc">
                <strong>¿Cómo funciona la autocalibración proporcional por volumen?</strong> Al alcanzar <strong>500 lanzamientos</strong>, HandStats activa un modelo empírico basado en tus propios datos. A partir de ese momento, el modelo se <strong>recalibra automáticamente</strong> cada vez que el número total de lanzamientos aumenta un <strong>25%</strong> respecto a la última actualización (500, 625, 782, 977, 1221 tiros...). En cada recalibración se utilizan todos los <strong>datos acumulados</strong>, permitiendo que las probabilidades de gol se <strong>ajusten progresivamente y ganen precisión y estabilidad</strong> conforme aumenta la muestra disponible.
              </p>
            </div>

            {/* BLOQUE PARALELO LADO A LADO: MARCO 3X3 DE PORTERÍA (IZQ) Y TABLA DESGLOSADA (DER) */}
            <div className="empirical-side-by-side-grid">
              {/* COLUMNA IZQUIERDA: MARCO DE PORTERÍA 3X3 */}
              <div className="empirical-breakdown-card" style={{ marginTop: 0 }}>
                <h5 style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: "var(--text-primary)", textTransform: "uppercase", marginBottom: "var(--space-12)", textAlign: "center" }}>
                  MODIFICADORES POR ZONA (MARCO 3X3)
                </h5>

                <div className="empirical-goal-grid-3x3">
                  {["TL", "TC", "TR", "ML", "C", "MR", "BL", "BC", "BR"].map((zKey) => {
                    const zData = empiricalData.zoneCounts[zKey] || { shots: 0, goals: 0 };
                    const modVal = empiricalData.zoneModifiers[zKey] ?? 0;
                    const ratePct = zData.shots > 0 ? Math.round((zData.goals / zData.shots) * 100) : 0;
                    const savePct = 100 - ratePct;

                    const isPositive = modVal > 0;
                    const isNegative = modVal < 0;

                    return (
                      <div
                        key={zKey}
                        className="empirical-goal-cell-3x3"
                        style={{
                          border: `1px solid ${isPositive ? "rgba(16, 185, 129, 0.4)" : isNegative ? "rgba(239, 68, 68, 0.4)" : "var(--border-color)"}`
                        }}
                      >
                        <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
                          {goalZoneLabels[zKey]}
                        </span>
                        <span style={{ fontSize: "14px", fontWeight: 900, fontFamily: "var(--font-mono)", margin: "2px 0" }}>
                          {zData.goals}/{zData.shots} ({ratePct}%)
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 800,
                            color: isPositive ? "var(--color-primary)" : isNegative ? "var(--color-danger)" : "var(--text-muted)"
                          }}
                        >
                          {modVal > 0 ? `+${modVal} xG` : `${modVal} xG`}
                        </span>
                        <span style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "2px" }}>
                          xSaves: {savePct}%
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
              <IconGlove size={18} className="settings-icon-header" />
              <h4 className="hs-card-title">EXPECTED SAVES (xSAVES) Y MODIFICADOR DE PORTERÍA POR ZONA 3X3</h4>
            </div>

            {/* CAJA EXPLICATIVA CON LA FÓRMULA DE xSaves Y MODIFICADOR DE PORTERÍA POR ZONA 3X3 */}
            <div className="formula-callout-box">
              <div className="formula-title">
                <IconInfo /> FÓRMULA EMPÍRICA CON MODIFICADOR POR ZONA 3X3 (xSAVES = 1 - xG + MODIFICADOR_ZONA)
              </div>
              <div className="formula-math">
                xSaves_Zona(z) = (1 - xG) + ModificadorZonaXSaves(z)
                <br />
                ModificadorZonaXSaves(z) = TasaParadasReal(z) - TasaParadasGlobalPortería
              </div>
              <p className="formula-desc">
                Las paradas esperadas del portero se calculan como <strong>1 - xG + ModificadorZonaXSaves</strong>. El <strong>Modificador de Portería por Zona 3x3</strong> evalúa el rendimiento empírico del portero en cada zona de la portería (diferenciando por ejemplo entre <strong>Arriba al Centro TC</strong> y <strong>Abajo al Centro BC</strong>) restando su porcentaje de paradas reales en ese cuadrante respecto a su efectividad global.
              </p>
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

        {/* SECCIÓN 5: ACCIONES Y RATING */}
        {activeTab === "rating" && (
          <div className="hs-card settings-card">
            <div className="settings-card-header">
              <IconStar size={18} className="settings-icon-header" />
              <h4 className="hs-card-title">ACCIONES Y VALORACIONES PARA RATING DE JUGADOR</h4>
            </div>
            <p className="settings-section-desc">
              Configuración y calibración del algoritmo de valoración individual (escala 0.0 a 10.0), basado en Impacto Neto ($NPS$), probabilidades esperadas ($xG/xSaves$) y normalización logística.
            </p>

            {/* EXPLICACIÓN DETALLADA DEL SISTEMA DE RATING */}
            <div className="rating-explanation-card">
              <h5 className="rating-explanation-title">
                <IconInfo /> ¿Cómo se calcula la nota individual de cada jugador?
              </h5>
              <p className="rating-explanation-text">
                El sistema **no cuenta simplemente goles**. En su lugar, calcula el **Impacto Neto del Jugador (NPS)** acumulando el mérito o penalización de cada acción relevante según su dificultad real y su valor táctico. Finalmente, transforma ese NPS acumulado en una **nota entre 0.0 y 10.0** mediante una curva sigmoide centrada en **5.0 para partidos neutros**.
              </p>

              {/* ESCALA DE VALORACIÓN DE REFERENCIA */}
              <div className="rating-scale-badges-grid">
                <div className="rating-scale-badge tier-excellent">
                  <span className="tier-score">9.5 - 10.0</span>
                  <span className="tier-label">Excelente / MVP</span>
                </div>
                <div className="rating-scale-badge tier-very-good">
                  <span className="tier-score">8.0 - 9.4</span>
                  <span className="tier-label">Muy Buen Partido</span>
                </div>
                <div className="rating-scale-badge tier-neutral">
                  <span className="tier-score">5.0</span>
                  <span className="tier-label">Partido Promedio</span>
                </div>
                <div className="rating-scale-badge tier-poor">
                  <span className="tier-score">3.0 - 4.9</span>
                  <span className="tier-label">Partido Flojo</span>
                </div>
                <div className="rating-scale-badge tier-bad">
                  <span className="tier-score">&lt; 3.0</span>
                  <span className="tier-label">Partido Muy Malo</span>
                </div>
              </div>

              {/* PRINCIPIOS MATEMÁTICOS Y REGLAS */}
              <div className="rating-principles-grid">
                <div className="rating-principle-item">
                  <strong>⚽ Goles y Dificultad (xG)</strong>
                  <span>Marcar un tiro difícil (xG = 0.20) aporta mucho más valor (+0.80 × peso) que marcar a puerta vacía (xG = 0.90). Fallar un tiro fácil penaliza fuertemente.</span>
                </div>
                <div className="rating-principle-item">
                  <strong>🛡️ Mérito Defensivo Real</strong>
                  <span>Provocar faltas en ataque y golpes francos suma valor directo. Permite que los especialistas defensivos obtengan notas altas (8.0 - 9.5) sin depender de marcar goles.</span>
                </div>
                <div className="rating-principle-item">
                  <strong>🧤 Portería Basada en xSaves</strong>
                  <span>Las paradas se valoran según el $xG$ del lanzamiento detenido. Parar un tiro de 6m/7m ($xG = 0.85$) concede una valoración máxima.</span>
                </div>
              </div>
            </div>

            {/* FÓRMULA MATEMÁTICA EN CUADRO DESTACADO */}
            <div className="formula-callout-box">
              <div className="formula-title">
                FÓRMULA DE IMPACITO NETO (NPS) Y NORMALIZACIÓN LOGÍSTICA
              </div>
              <div className="formula-math">
                Rating = 10 / (1 + e^(-k × NPS))
                <br />
                NPS = ∑ (Goles × (1 - xG) + Paradas × xG + AccionesDefensivas) - ∑ (Fallos × xG + Pérdidas + Sanciones)
              </div>
              <p className="formula-desc">
                Con $k = 0.35$, un NPS de $0$ otorga una nota exacta de $5.0$. Un NPS de $+4.0$ sube a $8.0$ y un NPS de $+6.3$ alcanza un $9.1$.
              </p>
            </div>

            {/* SECCIONES CONFIGURABLES DE PARÁMETROS */}

            {/* 1. NORMALIZACIÓN Y SENSIBILIDAD */}
            <div className="rating-category-block">
              <h5 className="rating-category-title">1. Escalado & Sensibilidad Sigmoide</h5>
              <div className="settings-inputs-grid">
                <div className="form-group">
                  <label>Factor de Sensibilidad (k)</label>
                  <div className="input-group-unit">
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="1.0"
                      className="input-field"
                      value={form.sigmoidK ?? 0.35}
                      onChange={(e) => handleChange("sigmoidK", e.target.value)}
                    />
                    <span className="unit-tag">k</span>
                  </div>
                  <span className="param-item-hint">Pendiente de la curva. Ajusta la velocidad de subida/bajada de la nota.</span>
                </div>

                <div className="form-group">
                  <label>Nota para Partido Neutro (NPS = 0)</label>
                  <div className="input-group-unit">
                    <input
                      type="number"
                      step="0.1"
                      min="4.0"
                      max="6.0"
                      className="input-field"
                      value={form.neutralRating ?? 5.0}
                      onChange={(e) => handleChange("neutralRating", e.target.value)}
                    />
                    <span className="unit-tag">pts</span>
                  </div>
                  <span className="param-item-hint">Nota asignada por defecto a un rendimiento neutro o de nivel medio.</span>
                </div>
              </div>
            </div>

            {/* 2. ATAQUE Y LANZAMIENTOS */}
            <div className="rating-category-block">
              <h5 className="rating-category-title">2. Ataque & Lanzamientos (Ponderados por xG)</h5>
              <div className="settings-inputs-grid">
                <div className="form-group">
                  <label>Peso Gol Anotado [ × (1 - xG) ]</label>
                  <div className="input-group-unit">
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="3.0"
                      className="input-field"
                      value={form.w_goal ?? 1.50}
                      onChange={(e) => handleChange("w_goal", e.target.value)}
                    />
                    <span className="unit-tag">peso</span>
                  </div>
                  <span className="param-item-hint">Impacto positivo base por marcar gol, escalado inversamente a su xG.</span>
                </div>

                <div className="form-group">
                  <label>Penalización Parada Sufrida [ × xG ]</label>
                  <div className="input-group-unit">
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="3.0"
                      className="input-field"
                      value={form.w_miss_saved ?? 1.20}
                      onChange={(e) => handleChange("w_miss_saved", e.target.value)}
                    />
                    <span className="unit-tag">peso</span>
                  </div>
                  <span className="param-item-hint">Penalización por tiro detenido a puerta, proporcional a la facilidad (xG).</span>
                </div>

                <div className="form-group">
                  <label>Penalización Tiro Fuera / Poste [ × xG ]</label>
                  <div className="input-group-unit">
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="3.0"
                      className="input-field"
                      value={form.w_miss_off ?? 1.40}
                      onChange={(e) => handleChange("w_miss_off", e.target.value)}
                    />
                    <span className="unit-tag">peso</span>
                  </div>
                  <span className="param-item-hint">Penalización por tirar fuera sin forzar intervención del portero rival.</span>
                </div>

                <div className="form-group">
                  <label>Puntuación Provocar Penalti 7m</label>
                  <div className="input-group-unit">
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="3.0"
                      className="input-field"
                      value={form.w_drawn_7m ?? 1.10}
                      onChange={(e) => handleChange("w_drawn_7m", e.target.value)}
                    />
                    <span className="unit-tag">peso</span>
                  </div>
                  <span className="param-item-hint">Valoración positiva por generar una ocasión clarísima de 7m en ataque.</span>
                </div>
              </div>
            </div>

            {/* 3. PÉRDIDAS DE BALÓN SEGMENTADAS */}
            <div className="rating-category-block">
              <h5 className="rating-category-title">3. Pérdidas de Balón Segmentadas</h5>
              <div className="settings-inputs-grid">
                <div className="form-group">
                  <label>Penalización Mal Pase</label>
                  <div className="input-group-unit">
                    <input
                      type="number"
                      step="0.1"
                      min="0.2"
                      max="2.5"
                      className="input-field"
                      value={form.w_turnover_bad_pass ?? 1.00}
                      onChange={(e) => handleChange("w_turnover_bad_pass", e.target.value)}
                    />
                    <span className="unit-tag">peso</span>
                  </div>
                  <span className="param-item-hint">Balón regregalado que suele conceder contraataque directo al rival.</span>
                </div>

                <div className="form-group">
                  <label>Penalización Dobles</label>
                  <div className="input-group-unit">
                    <input
                      type="number"
                      step="0.1"
                      min="0.2"
                      max="2.5"
                      className="input-field"
                      value={form.w_turnover_double ?? 0.80}
                      onChange={(e) => handleChange("w_turnover_double", e.target.value)}
                    />
                    <span className="unit-tag">peso</span>
                  </div>
                  <span className="param-item-hint">Infracción técnica no forzada en el bote de balón.</span>
                </div>

                <div className="form-group">
                  <label>Penalización Pasos</label>
                  <div className="input-group-unit">
                    <input
                      type="number"
                      step="0.1"
                      min="0.2"
                      max="2.5"
                      className="input-field"
                      value={form.w_turnover_travel ?? 0.80}
                      onChange={(e) => handleChange("w_turnover_travel", e.target.value)}
                    />
                    <span className="unit-tag">peso</span>
                  </div>
                  <span className="param-item-hint">Infracción técnica en la circulación o penetración.</span>
                </div>

                <div className="form-group">
                  <label>Penalización Pasivo</label>
                  <div className="input-group-unit">
                    <input
                      type="number"
                      step="0.1"
                      min="0.2"
                      max="2.5"
                      className="input-field"
                      value={form.w_turnover_passive ?? 0.90}
                      onChange={(e) => handleChange("w_turnover_passive", e.target.value)}
                    />
                    <span className="unit-tag">peso</span>
                  </div>
                  <span className="param-item-hint">Agotamiento del tiempo de ataque sin generar ocasión ni tiro.</span>
                </div>

                <div className="form-group">
                  <label>Penalización Falta en Ataque Cometida</label>
                  <div className="input-group-unit">
                    <input
                      type="number"
                      step="0.1"
                      min="0.2"
                      max="2.5"
                      className="input-field"
                      value={form.w_turnover_offensive_foul ?? 1.10}
                      onChange={(e) => handleChange("w_turnover_offensive_foul", e.target.value)}
                    />
                    <span className="unit-tag">peso</span>
                  </div>
                  <span className="param-item-hint">Infracción al chocar contra el defensor que anula el ataque.</span>
                </div>
              </div>
            </div>

            {/* 4. ACCIONES DEFENSIVAS */}
            <div className="rating-category-block">
              <h5 className="rating-category-title">4. Acciones Defensivas</h5>
              <div className="settings-inputs-grid">
                <div className="form-group">
                  <label>Puntuación Provocar Golpe Franco</label>
                  <div className="input-group-unit">
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="1.5"
                      className="input-field"
                      value={form.w_def_free_throw ?? 0.30}
                      onChange={(e) => handleChange("w_def_free_throw", e.target.value)}
                    />
                    <span className="unit-tag">peso</span>
                  </div>
                  <span className="param-item-hint">Frena el ritmo del rival y permite ajustar el bloque defensivo.</span>
                </div>

                <div className="form-group">
                  <label>Puntuación Provocar Falta en Ataque</label>
                  <div className="input-group-unit">
                    <input
                      type="number"
                      step="0.1"
                      min="0.3"
                      max="2.5"
                      className="input-field"
                      value={form.w_def_drawn_off_foul ?? 1.10}
                      onChange={(e) => handleChange("w_def_drawn_off_foul", e.target.value)}
                    />
                    <span className="unit-tag">peso</span>
                  </div>
                  <span className="param-item-hint">Recuperación neta de posesión en defensa (equivalente a un robo).</span>
                </div>

                <div className="form-group">
                  <label>Penalización Cometer Penalti 7m</label>
                  <div className="input-group-unit">
                    <input
                      type="number"
                      step="0.1"
                      min="0.3"
                      max="2.5"
                      className="input-field"
                      value={form.w_def_committed_7m ?? 1.10}
                      onChange={(e) => handleChange("w_def_committed_7m", e.target.value)}
                    />
                    <span className="unit-tag">peso</span>
                  </div>
                  <span className="param-item-hint">Penalización por conceder una opción de gol clara de 7m en defensa.</span>
                </div>
              </div>
            </div>

            {/* 5. ACTUACIÓN DE PORTERÍA */}
            <div className="rating-category-block">
              <h5 className="rating-category-title">5. Actuación de Portería (Ponderada por xG)</h5>
              <div className="settings-inputs-grid">
                <div className="form-group">
                  <label>Puntuación Parada Portero [ × xG ]</label>
                  <div className="input-group-unit">
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="3.0"
                      className="input-field"
                      value={form.w_gk_save ?? 1.50}
                      onChange={(e) => handleChange("w_gk_save", e.target.value)}
                    />
                    <span className="unit-tag">peso</span>
                  </div>
                  <span className="param-item-hint">Valoración positiva multiplicada directamente por la dificultad del tiro (xG).</span>
                </div>

                <div className="form-group">
                  <label>Penalización Gol Encajado [ × (1 - xG) ]</label>
                  <div className="input-group-unit">
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="3.0"
                      className="input-field"
                      value={form.w_gk_conceded ?? 1.00}
                      onChange={(e) => handleChange("w_gk_conceded", e.target.value)}
                    />
                    <span className="unit-tag">peso</span>
                  </div>
                  <span className="param-item-hint">Penalización multiplicada por (1 - xG). Encajar tiros lejanos resta más.</span>
                </div>
              </div>
            </div>

            {/* 6. DISCIPLINA Y SANCIONES */}
            <div className="rating-category-block">
              <h5 className="rating-category-title">6. Disciplina & Sanciones Disciplinarias</h5>
              <div className="settings-inputs-grid">
                <div className="form-group">
                  <label>Penalización Tarjeta Amarilla</label>
                  <div className="input-group-unit">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="1.5"
                      className="input-field"
                      value={form.w_yellow_card ?? 0.40}
                      onChange={(e) => handleChange("w_yellow_card", e.target.value)}
                    />
                    <span className="unit-tag">peso</span>
                  </div>
                  <span className="param-item-hint">Amonestación verbal o tarjeta reglamentaria sin inferioridad.</span>
                </div>

                <div className="form-group">
                  <label>Penalización Exclusión 2 Minutos</label>
                  <div className="input-group-unit">
                    <input
                      type="number"
                      step="0.1"
                      min="0.3"
                      max="3.0"
                      className="input-field"
                      value={form.w_two_min ?? 1.20}
                      onChange={(e) => handleChange("w_two_min", e.target.value)}
                    />
                    <span className="unit-tag">peso</span>
                  </div>
                  <span className="param-item-hint">Deja al equipo en inferioridad numérica durante 2 minutos (-1 jugador).</span>
                </div>

                <div className="form-group">
                  <label>Penalización Tarjeta Roja / Azul</label>
                  <div className="input-group-unit">
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="5.0"
                      className="input-field"
                      value={form.w_red_card ?? 2.50}
                      onChange={(e) => handleChange("w_red_card", e.target.value)}
                    />
                    <span className="unit-tag">peso</span>
                  </div>
                  <span className="param-item-hint">Expulsión definitiva del partido; perjuicio máximo al equipo.</span>
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
