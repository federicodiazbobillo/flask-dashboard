import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Updates from "./pages/Updates";

export default function App() {
  const [page, setPage] = useState("inicio");

  return (
    <div className="flex h-screen">
      <Sidebar onSelect={setPage} />
      <div className="flex flex-col flex-grow">
        <Topbar />
        <div className="p-4 overflow-y-auto bg-gray-950 text-white flex-grow">
          {page === "inicio" && <Dashboard />}
          {page === "actualizaciones" && <Updates />}
        </div>
      </div>
    </div>
  );
}
