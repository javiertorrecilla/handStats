import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../common/LanguageSelector";
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

const IconGoalkeeperHand = ({ size = 26, color = "var(--color-primary, #44D878)" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: size, height: size, flexShrink: 0 }}
  >
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4" />
    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v7" />
    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
    <path d="M6 14v-1.5a1.5 1.5 0 0 0-3 0V16a7 7 0 0 0 7 7h3a7 7 0 0 0 7-7v-3a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v2" />
  </svg>
);

const IconBallHandball = ({ size = 20, color = "var(--color-primary, #44D878)" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: size, height: size, flexShrink: 0 }}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m4.93 4.93 4.24 4.24" />
    <path d="m14.83 9.17 4.24-4.24" />
    <path d="m14.83 14.83 4.24 4.24" />
    <path d="m9.17 14.83-4.24 4.24" />
    <circle cx="12" cy="12" r="3.5" />
  </svg>
);

const BENCHMARK_GOAL_DATA = {
  TL: { label: "SUP. IZQUIERDO", shots: 7, saves: 1, xSavesPct: 5, mod: -0.23 },
  TC: { label: "SUP. CENTRO",    shots: 6, saves: 5, xSavesPct: 95, mod: 0.46 },
  TR: { label: "SUP. DERECHO",   shots: 6, saves: 1, xSavesPct: 5, mod: -0.21 },
  ML: { label: "MED. IZQUIERDO", shots: 16, saves: 10, xSavesPct: 87, mod: 0.25 },
  C:  { label: "CENTRO",         shots: 2, saves: 0, xSavesPct: 5, mod: -0.37 },
  MR: { label: "MED. DERECHO",   shots: 15, saves: 11, xSavesPct: 95, mod: 0.36 },
  BL: { label: "INF. IZQUIERDO", shots: 14, saves: 2, xSavesPct: 5, mod: -0.23 },
  BC: { label: "INF. CENTRO",    shots: 4, saves: 0, xSavesPct: 5, mod: -0.37 },
  BR: { label: "INF. DERECHO",   shots: 21, saves: 4, xSavesPct: 5, mod: -0.18 },
};

export default function SettingsPage({ matchesList = [], currentMatch = null }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("xg"); // "xg" | "xsaves" | "rating"
  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setForm(getSettings());
  }, []);

  // Calcular estadísticas empíricas del usuario sobre sus partidos registrados
  const empiricalData = useMemo(() => {
    let combined = Array.isArray(matchesList) ? [...matchesList] : [];
    if (currentMatch) {
      const idx = combined.findIndex(
        (m) =>
          (m && m._id && currentMatch._id && m._id === currentMatch._id) ||
          (m && m.id && currentMatch.id && m.id === currentMatch.id)
      );
      if (idx >= 0) {
        combined[idx] = currentMatch;
      } else {
        combined.push(currentMatch);
      }
    }
    return calculateUserEmpiricalXG(combined);
  }, [matchesList, currentMatch]);

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
    if (!confirm(t("settings.reset_confirm"))) return;
    const defaults = resetSettings();
    setForm(defaults);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const tabs = [
    { id: "xg", icon: <IconTarget size={16} />, label: t("settings.tab_xg") },
    { id: "xsaves", icon: <IconGlove size={16} />, label: t("settings.tab_xsaves") }
  ];

  const categoriesList = [
    { key: "7m", label: t("settings.label_7m"), paramKey: "xg7m", defaultVal: 0.75 },
    { key: "counter", label: t("settings.label_counter"), paramKey: "xgCounter", defaultVal: 0.80 },
    { key: "pivot", label: t("settings.label_pivot"), paramKey: "xgPivot", defaultVal: 0.72 },
    { key: "penetration", label: t("settings.label_penetration"), paramKey: "xgPenetration", defaultVal: 0.64 },
    { key: "wing", label: t("settings.label_wing"), paramKey: "xgWing", defaultVal: 0.56 },
    { key: "9m", label: t("settings.label_9m"), paramKey: "xg9m", defaultVal: 0.34 },
    { key: "emptyNet", label: t("settings.label_empty_net", "Portería Vacía"), paramKey: "xgEmptyNet", defaultVal: 0.40 },
  ];

  const goalZoneLabels = {
    TL: t("mesa_control.goal_zones.top_left", "Sup. Izq"),
    TC: t("mesa_control.goal_zones.top_center", "Sup. Cen"),
    TR: t("mesa_control.goal_zones.top_right", "Sup. Der"),
    ML: t("mesa_control.goal_zones.mid_left", "Med. Izq"),
    C: t("mesa_control.goal_zones.center", "Centro"),
    MR: t("mesa_control.goal_zones.mid_right", "Med. Der"),
    BL: t("mesa_control.goal_zones.bottom_left", "Inf. Izq"),
    BC: t("mesa_control.goal_zones.bottom_center", "Inf. Cen"),
    BR: t("mesa_control.goal_zones.bottom_right", "Inf. Der")
  };

  const isAutoActive = form.autoEmpiricalMode && empiricalData.isEligible;

  return (
    <div className="settings-page">
      {/* ENCABEZADO PRINCIPAL DE LA PÁGINA */}
      <div className="settings-header">
        <div>
          <h2>
            <IconSliders size={22} />
            <span>{t("settings.title")}</span>
          </h2>
          <p className="settings-subtitle">
            {t("settings.subtitle")}
          </p>
        </div>

        <div className="settings-header-actions">
          <LanguageSelector compact />
          <button type="button" className="btn btn-secondary" onClick={handleReset}>
            <IconRefresh />
            <span>{t("settings.reset")}</span>
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            <IconSave />
            <span>{t("settings.save_changes")}</span>
          </button>
        </div>
      </div>

      {/* MENSAJE DE NOTIFICACIÓN DE ÉXITO */}
      {savedSuccess && (
        <div className="settings-alert-success">
          {t("settings.success_alert")}
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
                <h4 className="hs-card-title" style={{ margin: 0 }}>{t("settings.xg_title")}</h4>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", fontWeight: 500 }}>
                  {t("settings.xg_subtitle")}
                </span>
              </div>
            </div>

            {/* PANEL DE CALIBRACIÓN EMPÍRICA AUTOMÁTICA */}
            <div className={`empirical-status-panel ${isAutoActive ? "active" : "pending"}`}>
              <div className="empirical-status-header">
                <div>
                  <span className="empirical-badge">
                    <IconZap />
                    {isAutoActive ? t("settings.empirical_active") : t("settings.empirical_mode_label")}
                  </span>
                  <p className="empirical-status-subtext">
                    {empiricalData.isEligible
                      ? t("settings.empirical_active_desc", {
                          total: empiricalData.totalShots,
                          next: empiricalData.nextCheckpoint,
                          remaining: empiricalData.shotsUntilNextRecalc
                        })
                      : t("settings.empirical_pending_desc", {
                          total: empiricalData.totalShots,
                          remaining: 500 - empiricalData.totalShots
                        })}
                  </p>
                </div>

                <div className="empirical-toggle-box">
                  <button
                    type="button"
                    className={`btn btn-sm ${form.autoEmpiricalMode ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => handleToggleAutoMode(true)}
                  >
                    {t("settings.btn_auto")}
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${!form.autoEmpiricalMode ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => handleToggleAutoMode(false)}
                  >
                    {t("settings.btn_manual")}
                  </button>
                </div>
              </div>

              {/* BARRA DE PROGRESO HACIA LOS 500 O SIGUIENTE HITO DE +25% */}
              <div className="empirical-progress-container">
                <div className="empirical-progress-label">
                  <span>{t("settings.progress_label")}</span>
                  <strong>{t("settings.progress_val", { count: empiricalData.totalShots })}</strong>
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
                  <IconInfo /> {t("settings.formula_title")}
                </div>
                <span className="formula-subtitle-tag">{t("settings.formula_subtitle")}</span>
              </div>

              {/* FILA DE TARJETAS DE FÓRMULAS */}
              <div className="formula-cards-row">
                <div className="formula-card">
                  <span className="formula-card-title">{t("settings.formula1_title")}</span>
                  <div className="formula-card-code">
                    {t("settings.formula1_code")}
                  </div>
                </div>
                <div className="formula-card">
                  <span className="formula-card-title">{t("settings.formula2_title")}</span>
                  <div className="formula-card-code">
                    {t("settings.formula2_code")}
                  </div>
                </div>
                <div className="formula-card">
                  <span className="formula-card-title">{t("settings.formula3_title")}</span>
                  <div className="formula-card-code">
                    {t("settings.formula3_code")}
                  </div>
                </div>
              </div>

              {/* BLOQUE EXPLICATIVO INFERIOR */}
              <div className="formula-explanation-block">
                <p>
                  {t("settings.formula_explanation")}
                </p>
              </div>
            </div>

            {/* BLOQUE PARALELO LADO A LADO: MARCO 3X3 DE PORTERÍA (IZQ) Y TABLA DESGLOSADA (DER) */}
            <div className="empirical-side-by-side-grid">
              {/* COLUMNA IZQUIERDA: MARCO DE PORTERÍA 3X3 */}
              <div className="empirical-breakdown-card" style={{ marginTop: 0 }}>
                <h5 style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: "var(--text-primary)", textTransform: "uppercase", marginBottom: "var(--space-12)", textAlign: "center" }}>
                  {t("settings.zone_modifiers_title")}
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
                          {zData.goals}/{zData.shots} {t("common.goals")}
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--text-primary)" }}>
                          {t("common.efficiency")}: {ratePct}%
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
                  {t("settings.empirical_history_title")}
                </h5>

                <div className="empirical-full-height-table-container">
                  <table className="empirical-full-height-table">
                    <thead>
                      <tr>
                        <th>{t("settings.col_shot_type")}</th>
                        <th>{t("settings.col_shots")}</th>
                        <th>{t("settings.col_goals")}</th>
                        <th>{t("settings.col_xg_base")}</th>
                        <th>{t("settings.col_xsaves")}</th>
                        <th>{t("settings.col_status")}</th>
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
                                {isAutoActive && data.shots >= 5 ? t("settings.status_empirical") : t("settings.status_manual")}
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
              {t("settings.manual_adjust_title")}
            </h5>

            <div className="settings-inputs-grid">
              <div className="form-group">
                <label>{t("settings.label_7m")}</label>
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
                <label>{t("settings.label_counter")}</label>
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
                <label>{t("settings.label_pivot")}</label>
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
                <label>{t("settings.label_penetration")}</label>
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
                <label>{t("settings.label_wing")}</label>
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
                <label>{t("settings.label_9m")}</label>
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
                <label>{t("settings.label_empty_net", "Portería Vacía")}</label>
                <div className="input-group-unit">
                  <input
                    type="number"
                    step="0.01"
                    min="0.05"
                    max="1.0"
                    className="input-field"
                    value={form.xgEmptyNet ?? 0.40}
                    onChange={(e) => handleChange("xgEmptyNet", e.target.value)}
                  />
                  <span className="unit-tag">xG</span>
                </div>
              </div>

              <div className="form-group">
                <label>{t("settings.label_superiority")}</label>
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
                <label>{t("settings.label_inferiority")}</label>
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
          <div className="xsaves-section-container">
            {/* TARJETA 1: FÓRMULAS Y EXPLICACIÓN */}
            <div className="xsaves-panel-card">
              {/* HEADER SUPERIOR */}
              <div className="xsaves-card-header">
                <div className="xsaves-header-left">
                  <div className="xsaves-avatar-box">
                    <IconGoalkeeperHand size={26} color="var(--color-primary, #44D878)" />
                  </div>
                  <div className="xsaves-header-titles">
                    <h3 className="xsaves-title">
                      {t("settings.xsaves_title", "EXPECTED SAVES (XSAVES) & MODIFICADOR DE PORTERÍA")}
                    </h3>
                    <p className="xsaves-subtitle">
                      {t(
                        "settings.xsaves_subtitle_custom",
                        "Modificador empírico por cuadrante (3×3) y paradas esperadas del portero en base a colocación, biomecánica y distancia."
                      )}
                    </p>
                  </div>
                </div>

                <div className="xsaves-formula-badge">
                  <span>xSaves = (1 - xG) +</span>
                  <span>Modificadores</span>
                </div>
              </div>

              {/* FILA DE 3 TARJETAS DE FÓRMULAS */}
              <div className="xsaves-formulas-grid">
                <div className="xsaves-formula-item">
                  <span className="xsaves-formula-item-label">
                    {t("settings.xsaves_f1_title", "1. XSAVES POR ZONA (Z)")}
                  </span>
                  <div className="xsaves-formula-item-code">
                    {t("settings.xsaves_f1_code", "(1 - xG) + ModificadorZona(z)")}
                  </div>
                </div>

                <div className="xsaves-formula-item">
                  <span className="xsaves-formula-item-label">
                    {t("settings.xsaves_f2_title", "2. MODIFICADOR PORTERÍA (Z)")}
                  </span>
                  <div className="xsaves-formula-item-code">
                    {t("settings.xsaves_f2_code", "TasaParadas(z) - TasaGlobal")}
                  </div>
                </div>

                <div className="xsaves-formula-item">
                  <span className="xsaves-formula-item-label">
                    {t("settings.xsaves_f3_title", "3. EVALUACIÓN CUADRANTES")}
                  </span>
                  <div className="xsaves-formula-item-code">
                    {t("settings.xsaves_f3_code", "Desviación vs Eficiencia Global")}
                  </div>
                </div>
              </div>

              {/* BLOQUE EXPLICATIVO INFERIOR */}
              <div className="xsaves-explanation-box">
                <p>
                  Las paradas esperadas del portero se calculan como <strong>(1 - xG) + ModificadorZonaXSave</strong>. El Modificador de Portería por Zona 3×3 evalúa el rendimiento empírico del portero en cada cuadrante de la portería restando su porcentaje de paradas reales en ese cuadrante respecto a su efectividad global.
                </p>
              </div>
            </div>

            {/* TARJETA 2: MODIFICADORES POR ZONA (MARCO 3X3) */}
            <div className="xsaves-goal-panel">
              {/* ENCABEZADO DE PORTERÍA */}
              <div className="xsaves-goal-header">
                <div className="xsaves-goal-title">
                  <IconBallHandball size={20} color="var(--color-primary, #44D878)" />
                  <span>{t("settings.zone_modifiers_title_custom", "MODIFICADORES POR ZONA (MARCO 3×3)")}</span>
                </div>
                <div className="xsaves-goal-dimensions">
                  <span>Dimensiones: 3.00m × 2.00m</span>
                </div>
              </div>

              {/* ESTRUCTURA MARCO DE PORTERÍA */}
              <div className="xsaves-goal-frame-wrapper">
                <div className="xsaves-crossbar-badge">
                  <span>LARGUERO SUPERIOR</span>
                </div>

                <div className="xsaves-goal-grid-3x3">
                  {["TL", "TC", "TR", "ML", "C", "MR", "BL", "BC", "BR"].map((zKey) => {
                    const benchmark = BENCHMARK_GOAL_DATA[zKey];
                    const hasShots = empiricalData && empiricalData.zoneCounts && empiricalData.zoneCounts[zKey]?.shots > 0;

                    let saves = benchmark.saves;
                    let totalShots = benchmark.shots;
                    let xSavePct = benchmark.xSavesPct;
                    let modXSaves = benchmark.mod;

                    if (hasShots) {
                      const zData = empiricalData.zoneCounts[zKey];
                      totalShots = zData.shots;
                      saves = Math.max(0, zData.shots - zData.goals);
                      modXSaves = empiricalData.zoneXSavesModifiers[zKey] ?? 0;
                      const xSaveVal = empiricalData.zoneXSaves[zKey] ?? 0.40;
                      xSavePct = Math.round(xSaveVal * 100);
                    }

                    const isPositive = modXSaves > 0;
                    const isNegative = modXSaves < 0;
                    const formattedMod = isPositive
                      ? `+${Number(modXSaves).toFixed(2)} xSaves`
                      : `${Number(modXSaves).toFixed(2)} xSaves`;

                    return (
                      <div
                        key={zKey}
                        className={`xsaves-quadrant-cell ${isPositive ? "is-positive" : isNegative ? "is-negative" : "is-neutral"}`}
                      >
                        <span className="xsaves-quadrant-title">
                          {benchmark.label}
                        </span>
                        <div className="xsaves-quadrant-saves">
                          {saves}/{totalShots} Paradas
                        </div>
                        <div className="xsaves-quadrant-pct">
                          xSaves: <strong>{xSavePct}%</strong>
                        </div>
                        <div className={`xsaves-quadrant-badge ${isPositive ? "positive" : isNegative ? "negative" : "neutral"}`}>
                          {formattedMod}
                        </div>
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
            <span>{t("settings.reset_all")}</span>
          </button>
          <button type="submit" className="btn btn-primary">
            <IconSave />
            <span>{t("settings.save_settings")}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
