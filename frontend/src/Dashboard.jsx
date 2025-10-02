import { useEffect, useState } from "react";
import GaugeChart from "react-gauge-chart";

function Dashboard() {
  const [stats, setStats] = useState({
    cpu_percent: 0,
    cpu_temp: null,
    memory_percent: 0,
    disk_percent: 0,
  });

  useEffect(() => {
    const fetchStats = () => {
      fetch("/api/stats")
        .then((res) => res.json())
        .then((data) => setStats(data))
        .catch((err) => console.error("Error:", err));
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // cada 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* CPU */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-md">
        <h2 className="text-xl mb-4">CPU Usage</h2>
        <GaugeChart
          id="cpu-gauge"
          nrOfLevels={20}
          percent={stats.cpu_percent / 100}
          colors={["#00ff00", "#ff0000"]}
          arcWidth={0.3}
        />
        <p className="mt-2">
          Temp: {stats.cpu_temp ? `${stats.cpu_temp} °C` : "N/A"}
        </p>
      </div>

      {/* RAM */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-md">
        <h2 className="text-xl mb-4">Memory</h2>
        <GaugeChart
          id="mem-gauge"
          nrOfLevels={20}
          percent={stats.memory_percent / 100}
          colors={["#00bfff", "#ff0000"]}
          arcWidth={0.3}
        />
        <p className="mt-2">{stats.memory_percent}% used</p>
      </div>

      {/* Disco */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-md">
        <h2 className="text-xl mb-4">Disk</h2>
        <GaugeChart
          id="disk-gauge"
          nrOfLevels={20}
          percent={stats.disk_percent / 100}
          colors={["#ffff00", "#ff0000"]}
          arcWidth={0.3}
        />
        <p className="mt-2">{stats.disk_percent}% used</p>
      </div>
    </div>
  );
}

export default Dashboard;
