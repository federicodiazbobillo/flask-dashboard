import { useEffect, useState } from "react";

/* ===========================
   Velocímetro semicircular (SVG)
   =========================== */
function Speedometer({
  value = 0,
  size = 220,
  strokeWidth = 16,
  thresholds = [50, 75, 90],              // cortes de color
  colors = ["#10B981", "#FBBF24", "#F97316", "#EF4444"], // verde, amarillo, naranja, rojo
}) {
  const clamp = (v) => Math.max(0, Math.min(100, Number.isFinite(v) ? v : 0));
  const val = clamp(value);

  // geometría
  const cx = size / 2;
  const cy = size * 0.9;                 // centro un poco abajo para que entre la media luna
  const r = size * 0.8 * 0.5;            // radio con margen

  const toAngle = (pct) => 180 - (pct / 100) * 180; // 0%->180°, 100%->0°

  const polar = (cx, cy, r, angDeg) => {
    const rad = (angDeg - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const arcPath = (cx, cy, r, startAng, endAng) => {
    const start = polar(cx, cy, r, endAng);
    const end = polar(cx, cy, r, startAng);
    const largeArc = Math.abs(endAng - startAng) > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
  };

  // tramos de color
  const segments = [
    { from: 0, to: thresholds[0], color: colors[0] },
    { from: thresholds[0], to: thresholds[1], color: colors[1] },
    { from: thresholds[1], to: thresholds[2], color: colors[2] },
    { from: thresholds[2], to: 100, color: colors[3] },
  ];

  // aguja
  const angle = toAngle(val);
  const needleLen = r;                    // largo de aguja
  const tip = polar(cx, cy, needleLen, angle);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full"
      style={{ height: 160 }}
    >
      {/* track gris de fondo */}
      <path
        d={arcPath(cx, cy, r, 180, 0)}
        stroke="#374151"
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
      />
      {/* tramos de color */}
      {segments.map((s, i) => (
        <path
          key={i}
          d={arcPath(cx, cy, r, toAngle(s.from), toAngle(s.to))}
          stroke={s.color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="butt"
        />
      ))}

      {/* aguja */}
      <line
        x1={cx}
        y1={cy}
        x2={tip.x}
        y2={tip.y}
        stroke="#ffffff"
        strokeWidth="4"
      />
      {/* tapa del eje */}
      <circle cx={cx} cy={cy} r="6" fill="#e5e7eb" />
    </svg>
  );
}

/* ===========================
   Card genérica con gauge
   =========================== */
function GaugeCard({ title, value, unit = "%", subtitle, children }) {
  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-md">
      <h2 className="text-xl mb-2">{title}</h2>
      {subtitle && <p className="text-sm text-gray-400 mb-2">{subtitle}</p>}
      <Speedometer value={value} />
      <p className="mt-2 text-center font-bold">
        {Number.isFinite(value) ? value : 0}
        {unit}
      </p>
      {children && <div className="mt-4 text-sm">{children}</div>}
    </div>
  );
}

/* ===========================
   Dashboard
   =========================== */
function Dashboard() {
  const [stats, setStats] = useState({
    cpu: {
      model: "Detectando...",
      cores_physical: 0,
      cores_logical: 0,
      cpu_percent_total: 0,
      cpu_percent_per_core: [],
      freq_current_mhz: null,
      freq_min_mhz: null,
      freq_max_mhz: null,
      load_avg: [],
      temperature_c: null,
    },
    memory: {
      memory_percent: 0,
      memory_total_gb: 0,
      memory_available_gb: 0,
      memory_slots: [],
    },
    storage: {
      disk_percent: 0,
      disk_total_gb: 0,
      disk_free_gb: 0,
    },
    gpus: [],
    net: { interfaces: [] },
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [cpuRes, memRes, diskRes, gpuRes, netRes] = await Promise.all([
          fetch("/api/server-info/cpu/"),
          fetch("/api/server-info/memory/"),
          fetch("/api/server-info/storage/"),
          fetch("/api/server-info/gpu/"),
          fetch("/api/server-info/net/"),
        ]);

        const [cpu, memory, storage, gpu, net] = await Promise.all([
          cpuRes.json(),
          memRes.json(),
          diskRes.json(),
          gpuRes.json(),
          netRes.json(),
        ]);

        setStats({
          cpu,
          memory: {
            memory_percent: memory.memory_percent,
            memory_total_gb: memory.memory_total_gb,
            memory_available_gb: memory.memory_available_gb,
            memory_slots: memory.slots || [],
          },
          storage: {
            disk_percent: storage.disk_percent,
            disk_total_gb: storage.disk_total_gb,
            disk_free_gb: storage.disk_free_gb,
          },
          gpus: gpu.gpus || [],
          net: net || { interfaces: [] },
        });
      } catch (err) {
        console.error("Error al cargar stats:", err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const firstOccupied =
    stats.memory.memory_slots.find((s) => s.status === "Occupied");
  const memoryLabel = firstOccupied
    ? `(${firstOccupied.type} — ${firstOccupied.configured_memory_speed})`
    : "";

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* CPU */}
      <GaugeCard
        title="CPU"
        value={stats.cpu.cpu_percent_total}
        subtitle={stats.cpu.model}
      >
        <p>
          Temp:{" "}
          {stats.cpu.temperature_c !== null
            ? `${stats.cpu.temperature_c} °C`
            : "N/A"}
        </p>
        <p>
          Núcleos: {stats.cpu.cores_physical} físicos /{" "}
          {stats.cpu.cores_logical} lógicos
        </p>
        <p>
          Frecuencia:{" "}
          {stats.cpu.freq_current_mhz
            ? `${stats.cpu.freq_current_mhz.toFixed(0)} MHz`
            : "N/A"}{" "}
          (min {stats.cpu.freq_min_mhz ?? "?"}, max {stats.cpu.freq_max_mhz ?? "?"})
        </p>
        <p>
          Load Avg:{" "}
          {stats.cpu.load_avg?.length
            ? stats.cpu.load_avg.map((l) => l.toFixed(2)).join(" | ")
            : "N/A"}
        </p>
        <div className="mt-4 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 text-xs">
          {stats.cpu.cpu_percent_per_core.map((usage, i) => (
            <div key={i} className="p-2 rounded bg-gray-700 text-center">
              <p className="font-bold">Core {i}</p>
              <p>{usage}%</p>
            </div>
          ))}
        </div>
      </GaugeCard>

      {/* RAM */}
      <GaugeCard
        title={`Memoria RAM ${memoryLabel}`}
        value={stats.memory.memory_percent}
        subtitle={`Total: ${stats.memory.memory_total_gb} GB — Disponible: ${stats.memory.memory_available_gb} GB`}
      >
        <div className="flex flex-col gap-2">
          {stats.memory.memory_slots.map((slot, i) => (
            <div
              key={i}
              className={`p-2 rounded-lg text-center text-xs ${
                slot.status === "Occupied" ? "bg-green-700" : "bg-gray-700"
              }`}
            >
              <p className="font-bold">{slot.locator}</p>
              {slot.status === "Occupied" ? (
                <>
                  <p>{slot.size_gb} GB</p>
                  <p className="truncate">{slot.manufacturer}</p>
                </>
              ) : (
                <p className="italic text-gray-400">Vacío</p>
              )}
            </div>
          ))}
        </div>
      </GaugeCard>

      {/* Disco */}
      <GaugeCard
        title="Disco"
        value={stats.storage.disk_percent}
        subtitle={`Total: ${stats.storage.disk_total_gb} GB — Libre: ${stats.storage.disk_free_gb} GB`}
      />

      {/* GPU */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-md col-span-1">
        <h2 className="text-xl mb-2">GPU</h2>
        {stats.gpus?.length ? (
          stats.gpus.map((gpu, i) => (
            <GaugeCard
              key={i}
              title={gpu.name}
              value={gpu.load}
              subtitle={`Memoria: ${gpu.memoryUsed}/${gpu.memoryTotal} MB — Temp: ${gpu.temperature}°C`}
            />
          ))
        ) : (
          <p>No se detectaron GPUs</p>
        )}
      </div>

      {/* Red */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-md col-span-1">
        <h2 className="text-xl mb-2">Interfaces de Red</h2>
        {stats.net.interfaces?.length ? (
          stats.net.interfaces.map((iface, i) => (
            <div key={i} className="mb-2 p-2 rounded-lg bg-gray-700 text-xs">
              <p className="font-bold">{iface.name}</p>
              <p>IP: {iface.ip || "N/A"}</p>
              <p>MAC: {iface.mac || "N/A"}</p>
              <p>Velocidad: {iface.speed} Mbps</p>
              <p>Estado: {iface.isup ? "Activo" : "Inactivo"}</p>
            </div>
          ))
        ) : (
          <p>No se detectaron interfaces de red</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
