import { getToken } from './authApi';

const API_URL = "http://localhost:4000/api";

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

// Using fetch to match other APIs
export const getPayments = async () => {
  const res = await fetch(`${API_URL}/payments`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch payments");
  return res.json();
};

export const createPayment = async (payment) => {
  const res = await fetch(`${API_URL}/payments`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payment),
  });
  if (!res.ok) throw new Error("Failed to create payment");
  return res.json();
};

// Added missing functions from old version
export const updatePayment = async (id, data) => {
  const res = await fetch(`${API_URL}/payments/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update payment");
  return res.json();
};

export const deletePayment = async (id) => {
  const res = await fetch(`${API_URL}/payments/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete payment");
  return res.json();
};