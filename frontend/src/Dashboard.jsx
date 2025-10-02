import { useEffect, useState } from "react";
import GaugeChart from "react-gauge-chart";

function Dashboard() {
  const [stats, setStats] = useState({
    cpu_model: "Detectando...",
    cpu_percent: 0,
    cpu_temp: null,
    memory_percent: 0,
    memory_total_gb: 0,
    disk_percent: 0,
    disk_total_gb: 0,
  });

  useEffect(() => {
    const fetchStats = () => {
      fetch("/api/stats")
        .then((res) => res.json())
        .then((data) => setStats(data))
        .catch((err) => console.error("Error:", err));
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // refrescar cada 5s
    return () => clearInterval(interval);
  }, []);

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
        <h2 className="text-xl mb-2">Memoria RAM</h2>
        <p className="text-sm text-gray-400 mb-4">
          Total: {stats.memory_total_gb} GB
        </p>
        <GaugeChart
          id="mem-gauge"
          nrOfLevels={20}
          percent={stats.memory_percent / 100}
          colors={["#00bfff", "#ff0000"]}
          arcWidth={0.3}
        />
        <p className="mt-2">Uso: {stats.memory_percent}%</p>
      </div>

      {/* Disco */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-md">
        <h2 className="text-xl mb-2">Disco</h2>
        <p className="text-sm text-gray-400 mb-4">
          Total: {stats.disk_total_gb} GB
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
    </div>
  );
}

export default Dashboard;
