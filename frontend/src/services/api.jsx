export async function fetchHello() {
  const res = await fetch("/api/hello"); // ruta relativa
  if (!res.ok) throw new Error("Error al llamar a la API");
  return res.json();
}
