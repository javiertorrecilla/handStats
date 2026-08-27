import React from "react";

/**
 * Componente gráfico SVG oficial de la portería de balonmano.
 * Incluye margen exterior para registro y visualización de tiros que van fuera (desviados/postes).
 */
export function HandballGoalGraphic({
  className = "",
  style = {},
  idPrefix = "hg"
}) {
  const netMeshId = `${idPrefix}-netMesh`;
  const stripedPostId = `${idPrefix}-stripedPost`;

  return (
    <svg
      viewBox="0 0 360 220"
      preserveAspectRatio="none"
      className={`handball-goal-svg ${className}`}
      style={{ width: "100%", height: "100%", display: "block", ...style }}
    >
      <defs>
        {/* Red de portería */}
        <pattern id={netMeshId} width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M 12 0 L 0 12 M 0 0 L 12 12" stroke="rgba(255,255,255,0.22)" strokeWidth="1" />
        </pattern>

        {/* Franjas de poste de balonmano (Blanco y Rojo) */}
        <pattern id={stripedPostId} width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="10" height="20" fill="#ffffff" />
          <rect x="10" width="10" height="20" fill="#dc2626" />
        </pattern>
      </defs>

      {/* Fondo de portería / zona exterior de fondo */}
      <rect x="0" y="0" width="360" height="220" fill="#081210" />

      {/* Zona exterior sutilmente sombreada para tiros que van fuera */}
      <rect x="0" y="0" width="360" height="24" fill="rgba(255,255,255,0.03)" />
      <rect x="0" y="24" width="30" height="196" fill="rgba(255,255,255,0.03)" />
      <rect x="330" y="24" width="30" height="196" fill="rgba(255,255,255,0.03)" />

      {/* Textos sutiles indicadores de zonas exteriores */}
      <text x="180" y="16" fill="rgba(255,255,255,0.28)" fontSize="8.5" fontWeight="800" textAnchor="middle" letterSpacing="0.8">FUERA ARRIBA</text>
      <text x="15" y="120" fill="rgba(255,255,255,0.28)" fontSize="7.5" fontWeight="800" textAnchor="middle" transform="rotate(-90 15 120)" letterSpacing="0.8">FUERA IZQ</text>
      <text x="345" y="120" fill="rgba(255,255,255,0.28)" fontSize="7.5" fontWeight="800" textAnchor="middle" transform="rotate(90 345 120)" letterSpacing="0.8">FUERA DER</text>

      {/* Malla / Red de portería interior */}
      <rect x="44" y="38" width="272" height="182" fill={`url(#${netMeshId})`} />

      {/* Guías visuales de escuadras y zonas interiores */}
      <line x1="134" y1="38" x2="134" y2="220" stroke="rgba(255,255,255,0.12)" strokeDasharray="4,4" />
      <line x1="226" y1="38" x2="226" y2="220" stroke="rgba(255,255,255,0.12)" strokeDasharray="4,4" />
      <line x1="44" y1="98" x2="316" y2="98" stroke="rgba(255,255,255,0.12)" strokeDasharray="4,4" />
      <line x1="44" y1="158" x2="316" y2="158" stroke="rgba(255,255,255,0.12)" strokeDasharray="4,4" />

      {/* Marco de Postes y Larguero (Reglamentario franjeado) */}
      {/* Larguero superior */}
      <rect x="30" y="24" width="300" height="14" fill={`url(#${stripedPostId})`} stroke="#000" strokeWidth="1" />
      {/* Poste Izquierdo */}
      <rect x="30" y="24" width="14" height="196" fill={`url(#${stripedPostId})`} stroke="#000" strokeWidth="1" />
      {/* Poste Derecho */}
      <rect x="316" y="24" width="14" height="196" fill={`url(#${stripedPostId})`} stroke="#000" strokeWidth="1" />

      {/* Línea de suelo / línea de gol */}
      <line x1="0" y1="219" x2="360" y2="219" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
    </svg>
  );
}
