import { useEffect, useState } from "react";
import { fetchHello } from "./services/api";

function Dashboard() {
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetchHello().then(data => setMsg(data.message));
  }, []);

  if (!msg) return <p>⏳ Cargando...</p>;

  return (
    <div>
      <h1>Frontend + Backend</h1>
      <p>Respuesta de la API: {msg}</p>
    </div>
  );
}

export default Dashboard;
