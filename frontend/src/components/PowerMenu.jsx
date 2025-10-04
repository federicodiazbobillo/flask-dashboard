export default function PowerMenu() {
  return (
    <div className="absolute right-6 top-14 bg-gray-900 text-white rounded-lg shadow-lg border border-gray-700 w-40">
      <button
        onClick={() => window.alert("Reiniciando servidor...")}
        className="w-full text-left px-4 py-2 hover:bg-gray-800"
      >
        🔁 Reiniciar
      </button>
      <button
        onClick={() => window.alert("Apagando servidor...")}
        className="w-full text-left px-4 py-2 hover:bg-gray-800"
      >
        ⏻ Apagar
      </button>
    </div>
  );
}
