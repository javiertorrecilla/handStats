import React from "react";

/**
 * Componente gráfico SVG oficial de la media pista de balonmano.
 * Idéntico en geometría, proporciones y estilo a la pantalla de registro de acciones.
 */
export function HandballCourtGraphic({
  showZones = false,
  className = "",
  style = {},
  idPrefix = "hc"
}) {
  const courtGradId = `${idPrefix}-courtBgGrad`;
  const areaGradId = `${idPrefix}-areaGrad`;
  const netPatId = `${idPrefix}-netPattern`;
  const postPatId = `${idPrefix}-postPattern`;

  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="none"
      className={`handball-court-svg ${className}`}
      style={{ width: "100%", height: "100%", display: "block", ...style }}
    >
      <defs>
        {/* Fondo Gradient de Pista (Verde Estadio Profesional) */}
        <linearGradient id={courtGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#061c0e" />
          <stop offset="50%" stopColor="#114725" />
          <stop offset="100%" stopColor="#082212" />
        </linearGradient>

        {/* Relleno diferenciado para el Área de 6m */}
        <linearGradient id={areaGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(45, 190, 96, 0.16)" />
          <stop offset="100%" stopColor="rgba(45, 190, 96, 0.32)" />
        </linearGradient>

        {/* Patrón de Red de Portería */}
        <pattern id={netPatId} width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M 0 3 L 6 3 M 3 0 L 3 6" fill="none" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="0.8" />
        </pattern>

        {/* Patrón de Franjas Rojas y Blancas para los Postes de la Portería */}
        <pattern id={postPatId} width="16" height="6" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="8" height="6" fill="#ef4444" />
          <rect x="8" y="0" width="8" height="6" fill="#ffffff" />
        </pattern>
      </defs>

      {/* 1. Fondo principal de la media pista */}
      <rect x="0" y="0" width="400" height="300" fill={`url(#${courtGradId})`} />

      {/* 2. Capa opcional de delimitación de zonas xG */}
      {showZones && (
        <g className="court-zone-overlays" opacity="0.6">
          {/* Extremo Izquierdo */}
          <path d="M 8 8 L 40 8 L 40 63 L 8 63 Z" fill="rgba(249, 115, 22, 0.45)" stroke="#f97316" strokeWidth="2" />
          <text x="24" y="38" fill="#fdba74" fontSize="9" fontWeight="bold" textAnchor="middle">EXT IZQ</text>

          {/* Extremo Derecho */}
          <path d="M 360 8 L 392 8 L 392 63 L 360 63 Z" fill="rgba(249, 115, 22, 0.45)" stroke="#f97316" strokeWidth="2" />
          <text x="376" y="38" fill="#fdba74" fontSize="9" fontWeight="bold" textAnchor="middle">EXT DER</text>

          {/* Área Azul de Pivote / Penetración */}
          <path
            d="M 8 63 L 40 63 A 135 135 0 0 0 165 143 L 235 143 A 135 135 0 0 0 360 63 L 392 63 A 195 195 0 0 1 235 203 L 165 203 A 195 195 0 0 1 8 63 Z"
            fill="rgba(37, 99, 235, 0.35)"
            stroke="#3b82f6"
            strokeWidth="2.5"
          />
          <text x="200" y="175" fill="#93c5fd" fontSize="10" fontWeight="bold" textAnchor="middle">PIVOTE 6M / PENETRACIÓN</text>

          {/* 9M Lateral Izquierdo */}
          <path d="M 8 63 A 195 195 0 0 0 124 196 L 124 288 L 8 288 Z" fill="rgba(236, 72, 153, 0.35)" stroke="#ec4899" strokeWidth="2" />
          <text x="66" y="245" fill="#f472b6" fontSize="10" fontWeight="bold" textAnchor="middle">9M LAT IZQ</text>

          {/* 9M Central */}
          <path d="M 124 196 A 195 195 0 0 0 165 203 L 235 203 A 195 195 0 0 0 276 196 L 276 288 L 124 288 Z" fill="rgba(34, 197, 94, 0.35)" stroke="#22c55e" strokeWidth="2" />
          <text x="200" y="245" fill="#86efac" fontSize="10" fontWeight="bold" textAnchor="middle">9M CENTRAL</text>

          {/* 9M Lateral Derecho */}
          <path d="M 276 196 A 195 195 0 0 0 392 63 L 392 288 L 276 288 Z" fill="rgba(255, 255, 255, 0.30)" stroke="#ffffff" strokeWidth="2" />
          <text x="334" y="245" fill="#f1f5f9" fontSize="10" fontWeight="bold" textAnchor="middle">9M LAT DER</text>
        </g>
      )}

      {/* 3. Marco exterior del campo (Líneas perimetrales) */}
      <rect x="8" y="8" width="384" height="284" fill="none" stroke="#ffffff" strokeWidth="3" />

      {/* 4. Portería y Red en la línea de fondo arriba */}
      <rect x="165" y="0" width="70" height="8" fill={`url(#${netPatId})`} stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      <rect x="165" y="6" width="70" height="5" fill={`url(#${postPatId})`} stroke="#ffffff" strokeWidth="1" />

      {/* 5. Área de 6 Metros oficial */}
      <path
        d="M 30 8 A 135 135 0 0 0 165 142 L 235 142 A 135 135 0 0 0 370 8 Z"
        fill={`url(#${areaGradId})`}
        stroke="#ffffff"
        strokeWidth="3.5"
      />

      {/* 6. Línea de 4 Metros del Portero */}
      <line x1="188" y1="98" x2="212" y2="98" stroke="#ffffff" strokeWidth="3" />

      {/* 7. Línea de 7 Metros (Penalti) */}
      <line x1="184" y1="165" x2="216" y2="165" stroke="#fbbf24" strokeWidth="3.5" />

      {/* 8. Línea de 9 Metros (Golpe Franco - Discontinua) */}
      <path
        d="M 8 63 A 195 195 0 0 0 165 203 L 235 203 A 195 195 0 0 0 392 63"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeDasharray="9 7"
      />

      {/* 9. Marca de zona de cambios */}
      <line x1="8" y1="260" x2="22" y2="260" stroke="#ffffff" strokeWidth="3" />
    </svg>
  );
}
