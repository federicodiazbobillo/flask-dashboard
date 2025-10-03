import React from "react";

function GaugeSemiCircle({ value }) {
  const clamped = Math.max(0, Math.min(100, value));
  const cx = 110, cy = 110, r = 90;

  // Utilidades
  const degFromPct = (p) => -90 + p * 180; // 0→-90°, 1→+90°
  const polar = (cx, cy, r, angleDeg) => {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const arc = (startDeg, endDeg) => {
    const s = polar(cx, cy, r, endDeg);
    const e = polar(cx, cy, r, startDeg);
    const large = endDeg - startDeg <= 180 ? 0 : 1;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
  };

  // Fondo semicircular (0–100%)
  const fullArc = arc(degFromPct(0), degFromPct(1));

  // Progreso dinámico
  const progressEnd = degFromPct(clamped / 100);
  const progressArc = arc(degFromPct(0), progressEnd);

  // Color del progreso
  let color = "green";
  if (clamped > 70) color = "orange";
  if (clamped > 90) color = "red";

  return (
    <svg
      viewBox="0 0 220 130"
      className="w-full h-32"
      preserveAspectRatio="xMidYMid meet"
      style={{ overflow: "visible" }}
    >
      {/* Fondo gris claro */}
      <path
        d={fullArc}
        fill="none"
        stroke="#555"   // gris más claro que el fondo
        strokeWidth="18"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
      />

      {/* Progreso dinámico */}
      <path
        d={progressArc}
        fill="none"
        stroke={color}
        strokeWidth="18"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
      />

      {/* Texto central */}
      <text
        x={cx}
        y={cy + 18}
        textAnchor="middle"
        fontSize="16"
        fill="white"
        fontWeight="bold"
      >
        {clamped.toFixed(1)}%
      </text>
    </svg>
  );
}

export default GaugeSemiCircle;
