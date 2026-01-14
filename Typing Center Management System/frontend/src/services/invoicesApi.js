import { getToken } from './authApi';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const API_URL = `${API_BASE}/api/invoices`;

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

export async function getInvoices() {
  const res = await fetch(API_URL, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch invoices");
  return res.json();
}

export async function getInvoiceById(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch invoice");
  return res.json();
}

export async function createInvoice(data) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to create invoice");
  return res.json();
}

export async function updateInvoice(id, data) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Failed to update invoice");
  return res.json();
}

export async function deleteInvoice(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!res.ok) throw new Error("Failed to delete invoice");
  return res.json();
}

export async function createInvoiceFromQuotation(quotationId) {
  const res = await fetch(
    `${API_URL}/from-quotation/${quotationId}`,
    { 
      method: "POST",
      headers: getHeaders()
    }
  );

  if (!res.ok) throw new Error("Failed to convert quotation");
  return res.json();
}
