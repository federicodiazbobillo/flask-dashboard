import { Home, RefreshCcw } from "lucide-react";

export default function Sidebar({ onSelect }) {
  return (
    <div className="flex flex-col bg-gray-900 text-white w-56 h-screen p-4 space-y-4">
      <div className="text-2xl font-bold mb-6">Dashboard</div>

      <button
        onClick={() => onSelect("inicio")}
        className="flex items-center space-x-2 hover:bg-gray-800 p-2 rounded"
      >
        <Home size={18} /> <span>Inicio</span>
      </button>

      <button
        onClick={() => onSelect("actualizaciones")}
        className="flex items-center space-x-2 hover:bg-gray-800 p-2 rounded"
      >
        <RefreshCcw size={18} /> <span>Actualizaciones</span>
      </button>
    </div>
  );
}
