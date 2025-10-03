import { useEffect, useState } from "react";
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

function GaugeCard({ title, value, color, unit = "%", subtitle }) {
  const data = [{ name: title, value: value, fill: color }];

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-md">
      <h2 className="text-xl mb-2">{title}</h2>
      {subtitle && <p className="text-sm text-gray-400 mb-2">{subtitle}</p>}
      <div className="w-full h-40">
        <ResponsiveContainer>
          <RadialBarChart
            cx="50%"
            cy="70%"
            innerRadius="60%"
            outerRadius="100%"
            barSize={15}
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              minAngle={15}
              clockWise
              dataKey="value"
              cornerRadius={10}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-center font-bold">
        {value}
        {unit}
      </p>
    </div>
  );
}

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
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const firstOccupied = stats.memory_slots.find((s) => s.status === "Occupied");
  const memoryLabel = firstOccupied
    ? `(${firstOccupied.type} — ${firstOccupied.configured_memory_speed})`
    : "";

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* CPU */}
      <GaugeCard
        title="CPU"
        value={stats.cpu_percent}
        color="#00ff00"
        subtitle={stats.cpu_model}
      />
      <div className="bg-gray-800 p-6 rounded-xl shadow-md">
        <p>Temp: {stats.cpu_temp ? `${stats.cpu_temp} °C` : "N/A"}</p>
      </div>

      {/* RAM */}
      <GaugeCard
        title={`Memoria RAM ${memoryLabel}`}
        value={stats.memory_percent}
        color="#00bfff"
        subtitle={`Total: ${stats.memory_total_gb} GB — Disponible: ${stats.memory_available_gb} GB`}
      />
      <div className="bg-gray-800 p-6 rounded-xl shadow-md">
        <h3 className="text-lg mb-2">Slots de memoria</h3>
        <div className="flex flex-col gap-2">
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
      <GaugeCard
        title="Disco"
        value={stats.disk_percent}
        color="#ffff00"
        subtitle={`Total: ${stats.disk_total_gb} GB — Libre: ${stats.disk_free_gb} GB`}
      />

      {/* GPU */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-md col-span-1">
        <h2 className="text-xl mb-2">GPU</h2>
        {stats.gpus && stats.gpus.length > 0 ? (
          stats.gpus.map((gpu, i) => (
            <GaugeCard
              key={i}
              title={gpu.name}
              value={gpu.load}
              color="#ff00ff"
              unit="%"
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
