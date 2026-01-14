import { getApiUrl } from '../config';

const AUTH_API = getApiUrl('/api/auth');

const API = "http://localhost:4000/api/auth";

// Store token in localStorage
const TOKEN_KEY = "typing_center_token";
const USER_KEY = "typing_center_user";

export const login = async (username, password) => {
  try {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    // Store token and user data
    if (data.token && data.user) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }

    return data;
  } catch (err) {
    console.error("Login error:", err);
    throw err;
  }
};

export const logout = async () => {
  try {
    // Call logout endpoint
    await fetch(`${API}/logout`, { method: "POST" });
  } finally {
    // Always clear local storage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.href = "/login";
  }
};

export const checkAuth = async () => {
  try {
    const token = getToken();
    
    if (!token) {
      return { isAuthenticated: false };
    }

    // Check if token is expired (basic check)
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    const isExpired = tokenData.exp * 1000 < Date.now();
    
    if (isExpired) {
      clearAuth();
      return { isAuthenticated: false };
    }

    const res = await fetch(`${API}/check`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    
    if (data.success) {
      return { 
        isAuthenticated: true, 
        user: data.user 
      };
    } else {
      clearAuth();
      return { isAuthenticated: false };
    }
  } catch (err) {
    console.error("Auth check error:", err);
    clearAuth();
    return { isAuthenticated: false };
  }
};

// Helper functions
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const getUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};
export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// Check if user has specific role
export const hasRole = (requiredRole) => {
  const user = getUser();
  return user?.role === requiredRole;
};

// Check if user has any of the specified roles
export const hasAnyRole = (roles) => {
  const user = getUser();
  return roles.includes(user?.role);
};