import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const GaugeSemiCircle = ({ value }) => {
  const percent = Math.min(Math.max(value, 0), 100); // clamp 0-100
  const angle = 180 - (percent / 100) * 180; // convertir valor a ángulo

  const COLORS = [
    { max: 25, color: "#00ff00" }, // verde
    { max: 50, color: "#ffff00" }, // amarillo
    { max: 75, color: "#ff9900" }, // naranja
    { max: 100, color: "#ff0000" }, // rojo
  ];

  // Particionar el arco en segmentos
  const data = COLORS.map((seg, i) => {
    const prev = i === 0 ? 0 : COLORS[i - 1].max;
    return { value: seg.max - prev, color: seg.color };
  });

  return (
    <div style={{ width: "100%", height: 180, position: "relative" }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={80}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Aguja */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "40px",
          transform: `rotate(${angle}deg) translateX(-50%)`,
          transformOrigin: "bottom center",
          width: "4px",
          height: "70px",
          backgroundColor: "white",
          borderRadius: "2px",
        }}
      />

      {/* Pivote */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "35px",
          transform: "translateX(-50%)",
          width: "16px",
          height: "16px",
          backgroundColor: "white",
          borderRadius: "50%",
          border: "2px solid #333",
        }}
      />

      {/* Valor numérico */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          textAlign: "center",
          bottom: "-5px",
          fontSize: "20px",
          fontWeight: "bold",
        }}
      >
        {percent.toFixed(1)}%
      </div>

      {/* Ticks */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          bottom: "10px",
          textAlign: "center",
          fontSize: "12px",
          display: "flex",
          justifyContent: "space-between",
          padding: "0 10px",
        }}
      >
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
    </div>
  );
};

export default GaugeSemiCircle;
