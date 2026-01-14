import { getToken } from './authApi';

const API = "http://localhost:4000/api/quotations";

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

export const getQuotations = async (showAll = false) => {
  const url = showAll
    ? "http://localhost:4000/api/quotations/all"
    : "http://localhost:4000/api/quotations";

  const res = await fetch(url, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch quotations");
  return res.json();
};

export const createQuotation = async (data) => {
  const res = await fetch(API, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create quotation");
  return res.json();
};

export const updateQuotation = async (id, data) => {
  const res = await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update quotation");
  return res.json();
};

export const getQuotationById = async (id) => {
  const res = await fetch(`${API}/${id}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch quotation");
  return res.json();
};

export const deleteQuotation = async (id) => {
  const res = await fetch(`${API}/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to delete quotation");
  }
  
  return res.json();
};

export const generateWhatsAppMessage = (quotation) => {
  return `Quotation ${quotation.quotation_number} from Bab Alyusr Business Setup Services\n` +
         `Client: ${quotation.client_name}\n` +
         `Date: ${quotation.date}\n` +
         `Total Amount: AED ${quotation.total}\n` +
         `View Details: http://localhost:5173/quotations/${quotation.id}`;
};