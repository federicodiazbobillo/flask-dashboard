import { useEffect, useState } from "react";

function App() {
  const [msg, setMsg] = useState("cargando...");

  useEffect(() => {
    fetch("http://192.168.2.194:5000/api/hello")   // 👈 usa la IP del servidor remoto
      .then(res => res.json())
      .then(data => setMsg(data.message))
      .catch(err => setMsg("❌ Error: " + err.message));
  }, []);

  return (
    <div>
      <h1>React + Flask</h1>
      <p>Respuesta de la API: {msg}</p>
    </div>
  );
}

export default App;
