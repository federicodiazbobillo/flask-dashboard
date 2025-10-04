import { useState, useEffect } from "react";
import PowerMenu from "./PowerMenu";

export default function Topbar() {
  const [time, setTime] = useState(new Date());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatted = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex items-center justify-between bg-gray-800 text-white px-6 py-3 shadow">
      <div className="text-lg font-semibold">Servidor local</div>

      <div className="flex items-center space-x-4">
        <span className="text-xl font-mono">{formatted}</span>
        <button
          onClick={() => setOpen(!open)}
          className="bg-gray-700 hover:bg-gray-600 p-2 rounded-full"
        >
          ⏻
        </button>
        {open && <PowerMenu />}
      </div>
    </div>
  );
}
