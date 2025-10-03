import { useEffect, useState } from "react";

// ───────────────────────────────
// Componente Speedometer
// ───────────────────────────────
function Speedometer({
  value = 0,
  size = 220,
  strokeWidth = 16,
  thresholds = [50, 75, 90],
  colors = ["#10B981", "#FBBF24", "#F97316", "#EF4444"], // verde → amarillo → naranja → rojo
}) {
  const clamp = (v) => Math.max(0, Math.min(100, Number.isFinite(v) ? v : 0));
  const val = clamp(value);

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - strokeWidth;

  const toAngle = (pct) => (-90 + (pct / 100) * 180) * (Math.PI / 180);

  const polar = (angle) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  });

  const describeArc = (startPct, endPct) => {
    const start = polar(toAngle(startPct));
    const end = polar(toAngle(endPct));
    const largeArc = endPct - startPct > 50 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const segments = [
    { from: 0, to: thresholds[0], color: colors[0] },
    { from: thresholds[0], to: thresholds[1], color: colors[1] },
    { from: thresholds[1], to: thresholds[2], color: colors[2] },
    { from: thresholds[2], to: 100, color: colors[3] },
  ];

  const ang = toAngle(val);
  const tip = {
    x: cx + (r - strokeWidth) * Math.cos(ang),
    y: cy + (r - strokeWidth) * Math.sin(ang),
  };

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size / 1.1}`} className="w-full h-32">
        {segments.map((s, i) => (
          <path
            key={i}
            d={describeArc(s.from, s.to)}
            stroke={s.color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
        ))}
        <line x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke="white" strokeWidth="3" />
        <circle cx={cx} cy={cy} r="5" fill="white" />
      </svg>
      <p className="font-bold mt-1">{val.toFixed(1)}%</p>
    </div>
  );
}

// ───────────────────────────────
// Dashboard principal
// ───────────────────────────────
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
        const cpu = await (await fetch("/api/server-info/cpu/")).json();
        const memory = await (await fetch("/api/server-info/memory/")).json();
        const storage = await (await fetch("/api/server-info/storage/")).json();
        const gpu = await (await fetch("/api/server-info/gpu/")).json();
        const net = await (await fetch("/api/server-info/net/")).json();

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

  const firstOccupied = stats.memory.memory_slots.find((s) => s.status === "Occupied");
  const memoryLabel = firstOccupied
    ? `(${firstOccupied.type} — ${firstOccupied.configured_memory_speed})`
    : "";

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* CPU */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-md lg:col-span-2">
        <h2 className="text-xl mb-2">CPU</h2>
        <p className="text-sm text-gray-400 mb-2">{stats.cpu.model}</p>
        <Speedometer value={stats.cpu.cpu_percent_total} />
        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          <p>Temp: {stats.cpu.temperature_c ?? "N/A"} °C</p>
          <p>
            Núcleos: {stats.cpu.cores_physical} físicos / {stats.cpu.cores_logical} lógicos
          </p>
          <p>
            Frecuencia:{" "}
            {stats.cpu.freq_current_mhz
              ? `${stats.cpu.freq_current_mhz.toFixed(0)} MHz`
              : "N/A"}{" "}
            (min {stats.cpu.freq_min_mhz ?? "?"}, max {stats.cpu.freq_max_mhz ?? "?"})
          </p>
          <p className="col-span-2 md:col-span-1">
            Load Avg:{" "}
            {stats.cpu.load_avg?.length
              ? stats.cpu.load_avg.map((l) => l.toFixed(2)).join(" | ")
              : "N/A"}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 text-xs">
          {stats.cpu.cpu_percent_per_core.map((usage, i) => (
            <div key={i} className="p-2 rounded bg-gray-700 text-center">
              <p className="font-bold">Core {i}</p>
              <p>{usage}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* RAM */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-md">
        <h2 className="text-xl mb-2">Memoria RAM {memoryLabel}</h2>
        <p className="text-sm text-gray-400 mb-4">
          Total: {stats.memory.memory_total_gb} GB — Disponible: {stats.memory.memory_available_gb} GB
        </p>
        <Speedometer value={stats.memory.memory_percent} />
        <p className="mt-2">Uso: {stats.memory.memory_percent}%</p>
        <div className="mt-4 flex flex-col gap-2">
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
      </div>

      {/* Disco */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-md">
        <h2 className="text-xl mb-2">Disco</h2>
        <p className="text-sm text-gray-400 mb-4">
          Total: {stats.storage.disk_total_gb} GB — Libre: {stats.storage.disk_free_gb} GB
        </p>
        <Speedometer value={stats.storage.disk_percent} />
        <p className="mt-2">Uso: {stats.storage.disk_percent}%</p>
      </div>

      {/* GPU */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-md">
        <h2 className="text-xl mb-2">GPU</h2>
        {stats.gpus?.length ? (
          stats.gpus.map((gpu, i) => (
            <div key={i} className="mb-4">
              <p className="font-bold">{gpu.name}</p>
              <Speedometer value={gpu.load} />
              <p className="mt-1">Uso: {gpu.load}%</p>
              <p className="mt-1">
                Memoria: {gpu.memoryUsed} / {gpu.memoryTotal} MB
              </p>
              <p className="mt-1">Temp: {gpu.temperature ?? "N/A"} °C</p>
            </div>
          ))
        ) : (
          <p>No se detectaron GPUs</p>
        )}
      </div>

      {/* Red */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-md">
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
