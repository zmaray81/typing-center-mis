import { getToken } from './authApi';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const API_URL = `${API_BASE}/api/useful-links`;

// Helper function to add auth headers
const getHeaders = () => {
  const headers = {
    "Content-Type": "application/json"
  };
  
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
};

export async function getUsefulLinks() {
  const res = await fetch(API_URL, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch useful links");
  return res.json();
}

export async function createUsefulLink(data) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to create useful link");
  return res.json();
}

export async function updateUsefulLink(id, data) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to update useful link");
  return res.json();
}

export async function deleteUsefulLink(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!res.ok) throw new Error("Failed to delete useful link");
  return res.json();
}
