import React from "react";

function GaugeSemiCircle({ value }) {
  const clamped = Math.max(0, Math.min(100, value));

  const cx = 100;
  const cy = 100;
  const r = 80;

  // convierte ángulo a coordenadas cartesianas
  const polarToCartesian = (cx, cy, r, angle) => {
    const rad = (angle - 90) * (Math.PI / 180.0); // ajustar para que -90 sea izquierda, +90 derecha
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  // genera arco de startAngle a endAngle
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

  // arco de fondo (-90 a +90 → semicirc)
  const totalArc = describeArc(-90, 90);
  const progressArc = describeArc(-90, (clamped / 100) * 180 - 90);

  // color dinámico
  let color = "green";
  if (clamped > 70) color = "orange";
  if (clamped > 90) color = "red";

  return (
    <svg viewBox="0 0 200 120" className="w-full h-32">
      {/* arco fondo */}
      <path d={totalArc} fill="none" stroke="#333" strokeWidth="20" />

      {/* progreso */}
      <path d={progressArc} fill="none" stroke={color} strokeWidth="20" />

      {/* texto */}
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
