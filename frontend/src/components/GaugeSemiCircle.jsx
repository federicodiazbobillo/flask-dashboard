import React from "react";

function GaugeSemiCircle({ value }) {
  const clamped = Math.max(0, Math.min(100, value));

  const cx = 100;
  const cy = 100;
  const r = 80;

  // Convierte ángulo a coordenadas cartesianas
  const polarToCartesian = (cx, cy, r, angle) => {
    const rad = (angle - 90) * (Math.PI / 180.0);
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  // Genera arco entre ángulos
  const describeArc = (startAngle, endAngle) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M",
      start.x,
      start.y,
      "A",
      r,
      r,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
    ].join(" ");
  };

  // Arcos fijos (segmentos)
  const greenArc = describeArc(-90, -36);   // 0-70%
  const yellowArc = describeArc(-36, 54);   // 70-90%
  const redArc = describeArc(54, 90);       // 90-100%

  // Progreso dinámico
  const progressArc = describeArc(-90, (clamped / 100) * 180 - 90);

  return (
    <svg viewBox="0 0 200 120" className="w-full h-32">
      {/* Segmentos fijos */}
      <path d={greenArc} fill="none" stroke="green" strokeWidth="20" />
      <path d={yellowArc} fill="none" stroke="orange" strokeWidth="20" />
      <path d={redArc} fill="none" stroke="red" strokeWidth="20" />

      {/* Progreso en blanco encima */}
      <path d={progressArc} fill="none" stroke="white" strokeWidth="6" />

      {/* Texto central */}
      <text
        x="100"
        y="115"
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
