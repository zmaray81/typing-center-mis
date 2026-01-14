import { getToken } from './authApi';

const API = "http://localhost:4000/api/applications";

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

// Using fetch to be consistent with other APIs
export const getApplications = async () => {
  const res = await fetch(API, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch applications");
  return res.json();
};

export const createApplication = async (data) => {
  const res = await fetch(API, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create application");
  return res.json();
};

export const updateApplication = async (id, data) => {
  const res = await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update application");
  return res.json();
};

export const deleteApplication = async (id) => {
  const res = await fetch(`${API}/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete application");
  return res.json();
};

export const getApplicationById = async (id) => {
  const res = await fetch(`${API}/${id}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch application");
  return res.json();
};