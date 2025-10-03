import React from "react";

function GaugeSemiCircle({ value }) {
  const clamped = Math.max(0, Math.min(100, value));

  const cx = 100;
  const cy = 100;
  const r = 80;

  // Función para calcular coordenadas de un punto en el arco
  const polarToCartesian = (cx, cy, r, angle) => {
    const rad = (angle * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  // Función para describir un arco entre ángulos
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

  // El gauge va de -90° a +90° (semicírculo)
  const totalArc = describeArc(-90, 90);
  const progressArc = describeArc(-90, (clamped / 100) * 180 - 90);

  // Color dinámico
  let color = "green";
  if (clamped > 70) color = "orange";
  if (clamped > 90) color = "red";

  return (
    <svg viewBox="0 0 200 120" className="w-full h-32">
      {/* Fondo */}
      <path d={totalArc} fill="none" stroke="#333" strokeWidth="20" />

      {/* Progreso */}
      <path d={progressArc} fill="none" stroke={color} strokeWidth="20" />

      {/* Texto central */}
      <text
        x="100"
        y="110"
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
