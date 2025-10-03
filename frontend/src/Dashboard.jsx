import { useEffect, useState } from "react";
import GaugeChart from "react-gauge-chart";

function Dashboard() {
  const [stats, setStats] = useState({
    cpu_model: "Detectando...",
    cpu_percent: 0,
    cpu_temp: null,
    memory_percent: 0,
    memory_total_gb: 0,
    memory_available_gb: 0,
    memory_slots: [],
    disk_percent: 0,
    disk_total_gb: 0,
    disk_free_gb: 0,
    gpus: [],
    net: { interfaces: [] },
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // CPU
        const cpuRes = await fetch("/api/server-info/cpu/");
        const cpu = await cpuRes.json();

        // Memoria
        const memRes = await fetch("/api/server-info/memory/");
        const memory = await memRes.json();

        // Disco
        const diskRes = await fetch("/api/server-info/storage/");
        const storage = await diskRes.json();

        // GPU
        const gpuRes = await fetch("/api/server-info/gpu/");
        const gpu = await gpuRes.json();

        // Red
        const netRes = await fetch("/api/server-info/net/");
        const net = await netRes.json();

        setStats({
          cpu_model: cpu.cpu_model,
          cpu_percent: cpu.cpu_percent,
          cpu_temp: cpu.cpu_temp,
          memory_percent: memory.memory_percent,
          memory_total_gb: memory.memory_total_gb,
          memory_available_gb: memory.memory_available_gb,
          memory_slots: memory.slots || [],
          disk_percent: storage.disk_percent,
          disk_total_gb: storage.disk_total_gb,
          disk_free_gb: storage.disk_free_gb,
          gpus: gpu.gpus || [],
          net: net || { interfaces: [] },
        });
      } catch (err) {
        console.error("Error al cargar stats:", err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // refrescar cada 5s
    return () => clearInterval(interval);
  }, []);

  // 🔎 Tomar tipo y velocidad de primer slot ocupado
  const firstOccupied = stats.memory_slots.find((s) => s.status === "Occupied");
  const memoryLabel = firstOccupied
    ? `(${firstOccupied.type} — ${firstOccupied.configured_memory_speed})`
    : "";

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* CPU */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-md">
        <h2 className="text-xl mb-2">CPU</h2>
        <p className="text-sm text-gray-400 mb-4">{stats.cpu_model}</p>
        <GaugeChart
          id="cpu-gauge"
          nrOfLevels={20}
          percent={stats.cpu_percent / 100}
          colors={["#00ff00", "#ff0000"]}
          arcWidth={0.3}
        />
        <p className="mt-2">Uso: {stats.cpu_percent}%</p>
        <p className="mt-1">
          Temp: {stats.cpu_temp ? `${stats.cpu_temp} °C` : "N/A"}
        </p>
      </div>

      {/* RAM */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-md">
        <h2 className="text-xl mb-2">Memoria RAM {memoryLabel}</h2>
        <p className="text-sm text-gray-400 mb-4">
          Total: {stats.memory_total_gb} GB — Disponible:{" "}
          {stats.memory_available_gb} GB
        </p>
        <GaugeChart
          id="mem-gauge"
          nrOfLevels={20}
          percent={stats.memory_percent / 100}
          colors={["#00bfff", "#ff0000"]}
          arcWidth={0.3}
        />
        <p className="mt-2">Uso: {stats.memory_percent}%</p>

        {/* Slots de memoria (verticales como el mother) */}
        <div className="mt-4 flex flex-col gap-2">
          {stats.memory_slots.map((slot, i) => (
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
          Total: {stats.disk_total_gb} GB — Libre: {stats.disk_free_gb} GB
        </p>
        <GaugeChart
          id="disk-gauge"
          nrOfLevels={20}
          percent={stats.disk_percent / 100}
          colors={["#ffff00", "#ff0000"]}
          arcWidth={0.3}
        />
        <p className="mt-2">Uso: {stats.disk_percent}%</p>
      </div>

      {/* GPU */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-md col-span-1">
        <h2 className="text-xl mb-2">GPU</h2>
        {stats.gpus && stats.gpus.length > 0 ? (
          stats.gpus.map((gpu, i) => (
            <div key={i} className="mb-4">
              <p className="font-bold">{gpu.name}</p>
              <GaugeChart
                id={`gpu-${i}`}
                nrOfLevels={20}
                percent={gpu.load / 100}
                colors={["#00ff00", "#ff0000"]}
                arcWidth={0.3}
              />
              <p className="mt-1">Uso: {gpu.load}%</p>
              <p className="mt-1">
                Memoria: {gpu.memoryUsed} / {gpu.memoryTotal} MB
              </p>
              <p className="mt-1">Temp: {gpu.temperature} °C</p>
            </div>
          ))
        ) : (
          <p>No se detectaron GPUs</p>
        )}
      </div>

      {/* Red */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-md col-span-1">
        <h2 className="text-xl mb-2">Interfaces de Red</h2>
        {stats.net.interfaces && stats.net.interfaces.length > 0 ? (
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
