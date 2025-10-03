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

  // Límites de segmentos
  const A0 = degFromPct(0);
  const A70 = degFromPct(0.7);
  const A90 = degFromPct(0.9);
  const A100 = degFromPct(1);

  // Pequeño gap visual (en grados) para separar segmentos
  const GAP = 2;

  const greenArc  = arc(A0,    A70 - GAP / 2);
  const yellowArc = arc(A70 + GAP / 2, A90 - GAP / 2);
  const redArc    = arc(A90 + GAP / 2, A100);

  const progressEnd = degFromPct(clamped / 100);
  const progressArc = arc(A0, progressEnd);

  return (
    <svg
      viewBox="0 0 220 130"
      className="w-full h-32"
      preserveAspectRatio="xMidYMid meet"
      style={{ overflow: "visible" }}
    >
      {/* Segmentos fijos */}
      <path d={greenArc}  fill="none" stroke="green"  strokeWidth="18"
            vectorEffect="non-scaling-stroke" strokeLinecap="round" />
      <path d={yellowArc} fill="none" stroke="orange" strokeWidth="18"
            vectorEffect="non-scaling-stroke" strokeLinecap="round" />
      <path d={redArc}    fill="none" stroke="red"    strokeWidth="18"
            vectorEffect="non-scaling-stroke" strokeLinecap="round" />

      {/* Progreso encima (blanco) */}
      <path d={progressArc} fill="none" stroke="white" strokeWidth="6"
            vectorEffect="non-scaling-stroke" strokeLinecap="round" />

      {/* Porcentaje */}
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
