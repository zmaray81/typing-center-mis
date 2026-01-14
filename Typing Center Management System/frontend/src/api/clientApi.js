const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const API = `${API_BASE}/api/auth`;

export const fetchClients = async () => {
  const res = await fetch(`${API_BASE}/clients`)
  if (!res.ok) {
    throw new Error('Failed to fetch clients')
  }
  return res.json()
}
