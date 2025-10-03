import React from "react";

function GaugeSemiCircle({ value }) {
  const clamped = Math.max(0, Math.min(100, value));

  // Ángulo entre -90° (izquierda) y +90° (derecha)
  const angle = (clamped / 100) * 180 - 90;

  // Centro y radio
  const cx = 150;
  const cy = 150;
  const r = 120;

  // Posición de la aguja
  const rad = (angle * Math.PI) / 180;
  const x = cx + r * Math.cos(rad);
  const y = cy + r * Math.sin(rad);

  return (
    <svg viewBox="0 0 300 180" className="w-full h-40">
      {/* Arco de fondo */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="#333"
        strokeWidth="20"
      />

      {/* Verde (0-60%) */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx} ${cy - r}`}
        fill="none"
        stroke="green"
        strokeWidth="20"
      />

      {/* Amarillo (60-85%) */}
      <path
        d={`M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx + (r * 0.87)} ${cy + (r * 0.5)}`}
        fill="none"
        stroke="orange"
        strokeWidth="20"
      />

      {/* Rojo (85-100%) */}
      <path
        d={`M ${cx + (r * 0.87)} ${cy + (r * 0.5)} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="red"
        strokeWidth="20"
      />

      {/* Aguja */}
      <line
        x1={cx}
        y1={cy}
        x2={x}
        y2={y}
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Centro de la aguja */}
      <circle cx={cx} cy={cy} r="8" fill="white" />

      {/* Texto con valor */}
      <text
        x={cx}
        y={cy + 30}
        textAnchor="middle"
        fontSize="20"
        fill="white"
        fontWeight="bold"
      >
        {clamped.toFixed(1)}%
      </text>

      {/* Ticks (marcas cada 20%) */}
      {[0, 20, 40, 60, 80, 100].map((t) => {
        const a = (t / 100) * 180 - 90;
        const radTick = (a * Math.PI) / 180;
        const x1 = cx + (r - 15) * Math.cos(radTick);
        const y1 = cy + (r - 15) * Math.sin(radTick);
        const x2 = cx + (r + 5) * Math.cos(radTick);
        const y2 = cy + (r + 5) * Math.sin(radTick);

        return (
          <line
            key={t}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="white"
            strokeWidth="2"
          />
        );
      })}
    </svg>
  );
}

export default GaugeSemiCircle;
