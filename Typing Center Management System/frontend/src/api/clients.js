import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const API_URL = `${API_BASE}/api/clients`;

export const getClients = () => axios.get(API_URL);
export const createClient = (data) => axios.post(API_URL, data);
export const updateClient = (id, data) => axios.put(`${API_URL}/${id}`, data);
export const deleteClient = (id) => axios.delete(`${API_URL}/${id}`);