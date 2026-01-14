import { getToken } from './authApi';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const API = `${API_BASE}/api/clients`;

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

export const getClients = async () => {
  const res = await fetch(API, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch clients");
  return res.json();
};

export const createClient = async (data) => {
  const res = await fetch(API, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  const responseData = await res.json();
  
  if (!res.ok) {
    if (res.status === 409) {
      // Duplicate client error - include the duplicate data if available
      throw new Error(`DUPLICATE: ${responseData.error}`, { cause: responseData.duplicates });
    }
    throw new Error(responseData.error || "Failed to create client");
  }
  
  return responseData;
};

export const updateClient = async (id, data) => {
  const res = await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Update failed (${res.status}):`, errorText);
    throw new Error(`Failed to update client: ${res.status} ${errorText}`);
  }
  
  return res.json();
};

export const deleteClient = async (id) => {
  const res = await fetch(`${API}/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!res.ok) {
    let errorMessage = `Failed to delete client (Status: ${res.status})`;
    try {
      const errorData = await res.json();
      errorMessage = errorData.error || errorData.details || errorMessage;
    } catch {
      errorMessage = `Failed to delete client: ${res.status} ${res.statusText}`;
    }
    throw new Error(errorMessage);
  }
  
  return res.json();
};
