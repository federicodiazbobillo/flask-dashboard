

function App() {
  const [msg, setMsg] = useState("cargando...");

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/hello")   // 👈 apunta directo al backend
      .then(res => res.json())
      .then(data => setMsg(data.message))
      .catch(err => setMsg("❌ Error: " + err.message));
  }, []);

  return (
    <div>
      <h1>Test React + API</h1>
      <p>Respuesta: {msg}</p>
    </div>
  );
}

export default App;
