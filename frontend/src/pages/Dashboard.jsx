import { useEffect, useState } from "react";
import GaugeSemiCircle from "../components/GaugeSemiCircle";

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
        const cpuRes = await fetch("/api/server-info/cpu/");
        const cpu = await cpuRes.json();

        const memRes = await fetch("/api/server-info/memory/");
        const memory = await memRes.json();

        const diskRes = await fetch("/api/server-info/storage/");
        const storage = await diskRes.json();

        const gpuRes = await fetch("/api/server-info/gpu/");
        const gpu = await gpuRes.json();

        const netRes = await fetch("/api/server-info/net/");
        const net = await netRes.json();

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
      <div className="bg-gray-800 p-6 rounded-xl shadow-md lg:col-span-2">
        <h2 className="text-xl mb-2">CPU</h2>
        <p className="text-sm text-gray-400 mb-2">{stats.cpu.model}</p>

        <GaugeSemiCircle value={stats.cpu.cpu_percent_total} />

        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          <p>Uso total: {stats.cpu.cpu_percent_total}%</p>
          <p>
            Temp:{" "}
            {stats.cpu.temperature_c !== null
              ? `${stats.cpu.temperature_c} °C`
              : "N/A"}
          </p>
          <p>
            Frecuencia:{" "}
            {stats.cpu.freq_current_mhz
              ? `${stats.cpu.freq_current_mhz.toFixed(0)} MHz`
              : "N/A"}{" "}
            (min {stats.cpu.freq_min_mhz ?? "?"}, max{" "}
            {stats.cpu.freq_max_mhz ?? "?"})
          </p>
          <p>
            Núcleos: {stats.cpu.cores_physical} físicos /{" "}
            {stats.cpu.cores_logical} lógicos
          </p>
          <p className="col-span-2 md:col-span-1">
            Load Avg:{" "}
            {stats.cpu.load_avg && stats.cpu.load_avg.length
              ? stats.cpu.load_avg.map((l) => l.toFixed(2)).join(" | ")
              : "N/A"}
          </p>
        </div>

        {/* Uso por core */}
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
          Total: {stats.memory.memory_total_gb} GB — Disponible:{" "}
          {stats.memory.memory_available_gb} GB
        </p>

        <GaugeSemiCircle value={stats.memory.memory_percent} />

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
          Total: {stats.storage.disk_total_gb} GB — Libre:{" "}
          {stats.storage.disk_free_gb} GB
        </p>

        <GaugeSemiCircle value={stats.storage.disk_percent} />

        <p className="mt-2">Uso: {stats.storage.disk_percent}%</p>
      </div>

        {/* GPU */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-md">
        <h2 className="text-xl mb-2">GPU</h2>
        {stats.gpus && stats.gpus.length > 0 ? (
            stats.gpus.map((gpu, i) => (
            <div key={i} className="mb-6 border-b border-gray-700 pb-4">
                <p className="font-bold text-lg">{gpu.name}</p>

                {/* Medidor de carga */}
                <GaugeSemiCircle value={gpu.load} />

                {/* Info básica */}
                <p className="mt-2">Uso: {gpu.load}%</p>
                <p>
                Memoria: {gpu.memoryUsed} / {gpu.memoryTotal} MB
                </p>
                <p>
                Temp:{" "}
                {gpu.temperature !== null ? `${gpu.temperature} °C` : "N/A"}
                </p>

                {/* Info adicional */}
                <p>
                Cooler:{" "}
                {gpu.fan_speed !== null ? `${gpu.fan_speed}%` : "N/A"}
                </p>
                <p>
                Consumo:{" "}
                {gpu.power_draw_watts !== null
                    ? `${gpu.power_draw_watts} W (~${gpu.power_draw_amperes_est} A)`
                    : "N/A"}{" "}
                / Límite:{" "}
                {gpu.power_limit_watts !== null
                    ? `${gpu.power_limit_watts} W`
                    : "N/A"}
                </p>
            </div>
            ))
        ) : (
            <p>No se detectaron GPUs</p>
        )}
        </div>


      {/* Red */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-md">
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
