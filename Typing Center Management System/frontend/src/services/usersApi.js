import { getToken } from './authApi';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const API = `${API_BASE}/api/users`;

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

export const getUsers = async () => {
  const res = await fetch(API, {
    headers: getHeaders()
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch users: ${res.status} ${errorText}`);
  }
  
  return res.json();
};

export const createUser = async (data) => {
  const res = await fetch(API, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  const responseData = await res.json();
  
  if (!res.ok) {
    throw new Error(responseData.error || "Failed to create user");
  }
  
  return responseData;
};

export const updateUser = async (id, data) => {
  const res = await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update user: ${res.status} ${errorText}`);
  }
  
  return res.json();
};

export const deleteUser = async (id) => {
  const res = await fetch(`${API}/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to delete user: ${res.status} ${errorText}`);
  }
  
  return res.json();
};

export const changePassword = async (id, { currentPassword, newPassword }) => {
  const res = await fetch(`${API}/${id}/password`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to change password: ${res.status} ${errorText}`);
  }
  
  return res.json();
};
