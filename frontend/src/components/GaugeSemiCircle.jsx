import React from "react";

function GaugeSemiCircle({ value }) {
  const clamped = Math.max(0, Math.min(100, value));

  // Ángulo entre -90° (izquierda) y +90° (derecha)
  const angle = (clamped / 100) * 180 - 90;

  // Posición de la aguja
  const r = 90;
  const rad = (angle * Math.PI) / 180;
  const x = 100 + r * Math.cos(rad);
  const y = 100 + r * Math.sin(rad);

  return (
    <svg viewBox="0 0 200 120" className="w-full h-32">
      {/* Fondo arco gris */}
      <path
        d="M 10 100 A 90 90 0 0 1 190 100"
        fill="none"
        stroke="#444"
        strokeWidth="20"
      />
      {/* Verde */}
      <path
        d="M 40 100 A 60 60 0 0 1 100 40"
        fill="none"
        stroke="green"
        strokeWidth="20"
      />
      {/* Amarillo */}
      <path
        d="M 100 40 A 60 60 0 0 1 160 100"
        fill="none"
        stroke="orange"
        strokeWidth="20"
      />
      {/* Rojo */}
      <path
        d="M 160 100 A 60 60 0 0 1 190 100"
        fill="none"
        stroke="red"
        strokeWidth="20"
      />
      {/* Aguja */}
      <line
        x1="100"
        y1="100"
        x2={x}
        y2={y}
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Centro */}
      <circle cx="100" cy="100" r="6" fill="white" />
      {/* Texto */}
      <text
        x="100"
        y="115"
        textAnchor="middle"
        fontSize="14"
        fill="white"
        fontWeight="bold"
      >
        {clamped.toFixed(1)}%
      </text>
    </svg>
  );
}

export default GaugeSemiCircle;
